from django.db import models
from cart.models import Cart, Booking


class Payment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Ожидает'),
        ('success', 'Успешно'),
        ('failed', 'Ошибка'),
        ('refunded', 'Возвращён'),
    ]
    
    cart = models.OneToOneField(Cart, on_delete=models.CASCADE, related_name='payment')
    payment_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Поля для YooKassa
    yookassa_payment_id = models.CharField(max_length=100, blank=True, null=True, verbose_name='ID платежа в YooKassa')
    yookassa_payment_url = models.URLField(blank=True, null=True, verbose_name='Ссылка на оплату')
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='Сумма')
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
        """Отметить платёж как успешный и создать билеты"""
        from django.utils import timezone
        from .models import Ticket
        self.payment_status = 'success'
        self.paid_at = timezone.now()
        self.save()
        
        # Создаём билеты для всех броней в корзине
        for booking in self.cart.bookings.all():
            Ticket.objects.get_or_create(
                booking=booking,
                defaults={
                    'payment': self,
                    'status': 'active'
                }
            )
        
        # Обновляем статус корзины
        self.cart.status = 'paid'
        self.cart.save()


class Ticket(models.Model):
    STATUS_CHOICES = [
        ('active', 'Активен'),
        ('refunded', 'Возвращён'),
    ]
    
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='ticket')
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='tickets')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    qr_code = models.CharField(max_length=255, unique=True, blank=True, null=True)
    
    class Meta:
        db_table = 'tickets'
        verbose_name = 'Билет'
        verbose_name_plural = 'Билеты'
    
    def __str__(self):
        return f'Билет #{self.id} - {self.booking.seat}'
    
    def generate_qr_code(self):
        """Генерация QR-кода для билета"""
        import hashlib
        import uuid
        
        # Уникальный идентификатор билета
        unique_string = f"{self.id}_{self.booking.session.id}_{self.booking.seat.id}_{self.payment.id}"
        self.qr_code = hashlib.md5(unique_string.encode()).hexdigest()
        self.save()
        return self.qr_code