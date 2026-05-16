from django.db import models
from django.utils.text import slugify

class Genre(models.Model):
    name = models.CharField(max_length=50, unique=True, verbose_name='Название')
    slug = models.SlugField(max_length=50, unique=True, blank=True, verbose_name='Slug')
    
    class Meta:
        db_table = 'genres'
        verbose_name = 'Жанр'
        verbose_name_plural = 'Жанры'
        ordering = ['name']
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name

class Film(models.Model):
    
    AGE_LIMITS = [
        ('0+', '0+'),
        ('6+', '6+'),
        ('12+', '12+'),
        ('16+', '16+'),
        ('18+', '18+'),
    ]
    director = models.CharField(max_length=100, verbose_name='Режиссер')
    name = models.CharField(max_length=200, verbose_name='Название')
    description = models.TextField(blank=True, verbose_name='Описание')
    rating = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True, verbose_name='Рейтинг')
    duration = models.PositiveIntegerField(verbose_name='Длительность (мин)')
    release_year = models.PositiveSmallIntegerField(verbose_name='Год выпуска')
    country = models.CharField(max_length=100, verbose_name='Страна')
    poster = models.URLField(max_length=255, blank=True, verbose_name='Постер')
    trailer = models.URLField(max_length=255, blank=True, verbose_name='Трейлер')
    age_limit = models.CharField(max_length=3, choices=AGE_LIMITS, default='0+', verbose_name='Возрастное ограничение')
    
    genres = models.ManyToManyField(Genre, through='FilmGenre', related_name='films')
    
    class Meta:
        db_table = 'films'
        verbose_name = 'Фильм'
        verbose_name_plural = 'Фильмы'
        ordering = ['-release_year', 'name']
    
    def __str__(self):
        return f'{self.name} ({self.release_year})'

class FilmGenre(models.Model):
    genre = models.ForeignKey(Genre, on_delete=models.CASCADE)
    film = models.ForeignKey(Film, on_delete=models.CASCADE)
    
    class Meta:
        db_table = 'film_genre'
        verbose_name = 'Жанр фильма'
        verbose_name_plural = 'Жанры фильмов'
        unique_together = (('genre', 'film'),)
    
    def __str__(self):
        return f'{self.film.name} - {self.genre.name}'