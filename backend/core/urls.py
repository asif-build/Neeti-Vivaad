from django.urls import path
from .views import LoginView, ProfileView, SkillGapAnalysisView

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('skill-gaps/', SkillGapAnalysisView.as_view(), name='skill-gaps'),
]
