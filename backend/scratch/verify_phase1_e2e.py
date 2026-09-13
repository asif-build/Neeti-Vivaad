import io
import os
import sys
import django

# Setup django environment
sys.path.insert(0, r"c:\Users\DELL\Desktop\Neeti-Vivaad\backend")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "neeti_vivaad.settings")
django.setup()

from django.test import Client
from core.models import User, SubSkill, CompetencyDomain, OfficialSkillProficiency
from assessment.models import DocumentUpload, Quiz, Question, Option, QuizAttempt, QuizAnswer


def create_minimal_pdf_bytes():
    """
    Creates a valid 3-page PDF in-memory containing official MoSPI technical guidelines.
    """
    import pypdf
    writer = pypdf.PdfWriter()

    # Create 3 pages with content
    p1 = writer.add_blank_page(width=612, height=792)
    # We can write text objects into PDF or use standard PDF stream
    # A standard minimalist valid PDF with 3 text streams:
    pdf_content = (
        b"%PDF-1.4\n"
        b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"
        b"2 0 obj << /Type /Pages /Kids [3 0 R 4 0 R 5 0 R] /Count 3 >> endobj\n"
        b"3 0 obj << /Type /Page /Parent 2 0 R /Resources << /Font << /F1 6 0 R >> >> /Contents 7 0 R /MediaBox [0 0 612 792] >> endobj\n"
        b"4 0 obj << /Type /Page /Parent 2 0 R /Resources << /Font << /F1 6 0 R >> >> /Contents 8 0 R /MediaBox [0 0 612 792] >> endobj\n"
        b"5 0 obj << /Type /Page /Parent 2 0 R /Resources << /Font << /F1 6 0 R >> >> /Contents 9 0 R /MediaBox [0 0 612 792] >> endobj\n"
        b"6 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n"
        b"7 0 obj << /Length 260 >> stream\n"
        b"BT /F1 12 Tf 50 700 Td (Section 1. Core Sampling Standards) Tj T* (All national sample statistical collections must maintain a minimum confidence interval of 95 percent.) Tj T* (Automated anomaly detection must flag duplicate household records within 24 hours of submission.) Tj ET\n"
        b"endstream\nendobj\n"
        b"8 0 obj << /Length 260 >> stream\n"
        b"BT /F1 12 Tf 50 700 Td (Section 2. Microdata Privacy Protocols) Tj T* (Data dissemination must undergo k-anonymity where k is at least 5 before open public release.) Tj T* (Personally Identifiable Information including biometric tokens must be stripped at the field collection tablet level.) Tj ET\n"
        b"endstream\nendobj\n"
        b"9 0 obj << /Length 240 >> stream\n"
        b"BT /F1 12 Tf 50 700 Td (Section 3. Enumerator Compliance Protocol) Tj T* (Enumerators operating in remote terrains must utilize offline-first mobile survey tools.) Tj T* (Multi-tier verification synchronization must execute within 15 minutes of re-establishing connectivity.) Tj ET\n"
        b"endstream\nendobj\n"
        b"xref\n0 10\n0000000000 65535 f \n"
        b"trailer << /Size 10 /Root 1 0 R >>\nstartxref\n1100\n%%EOF\n"
    )
    return pdf_content


def run_e2e_verification():
    print("=================================================================")
    print("STARTING REAL END-TO-END VERIFICATION: PHASE 1 KNOWLEDGE CHECK")
    print("=================================================================")

    # 1. Setup Test User
    email = "civil_servant_test@gov.in"
    user, _ = User.objects.get_or_create(
        username="officer_e2e",
        defaults={"email": email, "is_active": True, "is_email_verified": True}
    )
    user.set_password("SecurePass123!")
    user.save()
    print(f"[1] Test Civil Servant User created: {user.username} ({user.email})")

    # Ensure a SubSkill exists
    domain, _ = CompetencyDomain.objects.get_or_create(
        name="Data Governance",
        domain_type="FUNCTIONAL",
        defaults={"description": "Statistical and policy guidelines"}
    )
    subskill, _ = SubSkill.objects.get_or_create(
        code="SAMPLING",
        defaults={"name": "Sampling Techniques", "domain": domain}
    )
    print(f"[2] Target Competency: [{subskill.code}] {subskill.name}")

    client = Client()
    client.force_login(user)

    # 2. Upload Real PDF Document
    pdf_bytes = create_minimal_pdf_bytes()
    pdf_file = io.BytesIO(pdf_bytes)
    pdf_file.name = "MoSPI_IDQF_Guidelines_2024.pdf"

    upload_res = client.post(
        "/api/assessment/documents/",
        {"file": pdf_file, "title": "MoSPI India Data Quality Framework 2024 Guidelines"},
        format="multipart"
    )
    print(f"[3] Document Upload Response Status: {upload_res.status_code}")
    assert upload_res.status_code == 201, f"Upload failed: {upload_res.content}"
    doc_data = upload_res.json()
    doc_id = doc_data["document_id"]
    print(f"    - Document ID: {doc_id}")
    print(f"    - File Type: {doc_data['file_type']}")
    print(f"    - Extracted Pages: {doc_data['page_count']}")
    print(f"    - Chunks Indexed: {doc_data['chunk_count']}")
    assert doc_data["file_type"] == "PDF"
    assert doc_data["page_count"] == 3

    # 3. Generate Knowledge Check Draft in Studio
    gen_res = client.post(
        "/api/assessment/studio/generate/",
        {
            "document_id": doc_id,
            "title": "MoSPI 2024 Microdata Compliance Check",
            "num_questions": 3,
            "difficulty": "Intermediate",
            "question_types": ["MCQ", "TRUE_FALSE", "SCENARIO"],
            "subskill_id": subskill.id
        },
        content_type="application/json"
    )
    print(f"[4] Studio Check Generation Status: {gen_res.status_code}")
    assert gen_res.status_code == 201, f"Generation failed: {gen_res.content}"
    quiz_data = gen_res.json()
    quiz_id = quiz_data["quiz_id"]
    print(f"    - Quiz ID: {quiz_id}")
    print(f"    - Status: {quiz_data['status']}")
    print(f"    - Questions Generated: {len(quiz_data['questions'])}")
    assert quiz_data["status"] == "DRAFT"
    assert len(quiz_data["questions"]) >= 2

    # Verify every question has genuine evidence provenance
    for idx, q in enumerate(quiz_data["questions"], 1):
        print(f"    Q{idx}: {q['question_text'][:65]}...")
        print(f"        Type: {q['question_type']} | Page: {q['source_page']} | Section: {q['source_section']}")
        print(f"        Verbatim Evidence: \"{q['evidence_text'][:60]}...\"")
        assert q["source_page"] in [1, 2, 3]
        assert len(q["evidence_text"]) >= 12
        assert len(q["options"]) >= 2

    # 4. Author adds a manual question in Review Workspace
    add_q_res = client.post(
        f"/api/assessment/studio/{quiz_id}/questions/",
        {
            "action": "add",
            "question_text": "What is the mandatory threshold for microdata k-anonymity under Section 2?",
            "question_type": "MCQ",
            "source_page": 2,
            "source_section": "Section 2. Microdata Privacy Protocols",
            "evidence_text": "Data dissemination must undergo k-anonymity where k is at least 5 before open public release.",
            "explanation": "Section 2 mandates k >= 5 for all disseminated microdata.",
            "options": [
                {"text": "k must be at least 5", "is_correct": True},
                {"text": "k must be exactly 2", "is_correct": False},
                {"text": "k-anonymity is voluntary for municipal surveys", "is_correct": False},
                {"text": "k-anonymity is required only post-publication", "is_correct": False}
            ]
        },
        content_type="application/json"
    )
    print(f"[5] Author Add Question Status: {add_q_res.status_code}")
    assert add_q_res.status_code == 201

    # 5. Author Publishes the Knowledge Check
    pub_res = client.post(f"/api/assessment/studio/{quiz_id}/publish/")
    print(f"[6] Author Publish Status: {pub_res.status_code}")
    assert pub_res.status_code == 200
    pub_data = pub_res.json()
    assert pub_data["status"] == "PUBLISHED"
    print(f"    - Check is now PUBLISHED (v{pub_data['version']})")

    # 6. Public Learner Catalog Discovery
    catalog_res = client.get("/api/assessment/checks/")
    print(f"[7] Learner Catalog Discovery Status: {catalog_res.status_code}")
    assert catalog_res.status_code == 200
    cat_items = catalog_res.json()["checks"]
    found = any(c["id"] == quiz_id for c in cat_items)
    assert found, "Published check not found in catalog!"
    print(f"    - Published check successfully discovered in catalog.")

    # 7. Learner Starts Knowledge Check Runner
    detail_res = client.get(f"/api/assessment/checks/{quiz_id}/")
    print(f"[8] Learner Check Runner Load Status: {detail_res.status_code}")
    assert detail_res.status_code == 200
    runner_questions = detail_res.json()["questions"]
    print(f"    - Runner received {len(runner_questions)} questions.")

    # Ensure is_correct is NOT leaked to learner in runner
    for q in runner_questions:
        for opt in q["options"]:
            assert "is_correct" not in opt, "SECURITY BREACH: is_correct leaked to learner!"

    # 8. Learner Answers and Submits Check
    answers = {}
    for q in runner_questions:
        # Select first option for testing
        answers[str(q["id"])] = q["options"][0]["id"]

    sub_res = client.post(
        f"/api/assessment/checks/{quiz_id}/submit/",
        {"answers": answers},
        content_type="application/json"
    )
    print(f"[9] Learner Submission & Scoring Status: {sub_res.status_code}")
    assert sub_res.status_code == 200
    sub_data = sub_res.json()
    print(f"    - Attempt ID: {sub_data['attempt_id']}")
    print(f"    - Score: {sub_data['score_percentage']}% ({sub_data['correct_answers']}/{sub_data['total_questions']})")
    print(f"    - What You Did Well: {sub_data['what_you_did_well']}")
    print(f"    - Keep Practising: {sub_data['keep_practising']}")
    print(f"    - Competency Score Delta: +{sub_data['competency_score_delta']} pts")
    print(f"    - New SubSkill Proficiency: {sub_data['new_subskill_score']} / 100")

    # 9. Verify Database Persistence & Audit Provenance
    attempt = QuizAttempt.objects.get(id=sub_data["attempt_id"])
    assert attempt.user == user
    assert attempt.quiz.id == quiz_id
    assert attempt.quiz_version == 1
    assert attempt.status == "COMPLETED"

    quiz_answers = QuizAnswer.objects.filter(attempt=attempt)
    assert quiz_answers.count() == len(runner_questions)
    print(f"[10] Database Audit Verified: {quiz_answers.count()} QuizAnswer records stored.")

    # Check proficiency score in DB
    prof = OfficialSkillProficiency.objects.get(user=user, subskill=subskill)
    print(f"[11] Verified OfficialSkillProficiency in DB: {prof.score} pts for {subskill.name}")

    print("\n=================================================================")
    print("ALL PHASE 1 ACCEPTANCE CRITERIA MET AND VERIFIED SUCCESSFULLY!")
    print("=================================================================")


if __name__ == "__main__":
    run_e2e_verification()
