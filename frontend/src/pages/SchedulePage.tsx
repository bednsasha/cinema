// src/pages/SchedulePage.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { sessionAPI, movieAPI } from '../services/api';
import type { Session, Movie } from '../types';

export default function SchedulePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Получаем даты для календаря (неделя)
  const getWeekDates = (): Date[] => {
    const dates: Date[] = [];
    const startOfWeek = new Date(selectedDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();
  const today = new Date().toISOString().split('T')[0];

  // Загружаем фильмы
  useEffect(() => {
    movieAPI.getAll().then(res => setMovies(res.data)).catch(console.error);
  }, []);

  // Загружаем сеансы при выборе даты
  useEffect(() => {
    setLoading(true);
    const dateStr = selectedDate.toISOString().split('T')[0];
    
    sessionAPI.getByDate(dateStr)
      .then(response => {
        setSessions(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error:', error);
        setLoading(false);
      });
  }, [selectedDate]);

  // Группируем сеансы по фильмам
  const groupedSessions = sessions.reduce((acc, session) => {
    const film = movies.find(m => m.name === session.film_name);
    if (!acc[session.film_name]) {
      acc[session.film_name] = {
        film: film,
        sessions: []
      };
    }
    acc[session.film_name].sessions.push(session);
    return acc;
  }, {} as Record<string, { film: Movie | undefined; sessions: Session[] }>);

  // Сортируем сеансы по времени
  Object.values(groupedSessions).forEach(group => {
    group.sessions.sort((a, b) => 
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
  });

  const formattedDate = selectedDate.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12">
      <div className="container mx-auto px-6">
        {/* Заголовок */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Расписание сеансов</h1>
          <div className="w-24 h-1 bg-gradient-to-r from-red-500 to-purple-600 mx-auto rounded-full"></div>
        </div>

        {/* Навигация по неделям */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => {
              const newDate = new Date(selectedDate);
              newDate.setDate(selectedDate.getDate() - 7);
              setSelectedDate(newDate);
            }}
            className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
          >
            ← Предыдущая неделя
          </button>
          <button
            onClick={() => setSelectedDate(new Date())}
            className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition"
          >
            Сегодня
          </button>
          <button
            onClick={() => {
              const newDate = new Date(selectedDate);
              newDate.setDate(selectedDate.getDate() + 7);
              setSelectedDate(newDate);
            }}
            className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
          >
            Следующая неделя →
          </button>
        </div>

        {/* Календарь - выбор даты */}
        <div className="grid grid-cols-7 gap-4 mb-8">
          {weekDates.map((date, index) => {
            const dateStr = date.toISOString().split('T')[0];
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate.toISOString().split('T')[0];
            
            return (
              <button
                key={index}
                onClick={() => setSelectedDate(date)}
                className={`text-center p-3 rounded-xl transition ${
                  isSelected 
                    ? 'bg-gradient-to-r from-red-500 to-purple-600' 
                    : isToday 
                      ? 'bg-red-600' 
                      : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                <div className="text-sm text-gray-400">
                  {date.toLocaleDateString('ru-RU', { weekday: 'short' })}
                </div>
                <div className={`text-2xl font-bold ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                  {date.getDate()}
                </div>
              </button>
            );
          })}
        </div>

        {/* Выбранная дата */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">{formattedDate}</h2>
        </div>

        {/* Сеансы на выбранную дату */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-500"></div>
          </div>
        ) : Object.keys(groupedSessions).length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-12 text-center">
            <p className="text-gray-400 text-xl">Нет сеансов на выбранную дату</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedSessions).map(([filmName, { film, sessions: filmSessions }]) => (
              <div key={filmName} className="bg-gray-800 rounded-xl p-6">
                <div className="flex items-start gap-4 mb-4">
                  {film?.poster && (
                    <img 
                      src={film.poster} 
                      alt={filmName}
                      className="w-20 h-28 object-cover rounded-lg"
                    />
                  )}
                  <div>
                    <Link to={`/movie/${film?.id}`} className="text-xl font-semibold text-white hover:text-red-400 transition">
                      {filmName}
                    </Link>
                    <div className="flex gap-3 mt-2">
                      {film?.age_limit_display && (
                        <span className="text-xs text-red-400">{film.age_limit_display}</span>
                      )}
                      {film?.duration && (
                        <span className="text-xs text-gray-400">{film.duration} мин</span>
                      )}
                      {film?.rating && (
                        <span className="text-xs text-yellow-500">★ {film.rating}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3 ml-0 md:ml-24">
                  {filmSessions.map((session) => (
                    <Link
                      key={session.id}
                      to={`/booking/${session.id}`}
                      className="px-4 py-3 bg-gray-700 rounded-lg hover:bg-red-600 transition text-center min-w-[110px]"
                    >
                      <div className="text-lg font-bold">
                        {new Date(session.start_time).toLocaleTimeString('ru-RU', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {session.hall_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {session.screen_type_name}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}