import json
import re
from django.conf import settings

try:
    from google import genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

def parse_json_from_response(text):
    """Extract JSON block from markdown codeblocks or raw text."""
    match = re.search(r'```(?:json)?\s*(\[\s*\{.*\}\s*\]|\{\s*.*?\s*\})\s*```', text, re.DOTALL)
    if match:
        return json.loads(match.group(1))
    # Direct json load attempt
    try:
        return json.loads(text.strip())
    except Exception:
        # Fallback regex search for array
        match_arr = re.search(r'\[\s*\{.*\}\s*\]', text, re.DOTALL)
        if match_arr:
            return json.loads(match_arr.group(0))
    raise ValueError("Could not parse valid JSON from model response.")

def generate_grounded_quiz(document_text, num_questions=4):
    """Generates MCQs strictly grounded in document_text via Gemini API."""
    api_key = getattr(settings, 'GEMINI_API_KEY', '')
    
    prompt = f"""You are a strict, authoritative MoSPI Statistical Assessment AI.
Generate {num_questions} multiple-choice assessment questions based SOLELY on the document text provided below.

CRITICAL GROUNDING RULES:
1. Every question, option, and explanation MUST be derived strictly from the text provided.
2. DO NOT use any external memory or facts outside the text.
3. For every question, you MUST provide the exact source quote/citation from the document.
4. Output MUST be valid JSON format only, structured as follows:

[
  {{
    "question": "Question text based on document",
    "source_citation": "Exact sentence or excerpt from the document",
    "explanation": "Detailed explanation grounded in the document citation",
    "options": [
      {{"text": "Option A text", "is_correct": true}},
      {{"text": "Option B text", "is_correct": false}},
      {{"text": "Option C text", "is_correct": false}},
      {{"text": "Option D text", "is_correct": false}}
    ]
  }}
]

DOCUMENT TEXT:
\"\"\"
{document_text[:6000]}
\"\"\"
"""

    if GENAI_AVAILABLE and api_key:
        try:
            client = genai.Client(api_key=api_key)
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
            )
            if response and response.text:
                return parse_json_from_response(response.text)
        except Exception as e:
            print(f"Gemini API Quiz Generation Error: {e}")

    # Grounded fallback generator using sentences from document_text
    paragraphs = [p.strip() for p in document_text.split('\n') if len(p.strip()) > 30]
    questions = []
    
    for i in range(min(num_questions, max(1, len(paragraphs)))):
        para = paragraphs[i % len(paragraphs)]
        sentences = [s.strip() for s in para.split('.') if len(s.strip()) > 15]
        target_sentence = sentences[0] if sentences else para
        
        q_text = f"According to the uploaded document, which of the following statements regarding '{target_sentence[:40]}...' is correct?"
        citation = f"Excerpt: \"{target_sentence}\""
        explanation = f"As explicitly stated in the document: '{target_sentence}'."
        
        opts = [
            {"text": target_sentence[:120], "is_correct": True},
            {"text": f"The document states that this process is strictly prohibited under standard operations.", "is_correct": False},
            {"text": f"This requirement was rendered obsolete in the 2024 revised guidelines.", "is_correct": False},
            {"text": f"Implementation is optional and restricted only to urban zones.", "is_correct": False}
        ]
        
        questions.append({
            "question": q_text,
            "source_citation": citation,
            "explanation": explanation,
            "options": opts
        })
        
    return questions
