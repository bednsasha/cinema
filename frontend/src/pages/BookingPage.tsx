import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sessionAPI, hallAPI, cartAPI, authAPI } from '../services/api';
import type { Session, Seat, SeatWithStatus, Cart, CartBooking } from '../types';
export default function BookingPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  
  const [session, setSession] = useState<Session | null>(null);
  const [seats, setSeats] = useState<SeatWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Cart | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null);

  useEffect(() => {
    if (sessionId) {
      loadSessionData();
    }
  }, [sessionId]);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadSessionData = async () => {
    try {
      setLoading(true);
      
      const hasToken = authAPI.isAuthenticated();
      setIsAuthenticated(hasToken);
      
      const sessionRes = await sessionAPI.getById(Number(sessionId));
      const sessionData = sessionRes.data;
      setSession(sessionData);
      
      const hallId = typeof sessionData.hall === 'object' 
        ? (sessionData.hall as any).id 
        : sessionData.hall;
      
      const seatsRes = await hallAPI.getSeats(hallId);
      
      let bookedSeatIds: number[] = [];
      try {
        const bookedRes = await sessionAPI.getBookedSeats(Number(sessionId));
        bookedSeatIds = bookedRes.data.booked_seat_ids;
      } catch (error) {
        console.log('Could not fetch booked seats');
      }
      
      let cartData: Cart | null = null;
      let cartSeatIds: number[] = [];
      
      if (hasToken) {
        try {
          const cartRes = await cartAPI.getCart();
          cartData = cartRes.data;
          cartSeatIds = cartData?.bookings?.map((booking: CartBooking) => booking.seat) || [];
          setCart(cartData);
        } catch (error: any) {
          if (error.response?.status === 401) {
            setIsAuthenticated(false);
          }
        }
      }
      
      const seatsWithStatus: SeatWithStatus[] = seatsRes.data.map((seat: Seat) => ({
        ...seat,
        isBooked: bookedSeatIds.includes(seat.id),
        isSelected: cartSeatIds.includes(seat.id),
        bookingId: cartData?.bookings?.find((booking: CartBooking) => booking.seat === seat.id)?.id
      }));
      
      setSeats(seatsWithStatus);
      
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeatClick = async (seat: SeatWithStatus) => {
    if (!authAPI.isAuthenticated()) {
      localStorage.setItem('redirectAfterLogin', window.location.pathname);
      showNotification('Для выбора мест необходимо войти в систему', 'error');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }
    
    if (seat.isBooked) {
      showNotification('Это место уже занято', 'error');
      return;
    }
    
    try {
      if (seat.isSelected) {
        if (seat.bookingId) {
          await cartAPI.removeFromCart(seat.bookingId);
        }
        
        setSeats((prev: SeatWithStatus[]) => prev.map((s: SeatWithStatus) => 
          s.id === seat.id ? { ...s, isSelected: false, bookingId: undefined } : s
        ));
        showNotification('Место удалено из корзины', 'success');
      } else {
        const response = await cartAPI.addToCart(Number(sessionId), seat.id);
        
        setSeats((prev: SeatWithStatus[]) => prev.map((s: SeatWithStatus) => 
          s.id === seat.id ? { ...s, isSelected: true, bookingId: response.data.booking_id } : s
        ));
        showNotification('Место добавлено в корзину', 'success');
      }
      
      const cartRes = await cartAPI.getCart();
      setCart(cartRes.data);
      window.dispatchEvent(new Event('cartUpdated'));
      
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string }, status?: number } };
      if (err.response?.status === 401) {
        showNotification('Сессия истекла. Пожалуйста, войдите заново', 'error');
        authAPI.clearTokens();
        setTimeout(() => navigate('/login'), 1500);
      } else {
        showNotification(err.response?.data?.error || 'Произошла ошибка', 'error');
      }
    }
  };

  const getSeatColor = (seat: SeatWithStatus): string => {
    if (seat.isBooked) return 'bg-red-800 cursor-not-allowed opacity-70';
    if (seat.isSelected) return 'bg-green-500 hover:bg-green-600 text-white';
    
    switch (seat.seat_type_detail?.name) {
      case 'vip':
        return 'bg-purple-600 hover:bg-purple-700 text-white';
      case 'sofa':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      default:
        return 'bg-gray-600 hover:bg-gray-500 text-white';
    }
  };

  const getSeatTypeLabel = (seat: SeatWithStatus): string => {
    switch (seat.seat_type_detail?.name) {
      case 'vip':
        return 'VIP';
      case 'sofa':
        return 'Диван';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 text-xl">Сеанс не найден</p>
      </div>
    );
  }

  const seatsByRow = seats.reduce<Record<number, SeatWithStatus[]>>((acc, seat) => {
    if (!acc[seat.row_number]) acc[seat.row_number] = [];
    acc[seat.row_number].push(seat);
    return acc;
  }, {});

  const sortedRows = Object.keys(seatsByRow).sort((a, b) => Number(a) - Number(b));
  const hallName = typeof session.hall === 'object' ? (session.hall as any).name : session.hall_name;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12">
      <div className="container mx-auto px-6">
        {notification && (
          <div className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg ${
            notification.type === 'success' ? 'bg-green-600' : notification.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
          } text-white animate-fade-in`}>
            {notification.message}
          </div>
        )}

        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">{session.film_name}</h1>
          <div className="flex flex-wrap gap-4 text-gray-400">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {new Date(session.start_time).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' })}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {new Date(session.start_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {hallName}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
              {session.screen_type_name}
            </span>
          </div>
        </div>

        {!isAuthenticated && (
          <div className="bg-yellow-900/50 border border-yellow-600 rounded-xl p-4 mb-6 text-center">
            <p className="text-yellow-400">Для выбора мест необходимо войти в систему</p>
            <button
              onClick={() => navigate('/login')}
              className="mt-2 px-4 py-1 bg-yellow-600 rounded-lg text-sm hover:bg-yellow-700 transition"
            >
              Войти
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Выберите места</h2>
              
              <div className="mb-8">
                <div className="w-full h-2 bg-gradient-to-r from-transparent via-yellow-500 to-transparent rounded-full mb-2" />
                <div className="text-center text-gray-400 text-sm">ЭКРАН</div>
              </div>
              
              {seats.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">Нет данных о местах в этом зале</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  {sortedRows.map((rowNum) => (
                    <div key={rowNum} className="mb-4 flex justify-center">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm w-8 font-bold">{rowNum}</span>
                        <div className="flex flex-wrap gap-2">
                          {seatsByRow[Number(rowNum)].map((seat) => (
                            <button
                              key={seat.id}
                              onClick={() => handleSeatClick(seat)}
                              disabled={seat.isBooked || !isAuthenticated}
                              className={`relative w-10 h-10 md:w-12 md:h-12 rounded-lg transition-all font-medium ${getSeatColor(seat)} ${seat.isBooked ? 'line-through opacity-60' : ''} ${!seat.isBooked && !seat.isSelected ? 'hover:scale-105' : ''} disabled:cursor-not-allowed`}
                              title={`Ряд ${seat.row_number}, Место ${seat.seat_number}${getSeatTypeLabel(seat) ? ` (${getSeatTypeLabel(seat)})` : ''}`}
                            >
                              <span className="text-xs md:text-sm font-medium">{seat.seat_number}</span>
                              {getSeatTypeLabel(seat) && (
                                <span className="absolute -top-2 -right-2 text-[8px] md:text-[10px] bg-blue-500 rounded-full px-1 text-white">
                                  {getSeatTypeLabel(seat)}
                                </span>
                              )}
                              {seat.isBooked && (
                                <span className="absolute inset-0 flex items-center justify-center text-white text-base md:text-lg">✕</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex flex-wrap justify-center gap-6 mt-8 pt-6 border-t border-gray-700">
                <div className="flex items-center gap-2"><div className="w-6 h-6 bg-gray-600 rounded" /><span className="text-sm text-gray-400">Свободно</span></div>
                <div className="flex items-center gap-2"><div className="w-6 h-6 bg-green-500 rounded" /><span className="text-sm text-gray-400">Выбрано</span></div>
                <div className="flex items-center gap-2"><div className="w-6 h-6 bg-red-800 rounded" /><span className="text-sm text-gray-400">Занято</span></div>
                <div className="flex items-center gap-2"><div className="w-6 h-6 bg-purple-600 rounded" /><span className="text-sm text-gray-400">VIP</span></div>
                <div className="flex items-center gap-2"><div className="w-6 h-6 bg-blue-600 rounded" /><span className="text-sm text-gray-400">Диван</span></div>
              </div>
            </div>
          </div>
          
          <div>
            <div className="bg-gray-800 rounded-xl p-6 sticky top-24">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Ваш заказ</h2>
                {cart && cart.total_items > 0 && (
                  <button onClick={() => setShowCart(!showCart)} className="text-blue-400 text-sm hover:text-blue-300">
                    {showCart ? 'Скрыть' : 'Показать'}
                  </button>
                )}
              </div>
              
              {!isAuthenticated ? (
                <p className="text-gray-400 text-center py-8">Войдите в систему, чтобы выбирать места</p>
              ) : !cart || cart.total_items === 0 ? (
                <p className="text-gray-400 text-center py-8">Выберите места на схеме зала</p>
              ) : (
                <div className="space-y-4">
                  {showCart && (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {cart.bookings?.map((booking) => {
                        const seat = seats.find((s) => s.id === booking.seat);
                        return (
                          <div key={booking.id} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                            <div>
                              <p className="font-medium text-white">Ряд {seat?.row_number}, Место {seat?.seat_number}</p>
                              <p className="text-sm text-gray-400">{seat?.seat_type_detail?.display_name}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <p className="font-bold text-blue-400">{booking.price} ₽</p>
                              <button onClick={() => {
                                const foundSeat = seats.find((s) => s.id === booking.seat);
                                if (foundSeat) handleSeatClick(foundSeat);
                              }} className="text-gray-400 hover:text-blue-400">🗑️</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  <div className="border-t border-gray-700 pt-4">
                    <div className="flex justify-between mb-2"><span className="text-gray-400">Билеты:</span><span className="text-white">{cart.total_items} шт</span></div>
                    {cart.is_discount && (
                      <div className="flex justify-between mb-2 text-green-400">
                        <span>Скидка {cart.discount_percent}%:</span>
                        <span>- {Math.round(cart.total_price * cart.discount_percent / 100)} ₽</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xl font-bold">
                      <span className="text-white">Итого:</span>
                      <span className="text-blue-500">{cart.total_price} ₽</span>
                    </div>
                  </div>
                  
                  <button onClick={() => { if (cart.total_items > 0) navigate('/cart'); }} className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg font-semibold text-white hover:opacity-90 transition">
                    {cart.total_items > 0 ? 'Перейти к оформлению →' : 'Выберите места'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}