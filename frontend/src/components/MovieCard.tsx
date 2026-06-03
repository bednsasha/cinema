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
      { opacity: 0, y: 50, rotationX: -15 },
      {
        opacity: 1,
        y: 0,
        rotationX: 0,
        duration: 0.6,
        delay: index * 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: cardRef.current,
          start: 'top bottom-=100',
          toggleActions: 'play none none reverse',
        },
      }
    );
  }, [index]);

  // Формируем URL постера (если есть poster, иначе заглушка)
  const posterUrl = movie.poster 
    ? `http://127.0.0.1:8000${movie.poster}` 
    : 'https://via.placeholder.com/300x400/1a1a1a/ffffff?text=No+Poster';

  return (
    <motion.div
      ref={cardRef}
      whileHover={{ y: -10, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="group relative bg-gray-800 rounded-xl overflow-hidden shadow-xl cursor-pointer"
    >
      <Link to={`/movie/${movie.id}`}>
        <div className="relative overflow-hidden h-80">
          <motion.img
            src={posterUrl}
            alt={movie.name}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.3 }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Rating Badge */}
          {movie.rating && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="absolute top-4 right-4 bg-yellow-500 text-black px-2 py-1 rounded-full font-bold text-sm"
            >
              ★ {movie.rating}
            </motion.div>
          )}
          
          {/* Age Limit Badge */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="absolute top-4 left-4 bg-red-600 text-white px-2 py-1 rounded-full font-bold text-xs"
          >
            {movie.age_limit}
          </motion.div>
        </div>

        <div className="p-6">
          <h3 className="text-xl font-bold mb-2 group-hover:text-red-500 transition-colors line-clamp-1">
            {movie.name}
          </h3>
          
          <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
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
          
          <p className="text-gray-300 text-sm line-clamp-2">
            {movie.description}
          </p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mt-4 w-full py-2 bg-gradient-to-r from-red-500 to-purple-600 rounded-lg font-semibold"
          >
            Купить билет
          </motion.button>
        </div>
      </Link>
    </motion.div>
  );
};

export default MovieCard;