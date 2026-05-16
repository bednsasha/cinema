from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RentalViewSet, SessionViewSet

router = DefaultRouter()
router.register(r'rentals', RentalViewSet)
router.register(r'sessions', SessionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]