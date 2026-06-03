from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework.decorators import action
from yookassa import Payment as YooPayment
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

        # Проверяем существующий платеж
        payment = Payment.objects.filter(cart=cart).first()
        
        if payment and payment.payment_status == 'pending':
            # Если платеж еще в ожидании, возвращаем его
            return Response({
                "payment_id": payment.id,
                "payment_url": payment.yookassa_payment_url or "https://yoomoney.ru",
                "amount": str(payment.amount)
            }, status=status.HTTP_200_OK)
        elif payment and payment.payment_status == 'success':
            # Если платеж уже успешен, ошибка
            return Response(
                {"error": "Корзина уже оплачена"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Создаем новый платеж через Yookassa API
        try:
            yoo_payment = YooPayment.create({
                "amount": {
                    "value": str(cart.total_price),
                    "currency": "RUB"
                },
                "confirmation": {
                    "type": "redirect",
                    "return_url": serializer.validated_data.get('success_url') or settings.PAYMENT_SUCCESS_URL
                },
                "description": f"Оплата билетов в кино. Заказ №{cart.id}",
                "metadata": {
                    "cart_id": cart.id
                }
            })

            # Сохраняем платеж в БД с реальным Yookassa ID
            payment = Payment.objects.create(
                cart=cart,
                payment_status='pending',
                yookassa_payment_id=yoo_payment.id,
                yookassa_payment_url=yoo_payment.confirmation.confirmation_url,
                amount=cart.total_price
            )

            print(f"Payment created: {payment.id}, Yookassa ID: {yoo_payment.id}")

            return Response({
                "payment_id": payment.id,
                "payment_url": yoo_payment.confirmation.confirmation_url,
                "amount": str(payment.amount)
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            print(f"Error creating payment: {e}")
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
        try:
            event = json.loads(request.body)
        except json.JSONDecodeError:
            print("Invalid JSON in webhook")
            return Response({"status": "error"}, status=400)

        # Проверяем объект
        if 'object' not in event or 'id' not in event['object']:
            print("Missing object or id in webhook event")
            return Response({"status": "ok"})

        yoo_payment_id = event['object']['id']
        payment_status = event['object'].get('status')

        print(f"Webhook received - Payment ID: {yoo_payment_id}, Status: {payment_status}")

        # Находим платёж в БД
        try:
            payment = Payment.objects.get(yookassa_payment_id=yoo_payment_id)
            print(f"Found payment {payment.id} in database")
        except Payment.DoesNotExist:
            print(f"Payment not found for Yookassa ID: {yoo_payment_id}")
            return Response({"status": "ok"})

        # Обновляем статус платежа в зависимости от статуса от Yookassa
        if payment_status == 'succeeded':
            print(f"Processing successful payment {payment.id}")
            payment.mark_as_success()

            # Генерируем QR-коды для билетов
            for ticket in payment.tickets.all():
                ticket.generate_qr_code()
                print(f"Generated QR code for ticket {ticket.id}")

        elif payment_status == 'canceled':
            print(f"Processing canceled payment {payment.id}")
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
    
    def get(self, request, payment_id):
        payment = get_object_or_404(
            Payment, id=payment_id, cart__customer=request.user)
        
        # Запрашиваем статус у YooKassa только если платеж еще pending
        if payment.payment_status == 'pending':
            try:
                print(f"Checking payment status with Yookassa for payment {payment.id}")
                yoo_payment = YooPayment.find_one(payment.yookassa_payment_id)
                print(f"Yookassa status: {yoo_payment.status}")
                
                if yoo_payment.status == 'succeeded':
                    print(f"Payment {payment.id} succeeded, processing...")
                    payment.mark_as_success()
                    for ticket in payment.tickets.all():
                        ticket.generate_qr_code()
                    print(f"Payment {payment.id} processed successfully")
                elif yoo_payment.status == 'canceled':
                    print(f"Payment {payment.id} was canceled")
                    payment.payment_status = 'failed'
                    payment.save()
                    payment.cart.status = 'cancelled'
                    payment.cart.save()
            except Exception as e:
                print(f"Error checking YooKassa payment {payment.id}: {e}")
        
        serializer = PaymentSerializer(payment)
        return Response(serializer.data)