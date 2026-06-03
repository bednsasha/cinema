from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from rest_framework.decorators import action
from django.db import models
from .models import Cart, Booking
from .serializers import (
    CartSerializer, CartDetailSerializer,
    AddToCartSerializer, ApplyDiscountSerializer
)
from showtimes.utils import calculate_ticket_price


class CartViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Cart.objects.filter(customer=self.request.user).prefetch_related('bookings__session', 'bookings__seat')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CartDetailSerializer
        return CartSerializer

    # cart/views.py - исправленный метод

    def get_or_create_active_cart(self):
        cart = Cart.objects.filter(
            customer=self.request.user,
            status='active'
        ).first()

        if not cart:
            cart = Cart.objects.create(
                customer=self.request.user,
                expires_at=timezone.now() + timedelta(minutes=30),
                send_to_email=self.request.user.email,  # Добавь это поле
                total_items=0,
                total_price=0
            )
        return cart

    def list(self, request, *args, **kwargs):
        cart = self.get_or_create_active_cart()
        serializer = self.get_serializer(cart)
        return Response(serializer.data)

    # cart/views.py - полностью переделанный add_to_cart

    @action(
        detail=False,
        methods=['post'],
        url_path='add'
    )
    def add_to_cart(self, request):
        print("=== ADD TO CART ===")
        print("Request user:", request.user)
        print("Request data:", request.data)
        
        session_id = request.data.get('session_id')
        seat_id = request.data.get('seat_id')
        
        if not session_id or not seat_id:
            return Response(
                {"error": "session_id и seat_id обязательны"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from showtimes.models import Session
            from cinema.models import Seat
            
            session = Session.objects.get(id=int(session_id))
            seat = Seat.objects.get(id=int(seat_id))
        except Session.DoesNotExist:
            return Response(
                {"error": "Сеанс не найден"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Seat.DoesNotExist:
            return Response(
                {"error": "Место не найдено"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Проверка, что место принадлежит залу сеанса
        if seat.hall != session.hall:
            return Response(
                {"error": f"Место {seat.seat_number} не принадлежит залу {session.hall.name}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Проверка, что место свободно
        from .models import Booking
        if Booking.objects.filter(session=session, seat=seat).exists():
            return Response(
                {"error": "Это место уже забронировано"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Проверка, что место не продано
        try:
            from payments.models import Ticket
            if Ticket.objects.filter(booking__session=session, booking__seat=seat).exists():
                return Response(
                    {"error": "Это место уже продано"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except ImportError:
            pass  # Если модель Ticket еще не создана
        
        # Получаем или создаём корзину
        cart = self.get_or_create_active_cart()
        print("Cart created/found:", cart.id)
        
        # Рассчитываем цену (временно фиксированная)
        price = 300
        
        # Создаём бронь
        from django.utils import timezone
        from datetime import timedelta
        
        booking = Booking.objects.create(
            cart=cart,
            session=session,
            seat=seat,
            price=price,
            expires_at=timezone.now() + timedelta(minutes=15)
        )
        # ПРОВЕРКА: Сеанс не должен быть завершен
        if session.is_past:
            return Response(
                {"error": "Нельзя купить билет на завершенный сеанс"},
                status=status.HTTP_400_BAD_REQUEST
            )
    
        # Обновляем итоги корзины
        from django.db import models
        cart.total_items = cart.bookings.count()
        cart.total_price = cart.bookings.aggregate(total=models.Sum('price'))['total'] or 0
        cart.save()
        
        return Response(
            {"message": "Место добавлено в корзину", "booking_id": booking.id},
            status=status.HTTP_201_CREATED
        )
    @action(
        detail=False,
        methods=['delete'],
        url_path='remove/(?P<booking_id>[^/.]+)'
    )
    def remove_from_cart(self, request, booking_id=None):
        cart = self.get_or_create_active_cart()

        try:
            booking = cart.bookings.get(id=booking_id)
        except Booking.DoesNotExist:
            return Response(
                {"error": "Бронь не найдена"},
                status=status.HTTP_404_NOT_FOUND
            )

        booking.delete()

        cart.total_items = cart.bookings.count()
        cart.total_price = cart.bookings.aggregate(total=models.Sum('price'))['total'] or 0
        cart.save()

        return Response(
            {"message": "Место удалено из корзины"},
            status=status.HTTP_200_OK
        )

    @action(
        detail=False,
        methods=['post'],
        url_path='apply-discount',
        serializer_class=ApplyDiscountSerializer
    )
    def apply_discount(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cart = self.get_or_create_active_cart()
        cart.is_discount = serializer.validated_data['is_discount']

        if cart.is_discount:
            cart.discount_percent = serializer.validated_data.get('discount_percent', 10)

        subtotal = cart.bookings.aggregate(total=models.Sum('price'))['total'] or 0
        if cart.is_discount:
            cart.total_price = subtotal * (100 - cart.discount_percent) / 100
        else:
            cart.total_price = subtotal

        cart.save()

        return Response(
            {
                "message": "Скидка применена" if cart.is_discount else "Скидка отменена",
                "total_price": cart.total_price,
                "discount_percent": cart.discount_percent
            },
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['post'], url_path='clear')
    def clear_cart(self, request):
        cart = self.get_or_create_active_cart()
        cart.bookings.all().delete()
        cart.total_items = 0
        cart.total_price = 0
        cart.save()

        return Response(
            {"message": "Корзина очищена"},
            status=status.HTTP_200_OK
        )