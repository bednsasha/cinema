// src/pages/HomePage.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { movieAPI, sessionAPI } from '../services/api';
import type { Movie, Session } from '../types';

export default function HomePage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [todaySessions, setTodaySessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(true);

  useEffect(() => {
    // Загружаем фильмы
    movieAPI.getNowShowing()
      .then(response => {
        setMovies(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading movies:', error);
        setLoading(false);
      });
    
    // Загружаем сеансы на сегодня
    sessionAPI.getTodaySessions()
      .then(response => {
        // Фильтруем только будущие сеансы
        const now = new Date();
        const futureSessions = response.data.filter(session => {
          const sessionDate = new Date(session.start_time);
          return sessionDate > now;
        });
        setTodaySessions(futureSessions);
        setLoadingSessions(false);
      })
      .catch(error => {
        console.error('Error loading today sessions:', error);
        setLoadingSessions(false);
      });
  }, []);

  // Группируем сеансы по фильмам
  const groupedTodaySessions = todaySessions.reduce((acc, session) => {
    if (!acc[session.film_name]) {
      acc[session.film_name] = [];
    }
    acc[session.film_name].push(session);
    return acc;
  }, {} as Record<string, Session[]>);

  // Функция проверки, завершен ли сеанс
  const isSessionPast = (session: Session) => {
    const sessionDate = new Date(session.start_time);
    const now = new Date();
    return sessionDate < now;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Hero секция */}
      <div className="relative h-[400px] bg-cover bg-center" style={{
        backgroundImage: 'url("https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?ixlib=rb-4.0.3")',
      }}>
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative container mx-auto px-6 h-full flex flex-col justify-center items-center text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4">
            Добро пожаловать в Кинотеатр
          </h1>
          <p className="text-xl text-gray-200 max-w-2xl">
            Лучшие фильмы в лучшем качестве. Выбирай свой сеанс и покупай билеты онлайн!
          </p>
        </div>
      </div>

      {/* Секция фильмов */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-2">Сейчас в прокате</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 mx-auto rounded-full"></div>
        </div>

        {movies.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-xl">Нет фильмов в прокате</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {movies.map((movie) => (
              <Link to={`/movie/${movie.id}`} key={movie.id}>
                <div className="bg-gray-800 rounded-xl overflow-hidden hover:scale-105 transition-transform duration-300 shadow-xl hover:shadow-2xl h-full flex flex-col">
                  <div className="relative h-80">
                    {movie.poster ? (
                      <img 
                        src={movie.poster}
                        alt={movie.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                        <span className="text-gray-500">Нет постера</span>
                      </div>
                    )}
                    {movie.rating && (
                      <div className="absolute top-4 right-4 bg-yellow-500 text-black px-2 py-1 rounded-full text-sm font-bold">
                        ★ {movie.rating}
                      </div>
                    )}
                    <div className="absolute top-4 left-4 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                      {movie.age_limit_display}
                    </div>
                  </div>
                  
                  <div className="p-5 flex-grow">
                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{movie.name}</h3>
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
                      <span>{movie.duration} мин</span>
                      <span>•</span>
                      <span>{movie.release_year}</span>
                      <span>•</span>
                      <span>{movie.country}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {movie.genres?.slice(0, 3).map((genre) => (
                        <span key={genre.id} className="text-xs px-2 py-1 bg-gray-700 rounded-full text-gray-300">
                          {genre.name}
                        </span>
                      ))}
                    </div>
                    <p className="text-gray-400 text-sm line-clamp-2">
                      {movie.description}
                    </p>
                  </div>
                  
                  <div className="p-5 pt-0">
                    <button className="w-full py-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg font-semibold text-white hover:opacity-90 transition-opacity">
                      Купить билет
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Ближайшие сеансы на сегодня */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-8 mt-16">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Сеансы на сегодня</h2>
              <p className="text-gray-400 mt-1">
                {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
              </p>
            </div>
            <Link 
              to="/schedule" 
              className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
            >
              Все сеансы →
            </Link>
          </div>
          
          {loadingSessions ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : Object.keys(groupedTodaySessions).length === 0 ? (
            <p className="text-gray-400 text-center py-4">Нет сеансов на сегодня</p>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedTodaySessions).map(([filmName, sessions]) => (
                <div key={filmName} className="border-b border-gray-700 pb-4 last:border-0">
                  <h3 className="text-lg font-semibold text-white mb-3">{filmName}</h3>
                  <div className="flex flex-wrap gap-3">
                    {sessions.map((session) => {
                      const isPast = isSessionPast(session);
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
                          className={`px-4 py-2 rounded-lg transition text-center ${
                            isPast 
                              ? 'bg-gray-700 opacity-50 cursor-not-allowed' 
                              : 'bg-gray-700 hover:bg-blue-600'
                          }`}
                        >
                          <div className={`text-lg font-bold ${isPast ? 'text-gray-500' : 'text-white'}`}>
                            {new Date(session.start_time).toLocaleTimeString('ru-RU', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          <div className={`text-xs mt-1 ${isPast ? 'text-gray-500' : 'text-gray-400'}`}>
                            {session.hall_name} • {session.screen_type_name}
                          </div>
                          {isPast && (
                            <div className="text-xs text-gray-500 mt-1">Завершен</div>
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
    </div>
  );
}