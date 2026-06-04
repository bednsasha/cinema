from django.db import models
from django.utils import timezone
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.contrib.auth.hashers import make_password


class CustomerManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email обязателен')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        return self.create_user(email, password, **extra_fields)

    def get_by_natural_key(self, email):
        return self.get(email=email)


class Customer(AbstractBaseUser):
    email = models.EmailField(unique=True, verbose_name='Email')
    phone = models.CharField(
        max_length=20, unique=True, verbose_name='Телефон')
    receive_newsletter = models.BooleanField(
        default=False, verbose_name='Получать рассылку')
    first_name = models.CharField(max_length=50, verbose_name='Имя')
    last_name = models.CharField(max_length=50, verbose_name='Фамилия')
    patronimic = models.CharField(
        max_length=50, blank=True, verbose_name='Отчество')
    created_at = models.DateTimeField(
        auto_now_add=True, verbose_name='Дата регистрации')
    last_password_change = models.DateTimeField(auto_now_add=True)
    reset_code = models.CharField(
        max_length=6, blank=True, null=True, verbose_name='Код сброса')
    reset_code_created_at = models.DateTimeField(
        blank=True, null=True, verbose_name='Время создания кода')
    is_email_verified = models.BooleanField(default=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name', 'phone']

    objects = CustomerManager()

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
        delta = timezone.now() - self.reset_code_created_at
        return delta.total_seconds() <= 600

    def has_perm(self, perm, obj=None):
        return self.is_superuser

    def has_module_perms(self, app_label):
        return self.is_superuser

    def get_full_name(self):
        return f'{self.first_name} {self.last_name}'

    def get_short_name(self):
        return self.first_name
