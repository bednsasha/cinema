import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { sessionAPI, bookingAPI, movieAPI } from '../services/api';
import type { Session, Movie } from '../types';

interface Seat {
  id: string;
  row: string;
  number: number;
  isAvailable: boolean;
  isSelected: boolean;
  price: number;
}

const BookingPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingStep, setBookingStep] = useState(1);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    fetchSessionData();
  }, [sessionId]);

  const fetchSessionData = async () => {
    try {
      const response = await sessionAPI.getById(Number(sessionId));
      setSession(response.data);
      
      // Генерируем схему зала (например, 8x10 мест)
      generateSeats(8, 10);
      
      // Загружаем информацию о фильме
      const movieResponse = await movieAPI.getById(response.data.movie);
      setMovie(movieResponse.data);
      
      gsap.fromTo('.booking-container',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
      );
    } catch (error) {
      console.error('Error fetching session:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSeats = (rows: number, cols: number) => {
    const seatsList: Seat[] = [];
    const rowsLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    
    for (let i = 0; i < rows; i++) {
      for (let j = 1; j <= cols; j++) {
        // Имитируем занятые места (случайно)
        const isAvailable = Math.random() > 0.3;
        seatsList.push({
          id: `${rowsLetters[i]}${j}`,
          row: rowsLetters[i],
          number: j,
          isAvailable: isAvailable,
          isSelected: false,
          price: session?.price || 300,
        });
      }
    }
    setSeats(seatsList);
  };

  const toggleSeat = (seatId: string) => {
    setSeats(prev => prev.map(seat => 
      seat.id === seatId && seat.isAvailable
        ? { ...seat, isSelected: !seat.isSelected }
        : seat
    ));
  };

  const getSelectedSeats = () => seats.filter(seat => seat.isSelected);
  const getTotalPrice = () => getSelectedSeats().reduce((sum, seat) => sum + seat.price, 0);

  const handleBooking = async () => {
    if (bookingStep === 1 && getSelectedSeats().length === 0) {
      alert('Пожалуйста, выберите места');
      return;
    }
    
    if (bookingStep === 1) {
      setBookingStep(2);
      return;
    }
    
    if (!userName || !userEmail) {
      alert('Пожалуйста, заполните все поля');
      return;
    }
    
    // Создаем бронирование
    try {
      const bookingData = {
        session: Number(sessionId),
        seats: getSelectedSeats().map(seat => seat.id),
        total_price: getTotalPrice(),
        user_name: userName,
        user_email: userEmail,
      };
      
      await bookingAPI.create(bookingData);
      setBookingStep(3);
      
      // Анимация успеха
      gsap.fromTo('.success-animation',
        { scale: 0, rotation: -180 },
        { scale: 1, rotation: 0, duration: 0.8, ease: 'back.out(1.7)' }
      );
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Ошибка при создании бронирования');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-6">
        <div className="booking-container max-w-6xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-12">
            <div className="flex justify-between mb-2">
              {['Выбор мест', 'Данные', 'Подтверждение'].map((step, idx) => (
                <div key={step} className="text-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${
                    bookingStep > idx + 1 ? 'bg-green-500' :
                    bookingStep === idx + 1 ? 'bg-gradient-to-r from-red-500 to-purple-600' : 'bg-gray-700'
                  }`}>
                    {bookingStep > idx + 1 ? '✓' : idx + 1}
                  </div>
                  <div className="text-sm hidden md:block">{step}</div>
                </div>
              ))}
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((bookingStep - 1) / 2) * 100}%` }}
                transition={{ duration: 0.5 }}
                className="h-2 rounded-full bg-gradient-to-r from-red-500 to-purple-600"
              />
            </div>
          </div>

          {/* Step 1: Seat Selection */}
          {bookingStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
            >
              <div className="bg-gray-800 rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold mb-4">Выберите места</h2>
                <p className="text-gray-400 mb-6">
                  Фильм: {movie?.title} • Зал: {session?.hall} • {new Date(session!.start_time).toLocaleString()}
                </p>
                
                {/* Screen */}
                <div className="mb-12">
                  <div className="w-full h-3 bg-gradient-to-r from-transparent via-yellow-500 to-transparent rounded-full mb-2" />
                  <div className="text-center text-gray-400 text-sm">Экран</div>
                </div>

                {/* Seats Grid */}
                <div className="grid grid-cols-10 gap-2 mb-8 max-w-4xl mx-auto">
                  {seats.map((seat) => (
                    <motion.button
                      key={seat.id}
                      whileHover={seat.isAvailable && !seat.isSelected ? { scale: 1.1 } : {}}
                      whileTap={seat.isAvailable ? { scale: 0.95 } : {}}
                      onClick={() => toggleSeat(seat.id)}
                      disabled={!seat.isAvailable}
                      className={`
                        p-2 rounded-lg text-xs font-semibold transition-all
                        ${seat.isSelected ? 'bg-green-500 text-white' : ''}
                        ${!seat.isSelected && seat.isAvailable ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : ''}
                        ${!seat.isAvailable ? 'bg-red-900/50 text-gray-500 cursor-not-allowed line-through' : ''}
                      `}
                    >
                      {seat.id}
                    </motion.button>
                  ))}
                </div>

                {/* Legend */}
                <div className="flex justify-center gap-6 mb-8">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-700 rounded" />
                    <span className="text-sm">Свободно</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-500 rounded" />
                    <span className="text-sm">Выбрано</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-red-900/50 rounded" />
                    <span className="text-sm">Занято</span>
                  </div>
                </div>

                {/* Selected Seats Summary */}
                <div className="border-t border-gray-700 pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="font-bold">Выбранные места:</h3>
                      <p className="text-gray-400">
                        {getSelectedSeats().length > 0 
                          ? getSelectedSeats().map(s => s.id).join(', ')
                          : 'Не выбраны'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-red-500">{getTotalPrice()} ₽</div>
                      <div className="text-sm text-gray-400">Итого</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: User Info */}
          {bookingStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="bg-gray-800 rounded-2xl p-8"
            >
              <h2 className="text-2xl font-bold mb-6">Контактные данные</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Ваше имя</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Иван Иванов"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="ivan@example.com"
                  />
                </div>

                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h3 className="font-bold mb-2">Ваш заказ:</h3>
                  <p className="text-gray-300">
                    {getSelectedSeats().length} мест ({getSelectedSeats().map(s => s.id).join(', ')})
                  </p>
                  <p className="text-xl font-bold text-red-500 mt-2">{getTotalPrice()} ₽</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Success */}
          {bookingStep === 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center bg-gray-800 rounded-2xl p-12"
            >
              <div className="success-animation">
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              
              <h2 className="text-3xl font-bold mb-4">Бронирование успешно!</h2>
              <p className="text-gray-300 mb-6">
                Ваши билеты отправлены на почту {userEmail}
              </p>
              
              <div className="bg-gray-700 rounded-lg p-4 mb-8 inline-block">
                <p className="text-sm">Код бронирования: #{Math.random().toString(36).substr(2, 8).toUpperCase()}</p>
              </div>
              
              <div className="flex gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/')}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-purple-600 rounded-lg font-semibold"
                >
                  На главную
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.print()}
                  className="px-6 py-3 bg-gray-700 rounded-lg font-semibold"
                >
                  Распечатать билеты
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            {bookingStep < 3 && (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => bookingStep > 1 && setBookingStep(bookingStep - 1)}
                  className={`px-8 py-3 rounded-lg font-semibold ${
                    bookingStep > 1 ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  }`}
                  disabled={bookingStep === 1}
                >
                  Назад
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBooking}
                  className="px-8 py-3 bg-gradient-to-r from-red-500 to-purple-600 rounded-lg font-semibold"
                >
                  {bookingStep === 1 ? 'Продолжить' : 'Забронировать'}
                </motion.button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;