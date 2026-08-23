from django.db import models
from core.models import User

class DebateScenario(models.Model):
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=100, default='Data Policy')  # Data Policy, Digital Governance, Field Operations, Ethics & Privacy
    description = models.TextField()
    initial_constraint = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.category})"

class ReferenceDocument(models.Model):
    title = models.CharField(max_length=255)
    doc_code = models.CharField(max_length=50, unique=True)
    publisher = models.CharField(max_length=150, default='MoSPI / National Statistical Commission')
    content = models.TextField()
    publication_year = models.IntegerField(default=2024)

    def __str__(self):
        return f"{self.title} [{self.doc_code}]"

class DebateSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='debates')
    scenario = models.ForeignKey(DebateScenario, on_delete=models.CASCADE)
    active_constraint = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=30, default='IN_PROGRESS')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Debate {self.id} on {self.scenario.title} by {self.user.username}"

class DebateRound(models.Model):
    session = models.ForeignKey(DebateSession, on_delete=models.CASCADE, related_name='rounds')
    round_number = models.IntegerField(default=1)
    round_name = models.CharField(max_length=100, default='Opening Arguments')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['round_number']

class AgentArgument(models.Model):
    round = models.ForeignKey(DebateRound, on_delete=models.CASCADE, related_name='arguments')
    agent_code = models.CharField(max_length=20)  # SSO, DPO, FE, PA, JUDGE
    agent_name = models.CharField(max_length=100)
    avatar_color = models.CharField(max_length=30, default='blue')
    priority_tag = models.CharField(max_length=100)
    argument_text = models.TextField()
    source_citation = models.TextField(help_text="Retrieved MoSPI document citation")
    document_code = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return f"{self.agent_name} (Round {self.round.round_number})"

class DecisionReport(models.Model):
    session = models.OneToOneField(DebateSession, on_delete=models.CASCADE, related_name='decision_report')
    executive_summary = models.TextField()
    recommended_policy = models.TextField()
    tradeoffs_identified = models.JSONField(default=list)
    mitigation_steps = models.JSONField(default=list)
    judgment_tree = models.JSONField(default=dict, help_text="Expandable tree mapping claims to MoSPI sources")
    created_at = models.DateTimeField(auto_now_add=True)

class FallacyChallenge(models.Model):
    session = models.ForeignKey(DebateSession, on_delete=models.CASCADE, related_name='fallacies')
    round_number = models.IntegerField(default=1)
    target_agent_name = models.CharField(max_length=100)
    argument_snippet = models.TextField()
    fallacy_type = models.CharField(max_length=100)  # Strawman, Ad Hominem, False Dilemma, Hasty Generalization
    options = models.JSONField(default=list)
    correct_option_index = models.IntegerField(default=0)
    explanation = models.TextField()
    is_answered = models.BooleanField(default=False)
    user_answered_index = models.IntegerField(null=True, blank=True)
    is_user_correct = models.BooleanField(null=True, blank=True)
