from django.urls import path
from .views import (
    RegisterView, VerifyEmailView, LoginView, LogoutView, CurrentUserView,
    ProfileView, CompetenciesView, SkillGapAnalysisView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify-email'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('competencies/', CompetenciesView.as_view(), name='competencies'),
    path('skill-gaps/', SkillGapAnalysisView.as_view(), name='skill-gaps'),
]
