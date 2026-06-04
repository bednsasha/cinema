import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login(email, password);
      const { access, refresh } = response.data;
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      const savedAccess = localStorage.getItem('access_token');
      if (!savedAccess) {
        setError('Ошибка сохранения токена');
        setLoading(false);
        return;
      }
      
      const from = localStorage.getItem('redirectAfterLogin') || '/';
      localStorage.removeItem('redirectAfterLogin');
      
      navigate(from);
      window.location.reload();
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Неверный email или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center py-8 md:py-12 px-4 md:px-6">
      <div className="max-w-md w-full bg-gray-800 rounded-lg md:rounded-xl p-6 md:p-8 shadow-xl">
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Вход в систему</h1>
          <p className="text-gray-400 text-sm md:text-base">Войдите, чтобы купить билеты</p>
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

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1 md:mb-2">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm md:text-base"
              placeholder="Введите пароль"
              required
            />
          </div>

          <div className="text-right">
            <Link to="/forgot-password" className="text-xs md:text-sm text-blue-400 hover:text-blue-300 transition">
              Забыли пароль?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 md:py-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg font-semibold text-white text-sm md:text-base hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div className="mt-4 md:mt-6 text-center">
          <p className="text-gray-400 text-xs md:text-sm">
            Нет аккаунта?{' '}
            <Link to="/register" className="text-blue-400 hover:text-blue-300">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}