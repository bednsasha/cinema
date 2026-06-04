export interface Genre {
  id: number;
  name: string;
  slug: string;
}

export interface Movie {
  id: number;
  name: string;
  description: string;
  duration: number;
  rating: string;
  release_year: number;
  country: string;
  director: string;
  age_limit: string;
  age_limit_display: string;
  poster: string | null;
  trailer_url: string;
  genres: Genre[];
}

export interface Rental {
  id: number;
  film: number;
  film_name: string;
  date_rental_start: string;
  date_rental_end: string;
}

export interface ScreenType {
  id: number;
  name: string;
  slug: string;
}

export interface Hall {
  id: number;
  name: string;
  slug: string;
  screen_types: ScreenType[];
}

export interface Session {
  id: number;
  hall: number;
  hall_name: string;
  rental: number;
  film_name: string;
  screen_type: number;
  screen_type_name: string;
  start_time: string;
  is_past?: boolean;
}

export interface SeatType {
  id: number;
  name: string;
  display_name: string;
  slug: string;
}

export interface Seat {
  id: number;
  hall: number;
  hall_name: string;
  row_number: number;
  seat_number: number;
  seat_type: number;
  seat_type_detail: SeatType;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
}

export interface SeatWithStatus extends Seat {
  isBooked: boolean;
  isSelected: boolean;
  bookingId?: number;
}

export interface CartBooking {
  id: number;
  session: number;
  seat: number;
  price: number;
  seat_detail: Seat;
}

export interface Cart {
  id: number;
  total_items: number;
  total_price: number;
  is_discount: boolean;
  discount_percent: number;
  send_to_email: string;
  status: string;
  expires_at: string;
  bookings: CartBooking[];
}

export interface Ticket {
  id: number;
  qr_code: string;
  status: string;
  price: string;
  session_time: string;
  film_name: string;
  hall_name: string;
  row_number: number;
  seat_number: number;
  is_past?: boolean;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
}

export interface BookingHistory {
  id: number;
  session: number;
  seats: string[];
  total_price: number;
  user_name: string;
  user_email: string;
  booking_time: string;
}
export interface CartBooking {
  id: number;
  session: number;
  seat: number;
  price: number;
  seat_detail: Seat;
  session_detail: {
    id: number;
    film_name: string;
    hall_name: string;
    screen_type_name: string;
    start_time: string;
  };
}