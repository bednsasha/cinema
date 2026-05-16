from django.contrib import admin
from .models import Rental, Session


@admin.register(Rental)
class RentalAdmin(admin.ModelAdmin):
    list_display = ['id', 'film', 'date_rental_start', 'date_rental_end']
    list_filter = ['date_rental_start', 'date_rental_end']
    search_fields = ['film__name']
    ordering = ['-date_rental_start']
    fieldsets = (
        ('Фильм', {
            'fields': ('film',)
        }),
        ('Период проката', {
            'fields': ('date_rental_start', 'date_rental_end')
        }),
    )


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ['id', 'rental', 'hall', 'screen_type', 'start_time']
    list_filter = ['hall', 'screen_type', 'start_time']
    search_fields = ['rental__film__name', 'hall__name']
    ordering = ['start_time']
    fieldsets = (
        ('Сеанс', {
            'fields': ('rental', 'hall', 'screen_type', 'start_time')
        }),
    )
    raw_id_fields = ['rental', 'hall']