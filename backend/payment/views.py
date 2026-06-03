from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework.decorators import action
from yookassa import Configuration, Payment as YooPayment
import uuid
import json
import hmac
import hashlib
from django.utils import timezone
from cart.models import Cart
from .models import Payment, Ticket
from .serializers import PaymentSerializer, PaymentCreateSerializer, TicketSerializer
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

# Настройка YooKassa (добавьте ваши ключи в settings.py)
Configuration.account_id = getattr(settings, 'YOOKASSA_SHOP_ID', '')
Configuration.secret_key = getattr(settings, 'YOOKASSA_SECRET_KEY', '')


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
                "amount": str(payment.amount),
                "payment_status": payment.payment_status
            }, status=status.HTTP_200_OK)
        elif payment and payment.payment_status == 'success':
            # Если платеж уже успешен
            return Response({
                "payment_id": payment.id,
                "payment_status": "success",
                "message": "Корзина уже оплачена"
            }, status=status.HTTP_200_OK)

        # Создаем новый платеж через Yookassa API
        try:
            idempotence_key = str(uuid.uuid4())
            
            payment_data = {
                "amount": {
                    "value": str(cart.total_price),
                    "currency": "RUB"
                },
                "confirmation": {
                    "type": "redirect",
                    "return_url": serializer.validated_data.get('success_url') or getattr(settings, 'PAYMENT_SUCCESS_URL', 'http://localhost:3000/payment/success')
                },
                "capture": True,
                "description": f"Оплата билетов в кино. Заказ №{cart.id}",
                "metadata": {
                    "cart_id": cart.id,
                    "user_id": request.user.id
                }
            }

            yoo_payment = YooPayment.create(payment_data, idempotence_key)

            # Сохраняем платеж в БД
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
                "amount": str(payment.amount),
                "payment_status": "pending"
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
        try:
            event = json.loads(request.body)
            print(f"Webhook received: {json.dumps(event, indent=2)}")
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

        # Обновляем статус платежа
        if payment_status == 'succeeded':
            print(f"Processing successful payment {payment.id}")
            
            # Обновляем статус
            payment.payment_status = 'success'
            payment.save()
            
            # Обновляем статус корзины
            if payment.cart:
                payment.cart.status = 'paid'
                payment.cart.save()
            
            # Создаем билеты из бронирований
            bookings = payment.cart.bookings.all()
            for booking in bookings:
                ticket, created = Ticket.objects.get_or_create(
                    payment=payment,
                    booking=booking,
                    defaults={'status': 'active'}
                )
                if created:
                    ticket.generate_qr_code()
                    print(f"Created ticket {ticket.id} for booking {booking.id}")
                else:
                    print(f"Ticket already exists for booking {booking.id}")

        elif payment_status == 'canceled':
            print(f"Processing canceled payment {payment.id}")
            payment.payment_status = 'failed'
            payment.save()
            if payment.cart:
                payment.cart.status = 'cancelled'
                payment.cart.save()

        return Response({"status": "ok"})


class PaymentStatusView(generics.GenericAPIView):
    """View для получения статуса платежа"""
    permission_classes = [IsAuthenticated]

    def get(self, request, payment_id):
        payment = get_object_or_404(
            Payment, id=payment_id, cart__customer=request.user)
        serializer = PaymentSerializer(payment)
        return Response(serializer.data)

# payment/views.py - полностью исправленный CheckPaymentStatusView

class CheckPaymentStatusView(generics.GenericAPIView):
    """View для проверки и обновления статуса платежа через YooKassa"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, payment_id):
        payment = get_object_or_404(
            Payment, id=payment_id, cart__customer=request.user)
        
        print(f"=== Checking payment {payment.id} ===")
        print(f"Payment status: {payment.payment_status}")
        print(f"Cart ID: {payment.cart.id}")
        print(f"Bookings in cart: {payment.cart.bookings.count()}")
        
        # Если платеж уже успешен
        if payment.payment_status == 'success':
            # Проверяем, созданы ли билеты
            if payment.tickets.count() == 0:
                print(f"Creating tickets for existing successful payment {payment.id}")
                self._create_tickets_from_bookings(payment)
            
            return Response({
                "payment_status": "success",
                "payment_id": payment.id,
                "tickets_count": payment.tickets.count()
            })
        
        # Проверяем есть ли yookassa_payment_id
        if not payment.yookassa_payment_id:
            return Response({
                "payment_status": payment.payment_status,
                "payment_id": payment.id,
                "error": "No YooKassa payment ID"
            })
        
        # Запрашиваем статус у YooKassa
        try:
            import requests
            import base64
            from django.conf import settings
            from django.utils import timezone
            
            # Подготовка авторизации
            auth_string = f"{settings.YOOKASSA_SHOP_ID}:{settings.YOOKASSA_SECRET_KEY}"
            encoded_auth = base64.b64encode(auth_string.encode()).decode()
            
            headers = {
                'Authorization': f'Basic {encoded_auth}',
                'Content-Type': 'application/json',
            }
            
            # Получаем статус платежа
            get_url = f"https://api.yookassa.ru/v3/payments/{payment.yookassa_payment_id}"
            response = requests.get(get_url, headers=headers)
            
            if response.status_code == 200:
                yoo_data = response.json()
                status = yoo_data.get('status')
                paid = yoo_data.get('paid', False)
                
                print(f"Yookassa status: {status}, paid: {paid}")
                
                # Если платеж ожидает подтверждения
                if status == 'waiting_for_capture':
                    print(f"Payment {payment.id} is waiting for capture, confirming...")
                    
                    capture_url = f"https://api.yookassa.ru/v3/payments/{payment.yookassa_payment_id}/capture"
                    capture_response = requests.post(capture_url, headers=headers, json={})
                    
                    if capture_response.status_code == 200:
                        capture_data = capture_response.json()
                        status = capture_data.get('status')
                        paid = capture_data.get('paid', False)
                        print(f"Payment captured. New status: {status}")
                    else:
                        print(f"Error capturing payment: {capture_response.text}")
                
                # Обрабатываем успешный платеж
                if status == 'succeeded' or paid:
                    print(f"Payment {payment.id} succeeded, processing...")
                    
                    # Обновляем статус платежа
                    payment.payment_status = 'success'
                    payment.save()
                    
                    # Обновляем статус корзины
                    if payment.cart:
                        payment.cart.status = 'paid'  # Меняем на 'paid'
                        payment.cart.save()
                        print(f"Cart {payment.cart.id} status updated to 'paid'")
                    
                    # Создаем билеты из бронирований
                    self._create_tickets_from_bookings(payment)
                    
                    print(f"Payment {payment.id} processed successfully")
                    
                elif status == 'canceled':
                    print(f"Payment {payment.id} was canceled")
                    payment.payment_status = 'failed'
                    payment.save()
                    if payment.cart:
                        payment.cart.status = 'cancelled'
                        payment.cart.save()
            else:
                print(f"Error getting payment: {response.status_code} - {response.text}")
                
        except Exception as e:
            print(f"Error checking YooKassa payment {payment.id}: {e}")
            import traceback
            traceback.print_exc()
        
        # Возвращаем актуальный статус
        return Response({
            "payment_id": payment.id,
            "payment_status": payment.payment_status,
            "amount": str(payment.amount),
            "tickets_count": payment.tickets.count(),
            "bookings_count": payment.cart.bookings.count()
        })
    
    def _create_tickets_from_bookings(self, payment):
        """Создает билеты из бронирований корзины"""
        print(f"=== Creating tickets from bookings for payment {payment.id} ===")
        
        bookings = payment.cart.bookings.all()
        print(f"Found {bookings.count()} bookings in cart")
        
        tickets_created = 0
        for booking in bookings:
            # Проверяем, не создан ли уже билет для этого бронирования
            existing_ticket = Ticket.objects.filter(booking=booking).first()
            
            if existing_ticket:
                print(f"Ticket already exists for booking {booking.id}")
                continue
            
            # Создаем билет
            ticket = Ticket.objects.create(
                payment=payment,
                booking=booking,
                status='active'
            )
            
            # Генерируем QR-код
            ticket.generate_qr_code()
            
            tickets_created += 1
            print(f"Created ticket {ticket.id} for booking {booking.id} (Seat: {booking.seat.seat_number}, Session: {booking.session.id})")
        
        print(f"Total tickets created: {tickets_created}")
        

        
class MyTicketsView(generics.GenericAPIView):
    """View для получения билетов пользователя"""
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


class TestPaymentView(generics.GenericAPIView):
    """Тестовый эндпоинт для отладки платежей"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        cart = Cart.objects.filter(customer=request.user, status='active').first()
        if not cart:
            return Response({"error": "No active cart"}, status=400)
        
        # Создаем тестовый платеж
        payment = Payment.objects.create(
            cart=cart,
            payment_status='pending',
            amount=cart.total_price
        )
        
        return Response({
            "payment_id": payment.id,
            "test_mode": True,
            "message": "Test payment created. Use this ID for testing."
        })