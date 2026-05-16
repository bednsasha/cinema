from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FilmViewSet, GenreViewSet

router = DefaultRouter()
router.register(r'films', FilmViewSet)
router.register(r'genres', GenreViewSet)

urlpatterns = [
    path('', include(router.urls)),
]