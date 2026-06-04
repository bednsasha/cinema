import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Navbar from './components/Navbar';
import MovieDetailPage from './pages/MovieDetailPage';
import SchedulePage from './pages/SchedulePage';
import BookingPage from './pages/BookingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CartPage from './pages/CartPage';
import PaymentPage from './pages/PaymentSuccessPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import ProfilePage from './pages/ProfilePage';
import MoviesPage from './pages/MoviesPage';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
gsap.registerPlugin(ScrollTrigger);
const meta = document.createElement('meta');
meta.name = 'viewport';
meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes';
document.head.appendChild(meta);

function App() {
  return (
    <BrowserRouter>
    <div className="min-h-screen bg-black">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/movies" element={<MoviesPage />} />
        <Route path="/movie/:id" element={<MovieDetailPage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/booking/:sessionId" element={<BookingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/payment" element={<PaymentPage />} />
<Route path="/payment/success" element={<PaymentSuccessPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
<Route path="/reset-password" element={<ResetPasswordPage />} />
      
      </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;