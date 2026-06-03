# payment/models.py
from django.db import models
from cart.models import Cart, Booking
from django.utils import timezone


class Payment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Ожидает'),
        ('success', 'Успешно'),
        ('failed', 'Ошибка'),
        ('refunded', 'Возвращён'),
    ]

    cart = models.OneToOneField(
        Cart, on_delete=models.CASCADE, related_name='payment')
    payment_status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='pending')

    # Поля для YooKassa
    yookassa_payment_id = models.CharField(
        max_length=100, blank=True, null=True, verbose_name='ID платежа в YooKassa')
    yookassa_payment_url = models.URLField(
        blank=True, null=True, verbose_name='Ссылка на оплату')
    amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=0, verbose_name='Сумма')
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'payments'
        verbose_name = 'Платёж'
        verbose_name_plural = 'Платежи'
        ordering = ['-created_at']

    def __str__(self):
        return f'Платёж #{self.id} - {self.payment_status}'

    def mark_as_success(self):
        """Отметить платеж как успешный и создать билеты"""
        self.payment_status = 'success'
        self.yookassa_status = 'succeeded'
        self.paid_at = timezone.now()
        self.save()

        # Создаем билеты для каждой брони в корзине
        for booking in self.cart.bookings.all():
            Ticket.objects.get_or_create(
                booking=booking,
                defaults={
                    'payment': self,
                    'price': booking.price,
                    'status': 'active'
                }
            )

        # Очищаем корзину - удаляем все брони
        bookings_deleted = self.cart.bookings.all().delete()
        print(f"Deleted {bookings_deleted} bookings from cart {self.cart.id}")

        # Обновляем статус и итоги корзины
        self.cart.status = 'paid'
        self.cart.total_items = 0
        self.cart.total_price = 0
        self.cart.save()

        print(f"Cart {self.cart.id} cleaned and marked as paid")


class Ticket(models.Model):
    STATUS_CHOICES = [
        ('active', 'Активен'),
        ('refunded', 'Возвращён'),
    ]

    booking = models.OneToOneField(
        Booking, on_delete=models.CASCADE, related_name='ticket')
    payment = models.ForeignKey(
        Payment, on_delete=models.CASCADE, related_name='tickets')
    price = models.DecimalField(
        max_digits=10, decimal_places=2, default=0, verbose_name='Цена билета')
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='active')
    qr_code = models.CharField(
        max_length=255, unique=True, blank=True, null=True)

    class Meta:
        db_table = 'tickets'
        verbose_name = 'Билет'
        verbose_name_plural = 'Билеты'

    def __str__(self):
        return f'Билет #{self.id} - {self.booking.seat}'

    def generate_qr_code(self):
        # Ваша логика генерации QR-кода
        import qrcode
        from io import BytesIO
        from django.core.files import File
        
        # Создаем данные для QR-кода
        qr_data = f"Ticket ID: {self.id}\nBooking ID: {self.booking.id}\nSeat: {self.booking.seat.seat_number}\nSession: {self.booking.session.id}"
        
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(qr_data)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Сохраняем в поле ImageField
        buffer = BytesIO()
        img.save(buffer, 'PNG')
        buffer.seek(0)
        
        filename = f"ticket_{self.id}_{self.booking.id}.png"
        self.qr_code.save(filename, File(buffer), save=False)
        self.save()
