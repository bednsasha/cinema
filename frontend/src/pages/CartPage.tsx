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
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null);

  useEffect(() => {
    if (!authAPI.isAuthenticated()) {
      localStorage.setItem('redirectAfterLogin', '/cart');
      navigate('/login');
      return;
    }
    loadCart();
  }, []);

  const showNotification = (message: string, type: 'success' | 'error' = 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

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
      window.dispatchEvent(new Event('cartUpdated'));
      showNotification('Место удалено из корзины', 'success');
    } catch (error) {
      showNotification('Не удалось удалить место', 'error');
    }
  };

  const handleClearCart = async () => {
    if (confirm('Вы уверены, что хотите очистить корзину?')) {
      try {
        await cartAPI.clearCart();
        await loadCart();
        window.dispatchEvent(new Event('cartUpdated'));
        showNotification('Корзина очищена', 'success');
      } catch (error) {
        showNotification('Не удалось очистить корзину', 'error');
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
        localStorage.setItem('last_payment_id', data.payment_id);
        window.location.href = data.payment_url;
      } else {
        showNotification(data.error || 'Ошибка создания платежа', 'error');
      }
    } catch (error) {
      showNotification('Ошибка при создании платежа', 'error');
    } finally {
      setCreatingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  if (!cart || cart.total_items === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-20">
        <div className="container mx-auto px-6 text-center">
          <div className="bg-gray-800 rounded-xl p-12 max-w-md mx-auto">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6M17 13l1.5 6" />
</svg>
            <h1 className="text-2xl font-bold text-white mb-4">Корзина пуста</h1>
            <p className="text-gray-400 mb-6">Добавьте билеты из расписания</p>
            <Link
              to="/schedule"
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg font-semibold text-white hover:opacity-90 transition"
            >
              Выбрать билеты
            </Link>
          </div>
        </div>
      </div>
    );
  }

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

  const total = cart.total_price;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12">
      <div className="container mx-auto px-6">
        {notification && (
          <div className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg ${
            notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          } text-white animate-fade-in`}>
            {notification.message}
          </div>
        )}

        <h1 className="text-3xl font-bold text-white mb-8">Корзина</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Билеты ({cart.total_items} шт)</h2>
                <button onClick={handleClearCart} className="text-blue-400 text-sm hover:text-blue-300 transition">
                  Очистить корзину
                </button>
              </div>
              
              <div className="space-y-6">
                {Object.values(groupedBySession).map((group: any, idx: number) => (
                  <div key={idx} className="border-b border-gray-700 pb-4 last:border-0">
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold text-white">{group.film_name}</h3>
                      <div className="text-sm text-gray-400 mt-1">
                        {new Date(group.start_time).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} • 
                        {new Date(group.start_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} • 
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
                            <p className="font-bold text-blue-400">{booking.price} ₽</p>
                            <button onClick={() => handleRemoveItem(booking.id)} className="text-gray-400 hover:text-blue-400 transition">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
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
          
          <div>
            <div className="bg-gray-800 rounded-xl p-6 sticky top-24">
              <h2 className="text-xl font-bold text-white mb-4">Итого</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-400">Сумма:</span>
                  <span className="text-white">{total} ₽</span>
                </div>
                <div className="border-t border-gray-700 pt-3">
                  <div className="flex justify-between text-xl font-bold">
                    <span className="text-white">Итого:</span>
                    <span className="text-blue-500">{Math.round(total)} ₽</span>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4" defaultChecked />
                  <span className="text-sm text-gray-300">
                    Отправить билеты на email: {cart.send_to_email}
                  </span>
                </label>
              </div>
              
              <button
                onClick={handleCheckout}
                disabled={creatingPayment}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg font-semibold text-white hover:opacity-90 transition disabled:opacity-50"
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