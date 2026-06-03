// src/services/api.ts
import axios from 'axios';
import { Movie, Seat, Session } from '../types';

const API_URL = 'http://127.0.0.1:8000/api';

// Публичный API (без токена)
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Приватный API (с токеном для авторизованных запросов)
export const privateApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем токен ТОЛЬКО для приватного API
privateApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    console.log('Token from localStorage:', token ? 'exists' : 'not found');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Authorization header set');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

privateApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('Got 401, but NOT redirecting automatically');
      // НЕ ОЧИЩАЕМ токены и НЕ РЕДИРЕКТИМ
      // localStorage.removeItem('access_token');
      // localStorage.removeItem('refresh_token');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Остальные API методы...
export const movieAPI = {
  getAll: () => api.get<Movie[]>('/movies/films/'),
  getById: (id: number) => api.get<Movie>(`/movies/films/${id}/`),
  getNowShowing: () => api.get<Movie[]>('/movies/films/now-showing/'),
};

export const sessionAPI = {
  getByFilm: (filmId: number) => 
    api.get<Session[]>(`/showtimes/sessions/?rental__film=${filmId}`),
  getById: (id: number) => api.get<Session>(`/showtimes/sessions/${id}/`),
  getAll: (params?: any) => api.get<Session[]>('/showtimes/sessions/', { params }),
  getByDate: (date: string) => api.get<Session[]>(`/showtimes/sessions/?date=${date}`),
  getTodaySessions: () => {
    const today = new Date().toISOString().split('T')[0];
    return api.get<Session[]>(`/showtimes/sessions/?date=${today}`);
  },
  getBookedSeats: (sessionId: number) => 
    api.get(`/showtimes/sessions/${sessionId}/booked-seats/`),
};

export const hallAPI = {
  getAll: () => api.get('/cinema/halls/'),
  getById: (id: number) => api.get(`/cinema/halls/${id}/`),
  getSeats: (hallId: number) => api.get<Seat[]>(`/cinema/halls/${hallId}/seats/`),
};

// КОРЗИНА - использует приватный API с токеном
export const cartAPI = {
  getCart: () => privateApi.get('/cart/'),
  addToCart: (sessionId: number, seatId: number) => 
    privateApi.post('/cart/add/', { session_id: sessionId, seat_id: seatId }),
  removeFromCart: (bookingId: number) => 
    privateApi.delete(`/cart/remove/${bookingId}/`),
  clearCart: () => privateApi.post('/cart/clear/'),
  applyDiscount: (isDiscount: boolean, discountPercent?: number) => 
    privateApi.post('/cart/apply-discount/', { is_discount: isDiscount, discount_percent: discountPercent }),
};

// Авторизация - публичный API
export const authAPI = {
  login: (email: string, password: string) => 
    api.post('/token/', { email, password }),
  
  refresh: (refreshToken: string) => 
    api.post('/token/refresh/', { refresh: refreshToken }),
  
  register: (userData: any) => 
    api.post('/users/register/', userData),
  
  // src/services/api.ts - в authAPI
setTokens: (access: string, refresh: string) => {
  console.log('🔵 setTokens called');
  console.log('🔵 access token:', access?.substring(0, 50));
  console.log('🔵 refresh token:', refresh?.substring(0, 50));
  
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
  
  // Проверяем
  const test = localStorage.getItem('access_token');
  console.log('🔵 Verification - stored:', test ? 'YES' : 'NO');
},
  
  clearTokens: () => {
    console.log('Clearing tokens');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
  
  isAuthenticated: () => {
    const token = localStorage.getItem('access_token');
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;
      return Date.now() < exp;
    } catch {
      return false;
    }
  },
};