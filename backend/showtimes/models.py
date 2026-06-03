from datetime import timedelta

from django.db import models
from movies.models import Film
from cinema.models import Hall, ScreenType
from django.utils import timezone

class Rental(models.Model):
    film = models.ForeignKey(Film, on_delete=models.CASCADE, related_name='rentals')
    date_rental_start = models.DateField(verbose_name='Начало проката')
    date_rental_end = models.DateField(verbose_name='Конец проката')
    
    class Meta:
        db_table = 'rentals'
        verbose_name = 'Прокат'
        verbose_name_plural = 'Прокаты'
        ordering = ['-date_rental_start']
    
    def __str__(self):
        return f'{self.film.name} ({self.date_rental_start} - {self.date_rental_end})'

# showtimes/models.py

class Session(models.Model):
    hall = models.ForeignKey(Hall, on_delete=models.CASCADE, related_name='sessions')
    rental = models.ForeignKey(Rental, on_delete=models.CASCADE, related_name='sessions')
    screen_type = models.ForeignKey(ScreenType, on_delete=models.CASCADE)
    start_time = models.DateTimeField(verbose_name='Время начала')
    
    class Meta:
        db_table = 'sessions'
        verbose_name = 'Сеанс'
        verbose_name_plural = 'Сеансы'
        ordering = ['start_time']
        unique_together = (('hall', 'start_time'),)
    
    def __str__(self):
        return f'{self.rental.film.name} в {self.hall.name} ({self.start_time})'
    
    @property
    def is_past(self):
        """Проверяет, закончился ли сеанс (с учетом длительности фильма)"""
        film_duration = self.rental.film.duration  
        end_time = self.start_time + timedelta(minutes=film_duration)
        return end_time < timezone.now()