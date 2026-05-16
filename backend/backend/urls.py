
from django.contrib import admin
from django.db import router
from django.urls import include, path
from users.views import CustomTokenObtainPairView  
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from drf_yasg import openapi
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from rest_framework.routers import DefaultRouter
from django.conf import settings
from django.conf.urls.static import static

router = DefaultRouter()

schema_view = get_schema_view(
    openapi.Info(
        title="Cinema API",
        default_version='v1',
        description="API для кинотеатра",
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    path('admin/', admin.site.urls),
    # Пользователи
    path('api/users/', include('users.urls')),
    path('api-auth/', include('rest_framework.urls')),

    # JWT
    path('api/token/', CustomTokenObtainPairView.as_view(), name='get_token'),  # ← заменили на кастомный
    path('api/token/refresh/', TokenRefreshView.as_view(), name='refresh'),

    # Приложения
    path('api/movies/', include('movies.urls')),
    path('api/showtimes/', include('showtimes.urls')),
    path('api/cinema/', include('cinema.urls')),
    # Swagger документация
    path('swagger/', schema_view.with_ui('swagger',
         cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc',
         cache_timeout=0), name='schema-redoc'),
    path('', include(router.urls)),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
