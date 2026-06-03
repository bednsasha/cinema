
from .serializers import CustomTokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from users.models import Customer
from users.utils import generate_verification_code, print_verification_code
from .serializers import (
    CustomerRegistrationSerializer,
    ResendCodeSerializer,
    VerifyEmailSerializer,
    CustomerSerializer,
    ChangePasswordSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer
)

# users/views.py - замени RegisterView

class RegisterView(generics.GenericAPIView):
    """Простая регистрация без подтверждения email"""
    permission_classes = [AllowAny]
    serializer_class = CustomerRegistrationSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_data = serializer.validated_data
        
        user = Customer.objects.create(
            email=user_data['email'],
            phone=user_data['phone'],
            first_name=user_data['first_name'],
            last_name=user_data['last_name'],
            patronimic=user_data.get('patronimic', ''),
            receive_newsletter=user_data.get('receive_newsletter', False),
            password=make_password(user_data['password']),
            is_email_verified=True  # Сразу подтверждён
        )

        return Response(
            {
                "message": "Регистрация успешно завершена!",
                "user": CustomerSerializer(user).data
            },
            status=status.HTTP_201_CREATED
        )

class ChangePasswordView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ChangePasswordSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        user.password = make_password(
            serializer.validated_data['new_password'])
        user.last_password_change = timezone.now()
        user.save()

        return Response(
            {"message": "Пароль успешно изменён. Пожалуйста, войдите заново с новым паролем."},
            status=status.HTTP_200_OK
        )


class ForgotPasswordView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = ForgotPasswordSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.user
        code = user.set_reset_code()

        # Выводим код в консоль
        print_verification_code(
            user.email, user.first_name, code, 'password_reset')

        return Response(
            {"message": f"Код для восстановления пароля отправлен на email {user.email} (проверьте консоль)"},
            status=status.HTTP_200_OK
        )


class ResetPasswordView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = ResetPasswordSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.user
        user.password = make_password(
            serializer.validated_data['new_password'])
        user.reset_code = None
        user.reset_code_created_at = None
        user.save()

        return Response(
            {"message": "Пароль успешно изменён. Теперь вы можете войти с новым паролем."},
            status=status.HTTP_200_OK
        )




class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
