from django.urls import path
from . import views

urlpatterns = [
    # Регистрация
    path('register/', views.RegisterView.as_view(), name='register'),
    path('verify-email/', views.VerifyEmailView.as_view(), name='verify-email'),
    path('resend-code/', views.ResendCodeView.as_view(), name='resend-code'),

    # Восстановление пароля
    path('forgot-password/', views.ForgotPasswordView.as_view(),
         name='forgot-password'),
    path('reset-password/', views.ResetPasswordView.as_view(), name='reset-password'),
    path('change-password/', views.ChangePasswordView.as_view(),
         name='change-password'),
]
