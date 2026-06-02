from django.contrib import admin
from .models import Cart, Booking


class BookingInline(admin.TabularInline):
    model = Booking
    extra = 0
    readonly_fields = ['created_at', 'expires_at']
    fields = ['session', 'seat', 'price', 'created_at', 'expires_at']


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ['id', 'customer', 'status', 'total_items', 'total_price', 'created_at', 'expires_at']
    list_filter = ['status', 'created_at']
    search_fields = ['customer__email', 'customer__first_name', 'customer__last_name']
    readonly_fields = ['created_at']
    inlines = [BookingInline]
    fieldsets = (
        ('Клиент', {
            'fields': ('customer', 'send_to_email')
        }),
        ('Итоги', {
            'fields': ('total_items', 'total_price')
        }),
        ('Скидка', {
            'fields': ('is_discount', 'discount_percent')
        }),
        ('Статус', {
            'fields': ('status', 'created_at', 'expires_at')
        }),
    )


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['id', 'cart', 'session', 'seat', 'price', 'created_at', 'expires_at']
    list_filter = ['session__hall', 'session__start_time']
    search_fields = ['cart__customer__email', 'seat__hall__name']
    readonly_fields = ['created_at', 'expires_at']