import hashlib
import os
import re
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny

from core.models import User, SubSkill, CompetencyDomain, OfficialSkillProficiency
from core.throttling import KnowledgeCheckGenThrottle, QuizSubmissionThrottle, ResumeUploadThrottle
from core.recaptcha import verify_recaptcha
from .models import (
    BaselineQuestion, BaselineAssessmentAttempt,
    DocumentUpload, Quiz, Question, Option, QuizAttempt, QuizAnswer
)
from .extraction import process_document_source, DocumentExtractionError
from .ai_provider import get_ai_provider, AIProviderError, validate_questions_strict


# =====================================================================
# BASELINE ASSESSMENT (Civil Service Core Competencies)
# =====================================================================

class BaselineAssessmentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        questions = BaselineQuestion.objects.select_related('domain', 'subskill').all()
        q_data = []
        for q in questions:
            q_data.append({
                'id': q.id,
                'domain_name': q.domain.name,
                'domain_type': q.domain.domain_type,
                'subskill_name': q.subskill.name,
                'subskill_code': q.subskill.code,
                'question_text': q.question_text,
                'options': q.options
            })
        return Response({
            'total_questions': len(q_data),
            'baseline_completed': request.user.baseline_completed,
            'questions': q_data
        })


class SubmitBaselineAssessmentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        answers = request.data.get('answers', {})

        questions = BaselineQuestion.objects.select_related('domain', 'subskill').all()
        if not questions.exists():
            return Response({'error': 'Baseline assessment questions are not initialized.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        total_q = questions.count()
        correct_count = 0
        detailed_answers = []
        beh_correct = 0
        beh_total = 0

        for q in questions:
            user_choice = answers.get(str(q.id))
            if user_choice is None:
                user_choice = answers.get(q.id)

            is_correct = (user_choice is not None and int(user_choice) == q.correct_option_index)
            if is_correct:
                correct_count += 1

            if q.domain.domain_type == 'BEHAVIOURAL':
                beh_total += 1
                if is_correct:
                    beh_correct += 1

            score_val = 85.0 if is_correct else 42.0
            prof, _ = OfficialSkillProficiency.objects.get_or_create(
                user=user,
                subskill=q.subskill,
                defaults={'score': score_val}
            )
            prof.score = score_val
            prof.save()

            detailed_answers.append({
                'question_id': q.id,
                'question_text': q.question_text,
                'subskill_code': q.subskill.code,
                'domain_type': q.domain.domain_type,
                'user_choice': user_choice,
                'correct_index': q.correct_option_index,
                'is_correct': is_correct,
                'explanation': q.explanation
            })

        overall_pct = (correct_count / total_q) * 100.0 if total_q > 0 else 50.0
        beh_pct = (beh_correct / beh_total) * 100.0 if beh_total > 0 else 50.0
        calculated_ctq = round(0.6 * beh_pct + 0.4 * overall_pct, 1)

        user.ctq_score = calculated_ctq
        user.baseline_completed = True
        user.save()

        all_profs = OfficialSkillProficiency.objects.filter(user=user)
        domain_summary = []
        for d in CompetencyDomain.objects.all():
            d_profs = all_profs.filter(subskill__domain=d)
            avg = round(sum(p.score for p in d_profs) / d_profs.count(), 1) if d_profs.exists() else 0.0
            domain_summary.append({
                'domain_id': d.id,
                'domain_type': d.domain_type,
                'domain_name': d.name,
                'average_score': avg
            })

        attempt = BaselineAssessmentAttempt.objects.create(
            user=user,
            total_questions=total_q,
            correct_answers=correct_count,
            calculated_ctq=calculated_ctq,
            domain_scores=domain_summary,
            detailed_answers=detailed_answers
        )

        return Response({
            'message': 'Baseline assessment completed successfully! Competency profile initialized.',
            'attempt_id': attempt.id,
            'total_questions': total_q,
            'correct_answers': correct_count,
            'calculated_ctq': calculated_ctq,
            'domain_scores': domain_summary,
            'detailed_results': detailed_answers
        })


# =====================================================================
# DOCUMENT UPLOAD & EXTRACTION (Security, Chunking, Provenance)
# =====================================================================

class DocumentUploadView(APIView):
    """
    Secure document upload endpoint.
    Accepts PDF, DOCX, or TXT file, or pasted text.
    Extracts text, preserves page and section provenance, builds chunks.
    """
    permission_classes = [IsAuthenticated]
    throttle_classes = [ResumeUploadThrottle]

    def post(self, request):
        user = request.user
        title = request.data.get('title', '').strip()
        file_obj = request.FILES.get('file')
        raw_text = request.data.get('text', '').strip()

        if not file_obj and not raw_text:
            return Response(
                {'error': "We couldn't read this document. Please provide a file or text content."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            if file_obj:
                if file_obj.size > 15 * 1024 * 1024:
                    return Response({'error': "File size exceeds 15MB limit. Please upload a smaller document."}, status=status.HTTP_400_BAD_REQUEST)

                # Sanitize filename
                safe_basename = os.path.basename(file_obj.name)
                clean_filename = re.sub(r'[^a-zA-Z0-9_.-]', '_', safe_basename)
                file_obj.name = clean_filename
                filename = clean_filename

                # Magic byte check
                ext = os.path.splitext(filename)[1].lower()
                if ext not in ['.pdf', '.docx', '.doc', '.txt']:
                    return Response({'error': f"Unsupported file extension '{ext}'. Only PDF, DOCX, and TXT are supported."}, status=status.HTTP_400_BAD_REQUEST)

                file_bytes = file_obj.read()
                if len(file_bytes) == 0:
                    return Response(
                        {'error': "Uploaded file is empty. Please select a valid document."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                if ext == '.pdf' and not file_bytes[:4] == b'%PDF':
                    return Response({'error': 'Uploaded file is not a valid PDF document.'}, status=status.HTTP_400_BAD_REQUEST)
                elif ext == '.docx' and not file_bytes[:4] == b'PK\x03\x04':
                    return Response({'error': 'Uploaded file is not a valid DOCX document.'}, status=status.HTTP_400_BAD_REQUEST)

                extracted_data = process_document_source(file_bytes, filename)
            else:
                filename = "Pasted Document.txt"
                file_bytes = raw_text.encode('utf-8')
                extracted_data = process_document_source(file_bytes, filename)

        except DocumentExtractionError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response(
                {'error': "We couldn't read this document. Please try another file."},
                status=status.HTTP_400_BAD_REQUEST
            )

        doc_title = title or os.path.splitext(extracted_data["filename"])[0]
        doc = DocumentUpload.objects.create(
            user=user,
            title=doc_title,
            file=file_obj,
            filename=extracted_data["filename"],
            file_type=extracted_data["file_type"],
            file_size=extracted_data["file_size"],
            content_hash=extracted_data["content_hash"],
            page_count=extracted_data["page_count"],
            extracted_text=extracted_data["extracted_text"],
            chunks=extracted_data["chunks"],
            processing_status='READY',
            processed_at=timezone.now()
        )

        return Response({
            'document_id': doc.id,
            'title': doc.title,
            'filename': doc.filename,
            'file_type': doc.file_type,
            'file_size': doc.file_size,
            'page_count': doc.page_count,
            'chunk_count': len(doc.chunks),
            'preview': doc.extracted_text[:350] + ('...' if len(doc.extracted_text) > 350 else '')
        }, status=status.HTTP_201_CREATED)


# =====================================================================
# KNOWLEDGE CHECK STUDIO (Authoring Flow: Generate, Review, Edit, Publish)
# =====================================================================

def synthesize_diagnostic_feedback(quiz, correct_items, incorrect_items):
    """
    Teaches the learner by diagnosing understanding vs misconceptions.
    Never merely shows a raw score like '4/10'.
    Explains:
    - what the learner understood
    - where confusion exists
    - why the correct answer is right
    - what concept should be reviewed
    - a concrete, relatable civil service example
    """
    total = len(correct_items) + len(incorrect_items)
    score_pct = round((len(correct_items) / total) * 100.0, 1) if total > 0 else 0.0

    if not incorrect_items:
        return {
            "what_you_understood": f"You demonstrated complete understanding of the standards and statutory requirements in \"{quiz.title}\".",
            "where_confusion_exists": "No conceptual misunderstandings identified in this check.",
            "conceptual_contrast": "Your answers reflect precise application of both regulatory requirements and operational procedures.",
            "concrete_example": "You accurately distinguished mandatory statutory requirements from discretionary administrative measures across all tested scenarios.",
            "concept_to_review": "Ready to advance to policy decision simulations in Neeti Vivaad."
        }

    # Extract themes from incorrect questions
    misunderstood_sections = [item.get('source_section') for item in incorrect_items if item.get('source_section')]
    section_label = misunderstood_sections[0] if misunderstood_sections else (quiz.subskill.name if quiz.subskill else "Official Standard")

    first_err = incorrect_items[0]
    q_txt = first_err.get('question_text', '')

    # Check for common civil service conceptual contrasts
    if re.search(r'\b(retention|storage|minimi|collect)\b', q_txt, re.IGNORECASE):
        confusion_title = "data minimization versus data retention"
        contrast_expl = (
            "Data minimization means collecting strictly what is necessary for the immediate public service task. "
            "Data retention determines the duration a collected record may legally be preserved before mandatory deletion or archiving."
        )
        example_str = (
            "Example: Collecting only an applicant's current address for a scheme is data minimization; "
            "scheduling that address record for automated deletion 6 months after disbursement is retention compliance."
        )
    elif re.search(r'\b(consent|anonymis|identif|mask|differen)\b', q_txt, re.IGNORECASE):
        confusion_title = "informed consent versus technical anonymisation"
        contrast_expl = (
            "Consent is the legal permission given by a citizen for a specific purpose. "
            "Anonymisation is an irreversible technical transformation ensuring individuals cannot be re-identified even when combined with external registries."
        )
        example_str = (
            "Example: Having a citizen sign an authorization form is consent; "
            "stripping direct identifiers and applying differential privacy filters before statistical release is anonymisation."
        )
    elif re.search(r'\b(discretion|mandat|statutory|waiver|exempt)\b', q_txt, re.IGNORECASE):
        confusion_title = "statutory mandates versus operational discretion"
        contrast_expl = (
            "Statutory mandates are legal duties that no administrative officer has the authority to waive or dilute. "
            "Operational discretion applies only to implementation modalities where the guideline explicitly permits procedural flexibility."
        )
        example_str = (
            "Example: Maintaining verification logs is a mandatory statutory duty; "
            "deciding whether to conduct field audits via mobile app or physical register is operational discretion."
        )
    else:
        confusion_title = f"procedural compliance in {section_label}"
        contrast_expl = (
            f"Official guidelines on Page {first_err.get('source_page', 1)} mandate strict adherence to verifiable parameters, "
            "rather than informal local adaptations."
        )
        example_str = f"Refer to the exact requirement on Page {first_err.get('source_page', 1)}: \"{first_err.get('evidence_text', '')[:100]}...\""

    what_understood = (
        f"You demonstrated solid grasp of the core provisions in {len(correct_items)} of {total} questions, including baseline administrative protocols."
        if correct_items else
        f"You have begun reviewing {quiz.title}. Foundational standards require careful reference to the source document."
    )

    return {
        "what_you_understood": what_understood,
        "where_confusion_exists": f"Your answers suggest some confusion regarding {confusion_title}.",
        "conceptual_contrast": contrast_expl,
        "concrete_example": example_str,
        "concept_to_review": f"{section_label} (Page {first_err.get('source_page', 1)})"
    }


class GenerateQuizView(APIView):
    """
    Generates a grounded Knowledge Check from uploaded document material.
    Preserves real source questions first. Strict validation prevents hallucination.
    """
    permission_classes = [IsAuthenticated]
    throttle_classes = [KnowledgeCheckGenThrottle]

    def post(self, request):
        user = request.user
        doc_id = request.data.get('document_id')
        num_questions = int(request.data.get('num_questions', 5))
        difficulty = request.data.get('difficulty', 'Intermediate')
        question_types = request.data.get('question_types', ['MCQ', 'TRUE_FALSE', 'SCENARIO'])
        subskill_id = request.data.get('subskill_id')
        title = request.data.get('title', '').strip()

        # Bot protection verification
        captcha_valid, captcha_error = verify_recaptcha(request, expected_action='generate_quiz')
        if not captcha_valid:
            return Response(
                {'error': captcha_error or 'Security verification failed. Please try again.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not doc_id:
            return Response({'error': 'document_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            doc = DocumentUpload.objects.get(id=doc_id)
        except DocumentUpload.DoesNotExist:
            return Response({'error': 'Document not found.'}, status=status.HTTP_404_NOT_FOUND)

        subskill = None
        if subskill_id:
            try:
                subskill = SubSkill.objects.get(id=subskill_id)
            except SubSkill.DoesNotExist:
                pass

        doc_info = {'id': doc.id, 'title': doc.title}
        competency_code = subskill.code if subskill else 'GOV-GEN'

        # Detect pre-existing questions in source document
        source_qs = []
        if hasattr(doc, 'chunks') and isinstance(doc.chunks, list) and len(doc.chunks) > 0:
            from .extraction import detect_source_questions
            source_qs = detect_source_questions(doc.extracted_text, doc.chunks)

        provider = get_ai_provider()
        try:
            generated_data = provider.generate_questions(
                chunks=doc.chunks,
                num_questions=num_questions,
                difficulty=difficulty,
                question_types=question_types,
                source_questions=source_qs,
                doc_info=doc_info,
                competency_code=competency_code
            )
        except AIProviderError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response(
                {'error': "We couldn't prepare the knowledge check. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        quiz_title = title or f"Knowledge Check: {doc.title[:45]}"
        time_estimate = max(3, round(len(generated_data) * 1.5))

        quiz = Quiz.objects.create(
            document=doc,
            created_by=user,
            subskill=subskill,
            title=quiz_title,
            status='DRAFT',
            version=1,
            difficulty=difficulty,
            time_estimate_mins=time_estimate,
            question_types=question_types
        )

        q_list = []
        for idx, item in enumerate(generated_data, start=1):
            q_obj = Question.objects.create(
                quiz=quiz,
                question_text=item['question'],
                question_type=item.get('type', 'MCQ'),
                difficulty=item.get('difficulty', difficulty),
                source_page=item.get('source_page', 1),
                source_section=item.get('source_section', ''),
                source_chunk_id=item.get('source_chunk_id', ''),
                evidence_text=item.get('evidence_text', ''),
                source_citation=item.get('source_citation', f"Page {item.get('source_page', 1)}"),
                explanation=item.get('explanation', ''),
                created_by_ai=not item.get('is_source_question', False),
                is_source_question=item.get('is_source_question', False),
                validation_status=item.get('validation_status', 'VALIDATED'),
                validation_notes=item.get('validation_notes', ''),
                provenance_metadata=item.get('provenance_metadata', {}),
                order=idx
            )

            opts_data = []
            for opt in item.get('options', []):
                o_obj = Option.objects.create(
                    question=q_obj,
                    option_text=opt['text'],
                    is_correct=opt['is_correct']
                )
                opts_data.append({
                    'id': o_obj.id,
                    'text': o_obj.option_text,
                    'is_correct': o_obj.is_correct
                })

            q_list.append({
                'id': q_obj.id,
                'order': q_obj.order,
                'question': q_obj.question_text,
                'question_text': q_obj.question_text,
                'question_type': q_obj.question_type,
                'difficulty': q_obj.difficulty,
                'source_page': q_obj.source_page,
                'source_section': q_obj.source_section,
                'evidence_text': q_obj.evidence_text,
                'source_citation': q_obj.source_citation,
                'explanation': q_obj.explanation,
                'options': opts_data
            })

        return Response({
            'quiz_id': quiz.id,
            'quiz_title': quiz.title,
            'status': quiz.status,
            'version': quiz.version,
            'difficulty': quiz.difficulty,
            'time_estimate_mins': quiz.time_estimate_mins,
            'subskill_name': subskill.name if subskill else 'General',
            'subskill_id': subskill.id if subskill else None,
            'document_title': doc.title,
            'questions': q_list
        }, status=status.HTTP_201_CREATED)


class StudioQuizManageView(APIView):
    """
    Author workspace to inspect, edit, or delete a draft/published check.
    Enforces authorization: only the creator or admin can modify.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, quiz_id):
        user = request.user
        try:
            quiz = Quiz.objects.select_related('document', 'subskill', 'created_by').get(id=quiz_id)
        except Quiz.DoesNotExist:
            return Response({'error': 'Knowledge Check not found.'}, status=status.HTTP_404_NOT_FOUND)

        if quiz.created_by != user and not user.is_staff:
            return Response({'error': 'Unauthorized to view this studio check.'}, status=status.HTTP_403_FORBIDDEN)

        questions = quiz.questions.prefetch_related('options').all()
        q_data = []
        for q in questions:
            opts = [{'id': o.id, 'text': o.option_text, 'is_correct': o.is_correct} for o in q.options.all()]
            q_data.append({
                'id': q.id,
                'order': q.order,
                'question_text': q.question_text,
                'question_type': q.question_type,
                'difficulty': q.difficulty,
                'source_page': q.source_page,
                'source_section': q.source_section,
                'evidence_text': q.evidence_text,
                'source_citation': q.source_citation,
                'explanation': q.explanation,
                'options': opts
            })

        return Response({
            'quiz_id': quiz.id,
            'title': quiz.title,
            'status': quiz.status,
            'version': quiz.version,
            'difficulty': quiz.difficulty,
            'time_estimate_mins': quiz.time_estimate_mins,
            'subskill_id': quiz.subskill.id if quiz.subskill else None,
            'subskill_name': quiz.subskill.name if quiz.subskill else 'General',
            'document_id': quiz.document.id,
            'document_title': quiz.document.title,
            'questions': q_data
        })

    def patch(self, request, quiz_id):
        user = request.user
        try:
            quiz = Quiz.objects.get(id=quiz_id)
        except Quiz.DoesNotExist:
            return Response({'error': 'Knowledge Check not found.'}, status=status.HTTP_404_NOT_FOUND)

        if quiz.created_by != user and not user.is_staff:
            return Response({'error': 'Unauthorized to edit this check.'}, status=status.HTTP_403_FORBIDDEN)

        if 'title' in request.data:
            quiz.title = request.data['title'].strip()
        if 'difficulty' in request.data:
            quiz.difficulty = request.data['difficulty']
        if 'time_estimate_mins' in request.data:
            quiz.time_estimate_mins = int(request.data['time_estimate_mins'])
        if 'subskill_id' in request.data:
            sub = SubSkill.objects.filter(id=request.data['subskill_id']).first()
            if sub:
                quiz.subskill = sub
        quiz.save()

        # Inline question updates if provided
        updated_questions = request.data.get('questions', [])
        for q_dict in updated_questions:
            q_id = q_dict.get('id')
            if not q_id:
                continue
            question = quiz.questions.filter(id=q_id).first()
            if question:
                if 'question_text' in q_dict:
                    question.question_text = q_dict['question_text'].strip()
                if 'explanation' in q_dict:
                    question.explanation = q_dict['explanation'].strip()
                if 'evidence_text' in q_dict:
                    question.evidence_text = q_dict['evidence_text'].strip()
                question.save()

                # Update options
                if 'options' in q_dict and isinstance(q_dict['options'], list):
                    for opt_dict in q_dict['options']:
                        opt_id = opt_dict.get('id')
                        if opt_id:
                            opt = question.options.filter(id=opt_id).first()
                            if opt:
                                if 'text' in opt_dict:
                                    opt.option_text = opt_dict['text'].strip()
                                if 'is_correct' in opt_dict:
                                    opt.is_correct = bool(opt_dict['is_correct'])
                                opt.save()

        return Response({'message': 'Knowledge check updated successfully.', 'quiz_id': quiz.id})

    def delete(self, request, quiz_id):
        user = request.user
        try:
            quiz = Quiz.objects.get(id=quiz_id)
        except Quiz.DoesNotExist:
            return Response({'error': 'Knowledge Check not found.'}, status=status.HTTP_404_NOT_FOUND)

        if quiz.created_by != user and not user.is_staff:
            return Response({'error': 'Unauthorized to delete this check.'}, status=status.HTTP_403_FORBIDDEN)

        quiz.delete()
        return Response({'message': 'Knowledge check deleted.'})


class StudioQuizQuestionActionView(APIView):
    """
    Granular authoring operations:
    - Add question manually
    - Regenerate a specific question
    - Delete a specific question
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, quiz_id):
        user = request.user
        try:
            quiz = Quiz.objects.select_related('document').get(id=quiz_id)
        except Quiz.DoesNotExist:
            return Response({'error': 'Knowledge Check not found.'}, status=status.HTTP_404_NOT_FOUND)

        if quiz.created_by != user and not user.is_staff:
            return Response({'error': 'Unauthorized.'}, status=status.HTTP_403_FORBIDDEN)

        action = request.data.get('action', 'add')

        if action == 'add':
            q_text = request.data.get('question_text', '').strip()
            q_type = request.data.get('question_type', 'MCQ')
            options_data = request.data.get('options', [])
            explanation = request.data.get('explanation', '').strip()
            evidence_text = request.data.get('evidence_text', '').strip()
            source_page = int(request.data.get('source_page', 1))
            source_section = request.data.get('source_section', 'Author Note')

            if len(q_text) < 10:
                return Response({'error': 'Question text is too short.'}, status=status.HTTP_400_BAD_REQUEST)

            next_order = quiz.questions.count() + 1
            question = Question.objects.create(
                quiz=quiz,
                question_text=q_text,
                question_type=q_type,
                difficulty=quiz.difficulty,
                source_page=source_page,
                source_section=source_section,
                evidence_text=evidence_text,
                source_citation=f"Page {source_page}: {source_section}",
                explanation=explanation,
                created_by_ai=False,
                order=next_order
            )

            created_opts = []
            for o in options_data:
                text = o.get('text', '').strip()
                if text:
                    opt = Option.objects.create(
                        question=question,
                        option_text=text,
                        is_correct=bool(o.get('is_correct', False))
                    )
                    created_opts.append({'id': opt.id, 'text': opt.option_text, 'is_correct': opt.is_correct})

            return Response({
                'message': 'Question added successfully.',
                'question': {
                    'id': question.id,
                    'order': question.order,
                    'question_text': question.question_text,
                    'question_type': question.question_type,
                    'source_page': question.source_page,
                    'evidence_text': question.evidence_text,
                    'explanation': question.explanation,
                    'options': created_opts
                }
            }, status=status.HTTP_201_CREATED)

        elif action == 'regenerate':
            question_id = request.data.get('question_id')
            target_q = quiz.questions.filter(id=question_id).first()
            if not target_q:
                return Response({'error': 'Question not found.'}, status=status.HTTP_404_NOT_FOUND)

            chunks = quiz.document.chunks
            if not chunks:
                return Response({'error': 'No document chunks available.'}, status=status.HTTP_400_BAD_REQUEST)

            # Generate 1 fresh question using provider
            provider = get_ai_provider()
            try:
                fresh_list = provider.generate_questions(
                    chunks=chunks,
                    num_questions=3,
                    difficulty=quiz.difficulty,
                    question_types=[target_q.question_type]
                )
            except Exception as e:
                return Response({'error': f"Regeneration failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

            # Find a candidate that differs from existing questions
            existing_texts = set(q.question_text.lower() for q in quiz.questions.all())
            candidate = None
            for item in fresh_list:
                if item['question'].lower() not in existing_texts:
                    candidate = item
                    break
            if not candidate:
                candidate = fresh_list[0]

            # Update target question
            target_q.question_text = candidate['question']
            target_q.question_type = candidate.get('type', target_q.question_type)
            target_q.source_page = candidate.get('source_page', 1)
            target_q.source_section = candidate.get('source_section', '')
            target_q.evidence_text = candidate.get('evidence_text', '')
            target_q.source_citation = candidate.get('source_citation', f"Page {target_q.source_page}")
            target_q.explanation = candidate.get('explanation', '')
            target_q.created_by_ai = True
            target_q.save()

            # Replace options
            target_q.options.all().delete()
            created_opts = []
            for opt in candidate.get('options', []):
                o_obj = Option.objects.create(
                    question=target_q,
                    option_text=opt['text'],
                    is_correct=opt['is_correct']
                )
                created_opts.append({'id': o_obj.id, 'text': o_obj.option_text, 'is_correct': o_obj.is_correct})

            return Response({
                'message': 'Question regenerated successfully.',
                'question': {
                    'id': target_q.id,
                    'order': target_q.order,
                    'question_text': target_q.question_text,
                    'question_type': target_q.question_type,
                    'source_page': target_q.source_page,
                    'source_section': target_q.source_section,
                    'evidence_text': target_q.evidence_text,
                    'explanation': target_q.explanation,
                    'options': created_opts
                }
            })

        elif action == 'delete':
            question_id = request.data.get('question_id')
            target_q = quiz.questions.filter(id=question_id).first()
            if not target_q:
                return Response({'error': 'Question not found.'}, status=status.HTTP_404_NOT_FOUND)
            target_q.delete()
            return Response({'message': 'Question deleted successfully.'})

        return Response({'error': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)


class StudioQuizPublishView(APIView):
    """
    Publish a Knowledge Check. Freezes the version and makes it discoverable by learners.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, quiz_id):
        user = request.user
        try:
            quiz = Quiz.objects.get(id=quiz_id)
        except Quiz.DoesNotExist:
            return Response({'error': 'Knowledge Check not found.'}, status=status.HTTP_404_NOT_FOUND)

        if quiz.created_by != user and not user.is_staff:
            return Response({'error': 'Unauthorized to publish this check.'}, status=status.HTTP_403_FORBIDDEN)

        if quiz.questions.count() == 0:
            return Response(
                {'error': 'A Knowledge Check must have at least one question before publishing.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if quiz.questions.filter(validation_status='PENDING_REVIEW').exists():
            return Response(
                {'error': 'This Knowledge Check has questions pending validation review. Resolve or edit them before publishing.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        quiz.status = 'PUBLISHED'
        quiz.published_at = timezone.now()
        quiz.save()

        return Response({
            'message': 'Knowledge Check published successfully!',
            'quiz_id': quiz.id,
            'version': quiz.version,
            'status': quiz.status,
            'published_at': quiz.published_at
        })


class StudioAuthorDashboardView(APIView):
    """
    Lists all drafts, published, and archived checks authored by the user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        quizzes = Quiz.objects.filter(created_by=user).select_related('subskill', 'document').order_by('-updated_at')

        results = []
        for q in quizzes:
            results.append({
                'id': q.id,
                'title': q.title,
                'status': q.status,
                'version': q.version,
                'difficulty': q.difficulty,
                'questions_count': q.questions.count(),
                'subskill_name': q.subskill.name if q.subskill else 'General',
                'document_title': q.document.title if q.document else 'Manual Source',
                'created_at': q.created_at,
                'updated_at': q.updated_at,
                'published_at': q.published_at
            })

        return Response({
            'total': len(results),
            'quizzes': results
        })


# =====================================================================
# LEARNER EXPERIENCE (Discovery, Test Runner, Scoring & Source-Backed Feedback)
# =====================================================================

class KnowledgeCheckCatalogView(APIView):
    """
    Publicly browsable catalog of PUBLISHED Knowledge Checks.
    Filters: competency (subskill_id), difficulty, search.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        queryset = Quiz.objects.filter(status='PUBLISHED').select_related('subskill', 'subskill__domain', 'created_by')

        subskill_id = request.query_params.get('subskill_id')
        if subskill_id:
            queryset = queryset.filter(subskill_id=subskill_id)

        difficulty = request.query_params.get('difficulty')
        if difficulty:
            queryset = queryset.filter(difficulty__iexact=difficulty)

        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(title__icontains=search)

        checks = []
        for q in queryset:
            checks.append({
                'id': q.id,
                'title': q.title,
                'difficulty': q.difficulty,
                'version': q.version,
                'time_estimate_mins': q.time_estimate_mins,
                'question_count': q.questions.count(),
                'subskill_id': q.subskill.id if q.subskill else None,
                'subskill_name': q.subskill.name if q.subskill else 'General',
                'domain_name': q.subskill.domain.name if (q.subskill and q.subskill.domain) else 'Governance',
                'published_at': q.published_at
            })

        return Response({
            'total': len(checks),
            'checks': checks
        })


class KnowledgeCheckDetailView(APIView):
    """
    Returns published check details and questions for the test runner.
    Correct answers are withheld to prevent client-side inspection.
    """
    permission_classes = [AllowAny]

    def get(self, request, quiz_id):
        try:
            quiz = Quiz.objects.select_related('subskill', 'subskill__domain').get(id=quiz_id)
        except Quiz.DoesNotExist:
            return Response({'error': 'Knowledge Check not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Allow creator or staff to preview draft, otherwise require PUBLISHED
        if quiz.status != 'PUBLISHED':
            if not request.user.is_authenticated or (quiz.created_by != request.user and not request.user.is_staff):
                return Response({'error': 'This Knowledge Check is not published.'}, status=status.HTTP_404_NOT_FOUND)

        questions = quiz.questions.prefetch_related('options').all()
        q_data = []
        for q in questions:
            # Client options without exposing is_correct
            opts = [{'id': o.id, 'text': o.option_text} for o in q.options.all()]
            q_data.append({
                'id': q.id,
                'order': q.order,
                'question_text': q.question_text,
                'question_type': q.question_type,
                'source_page': q.source_page,
                'options': opts
            })

        return Response({
            'id': quiz.id,
            'title': quiz.title,
            'version': quiz.version,
            'difficulty': quiz.difficulty,
            'time_estimate_mins': quiz.time_estimate_mins,
            'subskill_name': quiz.subskill.name if quiz.subskill else 'General',
            'subskill_id': quiz.subskill.id if quiz.subskill else None,
            'domain_name': quiz.subskill.domain.name if (quiz.subskill and quiz.subskill.domain) else 'Governance',
            'total_questions': len(q_data),
            'questions': q_data
        })


class SubmitQuizView(APIView):
    """
    Submit a completed Knowledge Check.
    Evaluates answers, records attempt & detailed answers, calculates score,
    provides source-backed explanations referencing document pages, and updates
    competency progression with recorded provenance.
    """
    permission_classes = [IsAuthenticated]
    throttle_classes = [QuizSubmissionThrottle]

    def post(self, request, quiz_id=None):
        user = request.user
        target_quiz_id = quiz_id or request.data.get('quiz_id')
        user_answers = request.data.get('answers', {})

        if not target_quiz_id:
            return Response({'error': 'quiz_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            quiz = Quiz.objects.select_related('subskill', 'subskill__domain', 'document').get(id=target_quiz_id)
        except Quiz.DoesNotExist:
            return Response({'error': 'Knowledge Check not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Normalize answers structure (support either dict {q_id: opt_id} or list [{question_id, selected_option_id}])
        normalized_answers: dict = {}
        if isinstance(user_answers, list):
            for a in user_answers:
                q_id = a.get('question_id')
                o_id = a.get('selected_option_id')
                if q_id is not None:
                    normalized_answers[str(q_id)] = o_id
        elif isinstance(user_answers, dict):
            normalized_answers = {str(k): v for k, v in user_answers.items()}

        questions = quiz.questions.prefetch_related('options').all()
        total_questions = questions.count()
        if total_questions == 0:
            return Response({'error': 'This assessment has no questions.'}, status=status.HTTP_400_BAD_REQUEST)

        correct_count = 0
        detailed_results = []
        attempt_answers_to_create = []

        # Create QuizAttempt record first
        attempt = QuizAttempt.objects.create(
            user=user,
            quiz=quiz,
            quiz_version=quiz.version,
            status='COMPLETED',
            total_questions=total_questions,
            correct_answers=0,
            score_percentage=0.0,
            completed_at=timezone.now()
        )

        strengths = []
        improvements = []

        for q in questions:
            correct_opt = q.options.filter(is_correct=True).first()
            user_selected_val = normalized_answers.get(str(q.id))

            is_right = False
            selected_opt_obj = None

            if user_selected_val is not None:
                # Find selected option
                selected_opt_obj = q.options.filter(id=user_selected_val).first()
                if selected_opt_obj and selected_opt_obj.is_correct:
                    is_right = True

            if is_right:
                correct_count += 1
                strengths.append(f"Page {q.source_page} — {q.source_section or 'Guideline'}")
            else:
                improvements.append(f"Page {q.source_page} — {q.source_section or 'Guideline'}")

            # Feedback text
            if is_right:
                feedback_str = f"Correct. {q.explanation}"
            else:
                correct_label = correct_opt.option_text if correct_opt else "Correct Option"
                feedback_str = f"Incorrect. The correct answer is: \"{correct_label}\". {q.explanation}"

            attempt_answers_to_create.append(
                QuizAnswer(
                    attempt=attempt,
                    question=q,
                    selected_option=selected_opt_obj,
                    answer_text=selected_opt_obj.option_text if selected_opt_obj else '',
                    is_correct=is_right,
                    feedback=feedback_str
                )
            )

            detailed_results.append({
                'question_id': q.id,
                'question_text': q.question_text,
                'question_type': q.question_type,
                'source_page': q.source_page,
                'source_section': q.source_section,
                'evidence_text': q.evidence_text,
                'source_citation': q.source_citation,
                'user_selected_id': selected_opt_obj.id if selected_opt_obj else None,
                'correct_option_id': correct_opt.id if correct_opt else None,
                'correct_option_text': correct_opt.option_text if correct_opt else '',
                'is_correct': is_right,
                'explanation': q.explanation,
                'feedback': feedback_str
            })

        # Bulk create answers
        QuizAnswer.objects.bulk_create(attempt_answers_to_create)

        # Update attempt score
        score_pct = round((correct_count / total_questions) * 100.0, 1)
        attempt.correct_answers = correct_count
        attempt.score_percentage = score_pct
        attempt.save()

        # Defensible Competency Progress Update (Section 22 of prompt)
        score_delta = 0.0
        new_prof_score = None
        if quiz.subskill:
            prof, _ = OfficialSkillProficiency.objects.get_or_create(
                user=user,
                subskill=quiz.subskill,
                defaults={'score': 50.0}
            )
            # Modest increment with provenance
            if score_pct >= 80:
                score_delta = 6.0
            elif score_pct >= 50:
                score_delta = 3.0
            else:
                score_delta = -1.0

            prof.score = round(max(20.0, min(98.0, prof.score + score_delta)), 1)
            prof.save()
            new_prof_score = prof.score

        # Synthesize Diagnostic Teaching Feedback ("Teach, Don't Just Score")
        correct_items = [d for d in detailed_results if d['is_correct']]
        incorrect_items = [d for d in detailed_results if not d['is_correct']]
        diagnostic_feedback = synthesize_diagnostic_feedback(quiz, correct_items, incorrect_items)

        # Distinct feedback summaries
        what_you_did_well = list(dict.fromkeys(strengths))[:3]
        keep_practising = list(dict.fromkeys(improvements))[:3]

        return Response({
            'attempt_id': attempt.id,
            'quiz_id': quiz.id,
            'quiz_title': quiz.title,
            'quiz_version': quiz.version,
            'score_percentage': score_pct,
            'correct_answers': correct_count,
            'total_questions': total_questions,
            'subskill_name': quiz.subskill.name if quiz.subskill else 'General',
            'subskill_id': quiz.subskill.id if quiz.subskill else None,
            'competency_score_delta': score_delta,
            'new_subskill_score': new_prof_score,
            'diagnostic_feedback': diagnostic_feedback,
            'what_you_did_well': what_you_did_well or ["Good effort on completing the assessment."],
            'keep_practising': keep_practising or ["Review any challenging questions using the source citations."],
            'detailed_results': detailed_results
        })


class CompetencyListView(APIView):
    """
    Public list of official competencies/subskills for Knowledge Check configuration dropdowns.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        subskills = SubSkill.objects.select_related('domain').all()
        return Response({
            'competencies': [
                {
                    'id': s.id,
                    'code': s.code,
                    'name': s.name,
                    'domain_name': s.domain.name,
                    'domain_type': s.domain.domain_type
                }
                for s in subskills
            ]
        })

