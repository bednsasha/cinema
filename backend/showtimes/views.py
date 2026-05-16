from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Rental, Session
from .serializers import (
    RentalSerializer, RentalDetailSerializer,
    SessionSerializer, SessionDetailSerializer
)
from core.permissions import IsAdminOrReadOnly


class RentalViewSet(viewsets.ModelViewSet):
    queryset = Rental.objects.select_related('film').all()
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['film', 'date_rental_start', 'date_rental_end']
    search_fields = ['film__name']
    ordering_fields = ['date_rental_start', 'date_rental_end']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return RentalSerializer
        return RentalDetailSerializer


class SessionViewSet(viewsets.ModelViewSet):
    queryset = Session.objects.select_related('hall', 'rental__film', 'screen_type').all()
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['hall', 'rental', 'screen_type']
    search_fields = ['rental__film__name', 'hall__name']
    ordering_fields = ['start_time', 'hall__name']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return SessionSerializer
        return SessionDetailSerializer