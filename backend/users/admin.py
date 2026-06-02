from django.contrib import admin
from django.contrib.auth.hashers import make_password
from .models import Customer

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['id', 'email', 'phone', 'first_name', 'last_name', 'is_email_verified', 'created_at']
    list_filter = ['is_email_verified', 'receive_newsletter', 'created_at']
    search_fields = ['email', 'phone', 'first_name', 'last_name']
    readonly_fields = ['created_at', 'last_password_change', 'reset_code_created_at']
    fieldsets = (
        ('Личная информация', {
            'fields': ('email', 'phone', 'first_name', 'last_name', 'patronimic')
        }),
        ('Безопасность', {
            'fields': ('password', 'is_email_verified', 'reset_code', 'reset_code_created_at', 'last_password_change')
        }),
        ('Настройки', {
            'fields': ('receive_newsletter',)
        }),
        ('Даты', {
            'fields': ('created_at',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        # Хешируем пароль, если он был изменён
        if 'password' in form.changed_data:
            obj.password = make_password(obj.password)
        super().save_model(request, obj, form, change)