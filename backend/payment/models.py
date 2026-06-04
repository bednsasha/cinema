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

    # payment/models.py - исправленный mark_as_success

    def mark_as_success(self):
        """Отметить платеж как успешный и создать билеты"""
        self.payment_status = 'success'
        self.paid_at = timezone.now()
        self.save()

        print(f"\n=== PROCESSING PAYMENT {self.id} ===")
        print(f"Cart ID: {self.cart.id}")
        print(f"Bookings count: {self.cart.bookings.count()}")
        
        for booking in self.cart.bookings.all():
            print(f"\n--- Booking {booking.id} ---")
            print(f"  Price from booking: {booking.price}")
            
            from .models import Ticket
            ticket, created = Ticket.objects.get_or_create(
                booking=booking,
                defaults={
                    'payment': self,
                    'price': booking.price,  # ← Берем цену из booking
                    'status': 'active'
                }
            )
            print(f"  Ticket created: {created}")
            print(f"  Ticket price after create: {ticket.price}")
            
            if created:
                ticket.generate_qr_code()
                print(f"  QR code generated: {ticket.qr_code}")
            else:
                # Если билет уже существует, обновим его цену
                if ticket.price != booking.price:
                    ticket.price = booking.price
                    ticket.save()
                    print(f"  Updated ticket price to {ticket.price}")
        
        # Очищаем корзину
        bookings_deleted = self.cart.bookings.all().delete()
        print(f"\nDeleted {bookings_deleted} bookings")
        
        self.cart.status = 'paid'
        self.cart.total_items = 0
        self.cart.total_price = 0
        self.cart.save()
        
        print(f"Cart {self.cart.id} marked as paid\n")
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

    # payment/models.py - исправленный generate_qr_code

    def generate_qr_code(self):
        """Генерация QR-кода для билета"""
        import qrcode
        from io import BytesIO
        from django.core.files.base import ContentFile
        import hashlib
        
        # Создаем данные для QR-кода
        qr_data = f"""
        Билет #{self.id}
        Фильм: {self.booking.session.rental.film.name}
        Дата: {self.booking.session.start_time.strftime('%d.%m.%Y %H:%M')}
        Зал: {self.booking.session.hall.name}
        Ряд: {self.booking.seat.row_number}
        Место: {self.booking.seat.seat_number}
        """
        
        # Генерируем QR-код
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(qr_data.strip())
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Сохраняем в базу как строку (не как файл)
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        import base64
        qr_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        # Сохраняем как base64 строку в поле qr_code
        self.qr_code = f"data:image/png;base64,{qr_base64}"
        self.save()
        
        return self.qr_code