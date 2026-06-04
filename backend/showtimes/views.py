from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Rental, Session
from .serializers import (
    RentalSerializer, RentalDetailSerializer,
    SessionSerializer, SessionDetailSerializer
)
from core.permissions import IsAdminOrReadOnly
from django_filters import FilterSet, DateFilter
from rest_framework.decorators import action
from rest_framework.response import Response
from cart.models import Booking


class RentalViewSet(viewsets.ModelViewSet):
    queryset = Rental.objects.select_related('film').all()
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend,
                       filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['film', 'date_rental_start', 'date_rental_end']
    search_fields = ['film__name']
    ordering_fields = ['date_rental_start', 'date_rental_end']

    def get_serializer_class(self):
        if self.action == 'list':
            return RentalSerializer
        return RentalDetailSerializer


class SessionFilter(FilterSet):
    date = DateFilter(field_name='start_time', lookup_expr='date')
    date_gte = DateFilter(field_name='start_time', lookup_expr='date__gte')
    date_lte = DateFilter(field_name='start_time', lookup_expr='date__lte')

    class Meta:
        model = Session
        fields = ['hall', 'rental', 'screen_type',
                  'rental__film', 'date', 'date_gte', 'date_lte']


class SessionViewSet(viewsets.ModelViewSet):
    queryset = Session.objects.select_related(
        'hall', 'rental__film', 'screen_type').all()
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend,
                       filters.SearchFilter, filters.OrderingFilter]
    filterset_class = SessionFilter
    search_fields = ['rental__film__name', 'hall__name']
    ordering_fields = ['start_time', 'hall__name']

    def get_serializer_class(self):
        if self.action == 'list':
            return SessionSerializer
        return SessionDetailSerializer

    @action(detail=True, methods=['get'], url_path='booked-seats')
    def booked_seats(self, request, pk=None):

        session = self.get_object()
        bookings = Booking.objects.filter(session=session)
        booked_seat_ids = list(bookings.values_list('seat_id', flat=True))
        return Response({
            'session_id': session.id,
            'booked_seat_ids': booked_seat_ids,
            'total_booked': len(booked_seat_ids)
        })
