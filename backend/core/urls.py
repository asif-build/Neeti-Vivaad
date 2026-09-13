from django.urls import path
from .views import (
    RegisterView, VerifyEmailView, ResendVerificationEmailView,
    PasswordResetRequestView, PasswordResetConfirmView,
    LoginView, LogoutView, CurrentUserView,
    ProfileView, CompetenciesView, SkillGapAnalysisView,
    ResumeUploadView, ConfirmSkillsView, CareerGoalsView,
    LearningPreferencesView, FinalizeCompetenciesView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify-email'),
    path('resend-verification/', ResendVerificationEmailView.as_view(), name='resend-verification'),
    path('password-reset/request/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('competencies/', CompetenciesView.as_view(), name='competencies'),
    path('skill-gaps/', SkillGapAnalysisView.as_view(), name='skill-gaps'),

    # Onboarding Pipeline Endpoints
    path('onboarding/resume-upload/', ResumeUploadView.as_view(), name='onboarding-resume-upload'),
    path('onboarding/confirm-skills/', ConfirmSkillsView.as_view(), name='onboarding-confirm-skills'),
    path('onboarding/career-goals/', CareerGoalsView.as_view(), name='onboarding-career-goals'),
    path('onboarding/learning-preferences/', LearningPreferencesView.as_view(), name='onboarding-learning-preferences'),
    path('onboarding/finalize-competencies/', FinalizeCompetenciesView.as_view(), name='onboarding-finalize-competencies'),
]
