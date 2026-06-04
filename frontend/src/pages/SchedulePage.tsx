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

  useEffect(() => {
    movieAPI.getAll().then(res => setMovies(res.data)).catch(console.error);
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Расписание сеансов</h1>
          <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 mx-auto rounded-full"></div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => {
              const newDate = new Date(selectedDate);
              newDate.setDate(selectedDate.getDate() - 7);
              setSelectedDate(newDate);
            }}
            className="px-3 py-1.5 text-sm bg-gray-800 rounded-lg hover:bg-gray-700 transition"
          >
            ← Предыдущая
          </button>
          <button
            onClick={() => setSelectedDate(new Date())}
            className="px-3 py-1.5 text-sm bg-blue-600 rounded-lg hover:bg-blue-700 transition"
          >
            Сегодня
          </button>
          <button
            onClick={() => {
              const newDate = new Date(selectedDate);
              newDate.setDate(selectedDate.getDate() + 7);
              setSelectedDate(newDate);
            }}
            className="px-3 py-1.5 text-sm bg-gray-800 rounded-lg hover:bg-gray-700 transition"
          >
            Следующая →
          </button>
        </div>

        {/* Календарь */}
        <div className="grid grid-cols-7 gap-2 mb-6">
          {weekDates.map((date, index) => {
            const dateStr = date.toISOString().split('T')[0];
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate.toISOString().split('T')[0];
            
            return (
              <button
                key={index}
                onClick={() => setSelectedDate(date)}
                className={`text-center p-2 rounded-lg transition ${
                  isSelected 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white' 
                    : isToday 
                      ? 'bg-gray-700 border border-blue-500 text-blue-400' 
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                }`}
              >
                <div className="text-xs">
                  {date.toLocaleDateString('ru-RU', { weekday: 'short' })}
                </div>
                <div className={`text-lg font-bold ${isSelected ? 'text-white' : isToday ? 'text-blue-400' : 'text-gray-200'}`}>
                  {date.getDate()}
                </div>
              </button>
            );
          })}
        </div>

        {/* Выбранная дата */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white">{formattedDate}</h2>
        </div>

        {/* Сеансы */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
          </div>
        ) : Object.keys(groupedSessions).length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-8 text-center">
            <p className="text-gray-400">Нет сеансов на выбранную дату</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedSessions).map(([filmName, { film, sessions: filmSessions }]) => (
              <div key={filmName} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-start gap-4 mb-3">
                  {film?.poster && (
                    <img 
                      src={film.poster.startsWith('http') ? film.poster : `http://127.0.0.1:8000${film.poster}`}
                      alt={filmName}
                      className="w-16 h-24 object-cover rounded-md"
                    />
                  )}
                  <div>
                    <Link to={`/movie/${film?.id}`} className="text-lg font-semibold text-white hover:text-blue-400 transition">
                      {filmName}
                    </Link>
                    <div className="flex gap-2 mt-1">
                      {film?.age_limit_display && (
                        <span className="text-xs bg-gray-700 px-1.5 py-0.5 rounded text-blue-400">{film.age_limit_display}</span>
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
                
                {/* Время сеансов */}
                <div className="flex flex-wrap gap-2">
                  {filmSessions.map((session) => {
                    const sessionDate = new Date(session.start_time);
                    const now = new Date();
                    const isPast = sessionDate < now;
                    
                    return (
                      <Link
                        key={session.id}
                        to={!isPast ? `/booking/${session.id}` : '#'}
                        onClick={(e) => {
                          if (isPast) {
                            e.preventDefault();
                            alert('Этот сеанс уже завершен');
                          }
                        }}
                        className={`px-2 py-1 rounded-md text-center min-w-[70px] transition ${
                          isPast
                            ? 'bg-gray-800 opacity-50 cursor-not-allowed'
                            : 'bg-gray-700 hover:bg-blue-600'
                        }`}
                      >
                        <div className={`text-sm font-medium ${isPast ? 'text-gray-500' : 'text-white'}`}>
                          {new Date(session.start_time).toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <div className={`text-[10px] ${isPast ? 'text-gray-600' : 'text-gray-400'}`}>
                          {session.hall_name}
                        </div>
                        <div className={`text-[10px] ${isPast ? 'text-gray-600' : 'text-gray-500'}`}>
                          {session.screen_type_name?.slice(0, 3)}
                        </div>
                        {isPast && (
                          <div className="text-[9px] text-gray-500">Завершен</div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}