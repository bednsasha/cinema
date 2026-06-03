from django.db import models
from users.models import Customer
from showtimes.models import Session
from cinema.models import Seat

class Cart(models.Model):
    STATUS_CHOICES = [
        ('active', 'Активна'),
        ('paid', 'Оплачена'),
        ('cancelled', 'Отменена'),
        ('expired', 'Просрочена'),
    ]
    
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='carts')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    total_items = models.IntegerField(default=0)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    send_to_email = models.EmailField(blank=True, null=True)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    is_discount = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    def get_items(self):
        """Получить все элементы корзины (бронирования)"""
        return self.bookings.all()
    
    @property
    def items_count(self):
        return self.bookings.count()
    class Meta:
        db_table = 'carts'
        verbose_name = 'Корзина'
        verbose_name_plural = 'Корзины'
        ordering = ['-created_at']
    
    def __str__(self):
        return f'Корзина #{self.id} - {self.customer.email}'

class Booking(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='bookings')
    session = models.ForeignKey(Session, on_delete=models.CASCADE)
    seat = models.ForeignKey(Seat, on_delete=models.CASCADE)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    
    class Meta:
        db_table = 'bookings'
        verbose_name = 'Бронь'
        verbose_name_plural = 'Брони'
        unique_together = (('session', 'seat'),)
    
    def __str__(self):
        return f'Бронь #{self.id} - {self.seat}'
