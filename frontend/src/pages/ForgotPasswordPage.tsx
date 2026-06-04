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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center py-12 px-6">
        <div className="max-w-md w-full bg-gray-800 rounded-xl p-8 shadow-xl text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Код отправлен</h2>
          <p className="text-gray-400">
            Код для восстановления пароля отправлен на {email}. 
            Проверьте консоль сервера для получения кода.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="mt-6 px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition"
          >
            Вернуться ко входу
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center py-12 px-6">
      <div className="max-w-md w-full bg-gray-800 rounded-xl p-8 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Восстановление пароля</h1>
          <p className="text-gray-400">Введите email, чтобы получить код для сброса пароля</p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-600 rounded-lg p-3 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              placeholder="example@mail.com"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg font-semibold text-white hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Отправка...' : 'Отправить код'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-blue-400 hover:text-blue-300 transition">
            ← Вернуться ко входу
          </Link>
        </div>
      </div>
    </div>
  );
}