import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const API_URL = 'http://127.0.0.1:8000/api';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/users/forgot-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => navigate('/reset-password?email=' + encodeURIComponent(email)), 2000);
      } else {
        setError(data.error || 'Пользователь с таким email не найден');
      }
    } catch (error) {
      setError('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center py-8 md:py-12 px-4 md:px-6">
        <div className="max-w-md w-full bg-gray-800 rounded-lg md:rounded-xl p-6 md:p-8 shadow-xl text-center">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
            <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Код отправлен</h2>
          <p className="text-gray-400 text-sm md:text-base">
            Код для восстановления пароля отправлен на {email}. 
            Проверьте консоль сервера для получения кода.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 md:mt-6 px-3 md:px-4 py-1.5 md:py-2 bg-blue-600 rounded-lg text-white text-sm md:text-base hover:bg-blue-700 transition"
          >
            Вернуться ко входу
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center py-8 md:py-12 px-4 md:px-6">
      <div className="max-w-md w-full bg-gray-800 rounded-lg md:rounded-xl p-6 md:p-8 shadow-xl">
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Восстановление пароля</h1>
          <p className="text-gray-400 text-sm md:text-base">Введите email, чтобы получить код для сброса пароля</p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-600 rounded-lg p-2 md:p-3 mb-4 md:mb-6">
            <p className="text-red-400 text-xs md:text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1 md:mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm md:text-base"
              placeholder="example@mail.com"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 md:py-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg font-semibold text-white text-sm md:text-base hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Отправка...' : 'Отправить код'}
          </button>
        </form>

        <div className="mt-4 md:mt-6 text-center">
          <Link to="/login" className="text-sm text-blue-400 hover:text-blue-300 transition">
            ← Вернуться ко входу
          </Link>
        </div>
      </div>
    </div>
  );
}