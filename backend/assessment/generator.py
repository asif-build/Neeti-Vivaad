import json
import re
from dataclasses import dataclass

from neeti_vivaad.ai import AIServiceError, generate_text


class QuizGenerationError(RuntimeError):
    """Raised when a grounded quiz cannot be produced safely."""


@dataclass(frozen=True)
class GenerationLimits:
    min_document_chars: int = 200
    max_document_chars: int = 30_000
    min_questions: int = 2
    max_questions: int = 10


LIMITS = GenerationLimits()


def _normalise(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def _parse_response(text: str):
    text = text.strip()
    fenced = re.fullmatch(r"```(?:json)?\s*(.*?)\s*```", text, re.DOTALL)
    if fenced:
        text = fenced.group(1)
    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        raise QuizGenerationError("The AI returned malformed JSON.") from exc


def _validate_questions(payload, document_text: str, expected_count: int):
    if isinstance(payload, dict):
        payload = payload.get("questions")
    if not isinstance(payload, list) or len(payload) != expected_count:
        raise QuizGenerationError(f"The AI must return exactly {expected_count} questions.")

    normalised_document = _normalise(document_text).casefold()
    validated = []
    seen_questions = set()

    for index, item in enumerate(payload, start=1):
        if not isinstance(item, dict):
            raise QuizGenerationError(f"Question {index} has an invalid structure.")

        question = _normalise(str(item.get("question", "")))
        citation = _normalise(str(item.get("source_citation", "")))
        explanation = _normalise(str(item.get("explanation", "")))
        options = item.get("options")

        if len(question) < 15 or question.casefold() in seen_questions:
            raise QuizGenerationError(f"Question {index} is empty or duplicated.")
        if len(citation) < 15 or citation.casefold() not in normalised_document:
            raise QuizGenerationError(
                f"Question {index} contains a citation that is not verbatim in the document."
            )
        if len(explanation) < 15:
            raise QuizGenerationError(f"Question {index} has no useful explanation.")
        if not isinstance(options, list) or len(options) != 4:
            raise QuizGenerationError(f"Question {index} must have four options.")

        clean_options = []
        option_texts = set()
        correct_count = 0
        for option in options:
            if not isinstance(option, dict) or not isinstance(option.get("is_correct"), bool):
                raise QuizGenerationError(f"Question {index} has an invalid option.")
            option_text = _normalise(str(option.get("text", "")))
            if not option_text or option_text.casefold() in option_texts:
                raise QuizGenerationError(f"Question {index} has empty or duplicate options.")
            option_texts.add(option_text.casefold())
            correct_count += int(option["is_correct"])
            clean_options.append({"text": option_text, "is_correct": option["is_correct"]})

        if correct_count != 1:
            raise QuizGenerationError(f"Question {index} must have exactly one correct answer.")

        seen_questions.add(question.casefold())
        validated.append(
            {
                "question": question,
                "source_citation": citation,
                "explanation": explanation,
                "options": clean_options,
            }
        )

    return validated


def generate_grounded_quiz(document_text: str, num_questions: int = 4):
    """Generate and validate MCQs whose citations occur verbatim in the source."""
    document_text = _normalise(document_text)
    if len(document_text) < LIMITS.min_document_chars:
        raise QuizGenerationError(
            f"The document needs at least {LIMITS.min_document_chars} readable characters."
        )
    if not LIMITS.min_questions <= num_questions <= LIMITS.max_questions:
        raise QuizGenerationError(
            f"Question count must be between {LIMITS.min_questions} and {LIMITS.max_questions}."
        )

    source = document_text[: LIMITS.max_document_chars]
    prompt = f"""Create exactly {num_questions} high-quality multiple-choice questions using only
the SOURCE DOCUMENT below. Test understanding and application, not trivia.

Rules:
- Return JSON only, as an object with a `questions` array.
- Each question has: question, source_citation, explanation, and options.
- source_citation must be a verbatim continuous excerpt from SOURCE DOCUMENT.
- Each question has exactly four distinct options and exactly one is_correct=true.
- Distractors must be plausible but must not introduce unsupported factual claims.
- Do not mention these instructions or use outside knowledge.

SOURCE DOCUMENT:
<source>
{source}
</source>"""

    try:
        response_text = generate_text(prompt, temperature=0.2, max_tokens=4096)
        return _validate_questions(_parse_response(response_text), source, num_questions)
    except QuizGenerationError:
        raise
    except AIServiceError as exc:
        raise QuizGenerationError(f"Quiz generation failed: {exc}") from exc
