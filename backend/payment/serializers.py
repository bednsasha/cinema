from rest_framework import serializers
from .models import Payment, Ticket
from cart.serializers import CartSerializer
from cart.models import Booking


class PaymentSerializer(serializers.ModelSerializer):
    cart_detail = CartSerializer(source='cart', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'cart', 'cart_detail', 'payment_status',
            'yookassa_payment_url', 'amount', 'created_at', 'paid_at'
        ]
        read_only_fields = ['id', 'created_at', 'paid_at']


class PaymentCreateSerializer(serializers.Serializer):
    success_url = serializers.URLField(required=False)
    cancel_url = serializers.URLField(required=False)


class TicketSerializer(serializers.ModelSerializer):
    session_time = serializers.DateTimeField(source='booking.session.start_time', read_only=True)
    film_name = serializers.CharField(source='booking.session.rental.film.name', read_only=True)
    hall_name = serializers.CharField(source='booking.seat.hall.name', read_only=True)
    row_number = serializers.IntegerField(source='booking.seat.row_number', read_only=True)
    seat_number = serializers.IntegerField(source='booking.seat.seat_number', read_only=True)
    
    class Meta:
        model = Ticket
        fields = [
            'id', 'qr_code', 'status', 'session_time', 'film_name',
            'hall_name', 'row_number', 'seat_number'
        ]

