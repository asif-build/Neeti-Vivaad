from django.urls import path
from .views import LearnerDashboardView, AdminDashboardView

urlpatterns = [
    path('learner/', LearnerDashboardView.as_view(), name='learner-dashboard'),
    path('admin/', AdminDashboardView.as_view(), name='admin-dashboard'),
]
