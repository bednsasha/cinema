from rest_framework import serializers
from .models import Hall, Seat, ScreenType, HallScreen, SeatType


class SeatTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = SeatType
        fields = ['id', 'name', 'display_name', 'slug']


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
    seat_type_detail = SeatTypeSerializer(source='seat_type', read_only=True)
    hall_name = serializers.CharField(source='hall.name', read_only=True)
    
    class Meta:
        model = Seat
        fields = [
            'id', 'hall', 'hall_name', 'row_number', 'seat_number', 
            'seat_type', 'seat_type_detail', 'position_x', 'position_y', 
            'width', 'height'
        ]