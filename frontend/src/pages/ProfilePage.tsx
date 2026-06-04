// src/pages/ProfilePage.tsx
import { useEffect, useState } from 'react';
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
  is_past?: boolean;
}

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

  useEffect(() => {
    if (!authAPI.isAuthenticated()) {
      navigate('/login');
      return;
    }
    loadUserData();
    loadTickets();
  }, []);

  const loadUserData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const payload = JSON.parse(atob(token!.split('.')[1]));
      setUser({
        id: payload.user_id,
        email: payload.email,
        first_name: payload.first_name,
        last_name: payload.last_name,
        phone: ''
      });
    } catch (error) {
      console.error('Error loading user data:', error);
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
      
      const now = new Date();
      const ticketsWithStatus = data.map((ticket: Ticket) => ({
        ...ticket,
        is_past: new Date(ticket.session_time) < now
      }));
      
      setTickets(ticketsWithStatus);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeTickets = tickets.filter(t => !t.is_past && t.status === 'active');
  const archivedTickets = tickets.filter(t => t.is_past || t.status !== 'active');

  const handleLogout = () => {
    authAPI.clearTokens();
    navigate('/login');
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
      code: ticket.qr_code
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12">
      <div className="container mx-auto px-6 max-w-4xl">
        {/* Профиль пользователя */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">
                {user?.first_name} {user?.last_name}
              </h1>
              <p className="text-gray-400">{user?.email}</p>
              {user?.phone && <p className="text-gray-400 mt-1">{user?.phone}</p>}
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition"
            >
              Выйти
            </button>
          </div>
        </div>

        {/* Табы */}
        <div className="flex gap-4 mb-6 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('active')}
            className={`pb-3 px-4 font-semibold transition ${
              activeTab === 'active'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Активные билеты ({activeTickets.length})
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`pb-3 px-4 font-semibold transition ${
              activeTab === 'archived'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Архив билетов ({archivedTickets.length})
          </button>
        </div>

        {/* Активные билеты */}
        {activeTab === 'active' && (
          activeTickets.length === 0 ? (
            <div className="bg-gray-800 rounded-xl p-12 text-center">
              <div className="text-6xl mb-4">🎫</div>
              <p className="text-gray-400 text-lg">У вас нет активных билетов</p>
              <button
                onClick={() => navigate('/schedule')}
                className="mt-4 px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg text-white hover:opacity-90 transition"
              >
                Купить билеты
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {activeTickets.map((ticket) => (
                <div key={ticket.id} className="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition">
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white">{ticket.film_name}</h3>
                        <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                          Активен
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-400">
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
                      <p className="text-xs text-gray-600 mt-1">{ticket.qr_code?.substring(0, 8)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Архив билетов */}
        {activeTab === 'archived' && (
          archivedTickets.length === 0 ? (
            <div className="bg-gray-800 rounded-xl p-12 text-center">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-gray-400 text-lg">У вас нет архивных билетов</p>
            </div>
          ) : (
            <div className="space-y-4">
              {archivedTickets.map((ticket) => (
                <div key={ticket.id} className="bg-gray-800/50 rounded-xl p-6 opacity-75">
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-300">{ticket.film_name}</h3>
                        <span className="bg-gray-600 text-gray-300 text-xs px-2 py-1 rounded-full">
                          {ticket.is_past ? 'Просмотрен' : 'Архивный'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-500">
                        <p>📅 {new Date(ticket.session_time).toLocaleDateString('ru-RU', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })}</p>
                        <p>⏰ {new Date(ticket.session_time).toLocaleTimeString('ru-RU', {
                          hour: '2-digit', minute: '2-digit'
                        })}</p>
                        <p>🏠 {ticket.hall_name}</p>
                        <p>💺 Ряд {ticket.row_number}, Место {ticket.seat_number}</p>
                        <p className="text-gray-400">💰 {Number(ticket.price).toFixed(2)} ₽</p>
                      </div>
                    </div>
                    <div className="text-center opacity-50">
                      <QRCode 
                        value={getQRData(ticket)}
                        size={96}
                        bgColor="#ffffff"
                        fgColor="#000000"
                        level="H"
                      />
                      <p className="text-xs text-gray-500 mt-1">Билет использован</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}