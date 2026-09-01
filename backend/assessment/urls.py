from django.urls import path
from .views import (
    BaselineAssessmentView, SubmitBaselineAssessmentView,
    DocumentUploadView, GenerateQuizView, SubmitQuizView
)

urlpatterns = [
    path('baseline/', BaselineAssessmentView.as_view(), name='baseline-assessment'),
    path('baseline/submit/', SubmitBaselineAssessmentView.as_view(), name='submit-baseline-assessment'),
    path('upload/', DocumentUploadView.as_view(), name='document-upload'),
    path('generate-quiz/', GenerateQuizView.as_view(), name='generate-quiz'),
    path('submit-quiz/', SubmitQuizView.as_view(), name='submit-quiz'),
]
