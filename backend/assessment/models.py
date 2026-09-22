from django.db import models
from django.utils import timezone
from core.models import User, SubSkill, CompetencyDomain


class BaselineQuestion(models.Model):
    domain = models.ForeignKey(CompetencyDomain, on_delete=models.CASCADE, related_name='baseline_questions')
    subskill = models.ForeignKey(SubSkill, on_delete=models.CASCADE, related_name='baseline_questions')
    question_text = models.TextField()
    options = models.JSONField(default=list, help_text="List of string options")
    correct_option_index = models.IntegerField(default=0)
    explanation = models.TextField(blank=True, default='')

    def __str__(self):
        return f"[{self.subskill.code}] {self.question_text[:50]}..."


class BaselineAssessmentAttempt(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='baseline_attempts')
    total_questions = models.IntegerField(default=0)
    correct_answers = models.IntegerField(default=0)
    calculated_ctq = models.FloatField(default=0.0)
    domain_scores = models.JSONField(default=dict)
    detailed_answers = models.JSONField(default=list)
    completed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Baseline attempt by {self.user.username} at {self.completed_at}"


class DocumentUpload(models.Model):
    STATUS_CHOICES = [
        ('UPLOADED', 'Uploaded'),
        ('PROCESSING', 'Processing'),
        ('READY', 'Ready'),
        ('FAILED', 'Failed'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='documents')
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='uploaded_docs/', blank=True, null=True)
    filename = models.CharField(max_length=255, blank=True, default='')
    file_type = models.CharField(max_length=20, default='PDF')
    file_size = models.BigIntegerField(default=0)
    content_hash = models.CharField(max_length=64, blank=True, default='')
    page_count = models.IntegerField(default=1)
    extracted_text = models.TextField()
    chunks = models.JSONField(default=list, help_text="List of structured chunks: [{chunk_id, page_number, section_title, text}]")
    processing_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='READY')
    error_message = models.TextField(blank=True, default='')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.title} by {self.user.username} ({self.processing_status})"


class Quiz(models.Model):
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('PUBLISHED', 'Published'),
        ('ARCHIVED', 'Archived'),
    ]
    DIFFICULTY_CHOICES = [
        ('Beginner', 'Beginner'),
        ('Intermediate', 'Intermediate'),
        ('Advanced', 'Advanced'),
    ]

    document = models.ForeignKey(DocumentUpload, on_delete=models.CASCADE, related_name='quizzes')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='authored_quizzes')
    subskill = models.ForeignKey(SubSkill, on_delete=models.SET_NULL, null=True, blank=True)
    title = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    version = models.IntegerField(default=1)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='Intermediate')
    time_estimate_mins = models.IntegerField(default=8)
    question_types = models.JSONField(default=list)
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} (v{self.version}, {self.status})"


class Question(models.Model):
    TYPE_CHOICES = [
        ('MCQ', 'Multiple Choice'),
        ('TRUE_FALSE', 'True / False'),
        ('SCENARIO', 'Scenario'),
        ('SHORT_ANSWER', 'Short Answer'),
    ]

    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    question_type = models.CharField(max_length=30, choices=TYPE_CHOICES, default='MCQ')
    difficulty = models.CharField(max_length=20, default='Intermediate')
    source_page = models.IntegerField(default=1)
    source_section = models.CharField(max_length=255, blank=True, default='')
    source_chunk_id = models.CharField(max_length=64, blank=True, default='')
    evidence_text = models.TextField(blank=True, default='', help_text="Exact continuous excerpt supporting question and answer")
    source_citation = models.TextField(help_text="Exact snippet or reference from uploaded document")
    explanation = models.TextField(help_text="Reasoning grounded in document")
    created_by_ai = models.BooleanField(default=True)
    is_source_question = models.BooleanField(default=False, help_text="Preserved directly from the source training material")
    validation_status = models.CharField(
        max_length=20,
        choices=[
            ('VALIDATED', 'Validated'),
            ('PENDING_REVIEW', 'Pending Admin Review'),
            ('REJECTED', 'Rejected')
        ],
        default='VALIDATED'
    )
    validation_notes = models.TextField(blank=True, default='')
    provenance_metadata = models.JSONField(
        default=dict,
        help_text="Detailed audit trail: source_doc, page, section, chunk_id, evidence, competency, model, version"
    )
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return f"Q[{self.order}]: {self.question_text[:50]}..."


class Option(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='options')
    option_text = models.CharField(max_length=500)
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.option_text[:40]} ({'Correct' if self.is_correct else 'Wrong'})"


class QuizAttempt(models.Model):
    STATUS_CHOICES = [
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quiz_attempts')
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='attempts')
    quiz_version = models.IntegerField(default=1)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='COMPLETED')
    score_percentage = models.FloatField(default=0.0)
    total_questions = models.IntegerField(default=0)
    correct_answers = models.IntegerField(default=0)
    started_at = models.DateTimeField(default=timezone.now)
    completed_at = models.DateTimeField(null=True, blank=True)
    attempted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-attempted_at']

    def __str__(self):
        return f"{self.user.username} attempt on {self.quiz.title} (v{self.quiz_version}): {self.score_percentage}%"


class QuizAnswer(models.Model):
    attempt = models.ForeignKey(QuizAttempt, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='submitted_answers')
    selected_option = models.ForeignKey(Option, on_delete=models.SET_NULL, null=True, blank=True)
    answer_text = models.TextField(blank=True, default='')
    is_correct = models.BooleanField(default=False)
    feedback = models.TextField(blank=True, default='')
    misconception_tag = models.CharField(max_length=255, blank=True, default='', help_text="Concept confused or missed")
    pedagogical_explanation = models.TextField(blank=True, default='', help_text="Diagnostic explanation teaching the underlying principle with example")

    def __str__(self):
        return f"Answer for Q{self.question_id} on Attempt {self.attempt_id} ({'Correct' if self.is_correct else 'Wrong'})"
