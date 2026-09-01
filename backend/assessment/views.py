import os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from core.models import User, SubSkill, CompetencyDomain, OfficialSkillProficiency
from .models import DocumentUpload, Quiz, Question, Option, QuizAttempt, BaselineQuestion, BaselineAssessmentAttempt
from .generator import generate_grounded_quiz

try:
    import pypdf
    PYPDF_AVAILABLE = True
except ImportError:
    PYPDF_AVAILABLE = False

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
        answers = request.data.get('answers', {})  # { question_id: selected_option_index }

        questions = BaselineQuestion.objects.select_related('domain', 'subskill').all()
        if not questions.exists():
            return Response({'error': 'Baseline assessment questions are not initialized.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        total_q = questions.count()
        correct_count = 0
        subskill_results = {}
        domain_aggregates = {}
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

            # Subskill score calculation based on answer (scale 35 to 90)
            score_val = 85.0 if is_correct else 42.0
            sub_code = q.subskill.code
            subskill_results[sub_code] = {
                'subskill': q.subskill,
                'domain': q.domain,
                'score': score_val,
                'is_correct': is_correct
            }

            # Save / Update OfficialSkillProficiency for this authenticated user
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

        # Calculate initial CTQ score (Behavioural performance + overall baseline accuracy)
        overall_pct = (correct_count / total_q) * 100.0 if total_q > 0 else 50.0
        beh_pct = (beh_correct / beh_total) * 100.0 if beh_total > 0 else 50.0
        calculated_ctq = round(0.6 * beh_pct + 0.4 * overall_pct, 1)

        # Update User
        user.ctq_score = calculated_ctq
        user.baseline_completed = True
        user.save()

        # Calculate Domain Averages
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

        # Save Attempt record
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

class DocumentUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        title = request.data.get('title', 'MoSPI Technical Guideline Document')
        file_obj = request.FILES.get('file')
        raw_text = request.data.get('text', '')

        extracted_text = ""
        if file_obj:
            filename = file_obj.name.lower()
            if filename.endswith('.pdf') and PYPDF_AVAILABLE:
                try:
                    reader = pypdf.PdfReader(file_obj)
                    extracted_text = "\n".join([page.extract_text() or '' for page in reader.pages])
                except Exception as e:
                    extracted_text = f"Error reading PDF: {e}"
            else:
                extracted_text = file_obj.read().decode('utf-8', errors='ignore')
        else:
            extracted_text = raw_text

        if not extracted_text.strip():
            extracted_text = "India Data Quality Framework (IDQF) 2024 Standards. National Sample Survey Guidelines on Microdata Anonymity, Sampling Error Margins, and CAPI offline verification."

        doc = DocumentUpload.objects.create(
            user=user,
            title=title,
            file=file_obj,
            extracted_text=extracted_text
        )

        return Response({
            'document_id': doc.id,
            'title': doc.title,
            'extracted_character_count': len(extracted_text),
            'preview': extracted_text[:300] + '...'
        }, status=status.HTTP_201_CREATED)

class GenerateQuizView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        document_id = request.data.get('document_id')
        subskill_id = request.data.get('subskill_id')

        try:
            doc = DocumentUpload.objects.get(id=document_id, user=user)
        except DocumentUpload.DoesNotExist:
            doc = DocumentUpload.objects.filter(user=user).order_by('-uploaded_at').first()
            if not doc:
                return Response({'error': 'No document found for your account. Please upload a guideline document first.'}, status=status.HTTP_400_BAD_REQUEST)

        subskill = None
        if subskill_id:
            subskill = SubSkill.objects.filter(id=subskill_id).first()
        if not subskill:
            subskill = SubSkill.objects.first()

        generated = generate_grounded_quiz(doc.extracted_text, num_questions=4)

        quiz = Quiz.objects.create(
            document=doc,
            subskill=subskill,
            title=f"Grounded Assessment: {doc.title[:40]}"
        )

        q_list = []
        for item in generated:
            q_obj = Question.objects.create(
                quiz=quiz,
                question_text=item['question'],
                source_citation=item.get('source_citation', 'Document Section 1'),
                explanation=item.get('explanation', 'Derived directly from uploaded document.')
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
                    'text': o_obj.option_text
                })

            q_list.append({
                'id': q_obj.id,
                'question': q_obj.question_text,
                'source_citation': q_obj.source_citation,
                'explanation': q_obj.explanation,
                'options': opts_data
            })

        return Response({
            'quiz_id': quiz.id,
            'quiz_title': quiz.title,
            'subskill_name': subskill.name if subskill else 'General',
            'questions': q_list
        })

class SubmitQuizView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        quiz_id = request.data.get('quiz_id')
        user_answers = request.data.get('answers', {})

        try:
            quiz = Quiz.objects.get(id=quiz_id, document__user=user)
        except Quiz.DoesNotExist:
            return Response({'error': 'Quiz not found or unauthorized.'}, status=status.HTTP_404_NOT_FOUND)

        questions = quiz.questions.all()
        total_questions = questions.count()
        correct_count = 0
        detailed_results = []

        for q in questions:
            correct_opt = q.options.filter(is_correct=True).first()
            user_selected_id = user_answers.get(str(q.id)) or user_answers.get(q.id)

            is_right = False
            if correct_opt and str(user_selected_id) == str(correct_opt.id):
                is_right = True
                correct_count += 1

            detailed_results.append({
                'question_id': q.id,
                'question_text': q.question_text,
                'correct_option_id': correct_opt.id if correct_opt else None,
                'user_option_id': user_selected_id,
                'is_correct': is_right,
                'source_citation': q.source_citation,
                'explanation': q.explanation
            })

        score_pct = round((correct_count / total_questions) * 100.0, 1) if total_questions > 0 else 0.0

        attempt = QuizAttempt.objects.create(
            user=user,
            quiz=quiz,
            score_percentage=score_pct,
            total_questions=total_questions,
            correct_answers=correct_count
        )

        # Dynamic proficiency score update for request.user
        score_delta = 0
        if quiz.subskill:
            prof, _ = OfficialSkillProficiency.objects.get_or_create(
                user=user,
                subskill=quiz.subskill,
                defaults={'score': 50.0}
            )
            if score_pct >= 80:
                prof.score = round(min(100.0, prof.score + 8.0), 1)
                score_delta = 8.0
            elif score_pct >= 50:
                prof.score = round(min(100.0, prof.score + 4.0), 1)
                score_delta = 4.0
            else:
                prof.score = round(max(0.0, prof.score - 2.0), 1)
                score_delta = -2.0
            prof.save()

        return Response({
            'attempt_id': attempt.id,
            'score_percentage': score_pct,
            'correct_answers': correct_count,
            'total_questions': total_questions,
            'subskill_name': quiz.subskill.name if quiz.subskill else 'General',
            'competency_score_delta': score_delta,
            'new_subskill_score': prof.score if quiz.subskill else None,
            'detailed_results': detailed_results
        })
