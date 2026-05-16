from rest_framework import serializers
from .models import Hall, Seat, ScreenType, HallScreen

class ScreenTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScreenType
        fields = ['id', 'name', 'slug']

class HallSerializer(serializers.ModelSerializer):
    screen_types = ScreenTypeSerializer(many=True, read_only=True)
    
    class Meta:
        model = Hall
        fields = ['id', 'name', 'slug', 'screen_types']

class SeatSerializer(serializers.ModelSerializer):
    seat_type_display = serializers.CharField(source='get_seat_type_display', read_only=True)
    
    class Meta:
        model = Seat
        fields = ['id', 'row_number', 'seat_number', 'seat_type', 'seat_type_display',
                  'position_x', 'position_y', 'width', 'height']
