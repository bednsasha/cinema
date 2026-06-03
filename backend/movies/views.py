from django.utils import timezone
from rest_framework.decorators import action
from rest_framework import viewsets, filters
#DjangoFilterBackend — это бэкенд для фильтрации данных в (DRF)
from django_filters.rest_framework import DjangoFilterBackend
from .models import Film, Genre
from .serializers import FilmListSerializer, FilmDetailSerializer, GenreSerializer
from rest_framework import permissions
from rest_framework.response import Response

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:  # GET, HEAD, OPTIONS
            return True
        return request.user and request.user.is_staff  
    
class FilmViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminOrReadOnly]
    queryset = Film.objects.all()
    filter_backends = [DjangoFilterBackend,
                       filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['age_limit', 'release_year', 'country','genres']
    search_fields = ['name', 'director', 'country']
    ordering_fields = ['rating', 'release_year', 'name']

    def get_serializer_class(self):
        if self.action == 'list':
            return FilmListSerializer
        return FilmDetailSerializer
    @action(detail=False, methods=['get'], url_path='now-showing')
    def now_showing(self, request):
        
        today = timezone.now().date()
        
        films_with_rental = Film.objects.filter(
            rentals__date_rental_end__gte=today
        ).distinct()
        
        serializer = self.get_serializer(films_with_rental, many=True)
        return Response(serializer.data)


class GenreViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminOrReadOnly]
    queryset = Genre.objects.all()
    serializer_class = GenreSerializer
    search_fields = ['name']
