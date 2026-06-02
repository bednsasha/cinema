
from django.urls import path
from .views import (
    CreatePaymentView, 
    YooKassaWebhookView, 
    PaymentStatusView,
    MyTicketsView,
    CheckPaymentStatusView
)

urlpatterns = [
    path('create/', CreatePaymentView.as_view(), name='create-payment'),
    path('webhook/', YooKassaWebhookView.as_view(), name='yookassa-webhook'),
    path('<int:payment_id>/status/', PaymentStatusView.as_view(), name='payment-status'),
    path('check/<int:payment_id>/', CheckPaymentStatusView.as_view(), name='check-payment'),
    path('my-tickets/', MyTicketsView.as_view(), name='my-tickets'),
]