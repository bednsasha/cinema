import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import MovieDetailPage from './pages/MovieDetailPage';
import SchedulePage from './pages/SchedulePage';
import BookingPage from './pages/BookingPage';
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/movie/:id" element={<MovieDetailPage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/booking/:sessionId" element={<BookingPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;