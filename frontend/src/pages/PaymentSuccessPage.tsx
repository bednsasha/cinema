// src/pages/PaymentSuccessPage.tsx
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import QRCode from 'react-qr-code';

const API_URL = 'http://127.0.0.1:8000/api';

interface Ticket {
  id: number;
  qr_code: string;
  status: string;
  price: string;
  session_time: string;
  film_name: string;
  hall_name: string;
  row_number: number;
  seat_number: number;
}

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState('');
  const checkCount = useRef(0);
  const maxChecks = 10; 

  useEffect(() => {
    if (!authAPI.isAuthenticated()) {
      navigate('/login');
      return;
    }
    
    checkPaymentAndLoadTickets();
  }, []);

  const checkPaymentAndLoadTickets = async () => {
    const paymentId = localStorage.getItem('last_payment_id');
    
    if (paymentId) {
      await checkPaymentStatus(paymentId);
    } else {
      await loadTickets();
    }
  };

  const checkPaymentStatus = async (paymentId: string): Promise<void> => {
    try {
      const token = localStorage.getItem('access_token');
      console.log(`Checking payment status (attempt ${checkCount.current + 1}/${maxChecks}):`, paymentId);
      
      const response = await fetch(`${API_URL}/payment/check-status/${paymentId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Payment status:', data.payment_status);
        
        if (data.payment_status === 'success') {
          localStorage.removeItem('last_payment_id');
          await loadTickets();
        } else if (data.payment_status === 'pending' && checkCount.current < maxChecks) {
          checkCount.current++;
          setTimeout(() => checkPaymentStatus(paymentId), 3000);
        } else if (data.payment_status === 'pending' && checkCount.current >= maxChecks) {
          setError('Платеж долго обрабатывается. Пожалуйста, проверьте позже в личном кабинете.');
          setLoading(false);
        } else {
          setError('Платеж не подтвержден');
          setLoading(false);
        }
      } else {
        setError('Не удалось проверить статус платежа');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking payment:', error);
      setError('Ошибка при проверке платежа');
      setLoading(false);
    }
  };

  const loadTickets = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/payment/my-tickets/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      console.log('Loaded all tickets:', data);
      
      // Фильтруем только активные билеты (которые не просрочены и статус active)
      const now = new Date();
      const activeTickets = data.filter((ticket: Ticket) => {
        const sessionDate = new Date(ticket.session_time);
        return ticket.status === 'active' && sessionDate > now;
      });
      
      setAllTickets(activeTickets);
      setLoading(false);
      
      if (activeTickets.length === 0) {
        setError('Активные билеты не найдены. Возможно, платеж обрабатывается.');
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
      setError('Ошибка загрузки билетов');
      setLoading(false);
    }
  };

  // Формируем данные для QR-кода
  const getQRData = (ticket: Ticket) => {
    return JSON.stringify({
      ticket_id: ticket.id,
      film: ticket.film_name,
      date: new Date(ticket.session_time).toLocaleString('ru-RU'),
      hall: ticket.hall_name,
      row: ticket.row_number,
      seat: ticket.seat_number,
      price: ticket.price
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Проверка статуса платежа...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-20">
        <div className="container mx-auto px-6 max-w-2xl">
          <div className="bg-yellow-900/30 border border-yellow-500 rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-3xl font-bold text-white mb-2">Требуется проверка</h1>
            <p className="text-gray-300 mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg font-semibold text-white"
            >
              На главную
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (allTickets.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-20">
        <div className="container mx-auto px-6 max-w-2xl">
          <div className="bg-yellow-900/30 border border-yellow-500 rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">🎫</div>
            <h1 className="text-3xl font-bold text-white mb-2">Нет активных билетов</h1>
            <p className="text-gray-300 mb-6">
              У вас нет активных билетов на данный момент.
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg font-semibold text-white"
            >
              На главную
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-20">
      <div className="container mx-auto px-6 max-w-2xl">
        <div className="bg-green-900/30 border border-green-500 rounded-xl p-8 text-center mb-8">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold text-white mb-2">Оплата прошла успешно!</h1>
          <p className="text-gray-300">Ваши активные билеты готовы.</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Ваши билеты ({allTickets.length})</h2>
          <div className="space-y-4">
            {allTickets.map((ticket) => (
              <div key={ticket.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-lg">{ticket.film_name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-400 mt-2">
                      <p>📅 {new Date(ticket.session_time).toLocaleDateString('ru-RU', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}</p>
                      <p>⏰ {new Date(ticket.session_time).toLocaleTimeString('ru-RU', {
                        hour: '2-digit', minute: '2-digit'
                      })}</p>
                      <p>🏠 {ticket.hall_name}</p>
                      <p>💺 Ряд {ticket.row_number}, Место {ticket.seat_number}</p>
                      <p className="text-yellow-500 font-semibold">💰 {Number(ticket.price).toFixed(2)} ₽</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <QRCode 
                      value={getQRData(ticket)}
                      size={96}
                      bgColor="#ffffff"
                      fgColor="#000000"
                      level="H"
                    />
                    <p className="text-xs text-gray-500 mt-1">QR код билета</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={() => navigate('/profile')}
            className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg font-semibold text-white hover:opacity-90 transition"
          >
            Все мои билеты
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 py-3 bg-gray-700 rounded-lg font-semibold text-white hover:bg-gray-600 transition"
          >
            На главную
          </button>
        </div>
      </div>
    </div>
  );
}