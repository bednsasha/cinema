import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import type { Movie } from '../types';

interface MovieCardProps {
  movie: Movie;
  index: number;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, index }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.fromTo(cardRef.current,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        delay: index * 0.1,
        ease: 'power3.out',
      }
    );
  }, [index]);

  const posterUrl = movie.poster 
    ? movie.poster.startsWith('http') 
      ? movie.poster 
      : `http://127.0.0.1:8000${movie.poster}`
    : 'https://via.placeholder.com/300x400/1a1a1a/ffffff?text=No+Poster';

  const genresList = movie.genres || [];
  const displayGenres = genresList.slice(0, 2).map((genre: any, idx: number) => 
    typeof genre === 'string' ? genre : genre.name
  );

  const description = movie.description || 'Описание отсутствует';

  return (
    <motion.div
      ref={cardRef}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="group relative bg-gray-800 rounded-lg md:rounded-xl overflow-hidden shadow-xl cursor-pointer"
    >
      <Link to={`/movie/${movie.id}`}>
        <div className="relative overflow-hidden h-48 md:h-80">
          <img
            src={posterUrl}
            alt={movie.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x400/1a1a1a/ffffff?text=No+Poster';
            }}
          />
          
          {movie.rating && (
            <div className="absolute top-2 right-2 md:top-4 md:right-4 bg-yellow-500 text-black px-1.5 py-0.5 md:px-2 md:py-1 rounded-full text-[10px] md:text-sm font-bold">
              ★ {movie.rating}
            </div>
          )}
          
          <div className="absolute top-2 left-2 md:top-4 md:left-4 bg-blue-600 text-white px-1.5 py-0.5 md:px-2 md:py-1 rounded-full text-[8px] md:text-xs font-bold">
            {movie.age_limit_display || movie.age_limit || '0+'}
          </div>
        </div>

        <div className="p-2 md:p-5">
          <h3 className="text-sm md:text-xl font-bold text-white mb-1 md:mb-2 line-clamp-1 group-hover:text-blue-400 transition-colors">
            {movie.name}
          </h3>
          
          <div className="flex items-center gap-1 md:gap-2 text-gray-400 text-[10px] md:text-sm mb-1 md:mb-3">
            <span>{movie.duration} мин</span>
            <span>•</span>
            <span>{movie.release_year || '2024'}</span>
          </div>
          
          <div className="flex flex-wrap gap-0.5 md:gap-1 mb-1 md:mb-3">
            {displayGenres.length > 0 ? (
              displayGenres.map((genre: string, idx: number) => (
                <span key={idx} className="text-[8px] md:text-xs px-1 md:px-2 py-0.5 md:py-1 bg-gray-700 rounded-full text-gray-300">
                  {genre}
                </span>
              ))
            ) : (
              <span className="text-[8px] md:text-xs px-1 md:px-2 py-0.5 md:py-1 bg-gray-700 rounded-full text-gray-300">
                Без жанра
              </span>
            )}
          </div>
          
          <p className="text-gray-400 text-[10px] md:text-sm line-clamp-2">
            {description}
          </p>
        </div>
        
        <div className="p-2 md:p-5 pt-0">
          <button className="w-full py-1 md:py-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg font-semibold text-white text-xs md:text-base hover:opacity-90 transition-opacity">
            Купить билет
          </button>
        </div>
      </Link>
    </motion.div>
  );
};

export default MovieCard;