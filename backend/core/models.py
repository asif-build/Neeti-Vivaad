import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser

class UserRole(models.TextChoices):
    OFFICIAL = 'OFFICIAL', 'Government Official'
    ADMIN = 'ADMIN', 'System Administrator / DG'

class CompetencyDomainType(models.TextChoices):
    STATISTICAL = 'STATISTICAL', 'Statistical'
    TECHNICAL = 'TECHNICAL', 'Technical'
    DIGITAL_GOVERNANCE = 'DIGITAL_GOVERNANCE', 'Digital Governance'
    BEHAVIOURAL = 'BEHAVIOURAL', 'Behavioural / Managerial'

class User(AbstractUser):
    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.OFFICIAL)
    mobile_number = models.CharField(max_length=20, blank=True, null=True)
    is_email_verified = models.BooleanField(default=False)
    profile_complete = models.BooleanField(default=False)
    baseline_completed = models.BooleanField(default=False)
    ctq_score = models.FloatField(default=0.0, help_text="Critical Thinking & Decision-Making Quotient")

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.email})"

class OfficialProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='official_profile')
    organisation = models.CharField(max_length=200, default='Government of India', blank=True)
    department = models.CharField(max_length=200, default='', blank=True)
    designation = models.CharField(max_length=200, default='Statistical Officer', blank=True)
    experience_years = models.FloatField(default=0.0)
    education = models.CharField(max_length=300, default='', blank=True)
    skills = models.JSONField(default=list, blank=True)
    training_history = models.TextField(blank=True, default='')
    learning_preferences = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"OfficialProfile: {self.user.username} - {self.designation} ({self.department})"

class EmailVerificationToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='verification_tokens')
    token = models.CharField(max_length=64, unique=True, default=uuid.uuid4)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    verified_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Token for {self.user.email} (Verified: {self.is_verified})"

class CompetencyDomain(models.Model):
    name = models.CharField(max_length=100)
    domain_type = models.CharField(max_length=30, choices=CompetencyDomainType.choices, unique=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class SubSkill(models.Model):
    domain = models.ForeignKey(CompetencyDomain, on_delete=models.CASCADE, related_name='subskills')
    name = models.CharField(max_length=150)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.domain.name} -> {self.name}"

class OfficialSkillProficiency(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='proficiencies')
    subskill = models.ForeignKey(SubSkill, on_delete=models.CASCADE)
    score = models.FloatField(default=50.0, help_text="Current proficiency score (0 to 100)")
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'subskill')

    def __str__(self):
        return f"{self.user.username} - {self.subskill.name}: {self.score}"

class RoleCompetencyRequirement(models.Model):
    designation = models.CharField(max_length=150)
    subskill = models.ForeignKey(SubSkill, on_delete=models.CASCADE)
    target_score = models.FloatField(default=80.0, help_text="Required target score (0 to 100)")

    class Meta:
        unique_together = ('designation', 'subskill')

    def __str__(self):
        return f"{self.designation} requirement for {self.subskill.name}: {self.target_score}"
