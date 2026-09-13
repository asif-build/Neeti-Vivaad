from django.db import models
from django.utils import timezone
from core.models import SubSkill, CompetencyDomain

class Course(models.Model):
    igot_course_id = models.CharField(max_length=100, unique=True, db_index=True, help_text="Canonical iGOT content identifier (e.g. do_1136364937253437441916)")
    title = models.CharField(max_length=255, db_index=True)
    provider = models.CharField(max_length=255, default='iGOT Karmayogi', db_index=True)
    domain = models.ForeignKey(CompetencyDomain, on_delete=models.SET_NULL, null=True, blank=True)
    target_subskills = models.ManyToManyField(SubSkill, related_name='courses', blank=True)
    description = models.TextField()
    duration = models.CharField(max_length=50, default='3 Hours')
    duration_hours = models.FloatField(default=3.0)
    difficulty = models.CharField(max_length=50, default='Intermediate')
    url = models.URLField(max_length=500, default='https://portal.igotkarmayogi.gov.in/')
    igot_course_url = models.URLField(max_length=500, blank=True, null=True, help_text="Verified official individual iGOT course URL")
    thumbnail_url = models.URLField(max_length=500, blank=True, null=True, help_text="Official iGOT course thumbnail URL")
    language = models.CharField(max_length=50, default='English')
    rating = models.FloatField(default=4.8)
    
    # Metadata & Taxonomy
    category = models.CharField(max_length=100, default='General', db_index=True)
    topics = models.JSONField(default=list, blank=True)
    competencies = models.JSONField(default=list, blank=True)
    tags = models.JSONField(default=list, blank=True)
    modules = models.JSONField(default=list, blank=True)
    
    # Sync, Verification and Lifecycle
    status = models.CharField(max_length=50, default='active', db_index=True)
    source = models.CharField(max_length=50, default='igot', db_index=True)
    content_hash = models.CharField(max_length=64, blank=True, default='')
    last_synced_at = models.DateTimeField(default=timezone.now)
    url_verified = models.BooleanField(default=True)
    url_status = models.CharField(max_length=50, default='verified')

    class Meta:
        indexes = [
            models.Index(fields=['status', 'category']),
            models.Index(fields=['status', 'source']),
        ]

    @property
    def provider_name(self):
        return self.provider

    @property
    def course_url(self):
        return self.igot_course_url or self.url

    def __str__(self):
        return f"{self.title} ({self.provider})"


