import hashlib
import io
import os
import re
import zipfile
from typing import Any, Dict, List, Tuple

import pypdf
import docx


class DocumentExtractionError(Exception):
    """User-facing extraction error."""
    pass


MAX_FILE_SIZE = 15 * 1024 * 1024  # 15 MB
ALLOWED_EXTENSIONS = {'.pdf', '.docx', '.txt'}


def validate_file_security(file_bytes: bytes, filename: str) -> str:
    """
    Validates file size, extension, and content structure.
    Returns normalized file_type: 'PDF', 'DOCX', or 'TXT'.
    """
    if len(file_bytes) > MAX_FILE_SIZE:
        raise DocumentExtractionError("File size exceeds 15 MB limit.")

    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise DocumentExtractionError(
            f"Unsupported file format '{ext}'. Allowed formats: PDF, DOCX, TXT."
        )

    if ext == '.pdf':
        if not file_bytes.startswith(b'%PDF-'):
            raise DocumentExtractionError("Invalid or corrupted PDF file.")
        return 'PDF'

    elif ext == '.docx':
        try:
            with zipfile.ZipFile(io.BytesIO(file_bytes)) as zf:
                if 'word/document.xml' not in zf.namelist():
                    raise DocumentExtractionError("Invalid or corrupted DOCX document.")
        except Exception:
            raise DocumentExtractionError("Invalid or corrupted DOCX file.")
        return 'DOCX'

    elif ext == '.txt':
        return 'TXT'

    raise DocumentExtractionError("Unsupported file type.")


def _clean_text(text: str) -> str:
    # Normalize multiple whitespace while keeping newlines intact where relevant
    lines = [re.sub(r'[ \t]+', ' ', line).strip() for line in text.splitlines()]
    return "\n".join(line for line in lines if line)


def _detect_heading(line: str) -> bool:
    """Heuristic to detect if a line represents a section or chapter heading."""
    clean = line.strip()
    if not clean or len(clean) > 90:
        return False
    # Check common section patterns
    if re.match(r'^(?:Section|Chapter|Part|Article|Module|Guideline|Annexure|Appendix|\d+(\.\d+)*)\b', clean, re.IGNORECASE):
        return True
    if clean.isupper() and len(clean) > 4:
        return True
    return False


def _split_into_chunks(text: str, page_num: int, default_section: str, base_chunk_idx: int) -> Tuple[List[Dict[str, Any]], int]:
    """
    Splits text into cohesive chunks (approx 300 - 800 chars) retaining section context.
    """
    chunks = []
    lines = text.splitlines()
    current_section = default_section
    current_chunk_lines: List[str] = []
    current_chunk_len = 0
    chunk_idx = base_chunk_idx

    for line in lines:
        line_str = line.strip()
        if not line_str:
            continue

        if _detect_heading(line_str):
            # If current buffer has enough text, flush before changing section
            if current_chunk_lines and current_chunk_len >= 150:
                chunk_text = " ".join(current_chunk_lines).strip()
                chunks.append({
                    "chunk_id": f"chunk_p{page_num}_{chunk_idx}",
                    "page_number": page_num,
                    "section_title": current_section,
                    "text": chunk_text
                })
                chunk_idx += 1
                current_chunk_lines = []
                current_chunk_len = 0
            current_section = line_str

        current_chunk_lines.append(line_str)
        current_chunk_len += len(line_str)

        if current_chunk_len >= 600:
            chunk_text = " ".join(current_chunk_lines).strip()
            chunks.append({
                "chunk_id": f"chunk_p{page_num}_{chunk_idx}",
                "page_number": page_num,
                "section_title": current_section,
                "text": chunk_text
            })
            chunk_idx += 1
            current_chunk_lines = []
            current_chunk_len = 0

    if current_chunk_lines:
        chunk_text = " ".join(current_chunk_lines).strip()
        if len(chunk_text) >= 40:
            chunks.append({
                "chunk_id": f"chunk_p{page_num}_{chunk_idx}",
                "page_number": page_num,
                "section_title": current_section,
                "text": chunk_text
            })
            chunk_idx += 1

    return chunks, chunk_idx


def extract_pdf(file_bytes: bytes) -> Dict[str, Any]:
    """Extracts text page-by-page from a PDF."""
    try:
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
    except Exception as e:
        raise DocumentExtractionError(f"Failed to read PDF document: {str(e)}")

    page_count = len(reader.pages)
    if page_count == 0:
        raise DocumentExtractionError("The PDF contains no pages.")

    all_chunks: List[Dict[str, Any]] = []
    full_text_pages: List[str] = []
    chunk_counter = 1
    total_text_len = 0

    for idx, page in enumerate(reader.pages, start=1):
        try:
            page_text = page.extract_text() or ""
        except Exception:
            page_text = ""
        page_clean = _clean_text(page_text)
        total_text_len += len(page_clean)
        full_text_pages.append(f"--- Page {idx} ---\n{page_clean}")

        if page_clean:
            page_chunks, chunk_counter = _split_into_chunks(
                page_clean,
                page_num=idx,
                default_section=f"Page {idx}",
                base_chunk_idx=chunk_counter
            )
            all_chunks.extend(page_chunks)

    if total_text_len < 60:
        raise DocumentExtractionError("This document doesn't contain readable text.")

    return {
        "file_type": "PDF",
        "page_count": page_count,
        "extracted_text": "\n\n".join(full_text_pages),
        "chunks": all_chunks
    }


def extract_docx(file_bytes: bytes) -> Dict[str, Any]:
    """Extracts headings, paragraphs, and tables from a DOCX file."""
    try:
        doc = docx.Document(io.BytesIO(file_bytes))
    except Exception as e:
        raise DocumentExtractionError(f"Failed to read DOCX document: {str(e)}")

    lines = []
    current_section = "General Overview"

    for para in doc.paragraphs:
        p_text = para.text.strip()
        if not p_text:
            continue
        # Style inspection
        style_name = para.style.name.lower() if para.style else ""
        if 'heading' in style_name or _detect_heading(p_text):
            current_section = p_text
            lines.append(f"\n## {p_text}\n")
        else:
            lines.append(p_text)

    # Process tables
    for table_idx, table in enumerate(doc.tables, start=1):
        lines.append(f"\n[Table {table_idx}]")
        for row in table.rows:
            row_cells = [cell.text.strip().replace('\n', ' ') for cell in row.cells]
            if any(row_cells):
                lines.append(" | ".join(row_cells))

    full_text = "\n".join(lines).strip()
    if len(full_text) < 60:
        raise DocumentExtractionError("This document doesn't contain readable text.")

    # Approximate pages (every 1800 chars = 1 page)
    chars_per_page = 1800
    page_count = max(1, (len(full_text) + chars_per_page - 1) // chars_per_page)

    all_chunks: List[Dict[str, Any]] = []
    chunk_counter = 1

    # Split text into estimated pages, then chunk
    paragraphs = full_text.split('\n')
    current_page = 1
    current_page_chars = 0
    current_page_text: List[str] = []

    for para in paragraphs:
        current_page_text.append(para)
        current_page_chars += len(para)
        if current_page_chars >= chars_per_page:
            p_text = "\n".join(current_page_text)
            p_chunks, chunk_counter = _split_into_chunks(
                p_text,
                page_num=current_page,
                default_section=current_section,
                base_chunk_idx=chunk_counter
            )
            all_chunks.extend(p_chunks)
            current_page += 1
            current_page_chars = 0
            current_page_text = []

    if current_page_text:
        p_text = "\n".join(current_page_text)
        p_chunks, chunk_counter = _split_into_chunks(
            p_text,
            page_num=current_page,
            default_section=current_section,
            base_chunk_idx=chunk_counter
        )
        all_chunks.extend(p_chunks)

    return {
        "file_type": "DOCX",
        "page_count": max(page_count, current_page),
        "extracted_text": full_text,
        "chunks": all_chunks
    }


def extract_txt(file_bytes: bytes) -> Dict[str, Any]:
    """Extracts text from raw UTF-8 or Latin-1 text."""
    try:
        text = file_bytes.decode('utf-8')
    except UnicodeDecodeError:
        try:
            text = file_bytes.decode('latin-1')
        except Exception as e:
            raise DocumentExtractionError(f"Could not read text document: {str(e)}")

    cleaned = _clean_text(text)
    if len(cleaned) < 60:
        raise DocumentExtractionError("This document doesn't contain readable text.")

    chars_per_page = 1800
    page_count = max(1, (len(cleaned) + chars_per_page - 1) // chars_per_page)
    all_chunks, _ = _split_into_chunks(cleaned, page_num=1, default_section="Document Text", base_chunk_idx=1)

    return {
        "file_type": "TXT",
        "page_count": page_count,
        "extracted_text": cleaned,
        "chunks": all_chunks
    }


def detect_source_questions(extracted_text: str, chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Detects and extracts questions that naturally occur in the source document
    (e.g., end-of-chapter exercises, self-assessment questions, progress checks).
    Preserves real source questions rather than fabricating new ones.
    """
    found_questions: List[Dict[str, Any]] = []
    seen_q = set()

    # Regex for explicitly numbered question blocks with options: (a), (b), (c), (d)
    q_block_pattern = re.compile(
        r'(?:(?:Question|Q)\s*(\d+)[:.]?|(\d+)\.\s+)([^\n\?]+\?)\s*\n'
        r'(?:\s*[\(]?[aA][\)\.]\s*([^\n]+)\n)?'
        r'(?:\s*[\(]?[bB][\)\.]\s*([^\n]+)\n)?'
        r'(?:\s*[\(]?[cC][\)\.]\s*([^\n]+)\n)?'
        r'(?:\s*[\(]?[dD][\)\.]\s*([^\n]+))?',
        re.MULTILINE | re.IGNORECASE
    )

    # Search in each chunk for exact page and section provenance
    for chunk in chunks:
        c_text = chunk.get("text", "")
        page = chunk.get("page_number", 1)
        section = chunk.get("section_title", f"Page {page}")
        chunk_id = chunk.get("chunk_id", "")

        for match in q_block_pattern.finditer(c_text):
            q_num = match.group(1) or match.group(2) or str(len(found_questions) + 1)
            q_text = _clean_text(match.group(3))
            if len(q_text) < 15 or q_text.casefold() in seen_q:
                continue

            seen_q.add(q_text.casefold())

            # Check if options (a, b, c, d) were extracted
            opts = []
            for opt_idx, g_idx in enumerate([4, 5, 6, 7], start=1):
                raw_opt = match.group(g_idx)
                if raw_opt:
                    clean_opt = _clean_text(raw_opt)
                    if clean_opt:
                        opts.append({
                            "text": clean_opt,
                            "is_correct": (opt_idx == 1) # Default first candidate, validated later
                        })

            found_questions.append({
                "source_question_number": q_num,
                "question": q_text,
                "type": "MCQ" if len(opts) >= 2 else "SHORT_ANSWER",
                "options": opts,
                "page": page,
                "section": section,
                "chunk_id": chunk_id,
                "evidence_text": match.group(0)[:250],
                "is_source_question": True
            })

    # Also scan for standalone interrogative sentences in "Exercises" or "Review" sections
    for chunk in chunks:
        section = chunk.get("section_title", "")
        if re.search(r'\b(exercise|review|quiz|assessment|questions|check\s*your\s*progress)\b', section, re.IGNORECASE):
            c_text = chunk.get("text", "")
            page = chunk.get("page_number", 1)
            chunk_id = chunk.get("chunk_id", "")

            sentences = re.split(r'(?<=\?)\s+', c_text)
            for s in sentences:
                clean_s = _clean_text(s)
                if clean_s.endswith('?') and 20 <= len(clean_s) <= 220:
                    clean_clean = re.sub(r'^\s*(?:\d+[\.\)]|Q\d+[\.\:])\s*', '', clean_s)
                    if clean_clean.casefold() not in seen_q and len(clean_clean) >= 15:
                        seen_q.add(clean_clean.casefold())
                        found_questions.append({
                            "question": clean_clean,
                            "type": "MCQ",
                            "options": [],
                            "page": page,
                            "section": section,
                            "chunk_id": chunk_id,
                            "evidence_text": clean_s,
                            "is_source_question": True
                        })

    return found_questions


def detect_learning_objectives(chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Extracts key learning objectives, competency goals, and core principles from source chunks.
    """
    objectives: List[Dict[str, Any]] = []
    seen = set()

    for chunk in chunks:
        section = chunk.get("section_title", "")
        c_text = chunk.get("text", "")
        page = chunk.get("page_number", 1)

        is_obj_section = bool(re.search(r'\b(objective|outcome|competenc|key\s*concept|overview|scope)\b', section, re.IGNORECASE))
        lines = c_text.splitlines()

        for line in lines:
            clean = _clean_text(line)
            if not clean or len(clean) < 25 or len(clean) > 200:
                continue

            # Check bullet lines or objective statements
            if is_obj_section or re.match(r'^(?:[\-\*•]|\d+\.|\bUnderstand\b|\bLearn\b|\bAnalyze\b|\bEnsure\b|\bApply\b)', clean, re.IGNORECASE):
                if clean.casefold() not in seen:
                    seen.add(clean.casefold())
                    objectives.append({
                        "objective": clean,
                        "section": section,
                        "page": page
                    })
                    if len(objectives) >= 8:
                        return objectives

    return objectives


def process_document_source(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """
    Full extraction pipeline:
    1. Validates size, extension, integrity.
    2. Calculates SHA-256 hash.
    3. Extracts text and chunks preserving page number and section provenance.
    4. Detects existing source questions and learning objectives.
    """
    file_type = validate_file_security(file_bytes, filename)
    content_hash = hashlib.sha256(file_bytes).hexdigest()

    if file_type == 'PDF':
        extracted = extract_pdf(file_bytes)
    elif file_type == 'DOCX':
        extracted = extract_docx(file_bytes)
    else:
        extracted = extract_txt(file_bytes)

    extracted["file_size"] = len(file_bytes)
    extracted["content_hash"] = content_hash
    extracted["filename"] = filename

    # Detect pre-existing questions and objectives
    extracted["detected_source_questions"] = detect_source_questions(extracted["extracted_text"], extracted["chunks"])
    extracted["detected_learning_objectives"] = detect_learning_objectives(extracted["chunks"])

    return extracted
