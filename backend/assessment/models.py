from django.db import models
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
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='documents')
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='uploaded_docs/', blank=True, null=True)
    extracted_text = models.TextField()
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} by {self.user.username}"

class Quiz(models.Model):
    document = models.ForeignKey(DocumentUpload, on_delete=models.CASCADE, related_name='quizzes')
    subskill = models.ForeignKey(SubSkill, on_delete=models.SET_NULL, null=True, blank=True)
    title = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Question(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    source_citation = models.TextField(help_text="Exact snippet or reference from uploaded document")
    explanation = models.TextField(help_text="Reasoning grounded in document")

    def __str__(self):
        return f"Q: {self.question_text[:50]}..."

class Option(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='options')
    option_text = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.option_text} ({'Correct' if self.is_correct else 'Wrong'})"

class QuizAttempt(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quiz_attempts')
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE)
    score_percentage = models.FloatField(default=0.0)
    total_questions = models.IntegerField(default=0)
    correct_answers = models.IntegerField(default=0)
    attempted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} attempt on {self.quiz.title}: {self.score_percentage}%"
