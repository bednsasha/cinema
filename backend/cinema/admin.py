from django.contrib import admin
from .models import Hall, Seat, ScreenType, HallScreen

class SeatInline(admin.TabularInline):
    model = Seat
    extra = 5
    fields = ['row_number', 'seat_number', 'seat_type', 'position_x', 'position_y']
    ordering = ['row_number', 'seat_number']

class HallScreenInline(admin.TabularInline):
    model = HallScreen
    extra = 1

@admin.register(Hall)
class HallAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'slug', 'seat_count']
    search_fields = ['name']
    prepopulated_fields = {'slug': ('name',)}
    inlines = [SeatInline, HallScreenInline]
    
    def seat_count(self, obj):
        return obj.seats.count()
    seat_count.short_description = 'Количество мест'

@admin.register(Seat)
class SeatAdmin(admin.ModelAdmin):
    list_display = ['id', 'hall', 'row_number', 'seat_number', 'seat_type', 'position_x', 'position_y']
    list_filter = ['hall', 'seat_type']
    search_fields = ['hall__name', 'seat_number']
    ordering = ['hall', 'row_number', 'seat_number']

@admin.register(ScreenType)
class ScreenTypeAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'slug']
    search_fields = ['name']
    prepopulated_fields = {'slug': ('name',)}

@admin.register(HallScreen)
class HallScreenAdmin(admin.ModelAdmin):
    list_display = ['id', 'hall', 'screen_type']
    list_filter = ['screen_type']
    search_fields = ['hall__name']