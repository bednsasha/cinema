from django.contrib import admin
from django import forms
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
    list_display = ['id', 'get_film_name', 'hall', 'screen_type', 'start_time']
    list_filter = ['hall', 'screen_type', 'start_time']
    search_fields = ['rental__film__name', 'hall__name']
    ordering = ['start_time']
    
   
    autocomplete_fields = ['rental', 'hall']
    
    fieldsets = (
        ('Сеанс', {
            'fields': ('rental', 'hall', 'screen_type', 'start_time')
        }),
    )
    
    def get_film_name(self, obj):
        return obj.rental.film.name
    get_film_name.short_description = 'Фильм'
    get_film_name.admin_order_field = 'rental__film__name'