from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from .models import Hall, Seat, ScreenType
from .serializers import HallSerializer, SeatSerializer, ScreenTypeSerializer
from .permissions import IsAdminOrReadOnly  

class HallViewSet(viewsets.ModelViewSet):  
    queryset = Hall.objects.prefetch_related('screen_types', 'seats')
    serializer_class = HallSerializer
    permission_classes = [IsAdminOrReadOnly]  

class SeatViewSet(viewsets.ModelViewSet):
    queryset = Seat.objects.select_related('hall')
    serializer_class = SeatSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['hall_id', 'row_number', 'seat_type']
    permission_classes = [IsAdminOrReadOnly]

class ScreenTypeViewSet(viewsets.ModelViewSet):
    queryset = ScreenType.objects.all()
    serializer_class = ScreenTypeSerializer
    permission_classes = [IsAdminOrReadOnly]