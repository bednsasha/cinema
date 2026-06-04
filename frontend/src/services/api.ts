import axios from 'axios';
import { Movie, Seat, Session } from '../types';

const API_URL = 'http://127.0.0.1:8000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const privateApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

privateApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

privateApi.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

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

export const authAPI = {
  login: (email: string, password: string) => 
    api.post('/token/', { email, password }),
  
  refresh: (refreshToken: string) => 
    api.post('/token/refresh/', { refresh: refreshToken }),
  
  register: (userData: any) => 
    api.post('/users/register/', userData),
  
  setTokens: (access: string, refresh: string) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  },
  
  clearTokens: () => {
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