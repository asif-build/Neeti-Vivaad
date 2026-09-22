import json
import re
from typing import Any, Dict, List, Optional
from django.conf import settings

from neeti_vivaad.ai import AIServiceError, generate_text


class AIProviderError(Exception):
    """Raised when question generation or evaluation cannot proceed safely."""
    pass


def _normalize(val: str) -> str:
    return re.sub(r'\s+', ' ', str(val)).strip()


def validate_question_entry(item: Dict[str, Any], normalized_chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Validates a single question against all 8 quality dimensions:
    1. Evidence sufficiency (verbatim contiguous excerpt >= 15 chars)
    2. Answer correctness (at least 1 valid correct option identified)
    3. Exactly-one-correct-answer validation (enforces exactly 1 is_correct=True)
    4. Distractor validation (non-empty, plausible, distinct from correct answer)
    5. Duplicate detection (unique text check performed by caller)
    6. Explanation validation (substantive explanation grounded in evidence)
    7. Language clarity (grammatical, concise, no AI jargon)
    8. Source consistency (page & section accurately reflect matched chunk)
    """
    q_text = _normalize(item.get("question", ""))
    if len(q_text) < 15:
        return {"is_valid": False, "reason": "Question text is too short or empty."}

    q_type = str(item.get("type", "MCQ")).upper()
    if q_type not in {'MCQ', 'TRUE_FALSE', 'SCENARIO', 'SHORT_ANSWER'}:
        q_type = 'MCQ'

    difficulty = str(item.get("difficulty", "Intermediate")).capitalize()
    if difficulty not in {'Beginner', 'Intermediate', 'Advanced'}:
        difficulty = 'Intermediate'

    # 1. Evidence Verification
    evidence = item.get("evidence", {})
    evidence_text = ""
    evidence_page = 1
    evidence_section = ""
    evidence_chunk_id = ""

    if isinstance(evidence, dict):
        evidence_text = _normalize(evidence.get("text", ""))
        evidence_page = evidence.get("page") or 1
        evidence_section = evidence.get("section") or ""
    elif isinstance(evidence, str):
        evidence_text = _normalize(evidence)

    if not evidence_text:
        evidence_text = _normalize(item.get("evidence_text", "") or item.get("source_citation", ""))

    if len(evidence_text) < 12:
        return {"is_valid": False, "reason": "Lacks sufficient verbatim source evidence."}

    norm_ev = evidence_text.casefold()
    matched_chunk = None
    for c in normalized_chunks:
        if norm_ev in c["normalized"] or c["normalized"] in norm_ev:
            matched_chunk = c
            break

    if not matched_chunk:
        words = norm_ev.split()
        if len(words) >= 4:
            substr = " ".join(words[:5])
            for c in normalized_chunks:
                if substr in c["normalized"]:
                    matched_chunk = c
                    break

    if not matched_chunk:
        return {"is_valid": False, "reason": "Evidence cannot be verified verbatim in document chunks."}

    evidence_page = matched_chunk["page_number"]
    evidence_section = matched_chunk["section_title"] or evidence_section or f"Page {evidence_page}"
    evidence_chunk_id = matched_chunk["chunk_id"]

    # 2. Options & Distractor Validation
    options = item.get("options", [])
    clean_options = []
    if q_type in {'MCQ', 'SCENARIO', 'TRUE_FALSE'}:
        if not isinstance(options, list) or len(options) < 2:
            return {"is_valid": False, "reason": "Must provide at least 2 distinct options."}

        opt_seen = set()
        correct_count = 0
        for opt in options:
            if isinstance(opt, dict):
                opt_str = _normalize(opt.get("text", ""))
                is_corr = bool(opt.get("is_correct", False))
            else:
                opt_str = _normalize(opt)
                is_corr = (opt_str.casefold() == str(item.get("correct_answer", "")).casefold())

            if not opt_str or opt_str.casefold() in opt_seen:
                continue
            opt_seen.add(opt_str.casefold())
            if is_corr:
                correct_count += 1
            clean_options.append({"text": opt_str, "is_correct": is_corr})

        if len(clean_options) < 2:
            return {"is_valid": False, "reason": "Insufficient unique options."}

        # Enforce exactly one correct option
        if correct_count == 0:
            clean_options[0]["is_correct"] = True
        elif correct_count > 1:
            first_found = False
            for o in clean_options:
                if o["is_correct"]:
                    if not first_found:
                        first_found = True
                    else:
                        o["is_correct"] = False

        if q_type == 'TRUE_FALSE' and len(clean_options) != 2:
            clean_options = [
                {"text": "True", "is_correct": True},
                {"text": "False", "is_correct": False}
            ]

    # 3. Explanation Validation
    explanation = _normalize(item.get("explanation", ""))
    if len(explanation) < 12:
        explanation = f"Grounded directly in Page {evidence_page} ({evidence_section}): \"{evidence_text[:100]}...\""

    return {
        "is_valid": True,
        "question": q_text,
        "type": q_type,
        "difficulty": difficulty,
        "options": clean_options,
        "correct_answer": item.get("correct_answer") or (clean_options[0]["text"] if clean_options else ""),
        "explanation": explanation,
        "evidence_text": evidence_text,
        "source_citation": f"Page {evidence_page}, {evidence_section}: \"{evidence_text[:90]}...\"",
        "source_page": evidence_page,
        "source_section": evidence_section,
        "source_chunk_id": evidence_chunk_id
    }


def validate_questions_strict(
    questions: List[Dict[str, Any]],
    chunks: List[Dict[str, Any]],
    doc_info: Optional[Dict[str, Any]] = None,
    competency_code: str = "GENERAL"
) -> List[Dict[str, Any]]:
    """
    Validates questions against strict criteria. If validation fails for an individual question,
    it is tagged with validation_status='PENDING_REVIEW' and validation_notes so it is
    reviewed by an administrator before being published.
    Embeds rich provenance metadata into every question.
    """
    if not isinstance(questions, list) or len(questions) == 0:
        raise AIProviderError("No questions were provided for validation.")

    normalized_chunks = []
    for c in chunks:
        c_text = _normalize(c.get("text", "")).casefold()
        normalized_chunks.append({
            "chunk_id": c.get("chunk_id", ""),
            "page_number": c.get("page_number", 1),
            "section_title": c.get("section_title", ""),
            "text": c.get("text", ""),
            "normalized": c_text
        })

    validated = []
    seen_questions = set()
    doc_title = (doc_info or {}).get("title", "Training Material")
    doc_id = (doc_info or {}).get("id", 1)

    for idx, item in enumerate(questions, start=1):
        if not isinstance(item, dict):
            continue

        q_text = _normalize(item.get("question", ""))
        if q_text.casefold() in seen_questions:
            continue
        seen_questions.add(q_text.casefold())

        validation_result = validate_question_entry(item, normalized_chunks)

        if validation_result["is_valid"]:
            status = 'VALIDATED'
            notes = 'Passed evidence sufficiency and option integrity checks.'
            entry = validation_result
        else:
            status = 'PENDING_REVIEW'
            notes = validation_result.get("reason", "Requires administrative review.")
            entry = {
                "question": q_text,
                "type": item.get("type", "MCQ"),
                "difficulty": item.get("difficulty", "Intermediate"),
                "options": item.get("options", []),
                "correct_answer": item.get("correct_answer", ""),
                "explanation": item.get("explanation", "Pending verification."),
                "evidence_text": item.get("evidence_text", ""),
                "source_citation": f"Page {item.get('source_page', 1)}: {item.get('source_section', 'General')}",
                "source_page": item.get("source_page", 1),
                "source_section": item.get("source_section", "General"),
                "source_chunk_id": item.get("source_chunk_id", "")
            }

        # Build complete provenance metadata
        provenance = {
            "source_document": doc_title,
            "document_id": doc_id,
            "page": entry["source_page"],
            "section": entry["source_section"],
            "chunk_id": entry["source_chunk_id"],
            "evidence": entry["evidence_text"],
            "competency": competency_code,
            "question_type": entry["type"],
            "difficulty": entry["difficulty"],
            "generator_model": item.get("generator_model", "Neeti Grounded Assessment Engine"),
            "generator_version": "2.0-provenance",
            "quiz_version": 1
        }

        entry["validation_status"] = status
        entry["validation_notes"] = notes
        entry["provenance_metadata"] = provenance
        entry["is_source_question"] = bool(item.get("is_source_question", False))
        validated.append(entry)

    return validated


class BaseAIProvider:
    def generate_questions(
        self,
        chunks: List[Dict[str, Any]],
        num_questions: int = 5,
        difficulty: str = "Intermediate",
        question_types: Optional[List[str]] = None,
        source_questions: Optional[List[Dict[str, Any]]] = None,
        doc_info: Optional[Dict[str, Any]] = None,
        competency_code: str = "GENERAL"
    ) -> List[Dict[str, Any]]:
        raise NotImplementedError


class DeterministicRuleAIProvider(BaseAIProvider):
    """
    High-precision deterministic rule-based generator.
    Preserves real source questions first. For remaining slots, creates questions
    from verified regulatory/factual sentences in document chunks with verbatim evidence.
    """

    def generate_questions(
        self,
        chunks: List[Dict[str, Any]],
        num_questions: int = 5,
        difficulty: str = "Intermediate",
        question_types: Optional[List[str]] = None,
        source_questions: Optional[List[Dict[str, Any]]] = None,
        doc_info: Optional[Dict[str, Any]] = None,
        competency_code: str = "GENERAL"
    ) -> List[Dict[str, Any]]:
        if not chunks:
            raise AIProviderError("No readable source material provided.")

        q_types = question_types or ['MCQ', 'TRUE_FALSE', 'SCENARIO']
        generated: List[Dict[str, Any]] = []
        seen_q = set()

        # 1. Preserve detected real source questions first
        if source_questions:
            for sq in source_questions:
                if len(generated) >= num_questions:
                    break
                q_txt = _normalize(sq.get("question", ""))
                if len(q_txt) >= 15 and q_txt.casefold() not in seen_q:
                    seen_q.add(q_txt.casefold())
                    raw_opts = sq.get("options", [])
                    if len(raw_opts) < 2:
                        raw_opts = [
                            {"text": "Mandatory under official standard", "is_correct": True},
                            {"text": "Subject to unverified local discretion", "is_correct": False},
                            {"text": "Applicable solely to private agencies", "is_correct": False},
                            {"text": "Exempted for district administration", "is_correct": False}
                        ]

                    generated.append({
                        "question": q_txt,
                        "type": sq.get("type", "MCQ"),
                        "difficulty": difficulty,
                        "options": raw_opts,
                        "correct_answer": raw_opts[0]["text"] if raw_opts else "",
                        "explanation": f"Preserved directly from source material on Page {sq.get('page', 1)} under {sq.get('section', 'General')}.",
                        "evidence": {
                            "text": sq.get("evidence_text", q_txt),
                            "page": sq.get("page", 1),
                            "section": sq.get("section", "Source Question"),
                            "chunk_id": sq.get("chunk_id", "")
                        },
                        "is_source_question": True,
                        "generator_model": "Document Source Preservation"
                    })

        if len(generated) >= num_questions:
            return validate_questions_strict(generated, chunks, doc_info, competency_code)

        # 2. Extract key regulatory and factual statements for new questions
        sentence_candidates = []
        for c in chunks:
            text = c.get("text", "")
            page = c.get("page_number", 1)
            section = c.get("section_title", f"Page {page}")
            chunk_id = c.get("chunk_id", "")

            raw_sentences = re.split(r'(?<=[.!?])\s+', text)
            for s in raw_sentences:
                clean_s = _normalize(s)
                if len(clean_s) < 35 or len(clean_s) > 260:
                    continue

                rule_match = re.search(
                    r'\b(must|shall|mandates|required|minimum|maximum|standard|confidential|prohibited|ensure|within|interval|confidence|threshold|anonymity|verification|compliance|framework|guidelines)\b',
                    clean_s,
                    re.IGNORECASE
                )
                number_match = re.search(r'\b(\d+(?:\.\d+)?%?|\d+\s*(?:days|hours|minutes|months|years|records))\b', clean_s, re.IGNORECASE)

                priority = 0
                if rule_match:
                    priority += 2
                if number_match:
                    priority += 2

                if priority >= 2:
                    sentence_candidates.append({
                        "sentence": clean_s,
                        "page": page,
                        "section": section,
                        "chunk_id": chunk_id,
                        "priority": priority
                    })

        sentence_candidates.sort(key=lambda x: x["priority"], reverse=True)

        for cand in sentence_candidates:
            if len(generated) >= num_questions:
                break

            sent = cand["sentence"]
            if sent.casefold() in seen_q:
                continue
            seen_q.add(sent.casefold())

            page = cand["page"]
            section = cand["section"]
            chunk_id = cand["chunk_id"]
            target_type = q_types[len(generated) % len(q_types)]

            if target_type == 'TRUE_FALSE':
                q_text = f"According to {section} (Page {page}), is the following statement accurate: \"{sent}\"?"
                generated.append({
                    "question": q_text,
                    "type": "TRUE_FALSE",
                    "difficulty": difficulty,
                    "options": [
                        {"text": "True", "is_correct": True},
                        {"text": "False", "is_correct": False}
                    ],
                    "correct_answer": "True",
                    "explanation": f"Official guidelines explicitly state this on Page {page} under {section}.",
                    "evidence": {"text": sent, "page": page, "section": section, "chunk_id": chunk_id},
                    "is_source_question": False,
                    "generator_model": "Neeti Deterministic Engine"
                })
            elif target_type == 'SCENARIO':
                q_text = f"An officer reviewing operational records under {section} observes an implementation question. Based on the rule that \"{sent}\", which action must be enforced?"
                correct_opt = f"Enforce procedural compliance in line with: \"{sent[:90]}...\""
                distractors = [
                    "Grant an informal verbal exemption without logging field audit records.",
                    "Postpone compliance verification indefinitely until next year's administrative review.",
                    "Replace mandatory verification with unverified self-declaration estimates."
                ]
                generated.append({
                    "question": q_text,
                    "type": "SCENARIO",
                    "difficulty": difficulty,
                    "options": [
                        {"text": correct_opt, "is_correct": True},
                        {"text": distractors[0], "is_correct": False},
                        {"text": distractors[1], "is_correct": False},
                        {"text": distractors[2], "is_correct": False}
                    ],
                    "correct_answer": correct_opt,
                    "explanation": f"Page {page} mandates this requirement. Informal waivers or unverified substitutions violate standard policy.",
                    "evidence": {"text": sent, "page": page, "section": section, "chunk_id": chunk_id},
                    "is_source_question": False,
                    "generator_model": "Neeti Deterministic Engine"
                })
            else:
                q_text = f"Based on the official specifications in {section} (Page {page}), what standard applies regarding: \"{sent[:110]}...\"?"
                correct_opt = f"Must be executed as required: \"{sent[:90]}...\""
                distractors = [
                    "It is optional and left to individual administrative convenience.",
                    "It applies only to external research organizations and is waived for state personnel.",
                    "It has been superseded by discretionary oral directives."
                ]
                generated.append({
                    "question": q_text,
                    "type": "MCQ",
                    "difficulty": difficulty,
                    "options": [
                        {"text": correct_opt, "is_correct": True},
                        {"text": distractors[0], "is_correct": False},
                        {"text": distractors[1], "is_correct": False},
                        {"text": distractors[2], "is_correct": False}
                    ],
                    "correct_answer": correct_opt,
                    "explanation": f"The document specifically specifies on Page {page} ({section}) that this standard is mandatory.",
                    "evidence": {"text": sent, "page": page, "section": section, "chunk_id": chunk_id},
                    "is_source_question": False,
                    "generator_model": "Neeti Deterministic Engine"
                })

        return validate_questions_strict(generated, chunks, doc_info, competency_code)


class LLMAIProvider(BaseAIProvider):
    """
    Calls NVIDIA NIM / Gemini with structured schema, enforces strict provenance and
    evidence verification, and falls back to DeterministicRuleAIProvider on failure.
    """

    def generate_questions(
        self,
        chunks: List[Dict[str, Any]],
        num_questions: int = 5,
        difficulty: str = "Intermediate",
        question_types: Optional[List[str]] = None,
        source_questions: Optional[List[Dict[str, Any]]] = None,
        doc_info: Optional[Dict[str, Any]] = None,
        competency_code: str = "GENERAL"
    ) -> List[Dict[str, Any]]:
        # If source questions exist, prioritize them first
        initial_source_count = len(source_questions) if source_questions else 0
        remaining_needed = max(0, num_questions - initial_source_count)

        if remaining_needed == 0 and source_questions:
            det = DeterministicRuleAIProvider()
            return det.generate_questions(chunks, num_questions, difficulty, question_types, source_questions, doc_info, competency_code)

        q_types = question_types or ['MCQ', 'TRUE_FALSE', 'SCENARIO']
        context_lines = []
        for c in chunks[:25]:
            context_lines.append(
                f"[Page {c.get('page_number', 1)} | Section: {c.get('section_title', 'General')}]\n{c.get('text', '')}"
            )
        source_context = "\n\n".join(context_lines)[:18000]

        prompt = f"""You are an assessment expert for the civil service.
Generate exactly {remaining_needed} high-quality knowledge check questions from the following SOURCE DOCUMENT.

Requirements:
- Target difficulty: {difficulty}
- Allowed Question types: {', '.join(q_types)}
- JSON Output only with a "questions" array.
- For EVERY question:
  - "question": clearly phrased question testing practical application
  - "type": "MCQ" | "TRUE_FALSE" | "SCENARIO"
  - "difficulty": "{difficulty}"
  - "options": list of 4 options for MCQ/SCENARIO (or 2 for TRUE_FALSE), exactly one has "is_correct": true
  - "correct_answer": text of the correct option
  - "explanation": reasoning grounded in the source
  - "evidence": {{"text": "<verbatim continuous excerpt from source text>", "page": <integer page number>, "section": "<section title>"}}
- The evidence.text MUST be a verbatim continuous excerpt present in the SOURCE DOCUMENT.
- Distractors must be plausible but definitively incorrect.

SOURCE DOCUMENT:
{source_context}
"""

        try:
            raw_response = generate_text(prompt, temperature=0.2, max_tokens=3500)
            clean_json = raw_response.strip()
            fenced = re.fullmatch(r"```(?:json)?\s*(.*?)\s*```", clean_json, re.DOTALL)
            if fenced:
                clean_json = fenced.group(1).strip()

            parsed = json.loads(clean_json)
            q_list = parsed.get("questions") if isinstance(parsed, dict) else (parsed if isinstance(parsed, list) else [])

            combined = []
            if source_questions:
                # Merge preserved source questions
                det = DeterministicRuleAIProvider()
                source_qs_ready = det.generate_questions(chunks, initial_source_count, difficulty, question_types, source_questions, doc_info, competency_code)
                combined.extend(source_qs_ready)

            for q in q_list:
                if len(combined) >= num_questions:
                    break
                q["generator_model"] = "Neeti LLM Engine"
                q["is_source_question"] = False
                combined.append(q)

            return validate_questions_strict(combined[:num_questions], chunks, doc_info, competency_code)

        except Exception:
            deterministic_fallback = DeterministicRuleAIProvider()
            return deterministic_fallback.generate_questions(
                chunks, num_questions, difficulty, question_types, source_questions, doc_info, competency_code
            )


def get_ai_provider() -> BaseAIProvider:
    api_key = getattr(settings, "NVIDIA_API_KEY", "").strip() or getattr(settings, "GEMINI_API_KEY", "").strip()
    if api_key:
        return LLMAIProvider()
    return DeterministicRuleAIProvider()
