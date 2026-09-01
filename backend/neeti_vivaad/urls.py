from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from core.views import ProfileView, CompetenciesView, SkillGapAnalysisView

def api_root(request):
    return JsonResponse({
        "status": "online",
        "service": "Neeti-Vivaad Backend API",
        "version": "2.0.0",
        "endpoints": {
            "admin": "/admin/",
            "auth": "/api/auth/",
            "profile": "/api/profile/",
            "competencies": "/api/profile/competencies/",
            "skill_gaps": "/api/profile/skill-gaps/",
            "courses": "/api/courses/",
            "assessment": "/api/assessment/",
            "debate": "/api/debate/",
            "dashboard": "/api/dashboard/"
        }
    })

urlpatterns = [
    path('', api_root, name='api-root'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('core.urls')),
    path('api/profile/', ProfileView.as_view(), name='profile-root'),
    path('api/profile/competencies/', CompetenciesView.as_view(), name='profile-competencies'),
    path('api/profile/skill-gaps/', SkillGapAnalysisView.as_view(), name='profile-skill-gaps'),
    path('api/courses/', include('courses.urls')),
    path('api/assessment/', include('assessment.urls')),
    path('api/debate/', include('debate.urls')),
    path('api/dashboard/', include('dashboard.urls')),
    path('api/admin/', include('dashboard.admin_urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
