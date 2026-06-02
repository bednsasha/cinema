from rest_framework import serializers
from .models import Cart, Booking
from showtimes.models import Session
from cinema.models import Seat
from showtimes.serializers import SessionSerializer
from cinema.serializers import SeatSerializer


class BookingSerializer(serializers.ModelSerializer):
    session_detail = SessionSerializer(source='session', read_only=True)
    seat_detail = SeatSerializer(source='seat', read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'cart', 'session', 'session_detail', 'seat', 'seat_detail',
            'price', 'created_at', 'expires_at'
        ]
        read_only_fields = ['id', 'created_at', 'expires_at']


class BookingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ['session', 'seat', 'price']

    def validate(self, data):
        session = data['session']
        seat = data['seat']

        if seat.hall != session.hall:
            raise serializers.ValidationError(
                f"Место {seat.seat_number} не принадлежит залу {session.hall.name}"
            )

        if Booking.objects.filter(session=session, seat=seat).exists():
            raise serializers.ValidationError("Это место уже забронировано")

        from payment.models import Ticket  
        if Ticket.objects.filter(booking__session=session, booking__seat=seat).exists():
            raise serializers.ValidationError("Это место уже продано")

        return data


class CartSerializer(serializers.ModelSerializer):
    bookings = BookingSerializer(many=True, read_only=True)
    customer_email = serializers.CharField(
        source='customer.email', read_only=True)

    class Meta:
        model = Cart
        fields = [
            'id', 'customer', 'customer_email', 'created_at', 'expires_at',
            'total_items', 'total_price', 'send_to_email', 'discount_percent',
            'is_discount', 'status', 'bookings'
        ]
        read_only_fields = ['id', 'created_at']


class CartDetailSerializer(serializers.ModelSerializer):
    bookings = BookingSerializer(many=True, read_only=True)

    class Meta:
        model = Cart
        fields = '__all__'


class AddToCartSerializer(serializers.Serializer):
    session_id = serializers.IntegerField()
    seat_id = serializers.IntegerField()

    def validate_session_id(self, value):
        try:
            session = Session.objects.get(id=value)
        except Session.DoesNotExist:
            raise serializers.ValidationError("Сеанс не найден")
        return value

    def validate_seat_id(self, value):
        try:
            seat = Seat.objects.get(id=value)
        except Seat.DoesNotExist:
            raise serializers.ValidationError("Место не найдено")
        return value


class ApplyDiscountSerializer(serializers.Serializer):
    is_discount = serializers.BooleanField()
    discount_percent = serializers.DecimalField(
        max_digits=5, decimal_places=2, required=False)

    def validate_discount_percent(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError(
                "Скидка должна быть от 0 до 100%")
        return value
