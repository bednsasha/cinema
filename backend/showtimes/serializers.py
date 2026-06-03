from rest_framework import serializers
from .models import Rental, Session
from movies.serializers import FilmListSerializer
from cinema.serializers import HallSerializer, ScreenTypeSerializer


class RentalSerializer(serializers.ModelSerializer):
    film_name = serializers.CharField(source='film.name', read_only=True)
    
    class Meta:
        model = Rental
        fields = ['id', 'film', 'film_name', 'date_rental_start', 'date_rental_end']
        read_only_fields = ['id']


class RentalDetailSerializer(serializers.ModelSerializer):
    film = FilmListSerializer(read_only=True)
    
    class Meta:
        model = Rental
        fields = '__all__'


class SessionSerializer(serializers.ModelSerializer):
    film_name = serializers.CharField(source='rental.film.name', read_only=True)
    hall_name = serializers.CharField(source='hall.name', read_only=True)
    screen_type_name = serializers.CharField(source='screen_type.name', read_only=True)
    is_past = serializers.SerializerMethodField()
    
    class Meta:
        model = Session
        fields = [
            'id', 'hall', 'hall_name', 'rental', 'film_name',
            'screen_type', 'screen_type_name', 'start_time', 'is_past'
        ]
        read_only_fields = ['id']
    
    def get_is_past(self, obj):
        return obj.is_past

class SessionDetailSerializer(serializers.ModelSerializer):
    rental = RentalSerializer(read_only=True)
    hall = HallSerializer(read_only=True)
    screen_type = ScreenTypeSerializer(read_only=True)
    
    class Meta:
        model = Session
        fields = '__all__'