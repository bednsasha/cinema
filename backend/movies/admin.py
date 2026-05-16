from django.contrib import admin
from .models import Film, Genre, FilmGenre, FilmScreenFormat

class FilmGenreInline(admin.TabularInline):
    model = FilmGenre
    extra = 1
    autocomplete_fields = ['genre']

class FilmScreenFormatInline(admin.TabularInline):
    model = FilmScreenFormat
    extra = 1

@admin.register(Film)
class FilmAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'director', 'release_year', 'rating', 'age_limit', 'duration']
    list_filter = ['release_year', 'age_limit', 'country', 'genres']
    search_fields = ['name', 'director', 'country']
    readonly_fields = ['created_at'] if hasattr(Film, 'created_at') else []
    filter_horizontal = []  
    inlines = [FilmGenreInline, FilmScreenFormatInline]
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'director', 'description', 'duration', 'release_year', 'country')
        }),
        ('Рейтинг и возраст', {
            'fields': ('rating', 'age_limit')
        }),
        ('Медиа', {
            'fields': ('poster', 'trailer')
        }),
    )

@admin.register(Genre)
class GenreAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'slug']
    search_fields = ['name']
    prepopulated_fields = {'slug': ('name',)}

@admin.register(FilmScreenFormat)
class FilmScreenFormatAdmin(admin.ModelAdmin):
    list_display = ['id', 'film', 'screen_type']
    list_filter = ['screen_type']
    search_fields = ['film__name']