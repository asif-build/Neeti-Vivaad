from django.db import models
from core.models import SubSkill, CompetencyDomain

class Course(models.Model):
    igot_course_id = models.CharField(max_length=100, unique=True)
    title = models.CharField(max_length=255)
    provider = models.CharField(max_length=150, default='iGOT Karmayogi / MoSPI')
    domain = models.ForeignKey(CompetencyDomain, on_delete=models.SET_NULL, null=True, blank=True)
    target_subskills = models.ManyToManyField(SubSkill, related_name='courses')
    description = models.TextField()
    duration_hours = models.FloatField(default=4.0)
    difficulty = models.CharField(max_length=50, default='Intermediate')
    url = models.URLField(default='https://igotkarmayogi.gov.in/')
    rating = models.FloatField(default=4.8)

    def __str__(self):
        return f"{self.title} ({self.provider})"
