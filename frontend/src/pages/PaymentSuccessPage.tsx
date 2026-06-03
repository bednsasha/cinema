// src/pages/PaymentSuccessPage.tsx
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const API_URL = 'http://127.0.0.1:8000/api';

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);
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
          // Платеж успешен
          localStorage.removeItem('last_payment_id');
          await loadTickets();
        } else if (data.payment_status === 'pending' && checkCount.current < maxChecks) {
          // Платеж еще обрабатывается, ждем и пробуем снова
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
      setTickets(data);
      setLoading(false);
      
      if (data.length === 0) {
        setError('Билеты еще не созданы. Возможно, платеж обрабатывается.');
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
      setError('Ошибка загрузки билетов');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-500 mx-auto mb-4"></div>
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
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-purple-600 rounded-lg font-semibold text-white"
            >
              На главную
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-20">
        <div className="container mx-auto px-6 max-w-2xl">
          <div className="bg-yellow-900/30 border border-yellow-500 rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">🔄</div>
            <h1 className="text-3xl font-bold text-white mb-2">Платеж обрабатывается</h1>
            <p className="text-gray-300 mb-6">
              Ваш платеж успешно прошел, но билеты еще формируются. 
              Это может занять несколько минут. Пожалуйста, проверьте позже.
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-purple-600 rounded-lg font-semibold text-white"
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
          <p className="text-gray-300">Ваши билеты готовы. Они отправлены на вашу почту.</p>
        </div>

        {tickets.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Ваши билеты</h2>
            <div className="space-y-3">
              {tickets.map((ticket: any) => (
                <div key={ticket.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-white">{ticket.booking?.session?.rental?.film?.name || ticket.booking?.session?.film_name}</p>
                      <p className="text-sm text-gray-400">
                        {ticket.booking?.session?.hall_name || ticket.booking?.session?.hall?.name} • 
                        {new Date(ticket.booking?.session?.start_time).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-400">
                        Ряд {ticket.booking?.seat?.row_number}, Место {ticket.booking?.seat?.seat_number}
                      </p>
                      <p className="text-sm text-red-400 mt-1">
                        {ticket.price} ₽
                      </p>
                    </div>
                    {ticket.qr_code && (
                      <img src={ticket.qr_code} alt="QR Code" className="w-16 h-16" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4 mt-6">
          <button
            onClick={() => navigate('/')}
            className="flex-1 py-3 bg-gradient-to-r from-red-500 to-purple-600 rounded-lg font-semibold text-white hover:opacity-90 transition"
          >
            На главную
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 py-3 bg-gray-700 rounded-lg font-semibold text-white hover:bg-gray-600 transition"
          >
            Распечатать
          </button>
        </div>
      </div>
    </div>
  );
}