import json
from unittest.mock import patch

from django.test import TestCase
from rest_framework.test import APIClient

from core.models import User
from assessment.generator import QuizGenerationError, _validate_questions


SOURCE_TEXT = (
    "The policy requires encrypted storage on every field device. "
    "A verified backup must be completed at the end of each working day. "
    "Supervisors must review failed backups before new records are collected. "
    "These controls apply to every district office and all mobile field teams."
)


def generated_payload():
    return {
        "questions": [
            {
                "question": "What storage control does the policy require for field devices?",
                "source_citation": "The policy requires encrypted storage on every field device.",
                "explanation": "The source directly states that every field device requires encrypted storage.",
                "options": [
                    {"text": "Encrypted storage", "is_correct": True},
                    {"text": "Public cloud storage", "is_correct": False},
                    {"text": "Removable storage only", "is_correct": False},
                    {"text": "No device storage", "is_correct": False},
                ],
            },
            {
                "question": "When must the verified backup be completed under the policy?",
                "source_citation": "A verified backup must be completed at the end of each working day.",
                "explanation": "The cited sentence specifies the end of each working day as the deadline.",
                "options": [
                    {"text": "At the end of each working day", "is_correct": True},
                    {"text": "At the end of each month", "is_correct": False},
                    {"text": "Before each working day", "is_correct": False},
                    {"text": "Only after an incident", "is_correct": False},
                ],
            },
        ]
    }


class QuizValidationTests(TestCase):
    def test_rejects_citation_not_found_in_source(self):
        payload = generated_payload()
        payload["questions"][0]["source_citation"] = "This sentence is not in the source."

        with self.assertRaises(QuizGenerationError):
            _validate_questions(payload, SOURCE_TEXT, 2)


class QuizApiTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="official", password="secret")
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    @patch("assessment.generator.generate_text")
    def test_upload_generate_and_submit_uses_generated_questions(self, generate_text):
        generate_text.return_value = json.dumps(generated_payload())

        upload = self.client.post(
            "/api/assessment/upload/",
            {"title": "Field controls", "text": SOURCE_TEXT},
            format="json",
        )
        self.assertEqual(upload.status_code, 201)

        generation = self.client.post(
            "/api/assessment/generate-quiz/",
            {"document_id": upload.data["document_id"], "num_questions": 2},
            format="json",
        )
        self.assertEqual(generation.status_code, 201)
        self.assertEqual(len(generation.data["questions"]), 2)
        self.assertEqual(
            generation.data["questions"][0]["question"],
            generated_payload()["questions"][0]["question"],
        )

        answers = {
            str(question["id"]): question["options"][0]["id"]
            for question in generation.data["questions"]
        }
        submission = self.client.post(
            "/api/assessment/submit-quiz/",
            {"quiz_id": generation.data["quiz_id"], "answers": answers},
            format="json",
        )
        self.assertEqual(submission.status_code, 200)
        self.assertEqual(submission.data["score_percentage"], 100.0)

    def test_upload_rejects_empty_content(self):
        response = self.client.post(
            "/api/assessment/upload/",
            {"title": "Empty", "text": ""},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
