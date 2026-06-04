import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { authAPI, cartAPI } from '../services/api';

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef<HTMLElement>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadCartCount = async () => {
    if (!authAPI.isAuthenticated()) {
      setCartItemsCount(0);
      return;
    }
    try {
      const response = await cartAPI.getCart();
      setCartItemsCount(response.data.total_items || 0);
    } catch (error) {
      setCartItemsCount(0);
    }
  };

  useEffect(() => {
    const checkAuth = () => {
      const isAuth = authAPI.isAuthenticated();
      setIsAuthenticated(isAuth);
      if (isAuth) {
        loadCartCount();
      }
      setIsLoaded(true);
    };
    
    checkAuth();
    
    window.addEventListener('cartUpdated', loadCartCount);
    window.addEventListener('storage', checkAuth);
    
    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('cartUpdated', loadCartCount);
    };
  }, []);

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
    { path: '/', label: 'Главная', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ) },
    { path: '/movies', label: 'Фильмы', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
      </svg>
    ) },
    { path: '/schedule', label: 'Расписание', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ) },
  ];

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  if (!isLoaded) {
    return (
      <div className="bg-black/50 backdrop-blur-lg border-b border-gray-800 sticky top-0 z-50 h-16 md:h-20" />
    );
  }

  return (
    <>
      <motion.nav
        ref={navRef}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-black/80 backdrop-blur-lg border-b border-gray-800 sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent hover:opacity-80 transition">
              Cinema
            </Link>
            
            <div className="hidden md:flex items-center gap-6 lg:gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 transition-colors ${
                    location.pathname === item.path ? 'text-blue-500' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
            
            <div className="flex items-center gap-3 md:gap-4">
              <Link to="/cart" className="relative text-gray-300 hover:text-white transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {cartItemsCount > 0 && (
                  <span className="absolute -top-2 -right-3 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItemsCount}
                  </span>
                )}
              </Link>
              
              <div className="hidden md:block">
                {isAuthenticated ? (
                  <div className="flex items-center gap-3">
                    <Link to="/profile" className="text-gray-300 hover:text-white transition">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="px-3 py-1.5 bg-blue-600 rounded-lg text-white text-sm font-semibold hover:bg-blue-700 transition"
                    >
                      Выйти
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition"
                  >
                    Войти
                  </Link>
                )}
              </div>
              
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden text-gray-300 hover:text-white transition p-2"
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

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/70 z-40 md:hidden"
            />
            
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className="fixed right-0 top-0 h-full w-64 bg-gray-900 shadow-xl z-50 md:hidden"
            >
              <div className="p-4 pt-16">
                {isAuthenticated ? (
                  <div className="mb-6 pb-4 border-b border-gray-700">
                    <div className="flex items-center gap-3 mb-3">
                      <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
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
                      {item.icon}
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  ))}
                  
                  <Link
                    to="/cart"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <span className="font-medium">Корзина</span>
                    {cartItemsCount > 0 && (
                      <span className="ml-auto bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {cartItemsCount}
                      </span>
                    )}
                  </Link>
                  
                  {isAuthenticated && (
                    <>
                      <Link
                        to="/profile"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 transition"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="font-medium">Мои билеты</span>
                      </Link>
                      
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-gray-800 transition"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
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