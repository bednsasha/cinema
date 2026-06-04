from rest_framework.response import Response

from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from .models import Hall, Seat, ScreenType
from .serializers import HallSerializer, SeatSerializer, ScreenTypeSerializer
from core.permissions import IsAdminOrReadOnly 
from rest_framework.decorators import action

class HallViewSet(viewsets.ModelViewSet):  
    queryset = Hall.objects.prefetch_related('screen_types', 'seats')
    serializer_class = HallSerializer
    permission_classes = [IsAdminOrReadOnly]  
    @action(detail=True, methods=['get'], url_path='seats')
    def seats(self, request, pk=None):
        
        hall = self.get_object()
        seats = hall.seats.all().select_related('seat_type')
        serializer = SeatSerializer(seats, many=True)
        return Response(serializer.data)
class SeatViewSet(viewsets.ModelViewSet):
    queryset = Seat.objects.select_related('hall')
    serializer_class = SeatSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['hall_id', 'row_number', 'seat_type__id']
    permission_classes = [IsAdminOrReadOnly]

class ScreenTypeViewSet(viewsets.ModelViewSet):
    queryset = ScreenType.objects.all()
    serializer_class = ScreenTypeSerializer
    permission_classes = [IsAdminOrReadOnly]