
from django.contrib import admin
from .models import Customer


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('email', 'first_name', 'last_name',
                    'phone', 'is_staff', 'is_active')
    list_filter = ('is_staff', 'is_active', 'is_email_verified')
    search_fields = ('email', 'first_name', 'last_name', 'phone')

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Личная информация', {'fields': (
            'first_name', 'last_name', 'patronimic', 'phone', 'receive_newsletter')}),
        ('Статусы', {'fields': ('is_active', 'is_staff',
         'is_superuser', 'is_email_verified')}),

    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'phone', 'password1', 'password2'),
        }),
    )
