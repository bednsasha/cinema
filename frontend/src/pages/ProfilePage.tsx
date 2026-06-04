import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import QRCode from 'react-qr-code';
import type { Ticket, User } from '../types';

const API_URL = 'http://127.0.0.1:8000/api';

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
      const response = await fetch(`${API_URL}/users/profile/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser({
          id: data.id,
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone || ''
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-8 md:py-12">
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">
        <div className="bg-gray-800 rounded-xl p-4 md:p-6 mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg md:text-2xl font-bold text-white truncate">
                  {user?.first_name} {user?.last_name}
                </h1>
                <div className="flex flex-col gap-1 text-xs md:text-sm">
                  <p className="text-gray-400 flex items-center gap-1 truncate">
                    <svg className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="truncate">{user?.email}</span>
                  </p>
                  {user?.phone && (
                    <p className="text-gray-400 flex items-center gap-1">
                      <svg className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="truncate">{user?.phone}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 md:px-4 md:py-2 bg-red-600 rounded-lg text-white text-sm md:text-base hover:bg-red-700 transition flex items-center gap-1 md:gap-2 w-full sm:w-auto justify-center"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Выйти</span>
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex justify-around">
              <div className="text-center">
                <p className="text-xl md:text-2xl font-bold text-white">{activeTickets.length}</p>
                <p className="text-xs text-gray-500">Активных</p>
              </div>
              <div className="text-center">
                <p className="text-xl md:text-2xl font-bold text-white">{archivedTickets.length}</p>
                <p className="text-xs text-gray-500">Архивных</p>
              </div>
              <div className="text-center">
                <p className="text-xl md:text-2xl font-bold text-white">{tickets.length}</p>
                <p className="text-xs text-gray-500">Всего</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 md:gap-4 mb-4 md:mb-6 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('active')}
            className={`pb-2 md:pb-3 px-2 md:px-4 text-sm md:text-base font-semibold transition flex items-center gap-1 md:gap-2 ${
              activeTab === 'active'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Активные
            <span className="bg-green-600 text-white text-xs px-1.5 py-0.5 md:px-2 md:py-0.5 rounded-full">
              {activeTickets.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`pb-2 md:pb-3 px-2 md:px-4 text-sm md:text-base font-semibold transition flex items-center gap-1 md:gap-2 ${
              activeTab === 'archived'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Архив
            <span className="bg-gray-600 text-white text-xs px-1.5 py-0.5 md:px-2 md:py-0.5 rounded-full">
              {archivedTickets.length}
            </span>
          </button>
        </div>

        
        {activeTab === 'active' && (
          activeTickets.length === 0 ? (
            <div className="bg-gray-800 rounded-xl p-8 md:p-12 text-center">
              <svg className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
              </svg>
              <p className="text-gray-400 text-base md:text-lg">У вас нет активных билетов</p>
              <button
                onClick={() => navigate('/schedule')}
                className="mt-4 px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg text-white text-sm md:text-base hover:opacity-90 transition"
              >
                Купить билеты
              </button>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {activeTickets.map((ticket) => (
                <div key={ticket.id} className="bg-gray-800 rounded-xl p-4 md:p-6 hover:bg-gray-750 transition">
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-base md:text-xl font-bold text-white">{ticket.film_name}</h3>
                          <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">Активен</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-xs md:text-sm text-gray-400">
                          <p className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(ticket.session_time).toLocaleDateString('ru-RU', {
                              day: 'numeric', month: 'long', year: 'numeric'
                            })}
                          </p>
                          <p className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {new Date(ticket.session_time).toLocaleTimeString('ru-RU', {
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                          <p className="flex items-center gap-1 col-span-2">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            {ticket.hall_name}
                          </p>
                          <p className="flex items-center gap-1 col-span-2">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Ряд {ticket.row_number}, Место {ticket.seat_number}
                          </p>
                          <p className="text-yellow-500 font-semibold flex items-center gap-1 col-span-2">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 0a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12z" />
                            </svg>
                            {Number(ticket.price).toFixed(2)} ₽
                          </p>
                        </div>
                      </div>
                      <div className="text-center flex-shrink-0">
                        <QRCode value={getQRData(ticket)} size={60} bgColor="#ffffff" fgColor="#000000" level="H" />
                        <p className="text-xs text-gray-500 mt-1 hidden md:block">QR код</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === 'archived' && (
          archivedTickets.length === 0 ? (
            <div className="bg-gray-800 rounded-xl p-8 md:p-12 text-center">
              <svg className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <p className="text-gray-400 text-base md:text-lg">У вас нет архивных билетов</p>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {archivedTickets.map((ticket) => (
                <div key={ticket.id} className="bg-gray-800/50 rounded-xl p-4 md:p-6 opacity-75">
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-base md:text-xl font-bold text-gray-300">{ticket.film_name}</h3>
                          <span className="bg-gray-600 text-gray-300 text-xs px-2 py-0.5 rounded-full">
                            {ticket.is_past ? 'Просмотрен' : 'Архивный'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-xs md:text-sm text-gray-500">
                          <p className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(ticket.session_time).toLocaleDateString('ru-RU', {
                              day: 'numeric', month: 'long', year: 'numeric'
                            })}
                          </p>
                          <p className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {new Date(ticket.session_time).toLocaleTimeString('ru-RU', {
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                          <p className="flex items-center gap-1 col-span-2">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            {ticket.hall_name}
                          </p>
                          <p className="flex items-center gap-1 col-span-2">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Ряд {ticket.row_number}, Место {ticket.seat_number}
                          </p>
                          <p className="text-gray-400 flex items-center gap-1 col-span-2">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 0a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12z" />
                            </svg>
                            {Number(ticket.price).toFixed(2)} ₽
                          </p>
                        </div>
                      </div>
                      <div className="text-center flex-shrink-0 opacity-50">
                        <QRCode value={getQRData(ticket)} size={60} bgColor="#ffffff" fgColor="#000000" level="H" />
                        <p className="text-xs text-gray-500 mt-1 hidden md:block">Билет</p>
                      </div>
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