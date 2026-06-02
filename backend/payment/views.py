from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework.decorators import action
from yookassa import Payment as YooPayment
import uuid
from cart.models import Cart
from .models import Payment, Ticket
from .serializers import PaymentSerializer, PaymentCreateSerializer, TicketSerializer
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

class CreatePaymentView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PaymentCreateSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Получаем активную корзину пользователя
        cart = Cart.objects.filter(
            customer=request.user,
            status='active'
        ).first()

        if not cart or cart.total_items == 0:
            return Response(
                {"error": "Корзина пуста"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Проверяем, нет ли уже платежа для этой корзины
        if hasattr(cart, 'payment') and cart.payment.payment_status == 'pending':
            return Response({
                "payment_url": cart.payment.yookassa_payment_url,
                "payment_id": cart.payment.id,
                "message": "Платёж уже создан"
            })

        # Создаём платёж (YooKassa)
        idempotence_key = str(uuid.uuid4())
        success_url = serializer.validated_data.get(
            'success_url', settings.PAYMENT_SUCCESS_URL)
        cancel_url = serializer.validated_data.get(
            'cancel_url', settings.PAYMENT_CANCEL_URL)

        try:
            yoo_payment = YooPayment.create({
                "amount": {
                    "value": str(cart.total_price),
                    "currency": "RUB"
                },
                "confirmation": {
                    "type": "redirect",
                    "return_url": success_url
                },
                "capture": True,
                "description": f"Билеты в кино - заказ #{cart.id}",
                "receipt": {
                    "customer": {
                        "email": request.user.email
                    },
                    "items": [
                        {
                            "description": "Билеты в кино",
                            "quantity": cart.total_items,
                            "amount": {
                                "value": str(cart.total_price),
                                "currency": "RUB"
                            },
                            "vat_code": settings.YOOKASSA_VAT_CODE,
                            "payment_mode": "full_payment",
                            "payment_subject": "service"
                        }
                    ]
                },
                "metadata": {
                    "cart_id": cart.id,
                    "user_id": request.user.id
                }
            }, idempotence_key)

            # Сохраняем платёж в БД
            payment = Payment.objects.create(
                cart=cart,
                payment_status='pending',
                yookassa_payment_id=yoo_payment.id,
                yookassa_payment_url=yoo_payment.confirmation.confirmation_url,
                amount=cart.total_price
            )

            return Response({
                "payment_id": payment.id,
                "payment_url": payment.yookassa_payment_url,
                "amount": str(payment.amount)
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {"error": f"Ошибка создания платежа: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(csrf_exempt, name='dispatch')
class YooKassaWebhookView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = None

    def post(self, request, *args, **kwargs):
        import json
        event = json.loads(request.body)

        # Проверяем объект
        if 'object' in event and 'id' in event['object']:
            yoo_payment_id = event['object']['id']
            payment_status = event['object']['status']

            # Находим платёж в БД
            try:
                payment = Payment.objects.get(
                    yookassa_payment_id=yoo_payment_id)
            except Payment.DoesNotExist:
                return Response({"error": "Payment not found"}, status=404)

            # Обновляем статус
            if payment_status == 'succeeded':
                payment.mark_as_success()

                # Генерируем QR-коды для билетов
                for ticket in payment.tickets.all():
                    ticket.generate_qr_code()

            elif payment_status == 'canceled':
                payment.payment_status = 'failed'
                payment.save()
                payment.cart.status = 'cancelled'
                payment.cart.save()

        return Response({"status": "ok"})


class PaymentStatusView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, payment_id):
        payment = get_object_or_404(
            Payment, id=payment_id, cart__customer=request.user)
        serializer = PaymentSerializer(payment)
        return Response(serializer.data)


class MyTicketsView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TicketSerializer
    def get(self, request):
        tickets = Ticket.objects.filter(
            payment__cart__customer=request.user,
            status='active'
        ).select_related(
            'booking__session__rental__film',
            'booking__seat__hall'
        ).order_by('-payment__created_at')

        serializer = TicketSerializer(tickets, many=True)
        return Response(serializer.data)


class CheckPaymentStatusView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PaymentSerializer
    def get(self, request, payment_id):
        payment = get_object_or_404(
            Payment, id=payment_id, cart__customer=request.user)

        # Запрашиваем статус у YooKassa
        try:
            yoo_payment = YooPayment.find_one(payment.yookassa_payment_id)

            if yoo_payment.status == 'succeeded' and payment.payment_status != 'success':
                payment.mark_as_success()
                for ticket in payment.tickets.all():
                    ticket.generate_qr_code()
            elif yoo_payment.status == 'canceled' and payment.payment_status != 'failed':
                payment.payment_status = 'failed'
                payment.save()
                payment.cart.status = 'cancelled'
                payment.cart.save()

        except Exception as e:
            pass

        serializer = PaymentSerializer(payment)
        return Response(serializer.data)
