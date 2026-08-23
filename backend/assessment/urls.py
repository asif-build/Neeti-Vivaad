from django.urls import path
from .views import DocumentUploadView, GenerateQuizView, SubmitQuizView

urlpatterns = [
    path('upload/', DocumentUploadView.as_view(), name='document-upload'),
    path('generate-quiz/', GenerateQuizView.as_view(), name='generate-quiz'),
    path('submit-quiz/', SubmitQuizView.as_view(), name='submit-quiz'),
]
