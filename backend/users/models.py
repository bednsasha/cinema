from django.db import models
from django.utils import timezone


class Customer(models.Model):
    email = models.EmailField(unique=True, verbose_name='Email')
    phone = models.CharField(
        max_length=20, unique=True, verbose_name='Телефон')
    password = models.CharField(max_length=255, verbose_name='Пароль (hash)')
    receive_newsletter = models.BooleanField(
        default=False, verbose_name='Получать рассылку')
    first_name = models.CharField(max_length=50, verbose_name='Имя')
    last_name = models.CharField(max_length=50, verbose_name='Фамилия')
    patronimic = models.CharField(
        max_length=50, blank=True, verbose_name='Отчество')
    created_at = models.DateTimeField(
        auto_now_add=True, verbose_name='Дата регистрации')

    last_password_change = models.DateTimeField(auto_now_add=True)

    # Код с почты
    reset_code = models.CharField(
        max_length=6, blank=True, null=True, verbose_name='Код сброса')
    reset_code_created_at = models.DateTimeField(
        blank=True, null=True, verbose_name='Время создания кода')
    is_email_verified = models.BooleanField(default=False)
     
    class Meta:
        db_table = 'customers'
        verbose_name = 'Клиент'
        verbose_name_plural = 'Клиенты'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.first_name} {self.last_name} ({self.email})'

    def set_reset_code(self):
        import random
        self.reset_code = f"{random.randint(100000, 999999)}"
        self.reset_code_created_at = timezone.now()
        self.save()
        return self.reset_code

    def is_reset_code_valid(self, code):
        if not self.reset_code or not self.reset_code_created_at:
            return False
        if self.reset_code != code:
            return False
        # Код действителен 10 минут
        delta = timezone.now() - self.reset_code_created_at
        return delta.total_seconds() <= 600
