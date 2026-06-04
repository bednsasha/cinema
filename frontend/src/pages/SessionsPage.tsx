import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { sessionAPI, movieAPI } from '../services/api';
import type { Session, Movie } from '../types';

const SessionsPage: React.FC = () => {
  const { movieId } = useParams<{ movieId: string }>();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [movieId]);

  const fetchData = async () => {
    try {
      const [sessionsRes, movieRes] = await Promise.all([
        sessionAPI.getByFilm(Number(movieId)),
        movieAPI.getById(Number(movieId))
      ]);
      
      setSessions(sessionsRes.data);
      setMovie(movieRes.data);
      
      gsap.fromTo('.sessions-container',
        { opacity: 0 },
        { opacity: 1, duration: 0.6, ease: 'power2.out' }
      );
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupedSessions = sessions.reduce((acc, session) => {
    const date = new Date(session.start_time).toLocaleDateString('ru-RU');
    if (!acc[date]) acc[date] = [];
    acc[date].push(session);
    return acc;
  }, {} as Record<string, Session[]>);

  const dates = Object.keys(groupedSessions);
  
  const filteredSessions = selectedDate === 'all' 
    ? sessions 
    : sessions.filter(s => new Date(s.start_time).toLocaleDateString('ru-RU') === selectedDate);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-20">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-8 mb-12"
        >
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <img
              src={movie?.poster ? `http://127.0.0.1:8000${movie.poster}` : 'https://via.placeholder.com/300x400'}
              alt={movie?.name}
              className="w-32 h-48 object-cover rounded-lg shadow-lg"
            />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{movie?.name}</h1>
              <p className="text-gray-400">{movie?.duration} мин</p>
              <p className="text-gray-300 mt-4 max-w-2xl">{movie?.description}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold mb-4">Выберите дату</h2>
          <div className="flex flex-wrap gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedDate('all')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                selectedDate === 'all'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Все даты
            </motion.button>
            {dates.map((date) => (
              <motion.button
                key={date}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDate(date)}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  selectedDate === date
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {date}
              </motion.button>
            ))}
          </div>
        </motion.div>

        <AnimatePresence>
          <motion.div
            key={selectedDate}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredSessions.map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5 }}
                className="bg-gray-800 rounded-xl p-6 hover:shadow-xl transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-3xl font-bold text-blue-500">
                      {new Date(session.start_time).toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      {new Date(session.start_time).toLocaleDateString('ru-RU', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                      })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">Цена уточняется</div>
                    <div className="text-sm text-gray-400">Зал: {session.hall_name}</div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Доступно мест:</span>
                    <span className="text-green-500">Уточняйте</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `50%` }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                      className="h-2 rounded-full bg-green-500"
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/booking/${session.id}`)}
                  className="w-full py-3 rounded-lg font-semibold transition-all bg-gradient-to-r from-blue-500 to-indigo-600 hover:shadow-lg text-white"
                >
                  Выбрать места
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {filteredSessions.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-gray-400 text-xl">Нет доступных сеансов на выбранную дату</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SessionsPage;