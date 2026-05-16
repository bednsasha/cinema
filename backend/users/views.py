
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


class RegisterView(generics.GenericAPIView):
    """Регистрация - отправка кода в консоль"""
    permission_classes = [AllowAny]
    serializer_class = CustomerRegistrationSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        first_name = serializer.validated_data['first_name']
        code = generate_verification_code()

        # Сохраняем код и данные во временное хранилище
        request.session['reg_data'] = {
            'code': code,
            'data': serializer.validated_data,
            'created_at': timezone.now().timestamp()
        }

        # Выводим код в консоль
        print_verification_code(email, first_name, code, 'registration')

        return Response(
            {"message": f"Код подтверждения отправлен на email {email} (проверьте консоль)", "email": email},
            status=status.HTTP_200_OK
        )


class VerifyEmailView(generics.GenericAPIView):
    """Подтверждение email и создание пользователя"""
    permission_classes = [AllowAny]
    serializer_class = VerifyEmailSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        code = serializer.validated_data['code']

        # Получаем данные из сессии
        reg_data = request.session.get('reg_data')

        if not reg_data:
            return Response(
                {"error": "Сессия регистрации не найдена. Начните регистрацию заново."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Проверяем код
        if reg_data['code'] != code:
            return Response(
                {"error": "Неверный код подтверждения"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Проверяем время (10 минут)
        created_at = reg_data['created_at']
        if timezone.now().timestamp() - created_at > 600:
            del request.session['reg_data']
            return Response(
                {"error": "Время подтверждения истекло. Зарегистрируйтесь заново."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Проверяем, не создан ли пользователь
        if Customer.objects.filter(email__iexact=reg_data['data']['email']).exists():
            del request.session['reg_data']
            return Response(
                {"error": "Пользователь с таким email уже существует"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Создаём пользователя
        user_data = reg_data['data']
        user = Customer.objects.create(
            email=user_data['email'],
            phone=user_data['phone'],
            first_name=user_data['first_name'],
            last_name=user_data['last_name'],
            patronimic=user_data.get('patronimic', ''),
            receive_newsletter=user_data.get('receive_newsletter', False),
            password=make_password(user_data['password']),
            is_email_verified=True
        )

        # Очищаем сессию
        del request.session['reg_data']

        return Response(
            {
                "message": "Регистрация успешно завершена! Теперь вы можете войти.",
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


class ResendCodeView(generics.GenericAPIView):
    """Повторная отправка кода (для регистрации ИЛИ восстановления)"""
    permission_classes = [AllowAny]
    serializer_class = ResendCodeSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        user_exists = serializer.user_exists

        # Проверяем, есть ли активная сессия регистрации
        reg_data = request.session.get('reg_data')

        if reg_data and reg_data['data'].get('email') == email:
            # Сценарий: повторная отправка кода при регистрации
            new_code = generate_verification_code()
            reg_data['code'] = new_code
            reg_data['created_at'] = timezone.now().timestamp()
            request.session['reg_data'] = reg_data

            first_name = reg_data['data'].get('first_name', 'пользователь')
            print_verification_code(
                email, first_name, new_code, 'registration')

            return Response(
                {"message": f"Новый код подтверждения отправлен на email {email} (проверьте консоль)"},
                status=status.HTTP_200_OK
            )

        elif user_exists:
            # Сценарий: повторная отправка кода при восстановлении пароля
            try:
                user = Customer.objects.get(email__iexact=email)
                new_code = user.set_reset_code()
                print_verification_code(
                    email, user.first_name, new_code, 'password_reset')

                return Response(
                    {"message": f"Новый код восстановления отправлен на email {email} (проверьте консоль)"},
                    status=status.HTTP_200_OK
                )
            except Customer.DoesNotExist:
                pass

        # Если ничего не подошло
        return Response(
            {"error": "Не удалось отправить код. Начните процесс заново."},
            status=status.HTTP_400_BAD_REQUEST
        )

# users/views.py


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
