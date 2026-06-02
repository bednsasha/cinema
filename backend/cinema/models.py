from django.db import models

class ScreenType(models.Model):
    name = models.CharField(max_length=20, unique=True, verbose_name='Название')  # '2D', '3D', 'IMAX'
    slug = models.SlugField(max_length=20, unique=True, blank=True, verbose_name='Slug')
    
    class Meta:
        db_table = 'screen_types'
        verbose_name = 'Тип экрана'
        verbose_name_plural = 'Типы экранов'
    
    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name

class Hall(models.Model):
    name = models.CharField(max_length=50, verbose_name='Название зала')
    slug = models.SlugField(max_length=50, unique=True, blank=True, verbose_name='Slug')
    
    class Meta:
        db_table = 'halls'
        verbose_name = 'Зал'
        verbose_name_plural = 'Залы'
    
    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name

class HallScreen(models.Model):
    hall = models.ForeignKey(Hall, on_delete=models.CASCADE, related_name='screen_types')
    screen_type = models.ForeignKey(ScreenType, on_delete=models.CASCADE)
    
    class Meta:
        db_table = 'hall_screens'
        verbose_name = 'Поддержка экрана залом'
        verbose_name_plural = 'Поддержка экранов залами'
        unique_together = (('hall', 'screen_type'),)
    
    def __str__(self):
        return f'{self.hall.name} - {self.screen_type.name}'

class SeatType(models.Model):
    name = models.CharField(max_length=20, unique=True, verbose_name='Название')
    display_name = models.CharField(max_length=50, verbose_name='Отображаемое имя')
    slug = models.SlugField(unique=True, blank=True)
    
    class Meta:
        db_table = 'seat_types'
        verbose_name = 'Тип места'
        verbose_name_plural = 'Типы мест'
    
    def __str__(self):
        return self.display_name
class Seat(models.Model):
    
    
    hall = models.ForeignKey(Hall, on_delete=models.CASCADE, related_name='seats')
    row_number = models.PositiveSmallIntegerField(verbose_name='Номер ряда')
    seat_number = models.PositiveSmallIntegerField(verbose_name='Номер места')
    seat_type = models.ForeignKey(SeatType, on_delete=models.PROTECT, verbose_name='Тип места')
    
    # Для визуализации
    position_x = models.IntegerField(verbose_name='X координата')
    position_y = models.IntegerField(verbose_name='Y координата')
    width = models.IntegerField(default=40, verbose_name='Ширина')
    height = models.IntegerField(default=40, verbose_name='Высота')
    
    class Meta:
        db_table = 'seats'
        verbose_name = 'Место'
        verbose_name_plural = 'Места'
        unique_together = (('hall', 'row_number', 'seat_number'),)
        ordering = ['hall', 'row_number', 'seat_number']
    
    def __str__(self):
        return f'{self.hall.name} - Ряд {self.row_number}, Место {self.seat_number} ({self.seat_type.display_name})'