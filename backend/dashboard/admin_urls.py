from django.urls import path
from .admin_views import (
    WorkforceInsightsAPIView,
    LearningAnalyticsAPIView,
    ScenarioManagerListCreateAPIView,
    ScenarioAdminDetailAPIView,
    ScenarioConstraintCreateAPIView,
    ScenarioAnalyticsAPIView,
    ReferenceDocumentsListAPIView
)

urlpatterns = [
    path('workforce-insights/', WorkforceInsightsAPIView.as_view(), name='admin-workforce-insights'),
    path('learning-analytics/', LearningAnalyticsAPIView.as_view(), name='admin-learning-analytics'),
    path('scenarios/', ScenarioManagerListCreateAPIView.as_view(), name='admin-scenarios-list-create'),
    path('scenarios/<int:scenario_id>/', ScenarioAdminDetailAPIView.as_view(), name='admin-scenario-detail'),
    path('scenarios/<int:scenario_id>/constraints/', ScenarioConstraintCreateAPIView.as_view(), name='admin-scenario-constraint-create'),
    path('scenarios/<int:scenario_id>/analytics/', ScenarioAnalyticsAPIView.as_view(), name='admin-scenario-analytics'),
    path('reference-documents/', ReferenceDocumentsListAPIView.as_view(), name='admin-reference-documents'),
]
