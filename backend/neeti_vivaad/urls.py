from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('core.urls')),
    path('api/courses/', include('courses.urls')),
    path('api/assessment/', include('assessment.urls')),
    path('api/debate/', include('debate.urls')),
    path('api/dashboard/', include('dashboard.urls')),
    path('api/admin/', include('dashboard.admin_urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
