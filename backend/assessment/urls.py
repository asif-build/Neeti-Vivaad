from django.urls import path
from .views import (
    BaselineAssessmentView, SubmitBaselineAssessmentView,
    DocumentUploadView, GenerateQuizView, SubmitQuizView,
    StudioQuizManageView, StudioQuizQuestionActionView, StudioQuizPublishView, StudioAuthorDashboardView,
    KnowledgeCheckCatalogView, KnowledgeCheckDetailView, CompetencyListView
)

urlpatterns = [
    path('competencies/', CompetencyListView.as_view(), name='assessment-competencies'),
    # Baseline Competency Assessment
    path('baseline/', BaselineAssessmentView.as_view(), name='baseline-assessment'),
    path('baseline/submit/', SubmitBaselineAssessmentView.as_view(), name='submit-baseline-assessment'),

    # Document Upload & Extraction
    path('documents/', DocumentUploadView.as_view(), name='document-upload'),
    path('upload/', DocumentUploadView.as_view(), name='legacy-document-upload'),

    # Studio Authoring Flow
    path('studio/generate/', GenerateQuizView.as_view(), name='studio-generate-quiz'),
    path('generate-quiz/', GenerateQuizView.as_view(), name='legacy-generate-quiz'),
    path('studio/dashboard/', StudioAuthorDashboardView.as_view(), name='studio-author-dashboard'),
    path('studio/<int:quiz_id>/', StudioQuizManageView.as_view(), name='studio-quiz-manage'),
    path('studio/<int:quiz_id>/questions/', StudioQuizQuestionActionView.as_view(), name='studio-quiz-question-action'),
    path('studio/<int:quiz_id>/publish/', StudioQuizPublishView.as_view(), name='studio-quiz-publish'),

    # Learner Discovery & Attempt Flow
    path('checks/', KnowledgeCheckCatalogView.as_view(), name='knowledge-check-catalog'),
    path('checks/<int:quiz_id>/', KnowledgeCheckDetailView.as_view(), name='knowledge-check-detail'),
    path('checks/<int:quiz_id>/submit/', SubmitQuizView.as_view(), name='knowledge-check-submit'),
    path('submit-quiz/', SubmitQuizView.as_view(), name='legacy-submit-quiz'),
    path('evaluate/', SubmitQuizView.as_view(), name='legacy-evaluate-quiz'),
]
