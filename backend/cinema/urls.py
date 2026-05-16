from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HallViewSet, SeatViewSet

router = DefaultRouter()
router.register(r'halls', HallViewSet)
router.register(r'seats', SeatViewSet)

urlpatterns = [
    path('', include(router.urls)),
]