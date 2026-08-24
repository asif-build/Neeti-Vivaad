from pathlib import Path

from django.db import transaction
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import OfficialSkillProficiency, SubSkill, User
from .generator import LIMITS, QuizGenerationError, generate_grounded_quiz
from .models import DocumentUpload, Option, Question, Quiz, QuizAttempt

try:
    import pypdf
except ImportError:  # pragma: no cover - depends on deployment extras
    pypdf = None

try:
    import pymupdf
except ImportError:  # pragma: no cover - pypdf remains the portable fallback
    pymupdf = None


MAX_UPLOAD_BYTES = 10 * 1024 * 1024
TEXT_EXTENSIONS = {".txt", ".md", ".csv"}


def _request_user(request):
    if request.user and request.user.is_authenticated:
        return request.user
    # Keep compatibility with the current demo login until authentication is
    # wired through the frontend. This never invents document or quiz content.
    return User.objects.filter(role="OFFICIAL").first() or User.objects.first()


def _extract_text(file_obj):
    if file_obj.size > MAX_UPLOAD_BYTES:
        raise ValueError("File size must not exceed 10 MB.")

    extension = Path(file_obj.name).suffix.lower()
    if extension == ".pdf":
        if pymupdf is None and pypdf is None:
            raise RuntimeError("PDF support is unavailable on the server.")
        try:
            extracted_pages = []
            extracted_chars = 0
            if pymupdf is not None:
                # MuPDF repairs malformed cross-reference tables efficiently;
                # these are common in long scanned/government-issued PDFs.
                document = pymupdf.open(stream=file_obj.read(), filetype="pdf")
                try:
                    if document.needs_pass:
                        raise ValueError("Encrypted PDFs are not supported.")
                    for page in document:
                        page_text = page.get_text("text") or ""
                        extracted_pages.append(page_text)
                        extracted_chars += len(page_text)
                        if extracted_chars >= LIMITS.max_document_chars:
                            break
                finally:
                    document.close()
            else:
                reader = pypdf.PdfReader(file_obj, strict=False)
                if reader.is_encrypted:
                    raise ValueError("Encrypted PDFs are not supported.")
                for page in reader.pages:
                    page_text = page.extract_text() or ""
                    extracted_pages.append(page_text)
                    extracted_chars += len(page_text)
                    if extracted_chars >= LIMITS.max_document_chars:
                        break
            text = "\n".join(extracted_pages)[: LIMITS.max_document_chars]
        except ValueError:
            raise
        except Exception as exc:
            raise ValueError(f"The PDF could not be read: {exc}") from exc
    elif extension in TEXT_EXTENSIONS:
        try:
            text = file_obj.read().decode("utf-8")
        except UnicodeDecodeError as exc:
            raise ValueError("Text files must use UTF-8 encoding.") from exc
    else:
        raise ValueError("Supported file types are PDF, TXT, MD, and CSV.")

    file_obj.seek(0)
    return text.strip()


class DocumentUploadView(APIView):
    def post(self, request):
        user = _request_user(request)
        if user is None:
            return Response({"error": "No user is available for this document."}, status=400)

        file_obj = request.FILES.get("file")
        raw_text = str(request.data.get("text", "")).strip()
        title = str(request.data.get("title", "")).strip()

        if not file_obj and not raw_text:
            return Response({"error": "Upload a document or paste document text."}, status=400)
        if file_obj and raw_text:
            return Response({"error": "Provide either a file or pasted text, not both."}, status=400)

        try:
            extracted_text = _extract_text(file_obj) if file_obj else raw_text
        except RuntimeError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        if len(extracted_text) < LIMITS.min_document_chars:
            return Response(
                {"error": f"The document needs at least {LIMITS.min_document_chars} readable characters."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not title:
            title = Path(file_obj.name).stem if file_obj else "Pasted document"

        document = DocumentUpload.objects.create(
            user=user,
            title=title[:255],
            file=file_obj,
            extracted_text=extracted_text,
        )
        return Response(
            {
                "document_id": document.id,
                "title": document.title,
                "extracted_character_count": len(extracted_text),
                "preview": extracted_text[:300],
            },
            status=status.HTTP_201_CREATED,
        )


class GenerateQuizView(APIView):
    def post(self, request):
        user = _request_user(request)
        document_id = request.data.get("document_id")
        if not document_id:
            return Response({"error": "document_id is required."}, status=400)

        try:
            document = DocumentUpload.objects.get(id=document_id, user=user)
        except (DocumentUpload.DoesNotExist, ValueError, TypeError):
            return Response({"error": "Document not found."}, status=404)

        try:
            num_questions = int(request.data.get("num_questions", 4))
        except (TypeError, ValueError):
            return Response({"error": "num_questions must be an integer."}, status=400)

        subskill = None
        subskill_id = request.data.get("subskill_id")
        if subskill_id:
            try:
                subskill = SubSkill.objects.get(id=subskill_id)
            except (SubSkill.DoesNotExist, ValueError, TypeError):
                return Response({"error": "Subskill not found."}, status=404)

        try:
            generated = generate_grounded_quiz(document.extracted_text, num_questions)
        except QuizGenerationError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        with transaction.atomic():
            quiz = Quiz.objects.create(
                document=document,
                subskill=subskill,
                title=f"AI assessment: {document.title}"[:255],
            )
            response_questions = []
            for item in generated:
                question = Question.objects.create(
                    quiz=quiz,
                    question_text=item["question"],
                    source_citation=item["source_citation"],
                    explanation=item["explanation"],
                )
                options = [
                    Option.objects.create(
                        question=question,
                        option_text=option["text"][:255],
                        is_correct=option["is_correct"],
                    )
                    for option in item["options"]
                ]
                response_questions.append(
                    {
                        "id": question.id,
                        "question": question.question_text,
                        "source_citation": question.source_citation,
                        "options": [{"id": option.id, "text": option.option_text} for option in options],
                    }
                )

        return Response(
            {
                "quiz_id": quiz.id,
                "quiz_title": quiz.title,
                "subskill_name": subskill.name if subskill else None,
                "questions": response_questions,
            },
            status=status.HTTP_201_CREATED,
        )


class SubmitQuizView(APIView):
    def post(self, request):
        user = _request_user(request)
        quiz_id = request.data.get("quiz_id")
        answers = request.data.get("answers")
        if not quiz_id or not isinstance(answers, dict):
            return Response({"error": "quiz_id and an answers object are required."}, status=400)

        try:
            quiz = Quiz.objects.prefetch_related("questions__options").get(
                id=quiz_id, document__user=user
            )
        except (Quiz.DoesNotExist, ValueError, TypeError):
            return Response({"error": "Quiz not found."}, status=404)

        questions = list(quiz.questions.all())
        if len(answers) != len(questions) or any(str(q.id) not in answers for q in questions):
            return Response({"error": "Answer every question before submitting."}, status=400)

        correct_count = 0
        detailed_results = []
        for question in questions:
            options = list(question.options.all())
            correct_option = next((option for option in options if option.is_correct), None)
            if correct_option is None:
                return Response({"error": "Quiz data is invalid."}, status=500)
            try:
                selected_id = int(answers[str(question.id)])
            except (TypeError, ValueError):
                return Response({"error": f"Invalid answer for question {question.id}."}, status=400)
            if selected_id not in {option.id for option in options}:
                return Response({"error": f"Invalid option for question {question.id}."}, status=400)

            is_correct = selected_id == correct_option.id
            correct_count += int(is_correct)
            detailed_results.append(
                {
                    "question_id": question.id,
                    "correct_option_id": correct_option.id,
                    "user_option_id": selected_id,
                    "is_correct": is_correct,
                    "source_citation": question.source_citation,
                    "explanation": question.explanation,
                }
            )

        score = round(correct_count / len(questions) * 100, 1)
        with transaction.atomic():
            attempt = QuizAttempt.objects.create(
                user=user,
                quiz=quiz,
                score_percentage=score,
                total_questions=len(questions),
                correct_answers=correct_count,
            )
            score_delta = 0.0
            new_score = None
            if quiz.subskill:
                proficiency, _ = OfficialSkillProficiency.objects.get_or_create(
                    user=user, subskill=quiz.subskill, defaults={"score": 50.0}
                )
                score_delta = 8.0 if score >= 80 else (4.0 if score >= 50 else -2.0)
                proficiency.score = min(100.0, max(0.0, proficiency.score + score_delta))
                proficiency.save()
                new_score = proficiency.score

        return Response(
            {
                "attempt_id": attempt.id,
                "score_percentage": score,
                "correct_answers": correct_count,
                "total_questions": len(questions),
                "subskill_name": quiz.subskill.name if quiz.subskill else None,
                "competency_score_delta": score_delta,
                "new_subskill_score": new_score,
                "detailed_results": detailed_results,
            }
        )
