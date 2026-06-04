import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { authAPI, cartAPI } from '../services/api';

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef<HTMLElement>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Функция загрузки количества товаров в корзине
  const loadCartCount = async () => {
    if (!authAPI.isAuthenticated()) {
      setCartItemsCount(0);
      return;
    }
    try {
      const response = await cartAPI.getCart();
      setCartItemsCount(response.data.total_items || 0);
    } catch (error) {
      console.error('Error loading cart count:', error);
      setCartItemsCount(0);
    }
  };

  useEffect(() => {
    gsap.fromTo(navRef.current,
      { y: -100 },
      { y: 0, duration: 0.8, ease: 'bounce.out' }
    );
    
    const checkAuth = () => {
      const isAuth = authAPI.isAuthenticated();
      setIsAuthenticated(isAuth);
      if (isAuth) {
        loadCartCount();
      } else {
        setCartItemsCount(0);
      }
    };
    
    checkAuth();
    
    // Слушаем событие обновления корзины
    window.addEventListener('cartUpdated', loadCartCount);
    window.addEventListener('storage', checkAuth);
    
    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('cartUpdated', loadCartCount);
    };
  }, []);

  // Загружаем количество при изменении авторизации
  useEffect(() => {
    if (isAuthenticated) {
      loadCartCount();
    } else {
      setCartItemsCount(0);
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    authAPI.clearTokens();
    setIsAuthenticated(false);
    setCartItemsCount(0);
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  const navItems = [
    { path: '/', label: 'Главная', icon: '🏠' },
    { path: '/movies', label: 'Фильмы', icon: '🎬' },
    { path: '/schedule', label: 'Расписание', icon: '📅' },
  ];

  // Закрываем меню при смене страницы
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      <motion.nav
        ref={navRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-black/50 backdrop-blur-lg border-b border-gray-800 sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex justify-between items-center">
            {/* Логотип */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/" className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
                CinemaDRF
              </Link>
            </motion.div>
            
            {/* Десктопное меню */}
            <div className="hidden md:flex items-center gap-6 lg:gap-8">
              {navItems.map((item) => (
                <motion.div
                  key={item.path}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to={item.path}
                    className={`relative px-3 py-2 transition-colors ${
                      location.pathname === item.path ? 'text-blue-500' : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    {item.label}
                    {location.pathname === item.path && (
                      <motion.div
                        layoutId="underline"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                  </Link>
                </motion.div>
              ))}
            </div>
            
            {/* Правая часть (корзина + профиль) */}
            <div className="flex items-center gap-3 md:gap-4">
              {/* Корзина */}
              <Link to="/cart" className="relative text-gray-300 hover:text-white transition">
                <span className="text-xl md:text-2xl">🛒</span>
                {cartItemsCount > 0 && (
                  <span className="absolute -top-2 -right-3 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItemsCount}
                  </span>
                )}
              </Link>
              
              {/* Десктопный профиль */}
              <div className="hidden md:block">
                {isAuthenticated ? (
                  <div className="flex items-center gap-3">
                    <Link 
                      to="/profile" 
                      className="text-gray-300 hover:text-white transition flex items-center gap-1"
                    >
                      <span className="text-xl">👤</span>
                      <span className="text-sm">Профиль</span>
                    </Link>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleLogout}
                      className="px-3 py-1.5 bg-blue-600 rounded-lg text-white text-sm font-semibold hover:bg-blue-700 transition"
                    >
                      Выйти
                    </motion.button>
                  </div>
                ) : (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      to="/login"
                      className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition"
                    >
                      Войти
                    </Link>
                  </motion.div>
                )}
              </div>
              
              {/* Мобильное меню кнопка */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden text-gray-300 hover:text-white transition p-2"
                aria-label="Меню"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Мобильное боковое меню */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Затемнение фона */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/70 z-40 md:hidden"
            />
            
            {/* Боковое меню */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className="fixed right-0 top-0 h-full w-64 bg-gray-900 shadow-xl z-50 md:hidden"
            >
              <div className="p-4 pt-16">
                {/* Профиль в мобильном меню */}
                {isAuthenticated ? (
                  <div className="mb-6 pb-4 border-b border-gray-700">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">👤</span>
                      <div>
                        <p className="text-white font-semibold">Профиль</p>
                        <p className="text-gray-400 text-sm">Ваши билеты</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6">
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full text-center px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg text-white font-semibold"
                    >
                      Войти
                    </Link>
                  </div>
                )}
                
                {/* Навигационные ссылки */}
                <div className="space-y-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                        location.pathname === item.path
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-gray-800'
                      }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  ))}
                  
                  {/* Корзина в мобильном меню */}
                  <Link
                    to="/cart"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 transition"
                  >
                    <span className="text-xl">🛒</span>
                    <span className="font-medium">Корзина</span>
                    {cartItemsCount > 0 && (
                      <span className="ml-auto bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {cartItemsCount}
                      </span>
                    )}
                  </Link>
                  
                  {/* Профиль в мобильном меню (для авторизованных) */}
                  {isAuthenticated && (
                    <>
                      <Link
                        to="/profile"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 transition"
                      >
                        <span className="text-xl">👤</span>
                        <span className="font-medium">Мои билеты</span>
                      </Link>
                      
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-blue-400 hover:bg-gray-800 transition"
                      >
                        <span className="text-xl">🚪</span>
                        <span className="font-medium">Выйти</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;