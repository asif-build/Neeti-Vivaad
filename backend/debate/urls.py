from django.urls import path
from .views import (
    # Phase 2 Studio Views
    VivaadSourceUploadView,
    VivaadScenarioGenerateView,
    VivaadStudioDashboardView,
    VivaadScenarioManageView,
    VivaadPerspectiveActionView,
    VivaadScenarioPublishView,
    # Phase 2 Learner Views
    VivaadScenarioCatalogView,
    VivaadScenarioDetailView,
    VivaadSessionStartView,
    VivaadSessionTurnView,
    VivaadSessionDecideView,
    VivaadSessionResultView,
    # Legacy Debate Views (Preserved)
    ScenariosListView,
    StartDebateView,
    NextRoundView,
    InjectConstraintView,
    AnswerFallacyView,
    GetDebateSessionView,
)

urlpatterns = [
    # Phase 2: Authoring Studio Endpoints
    path('studio/source/', VivaadSourceUploadView.as_view(), name='vivaad-studio-source-upload'),
    path('studio/generate/', VivaadScenarioGenerateView.as_view(), name='vivaad-studio-scenario-generate'),
    path('studio/dashboard/', VivaadStudioDashboardView.as_view(), name='vivaad-studio-dashboard'),
    path('studio/<int:scenario_id>/', VivaadScenarioManageView.as_view(), name='vivaad-studio-scenario-manage'),
    path('studio/<int:scenario_id>/perspectives/', VivaadPerspectiveActionView.as_view(), name='vivaad-studio-perspective-action'),
    path('studio/<int:scenario_id>/publish/', VivaadScenarioPublishView.as_view(), name='vivaad-studio-scenario-publish'),

    # Phase 2: Learner Simulation Endpoints
    path('scenarios/', VivaadScenarioCatalogView.as_view(), name='vivaad-scenarios-catalog'),
    path('scenarios/<int:scenario_id>/', VivaadScenarioDetailView.as_view(), name='vivaad-scenario-detail'),
    path('sessions/start/', VivaadSessionStartView.as_view(), name='vivaad-session-start'),
    path('sessions/<int:session_id>/turn/', VivaadSessionTurnView.as_view(), name='vivaad-session-turn'),
    path('sessions/<int:session_id>/decide/', VivaadSessionDecideView.as_view(), name='vivaad-session-decide'),
    path('sessions/<int:session_id>/result/', VivaadSessionResultView.as_view(), name='vivaad-session-result'),

    # Legacy Debate Endpoints
    path('start/', StartDebateView.as_view(), name='debate-start'),
    path('next-round/', NextRoundView.as_view(), name='debate-next-round'),
    path('inject-constraint/', InjectConstraintView.as_view(), name='debate-inject-constraint'),
    path('answer-fallacy/', AnswerFallacyView.as_view(), name='debate-answer-fallacy'),
    path('session/<int:session_id>/', GetDebateSessionView.as_view(), name='debate-session-detail'),
]

