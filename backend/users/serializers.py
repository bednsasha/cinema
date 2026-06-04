from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import serializers
from users.models import Customer
import re
from django.contrib.auth.hashers import make_password, check_password
from django.core.validators import validate_email
from django.core.exceptions import ValidationError


class CustomerRegistrationSerializer(serializers.Serializer):

    email = serializers.EmailField(required=True)
    phone = serializers.CharField(required=True)
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    patronimic = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True, min_length=6)
    receive_newsletter = serializers.BooleanField(
        required=False, default=False)

    def validate_email(self, value):
        try:
            validate_email(value)
        except ValidationError:
            raise serializers.ValidationError("Введите корректный email адрес")

        if Customer.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "Пользователь с таким email уже существует")

        return value.lower()

    def validate_phone(self, value):
        cleaned = re.sub(r'[\s\-\(\)\+]', '', value)

        if not re.match(r'^[78]\d{10}$', cleaned):
            raise serializers.ValidationError(
                "Номер телефона должен содержать 11 цифр и начинаться с 7 или 8"
            )

        if cleaned.startswith('8'):
            formatted = '+7' + cleaned[1:]
        elif cleaned.startswith('7'):
            formatted = '+' + cleaned
        else:
            formatted = '+' + cleaned

        if Customer.objects.filter(phone=formatted).exists():
            raise serializers.ValidationError(
                "Пользователь с таким номером телефона уже существует"
            )

        return formatted

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError(
                {"confirm_password": "Пароли не совпадают"})
        return data


class VerifyEmailSerializer(serializers.Serializer):

    code = serializers.CharField(min_length=6, max_length=6, required=True)


class CustomerSerializer(serializers.ModelSerializer):

    class Meta:
        model = Customer
        fields = ['id', 'email', 'phone', 'first_name', 'last_name', 'patronimic',
                  'receive_newsletter', 'created_at', 'is_email_verified']
        read_only_fields = ['id', 'created_at']


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(
        write_only=True, required=True, min_length=6)
    confirm_new_password = serializers.CharField(
        write_only=True, required=True)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not check_password(value, user.password):
            raise serializers.ValidationError("Старый пароль неверен")
        return value

    def validate(self, data):
        if data['new_password'] != data['confirm_new_password']:
            raise serializers.ValidationError(
                {"confirm_new_password": "Новые пароли не совпадают"}
            )
        return data


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        try:
            user = Customer.objects.get(email__iexact=value)
        except Customer.DoesNotExist:
            raise serializers.ValidationError(
                "Пользователь с таким email не найден")
        self.user = user
        return value


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    code = serializers.CharField(min_length=6, max_length=6, required=True)
    new_password = serializers.CharField(min_length=6, required=True)
    confirm_new_password = serializers.CharField(min_length=6, required=True)

    def validate_email(self, value):
        try:
            user = Customer.objects.get(email__iexact=value)
        except Customer.DoesNotExist:
            raise serializers.ValidationError(
                "Пользователь с таким email не найден")
        self.user = user
        return value

    def validate_code(self, value):
        if not hasattr(self, 'user') or self.user is None:
            raise serializers.ValidationError(
                "Сначала укажите корректный email")
        if not self.user.is_reset_code_valid(value):
            raise serializers.ValidationError("Неверный или просроченный код")
        return value

    def validate(self, data):
        if data['new_password'] != data['confirm_new_password']:
            raise serializers.ValidationError(
                {"confirm_new_password": "Пароли не совпадают"}
            )
        return data


class ResendCodeSerializer(serializers.Serializer):

    email = serializers.EmailField(required=True)

    def validate_email(self, value):

        user_exists = Customer.objects.filter(email__iexact=value).exists()

        self.user_exists = user_exists
        return value.lower()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        token['last_password_change'] = user.last_password_change.timestamp()
        return token

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        try:
            user = Customer.objects.get(email=email)
        except Customer.DoesNotExist:
            raise serializers.ValidationError("Неверный email или пароль")

        if not check_password(password, user.password):
            raise serializers.ValidationError("Неверный email или пароль")

        refresh = self.get_token(user)

        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user_id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
        }
