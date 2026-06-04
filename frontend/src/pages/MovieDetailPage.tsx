import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { movieAPI, sessionAPI } from '../services/api';
import type { Movie, Session } from '../types';

export default function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    if (id) {
      Promise.all([
        movieAPI.getById(Number(id)),
        sessionAPI.getByFilm(Number(id))
      ])
        .then(([movieRes, sessionsRes]) => {
          setMovie(movieRes.data);
          
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          
          const futureSessions = sessionsRes.data.filter(session => {
            const sessionDate = new Date(session.start_time);
            return sessionDate >= now;
          });
          
          setSessions(futureSessions);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error:', error);
          setLoading(false);
        });
    }
  }, [id]);

  const groupedSessions = sessions.reduce((acc, session) => {
    const sessionDate = new Date(session.start_time);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let dateKey;
    if (sessionDate.toDateString() === today.toDateString()) {
      dateKey = 'Сегодня';
    } else {
      dateKey = sessionDate.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        weekday: 'long'
      });
    }
    
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(session);
    return acc;
  }, {} as Record<string, Session[]>);

  const dates = Object.keys(groupedSessions);

  const sortedDates = [...dates].sort((a, b) => {
    if (a === 'Сегодня') return -1;
    if (b === 'Сегодня') return 1;
    
    const dateA = new Date(a.split(',').reverse().join(','));
    const dateB = new Date(b.split(',').reverse().join(','));
    return dateA.getTime() - dateB.getTime();
  });

  Object.keys(groupedSessions).forEach(date => {
    groupedSessions[date].sort((a, b) => 
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
  });

  useEffect(() => {
    if (sortedDates.length > 0 && !selectedDate) {
      setSelectedDate(sortedDates[0]);
    }
  }, [sortedDates, selectedDate]);

  const filteredSessions = selectedDate ? groupedSessions[selectedDate] || [] : [];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 text-xl">Фильм не найден</p>
      </div>
    );
  }

  const posterUrl = movie.poster 
    ? movie.poster.startsWith('http') 
      ? movie.poster 
      : `http://127.0.0.1:8000${movie.poster}`
    : 'https://via.placeholder.com/300x400/1a1a1a/ffffff?text=No+Poster';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="relative h-[500px] bg-cover bg-center" style={{
        backgroundImage: `url(${posterUrl})`,
        backgroundColor: '#1a1a2e'
      }}>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent" />
        
        <div className="relative container mx-auto px-6 h-full flex items-end pb-12">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-48 md:w-64 rounded-xl overflow-hidden shadow-2xl">
              <img 
                src={posterUrl}
                alt={movie.name}
                className="w-full h-auto"
              />
            </div>
            
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{movie.name}</h1>
              
              <div className="flex flex-wrap gap-4 mb-4">
                {movie.rating && (
                  <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold">
                    ★ {movie.rating}
                  </span>
                )}
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                  {movie.age_limit_display || movie.age_limit || '0+'}
                </span>
                <span className="bg-gray-700 text-white px-3 py-1 rounded-full text-sm">
                  {movie.duration} мин
                </span>
                <span className="bg-gray-700 text-white px-3 py-1 rounded-full text-sm">
                  {movie.release_year}
                </span>
              </div>
              
              <div className="text-gray-300 space-y-2 mb-4">
                <p><span className="text-gray-400">Страна:</span> {movie.country}</p>
                <p><span className="text-gray-400">Режиссёр:</span> {movie.director}</p>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {movie.genres?.map((genre) => (
                  <span key={genre.id} className="px-3 py-1 bg-gray-800 rounded-full text-sm text-gray-300">
                    {genre.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-white mb-4">О фильме</h2>
            <p className="text-gray-300 leading-relaxed whitespace-pre-line">
              {movie.description || 'Описание отсутствует'}
            </p>
            
            {movie.trailer_url && (
              <div className="mt-8">
                <h3 className="text-xl font-bold text-white mb-4">Трейлер</h3>
                <a 
                  href={movie.trailer_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-400 transition"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 0a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM8 15V5l6 5-6 5z" />
                  </svg>
                  Смотреть трейлер
                </a>
              </div>
            )}
          </div>

          <div>
            <div className="bg-gray-800 rounded-xl p-6 sticky top-24">
              <h3 className="text-2xl font-bold text-white mb-4">Ближайшие сеансы</h3>
              
              {sessions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">Нет доступных сеансов</p>
                  <p className="text-gray-500 text-sm mt-2">Все сеансы прошли или ещё не добавлены</p>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {sortedDates.map((date) => (
                      <button
                        key={date}
                        onClick={() => setSelectedDate(date)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                          selectedDate === date
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {date}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3">
                    {filteredSessions.map((session) => {
                      const sessionDate = new Date(session.start_time);
                      const now = new Date();
                      const isPast = sessionDate < now;
                      
                      return (
                        <button
                          key={session.id}
                          onClick={() => !isPast && navigate(`/booking/${session.id}`)}
                          disabled={isPast}
                          className={`w-full p-4 rounded-lg text-left transition-colors ${
                            isPast 
                              ? 'bg-gray-800 opacity-50 cursor-not-allowed' 
                              : 'bg-gray-700 hover:bg-gray-600 group'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className={`text-xl font-bold ${isPast ? 'text-gray-500' : 'text-white'}`}>
                                {new Date(session.start_time).toLocaleTimeString('ru-RU', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                              <p className="text-sm text-gray-400 mt-1">
                                Зал: {session.hall_name}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {session.screen_type_name}
                              </p>
                            </div>
                            <div className="text-right">
                              {isPast ? (
                                <span className="text-sm text-gray-500">Завершен</span>
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition">
                                  <span className="text-blue-400 text-xl">→</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}