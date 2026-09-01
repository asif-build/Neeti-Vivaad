from django.urls import path
from .views import CourseListView, RecommendedCoursesView

urlpatterns = [
    path('', CourseListView.as_view(), name='course-list'),
    path('recommendations/', RecommendedCoursesView.as_view(), name='course-recommendations'),
    path('recommended/', RecommendedCoursesView.as_view(), name='course-recommended-alt'),
]
