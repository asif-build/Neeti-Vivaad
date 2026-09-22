from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from core.views import (
    ProfileView, CompetenciesView, SkillGapAnalysisView,
    ResumeUploadView, ConfirmSkillsView, CareerGoalsView,
    LearningPreferencesView, FinalizeCompetenciesView
)
from core.reviews_views import PublicReviewListView, SubmitReviewView
from core.support_views import SupportTicketView

def api_root(request):
    return JsonResponse({
        "status": "online",
        "service": "Neeti-Vivaad Backend API",
        "version": "2.0.0",
        "endpoints": {
            "admin": "/admin/",
            "auth": "/api/auth/",
            "reviews": "/api/reviews/",
            "support": "/api/support/",
            "onboarding": "/api/onboarding/",
            "profile": "/api/profile/",
            "competencies": "/api/profile/competencies/",
            "skill_gaps": "/api/profile/skill-gaps/",
            "courses": "/api/courses/",
            "assessment": "/api/assessment/",
            "debate": "/api/debate/",
            "dashboard": "/api/dashboard/",
            "buddy": "/api/buddy/"
        }
    })

urlpatterns = [
    path('', api_root, name='api-root'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('core.urls')),
    path('api/reviews/', PublicReviewListView.as_view(), name='public-reviews'),
    path('api/reviews/submit/', SubmitReviewView.as_view(), name='submit-review'),
    path('api/support/', SupportTicketView.as_view(), name='support-ticket'),
    path('api/onboarding/resume-upload/', ResumeUploadView.as_view(), name='onboarding-resume-upload-root'),
    path('api/onboarding/confirm-skills/', ConfirmSkillsView.as_view(), name='onboarding-confirm-skills-root'),
    path('api/onboarding/career-goals/', CareerGoalsView.as_view(), name='onboarding-career-goals-root'),
    path('api/onboarding/learning-preferences/', LearningPreferencesView.as_view(), name='onboarding-learning-preferences-root'),
    path('api/onboarding/finalize-competencies/', FinalizeCompetenciesView.as_view(), name='onboarding-finalize-competencies-root'),
    path('api/profile/', ProfileView.as_view(), name='profile-root'),
    path('api/profile/competencies/', CompetenciesView.as_view(), name='profile-competencies'),
    path('api/profile/skill-gaps/', SkillGapAnalysisView.as_view(), name='profile-skill-gaps'),
    path('api/courses/', include('courses.urls')),
    path('api/assessment/', include('assessment.urls')),
    path('api/debate/', include('debate.urls')),
    path('api/dashboard/', include('dashboard.urls')),
    path('api/admin/', include('dashboard.admin_urls')),
    path('api/buddy/', include('buddy.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
