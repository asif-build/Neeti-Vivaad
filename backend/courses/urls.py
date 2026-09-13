from django.urls import path
from .views import CourseListView, CourseDetailView, RecommendedCoursesView
from .sync_views import CourseActionStartView, CourseSyncCompletionView, UserEnrollmentsListView

urlpatterns = [
    path('', CourseListView.as_view(), name='course-list'),
    path('recommendations/', RecommendedCoursesView.as_view(), name='course-recommendations'),
    path('recommended/', RecommendedCoursesView.as_view(), name='course-recommended-alt'),
    path('enrollments/', UserEnrollmentsListView.as_view(), name='course-enrollments'),
    path('<str:course_id>/', CourseDetailView.as_view(), name='course-detail'),
    path('<str:course_id>/start/', CourseActionStartView.as_view(), name='course-start-action'),
    path('<str:course_id>/sync/', CourseSyncCompletionView.as_view(), name='course-sync-completion'),
]


