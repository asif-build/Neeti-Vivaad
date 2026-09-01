import secrets
from datetime import timedelta
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

def generate_secure_token():
    return secrets.token_urlsafe(32)

class UserRole(models.TextChoices):
    OFFICIAL = 'OFFICIAL', 'Government Official'
    ADMIN = 'ADMIN', 'System Administrator / DG'

class UserStatus(models.TextChoices):
    PENDING_VERIFICATION = 'PENDING_VERIFICATION', 'Pending Verification'
    ACTIVE = 'ACTIVE', 'Active'
    SUSPENDED = 'SUSPENDED', 'Suspended'

class CompetencyDomainType(models.TextChoices):
    STATISTICAL = 'STATISTICAL', 'Statistical'
    TECHNICAL = 'TECHNICAL', 'Technical'
    DIGITAL_GOVERNANCE = 'DIGITAL_GOVERNANCE', 'Digital Governance'
    BEHAVIOURAL = 'BEHAVIOURAL', 'Behavioural / Managerial'

class User(AbstractUser):
    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.OFFICIAL)
    status = models.CharField(max_length=30, choices=UserStatus.choices, default=UserStatus.PENDING_VERIFICATION)
    mobile_number = models.CharField(max_length=20, blank=True, null=True)
    is_email_verified = models.BooleanField(default=False)
    profile_complete = models.BooleanField(default=False)
    baseline_completed = models.BooleanField(default=False)
    ctq_score = models.FloatField(default=0.0, help_text="Critical Thinking & Decision-Making Quotient")

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.email}) - {self.status}"

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
    token = models.CharField(max_length=100, unique=True, default=generate_secure_token)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    verified_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(hours=24)
        super().save(*args, **kwargs)

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"VerificationToken for {self.user.email} (Used: {self.is_used})"

class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_tokens')
    token = models.CharField(max_length=100, unique=True, default=generate_secure_token)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(hours=1)
        super().save(*args, **kwargs)

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"ResetToken for {self.user.email} (Used: {self.is_used})"

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

class EmailLog(models.Model):
    class EmailStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        SENT = 'SENT', 'Sent'
        FAILED = 'FAILED', 'Failed'

    recipient_email = models.EmailField(max_length=255)
    recipient_user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='email_logs')
    email_type = models.CharField(max_length=50) # WELCOME_VERIFICATION, ACCOUNT_VERIFIED, PASSWORD_RESET
    subject = models.CharField(max_length=255)
    provider_message_id = models.CharField(max_length=255, null=True, blank=True)
    status = models.CharField(max_length=20, choices=EmailStatus.choices, default=EmailStatus.PENDING)
    failure_reason = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"[{self.status}] {self.email_type} to {self.recipient_email} at {self.created_at}"
