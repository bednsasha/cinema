from rest_framework import viewsets, filters
#DjangoFilterBackend — это бэкенд для фильтрации данных в (DRF)
from django_filters.rest_framework import DjangoFilterBackend
from .models import Film, Genre
from .serializers import FilmListSerializer, FilmDetailSerializer, GenreSerializer
from rest_framework import permissions

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


class GenreViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminOrReadOnly]
    queryset = Genre.objects.all()
    serializer_class = GenreSerializer
    search_fields = ['name']
