import os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from core.models import User, SubSkill, OfficialSkillProficiency
from .models import DocumentUpload, Quiz, Question, Option, QuizAttempt
from .generator import generate_grounded_quiz

try:
    import pypdf
    PYPDF_AVAILABLE = True
except ImportError:
    PYPDF_AVAILABLE = False

class DocumentUploadView(APIView):
    def post(self, request):
        user = request.user if request.user.is_authenticated else User.objects.filter(role='OFFICIAL').first()
        if not user:
            user = User.objects.first()

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
            extracted_text = "Standard Operating Procedure for National Sample Survey Field Operations Division. Section 1. Data Integrity & Verification. Enumerators must verify household credentials using Aadhaar or Ration Card documentation..."

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
    def post(self, request):
        document_id = request.data.get('document_id')
        subskill_id = request.data.get('subskill_id')
        
        try:
            doc = DocumentUpload.objects.get(id=document_id)
        except DocumentUpload.DoesNotExist:
            # Fallback to latest uploaded doc
            doc = DocumentUpload.objects.first()
            if not doc:
                return Response({'error': 'No document found. Upload a document first.'}, status=status.HTTP_400_BAD_REQUEST)

        subskill = None
        if subskill_id:
            try:
                subskill = SubSkill.objects.get(id=subskill_id)
            except SubSkill.DoesNotExist:
                pass
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
                explanation=item.get('explanation', 'Derived directly from uploaded material.')
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
    def post(self, request):
        user = request.user if request.user.is_authenticated else User.objects.filter(role='OFFICIAL').first()
        if not user:
            user = User.objects.first()

        quiz_id = request.data.get('quiz_id')
        user_answers = request.data.get('answers', {})  # Dict of question_id -> option_id

        try:
            quiz = Quiz.objects.get(id=quiz_id)
        except Quiz.DoesNotExist:
            return Response({'error': 'Quiz not found'}, status=status.HTTP_404_NOT_FOUND)

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

        # Save Attempt
        attempt = QuizAttempt.objects.create(
            user=user,
            quiz=quiz,
            score_percentage=score_pct,
            total_questions=total_questions,
            correct_answers=correct_count
        )

        # Competency Profile Feedback Loop
        score_delta = 0
        if quiz.subskill:
            prof, _ = OfficialSkillProficiency.objects.get_or_create(
                user=user,
                subskill=quiz.subskill,
                defaults={'score': 50.0}
            )
            old_score = prof.score
            if score_pct >= 80:
                prof.score = min(100.0, prof.score + 8.0)
                score_delta = 8.0
            elif score_pct >= 50:
                prof.score = min(100.0, prof.score + 4.0)
                score_delta = 4.0
            else:
                prof.score = max(0.0, prof.score - 2.0)
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
