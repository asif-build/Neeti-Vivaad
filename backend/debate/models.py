from django.db import models
from django.utils import timezone
from core.models import User, SubSkill


# =====================================================================
# LEGACY DEBATE MODELS (Preserved for backwards compatibility)
# =====================================================================

class ScenarioDifficulty(models.TextChoices):
    BEGINNER = 'Beginner', 'Beginner'
    INTERMEDIATE = 'Intermediate', 'Intermediate'
    ADVANCED = 'Advanced', 'Advanced'

class ScenarioStatus(models.TextChoices):
    DRAFT = 'Draft', 'Draft'
    ACTIVE = 'Active', 'Active'
    ARCHIVED = 'Archived', 'Archived'

class ReferenceDocument(models.Model):
    title = models.CharField(max_length=255)
    doc_code = models.CharField(max_length=50, unique=True)
    publisher = models.CharField(max_length=150, default='MoSPI / National Statistical Commission')
    document_type = models.CharField(max_length=100, default='Official Policy Standard')
    page_reference = models.CharField(max_length=100, default='Section 4.2')
    content = models.TextField()
    publication_year = models.IntegerField(default=2024)
    is_indexed = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.title} [{self.doc_code}]"

class DebateScenario(models.Model):
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=100, default='Data Policy')
    description = models.TextField()
    initial_constraint = models.TextField(blank=True, null=True)
    difficulty = models.CharField(max_length=30, choices=ScenarioDifficulty.choices, default=ScenarioDifficulty.INTERMEDIATE)
    status = models.CharField(max_length=30, choices=ScenarioStatus.choices, default=ScenarioStatus.ACTIVE)
    learning_objective = models.TextField(blank=True, null=True, default='Evaluate data collection policy trade-offs and ensure data privacy compliance.')
    reference_sources = models.ManyToManyField(ReferenceDocument, blank=True, related_name='scenarios')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.category}) - {self.status}"

class ScenarioConstraint(models.Model):
    scenario = models.ForeignKey(DebateScenario, on_delete=models.CASCADE, related_name='constraints')
    name = models.CharField(max_length=150)
    description = models.TextField()
    impact = models.TextField(blank=True, null=True)
    trigger_round = models.IntegerField(default=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} (Round {self.trigger_round}) for {self.scenario.title}"

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
    agent_code = models.CharField(max_length=20)
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
    fallacy_type = models.CharField(max_length=100)
    options = models.JSONField(default=list)
    correct_option_index = models.IntegerField(default=0)
    explanation = models.TextField()
    is_answered = models.BooleanField(default=False)
    user_answered_index = models.IntegerField(null=True, blank=True)
    is_user_correct = models.BooleanField(null=True, blank=True)


# =====================================================================
# PHASE 2: PRODUCTION-GRADE NEETI VIVAAD MODELS
# =====================================================================

class VivaadSource(models.Model):
    """Uploaded policy/guideline source document for Option A scenarios."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='vivaad_sources')
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='vivaad_docs/', blank=True, null=True)
    filename = models.CharField(max_length=255, blank=True, default='')
    file_type = models.CharField(max_length=20, default='PDF')  # PDF, DOCX, TXT
    file_size = models.BigIntegerField(default=0)
    content_hash = models.CharField(max_length=64, blank=True, default='')
    page_count = models.IntegerField(default=1)
    extracted_text = models.TextField()
    chunks = models.JSONField(default=list, help_text="List of structured chunks: [{chunk_id, page_number, section_title, text}]")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.file_type}, {self.page_count}p)"


class VivaadScenario(models.Model):
    """
    Core structured Policy Decision Scenario.
    Supports Option A (Document-Backed) and Option B (Creator-Provided Custom Scenario).
    """
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('PUBLISHED', 'Published'),
        ('ARCHIVED', 'Archived'),
    ]
    SOURCE_TYPE_CHOICES = [
        ('DOCUMENT', 'Based on Provided Material'),
        ('CUSTOM', 'Creator-Provided Scenario'),
    ]
    DIFFICULTY_CHOICES = [
        ('Beginner', 'Beginner'),
        ('Intermediate', 'Intermediate'),
        ('Advanced', 'Advanced'),
    ]

    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='authored_scenarios')
    title = models.CharField(max_length=255)
    source_type = models.CharField(max_length=20, choices=SOURCE_TYPE_CHOICES, default='CUSTOM')
    source = models.ForeignKey(VivaadSource, on_delete=models.SET_NULL, null=True, blank=True, related_name='scenarios')
    category = models.CharField(max_length=100, default='Data Policy')
    difficulty = models.CharField(max_length=30, choices=DIFFICULTY_CHOICES, default='Intermediate')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='DRAFT')
    version = models.IntegerField(default=1)

    # Structured Scenario Content
    situation = models.TextField(help_text="Detailed public-sector administrative situation")
    decision_question = models.TextField(help_text="The core policy dilemma the learner must decide")
    objective = models.TextField(blank=True, default='', help_text="Policy or public interest goal")
    constraints = models.JSONField(default=list, help_text="List of constraints: legal, fiscal, operational, time")
    affected_people = models.JSONField(default=list, help_text="Affected citizen groups, enumerators, departments")
    risks = models.JSONField(default=list, help_text="Operational, public trust, and legal risks")
    options = models.JSONField(default=list, help_text="List of decision options: [{id, label, summary}]")
    evaluation_criteria = models.JSONField(default=list, help_text="List of evaluation dimensions")

    # Competency Association
    target_subskills = models.ManyToManyField(SubSkill, blank=True, related_name='vivaad_scenarios')

    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} (v{self.version}, {self.status})"


class VivaadPerspective(models.Model):
    """
    A tailored stakeholder perspective (NOT generic AI Agent) reasoning legitimately from its role.
    """
    scenario = models.ForeignKey(VivaadScenario, on_delete=models.CASCADE, related_name='perspectives')
    name = models.CharField(max_length=120)
    role = models.CharField(max_length=150)
    avatar_color = models.CharField(max_length=30, default='emerald')
    primary_concern = models.CharField(max_length=255)
    objective = models.TextField()
    position = models.TextField(help_text="Opening position statement and stance")
    relevant_evidence = models.TextField(blank=True, default='')
    source_page = models.IntegerField(null=True, blank=True)
    source_section = models.CharField(max_length=255, blank=True, default='')
    key_questions = models.JSONField(default=list, help_text="Challenge questions raised by this perspective")
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return f"{self.name} ({self.role}) - {self.scenario.title}"


class VivaadSession(models.Model):
    """
    Persistent learner simulation session. References immutable scenario version.
    """
    STATUS_CHOICES = [
        ('IN_PROGRESS', 'In Progress'),
        ('DECIDED', 'Decided'),
        ('EVALUATED', 'Evaluated'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='vivaad_sessions')
    scenario = models.ForeignKey(VivaadScenario, on_delete=models.CASCADE, related_name='sessions')
    scenario_version = models.IntegerField(default=1)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='IN_PROGRESS')
    active_perspective = models.ForeignKey(VivaadPerspective, on_delete=models.SET_NULL, null=True, blank=True)
    started_at = models.DateTimeField(default=timezone.now)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f"Vivaad Session {self.id}: {self.user.username} on '{self.scenario.title}' (v{self.scenario_version})"


class VivaadTurn(models.Model):
    """
    A single dialogue turn within a controlled discussion (2–4 exchanges).
    """
    SPEAKER_CHOICES = [
        ('LEARNER', 'Learner'),
        ('PERSPECTIVE', 'Perspective'),
    ]

    session = models.ForeignKey(VivaadSession, on_delete=models.CASCADE, related_name='turns')
    perspective = models.ForeignKey(VivaadPerspective, on_delete=models.SET_NULL, null=True, blank=True)
    turn_number = models.IntegerField(default=1)
    speaker_type = models.CharField(max_length=20, choices=SPEAKER_CHOICES)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['turn_number', 'timestamp']

    def __str__(self):
        return f"Turn {self.turn_number} by {self.speaker_type} in Session {self.session_id}"


class VivaadDecision(models.Model):
    """
    Learner's final recommendation and mandatory reasoning explanation.
    """
    session = models.OneToOneField(VivaadSession, on_delete=models.CASCADE, related_name='decision_record')
    selected_option_id = models.CharField(max_length=100)
    selected_option_label = models.CharField(max_length=255)
    reasoning = models.TextField(help_text="Learner's justification explaining trade-offs and mitigation")
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Decision in Session {self.session_id}: {self.selected_option_label}"


class VivaadEvaluation(models.Model):
    """
    Multi-criteria assessment evaluating evidence use, reasoning, risk awareness,
    people impact, practicality, and ethics without dogma.
    """
    session = models.OneToOneField(VivaadSession, on_delete=models.CASCADE, related_name='evaluation_record')
    overall_score = models.FloatField(default=0.0)
    criteria_scores = models.JSONField(default=dict, help_text="Scores across 6 dimensions: evidence_use, policy_reasoning, risk_awareness, people_impact, practicality, ethical_consideration")
    what_you_did_well = models.JSONField(default=list)
    try_next_time = models.JSONField(default=list)
    tradeoffs_analysis = models.TextField(blank=True, default='')
    source_backed_notes = models.JSONField(default=list, help_text="Notes with exact page references where applicable")
    competency_deltas = models.JSONField(default=dict, help_text="Map of subskill_code to score change")
    evaluated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Evaluation for Session {self.session_id}: {self.overall_score}%"
