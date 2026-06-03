// src/pages/CartPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { cartAPI, authAPI } from '../services/api';

const API_URL = 'http://127.0.0.1:8000/api';

interface SeatDetail {
  id: number;
  row_number: number;
  seat_number: number;
  seat_type_detail: {
    id: number;
    name: string;
    display_name: string;
  };
}

interface Booking {
  id: number;
  session: number;
  seat: number;
  price: number;
  session_detail: {
    id: number;
    film_name: string;
    hall_name: string;
    screen_type_name: string;
    start_time: string;
  };
  seat_detail: SeatDetail;
}

interface Cart {
  id: number;
  total_items: number;
  total_price: number;
  is_discount: boolean;
  discount_percent: number;
  send_to_email: string;
  status: string;
  expires_at: string;
  bookings: Booking[];
}

export default function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [discountCode, setDiscountCode] = useState('');
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [creatingPayment, setCreatingPayment] = useState(false);

  useEffect(() => {
    // Проверяем авторизацию
    if (!authAPI.isAuthenticated()) {
      localStorage.setItem('redirectAfterLogin', '/cart');
      navigate('/login');
      return;
    }
    
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      const response = await cartAPI.getCart();
      setCart(response.data);
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (bookingId: number) => {
    try {
      await cartAPI.removeFromCart(bookingId);
      await loadCart();
    } catch (error) {
      console.error('Error removing item:', error);
      alert('Не удалось удалить место');
    }
  };

  const handleApplyDiscount = async () => {
    if (!discountCode) return;
    
    setApplyingDiscount(true);
    try {
      await cartAPI.applyDiscount(true, 10);
      await loadCart();
      setDiscountCode('');
    } catch (error) {
      console.error('Error applying discount:', error);
      alert('Не удалось применить скидку');
    } finally {
      setApplyingDiscount(false);
    }
  };

  const handleRemoveDiscount = async () => {
    setApplyingDiscount(true);
    try {
      await cartAPI.applyDiscount(false);
      await loadCart();
    } catch (error) {
      console.error('Error removing discount:', error);
    } finally {
      setApplyingDiscount(false);
    }
  };

  const handleClearCart = async () => {
    if (confirm('Вы уверены, что хотите очистить корзину?')) {
      try {
        await cartAPI.clearCart();
        await loadCart();
      } catch (error) {
        console.error('Error clearing cart:', error);
        alert('Не удалось очистить корзину');
      }
    }
  };

  const handleCheckout = async () => {
  setCreatingPayment(true);
  try {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_URL}/payment/create/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        success_url: `${window.location.origin}/payment/success`,
        cancel_url: `${window.location.origin}/cart`
      })
    });

    const data = await response.json();
    
    if (response.ok && data.payment_url) {
      // Сохраняем payment_id в localStorage
      localStorage.setItem('last_payment_id', data.payment_id);
      window.location.href = data.payment_url;
    } else {
      alert(data.error || 'Ошибка создания платежа');
    }
  } catch (error) {
    console.error('Payment error:', error);
    alert('Ошибка при создании платежа');
  } finally {
    setCreatingPayment(false);
  }
};
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-500"></div>
      </div>
    );
  }

  if (!cart || cart.total_items === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-20">
        <div className="container mx-auto px-6 text-center">
          <div className="bg-gray-800 rounded-xl p-12 max-w-md mx-auto">
            <div className="text-6xl mb-4">🛒</div>
            <h1 className="text-2xl font-bold text-white mb-4">Корзина пуста</h1>
            <p className="text-gray-400 mb-6">Добавьте билеты из расписания</p>
            <Link
              to="/schedule"
              className="inline-block px-6 py-3 bg-gradient-to-r from-red-500 to-purple-600 rounded-lg font-semibold text-white hover:opacity-90 transition"
            >
              Выбрать билеты
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Группируем билеты по сеансам
  const groupedBySession = cart.bookings.reduce((acc, booking) => {
    const sessionKey = booking.session_detail.film_name;
    if (!acc[sessionKey]) {
      acc[sessionKey] = {
        film_name: booking.session_detail.film_name,
        hall_name: booking.session_detail.hall_name,
        screen_type: booking.session_detail.screen_type_name,
        start_time: booking.session_detail.start_time,
        bookings: []
      };
    }
    acc[sessionKey].bookings.push(booking);
    return acc;
  }, {} as Record<string, any>);

  const subtotal = cart.total_price;
  const discountAmount = cart.is_discount ? (subtotal * cart.discount_percent / 100) : 0;
  const total = subtotal - discountAmount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12">
      <div className="container mx-auto px-6">
        <h1 className="text-3xl font-bold text-white mb-8">Корзина</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Список билетов */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">
                  Билеты ({cart.total_items} шт)
                </h2>
                <button
                  onClick={handleClearCart}
                  className="text-red-400 text-sm hover:text-red-300 transition"
                >
                  Очистить корзину
                </button>
              </div>
              
              <div className="space-y-6">
                {Object.values(groupedBySession).map((group: any, idx: number) => (
                  <div key={idx} className="border-b border-gray-700 pb-4 last:border-0">
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold text-white">{group.film_name}</h3>
                      <div className="text-sm text-gray-400 mt-1">
                        {new Date(group.start_time).toLocaleDateString('ru-RU', {
                          day: 'numeric', month: 'long'
                        })} • 
                        {new Date(group.start_time).toLocaleTimeString('ru-RU', {
                          hour: '2-digit', minute: '2-digit'
                        })} • 
                        {group.hall_name} • {group.screen_type}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {group.bookings.map((booking: Booking) => (
                        <div key={booking.id} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                          <div>
                            <p className="font-medium text-white">
                              Ряд {booking.seat_detail.row_number}, Место {booking.seat_detail.seat_number}
                            </p>
                            <p className="text-sm text-gray-400">
                              {booking.seat_detail.seat_type_detail?.display_name || 'Обычное'}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className="font-bold text-red-400">{booking.price} ₽</p>
                            <button
                              onClick={() => handleRemoveItem(booking.id)}
                              className="text-gray-400 hover:text-red-400 transition"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Итоговая информация */}
          <div>
            <div className="bg-gray-800 rounded-xl p-6 sticky top-24">
              <h2 className="text-xl font-bold text-white mb-4">Итого</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-400">Сумма:</span>
                  <span className="text-white">{subtotal} ₽</span>
                </div>
                
                {cart.is_discount && (
                  <div className="flex justify-between text-green-400">
                    <span>Скидка {cart.discount_percent}%:</span>
                    <span>- {Math.round(discountAmount)} ₽</span>
                  </div>
                )}
                
                <div className="border-t border-gray-700 pt-3">
                  <div className="flex justify-between text-xl font-bold">
                    <span className="text-white">Итого:</span>
                    <span className="text-red-500">{Math.round(total)} ₽</span>
                  </div>
                </div>
              </div>
              
              {/* Промокод */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Промокод
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    placeholder="Введите код"
                    className="flex-1 px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
                  />
                  <button
                    onClick={handleApplyDiscount}
                    disabled={applyingDiscount}
                    className="px-4 py-2 bg-purple-600 rounded-lg font-semibold text-white hover:bg-purple-700 transition disabled:opacity-50 whitespace-nowrap"
                  >
                    {applyingDiscount ? '...' : 'Применить'}
                  </button>
                </div>
                {cart.is_discount && (
                  <button
                    onClick={handleRemoveDiscount}
                    className="text-sm text-red-400 mt-2 hover:text-red-300"
                  >
                    Удалить скидку
                  </button>
                )}
              </div>
              
              {/* Информация о рассылке */}
              <div className="mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4"
                    defaultChecked
                  />
                  <span className="text-sm text-gray-300">
                    Отправить билеты на email: {cart.send_to_email}
                  </span>
                </label>
              </div>
              
              {/* Кнопка оплаты */}
              <button
                onClick={handleCheckout}
                disabled={creatingPayment}
                className="w-full py-3 bg-gradient-to-r from-red-500 to-purple-600 rounded-lg font-semibold text-white hover:opacity-90 transition disabled:opacity-50"
              >
                {creatingPayment ? 'Создание платежа...' : 'Перейти к оплате →'}
              </button>
              
              <p className="text-xs text-gray-500 text-center mt-4">
                Время бронирования: до {new Date(cart.expires_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}