import axios from 'axios';
import type { Movie, Session, Hall, Seat, Rental } from '../types';

const API_URL = 'http://127.0.0.1:8000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});


export const movieAPI = {
  getAll: () => api.get<Movie[]>('/movies/films/'),
  getById: (id: number) => api.get<Movie>(`/movies/films/${id}/`),
  getNowShowing: () => api.get<Movie[]>('/movies/films/now-showing/'), // новый эндпоинт
};

export const sessionAPI = {
  getByFilm: (filmId: number) => 
    api.get<Session[]>(`/showtimes/sessions/?rental__film=${filmId}`),
  getById: (id: number) => 
    api.get<Session>(`/showtimes/sessions/${id}/`),
  
  getAll: (params?: any) => 
    api.get<Session[]>('/showtimes/sessions/', { params }),
  
  getByDate: (date: string) => 
    api.get<Session[]>(`/showtimes/sessions/?date=${date}`),
  
  getByDateRange: (startDate: string, endDate: string) => 
    api.get<Session[]>(`/showtimes/sessions/?date_gte=${startDate}&date_lte=${endDate}`),
getTodaySessions: () => {
    const today = new Date().toISOString().split('T')[0];
    return api.get<Session[]>(`/showtimes/sessions/?date=${today}`);
  },
  getBookedSeats: (sessionId: number) => 
    api.get<{ booked_seat_ids: number[] }>(`/showtimes/sessions/${sessionId}/booked-seats/`),
};

export const rentalAPI = {
  getAll: () => api.get<Rental[]>('/showtimes/rentals/'),
  getCurrent: () => {
    const today = new Date().toISOString().split('T')[0];
    return api.get<Rental[]>(`/showtimes/rentals/?date_rental_end__gte=${today}`);
  },
};
export const hallAPI = {
  getAll: () => api.get('/cinema/halls/'),
  getById: (id: number) => api.get(`/cinema/halls/${id}/`),
  getSeats: (hallId: number) => api.get<Seat[]>(`/cinema/halls/${hallId}/seats/`),
};
export const cartAPI = {
  // Получить текущую корзину
  getCart: () => api.get('/cart/'),
  
  // Добавить место в корзину
  addToCart: (sessionId: number, seatId: number) => 
    api.post('/cart/add/', { session_id: sessionId, seat_id: seatId }),
  
  // Удалить место из корзины
  removeFromCart: (bookingId: number) => 
    api.delete(`/cart/remove/${bookingId}/`),
  
  // Очистить корзину
  clearCart: () => api.post('/cart/clear/'),
  
  // Применить скидку
  applyDiscount: (isDiscount: boolean, discountPercent?: number) => 
    api.post('/cart/apply-discount/', { is_discount: isDiscount, discount_percent: discountPercent }),
};