from django.urls import path
from .views import (
    ScenariosListView, StartDebateView, NextRoundView, 
    InjectConstraintView, AnswerFallacyView, GetDebateSessionView
)

urlpatterns = [
    path('scenarios/', ScenariosListView.as_view(), name='debate-scenarios'),
    path('start/', StartDebateView.as_view(), name='debate-start'),
    path('next-round/', NextRoundView.as_view(), name='debate-next-round'),
    path('inject-constraint/', InjectConstraintView.as_view(), name='debate-inject-constraint'),
    path('answer-fallacy/', AnswerFallacyView.as_view(), name='debate-answer-fallacy'),
    path('session/<int:session_id>/', GetDebateSessionView.as_view(), name='debate-session-detail'),
]
