// src/components/Navbar.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { authAPI, cartAPI } from '../services/api';

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef<HTMLElement>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [cartItemsCount, setCartItemsCount] = useState(0);

  useEffect(() => {
    gsap.fromTo(navRef.current,
      { y: -100 },
      { y: 0, duration: 0.8, ease: 'bounce.out' }
    );
    
    const checkAuth = () => {
      setIsAuthenticated(authAPI.isAuthenticated());
    };
    
    checkAuth();
    
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  // Загружаем количество товаров в корзине
  useEffect(() => {
    if (isAuthenticated) {
      const loadCartCount = async () => {
        try {
          const response = await cartAPI.getCart();
          setCartItemsCount(response.data.total_items || 0);
        } catch (error) {
          console.error('Error loading cart count:', error);
        }
      };
      loadCartCount();
    } else {
      setCartItemsCount(0);
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    authAPI.clearTokens();
    setIsAuthenticated(false);
    setCartItemsCount(0);
    navigate('/');
  };

  const navItems = [
    { path: '/', label: 'Главная' },
    { path: '/movies', label: 'Фильмы' },
    { path: '/schedule', label: 'Расписание' },
  ];

  return (
    <motion.nav
      ref={navRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-black/50 backdrop-blur-lg border-b border-gray-800 sticky top-0 z-50"
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-red-500 to-purple-600 bg-clip-text text-transparent">
              CinemaDRF
            </Link>
          </motion.div>
          
          <div className="flex items-center gap-8">
            {navItems.map((item) => (
              <motion.div
                key={item.path}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to={item.path}
                  className={`relative px-3 py-2 transition-colors ${
                    location.pathname === item.path ? 'text-red-500' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {item.label}
                  {location.pathname === item.path && (
                    <motion.div
                      layoutId="underline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-purple-600"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </Link>
              </motion.div>
            ))}
            
            {/* Корзина */}
            <Link to="/cart" className="relative text-gray-300 hover:text-white transition">
              <span className="text-xl">🛒</span>
              {cartItemsCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </Link>
            
            {isAuthenticated ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 rounded-lg text-white font-semibold hover:bg-red-700 transition"
              >
                Выйти
              </motion.button>
            ) : (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/login"
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-purple-600 rounded-lg text-white font-semibold hover:opacity-90 transition"
                >
                  Войти
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;