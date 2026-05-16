from rest_framework import serializers
from .models import Genre, Film, FilmGenre

class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ['id', 'name', 'slug']

class FilmListSerializer(serializers.ModelSerializer):
    genres = serializers.SlugRelatedField(many=True, read_only=True, slug_field='name')
    age_limit_display = serializers.CharField(source='get_age_limit_display', read_only=True)
    
    class Meta:
        model = Film
        fields = ['id', 'name', 'poster', 'rating', 'duration', 
                  'age_limit', 'age_limit_display', 'genres']

class FilmDetailSerializer(serializers.ModelSerializer):
    genres = GenreSerializer(many=True, read_only=True)
    age_limit_display = serializers.CharField(source='get_age_limit_display', read_only=True)
    
    class Meta:
        model = Film
        fields = '__all__'