import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import QRCode from 'react-qr-code';
import type { Ticket } from '../types';

const API_URL = 'http://127.0.0.1:8000/api';

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
      const response = await fetch(`${API_URL}/payment/check-status/${paymentId}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.payment_status === 'success') {
          localStorage.removeItem('last_payment_id');
          window.dispatchEvent(new Event('cartUpdated'));
          await loadTickets();
        } else if (data.payment_status === 'pending' && checkCount.current < maxChecks) {
          checkCount.current++;
          setTimeout(() => checkPaymentStatus(paymentId), 3000);
        } else if (data.payment_status === 'pending' && checkCount.current >= maxChecks) {
          setError('Платеж долго обрабатывается. Пожалуйста, проверьте позже');
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
      setError('Ошибка при проверке платежа');
      setLoading(false);
    }
  };

  const loadTickets = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/payment/my-tickets/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      const now = new Date();
      const activeTickets = data.filter((ticket: Ticket) => {
        const sessionDate = new Date(ticket.session_time);
        return ticket.status === 'active' && sessionDate > now;
      });
      
      setAllTickets(activeTickets);
      setLoading(false);
      window.dispatchEvent(new Event('cartUpdated'));
      
      if (activeTickets.length === 0) {
        setError('Активные билеты не найдены');
      }
    } catch (error) {
      setError('Ошибка загрузки билетов');
      setLoading(false);
    }
  };

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
          <div className="animate-spin rounded-full h-12 md:h-16 w-12 md:w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-3 md:mb-4"></div>
          <p className="text-gray-400 text-sm md:text-base">Проверка статуса платежа...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 md:py-20">
        <div className="container mx-auto px-4 md:px-6 max-w-2xl">
          <div className="bg-yellow-900/30 border border-yellow-500 rounded-lg md:rounded-xl p-6 md:p-8 text-center">
            <svg className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Требуется проверка</h1>
            <p className="text-gray-300 text-sm md:text-base mb-4 md:mb-6">{error}</p>
            <button onClick={() => navigate('/')} className="px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg font-semibold text-white text-sm md:text-base">
              На главную
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (allTickets.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 md:py-20">
        <div className="container mx-auto px-4 md:px-6 max-w-2xl">
          <div className="bg-gray-800 rounded-lg md:rounded-xl p-8 md:p-12 text-center">
            <svg className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
            </svg>
            <h1 className="text-xl md:text-2xl font-bold text-white mb-2">Нет активных билетов</h1>
            <p className="text-gray-400 text-sm md:text-base mb-4 md:mb-6">У вас нет активных билетов на данный момент</p>
            <button onClick={() => navigate('/')} className="px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg font-semibold text-white text-sm md:text-base">
              На главную
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-8 md:py-20">
      <div className="container mx-auto px-4 md:px-6 max-w-2xl">
        <div className="bg-green-900/30 border border-green-500 rounded-lg md:rounded-xl p-6 md:p-8 text-center mb-6 md:mb-8">
          <svg className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Оплата прошла успешно!</h1>
          <p className="text-gray-300 text-sm md:text-base">Ваши активные билеты готовы</p>
        </div>

        <div className="bg-gray-800 rounded-lg md:rounded-xl p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold text-white mb-3 md:mb-4">Ваши билеты ({allTickets.length})</h2>
          <div className="space-y-3 md:space-y-4">
            {allTickets.map((ticket) => (
              <div key={ticket.id} className="bg-gray-700 rounded-lg p-3 md:p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 md:gap-4">
                  <div className="flex-1 w-full sm:w-auto">
                    <h3 className="font-bold text-white text-base md:text-lg">{ticket.film_name}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 md:gap-2 text-xs md:text-sm text-gray-400 mt-2">
                      <p className="flex items-center gap-1">
                        <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(ticket.session_time).toLocaleDateString('ru-RU', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })}
                      </p>
                      <p className="flex items-center gap-1">
                        <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(ticket.session_time).toLocaleTimeString('ru-RU', {
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                      <p className="flex items-center gap-1 col-span-1 sm:col-span-2">
                        <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        {ticket.hall_name}
                      </p>
                      <p className="flex items-center gap-1">
                        <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Ряд {ticket.row_number}, Место {ticket.seat_number}
                      </p>
                      <p className="text-yellow-500 font-semibold flex items-center gap-1">
                        <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 0a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12z" />
                        </svg>
                        {Number(ticket.price).toFixed(2)} ₽
                      </p>
                    </div>
                  </div>
                  <div className="text-center flex-shrink-0 mx-auto sm:mx-0">
                    <QRCode value={getQRData(ticket)} size={70} bgColor="#ffffff" fgColor="#000000" level="H" />
                    <p className="text-[10px] md:text-xs text-gray-500 mt-1">QR код билета</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mt-6 md:mt-8">
          <button onClick={() => navigate('/profile')} className="w-full sm:flex-1 py-2 md:py-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg font-semibold text-white text-sm md:text-base hover:opacity-90 transition">
            Все мои билеты
          </button>
          <button onClick={() => navigate('/')} className="w-full sm:flex-1 py-2 md:py-3 bg-gray-700 rounded-lg font-semibold text-white text-sm md:text-base hover:bg-gray-600 transition">
            На главную
          </button>
        </div>
      </div>
    </div>
  );
}