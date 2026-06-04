import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { movieAPI } from '../services/api';
import type { Movie } from '../types';
import MovieCard from '../components/MovieCard';

const MoviesPage: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      const response = await movieAPI.getAll();
      setMovies(response.data);
      
      gsap.fromTo('.movies-header',
        { y: -50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
      );
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-20">
      <div className="container mx-auto px-6">
        <motion.div
          className="movies-header text-center mb-12"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
            Все фильмы
          </h1>
          <p className="text-gray-400 text-lg">Выберите фильм для просмотра</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {movies.map((movie, index) => (
            <MovieCard key={movie.id} movie={movie} index={index} />
          ))}
        </div>

        {movies.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 text-xl">Фильмы не найдены</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoviesPage;