// src/pages/LoginPage.tsx
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
      console.log('1. Sending login request...');
      const response = await authAPI.login(email, password);
      console.log('2. Response received:', response);
      
      const { access, refresh } = response.data;
      console.log('3. Access token:', access?.substring(0, 50) + '...');
      
      console.log('4. Saving tokens...');
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      // Проверяем сразу после сохранения
      const savedAccess = localStorage.getItem('access_token');
      console.log('5. Saved access token:', savedAccess ? 'YES' : 'NO');
      
      if (!savedAccess) {
        console.error('❌ Token not saved!');
        setError('Ошибка сохранения токена');
        setLoading(false);
        return;
      }
      
      console.log('6. Tokens saved successfully!');
      
      const from = localStorage.getItem('redirectAfterLogin') || '/';
      localStorage.removeItem('redirectAfterLogin');
      
      console.log('7. Navigating to:', from);
      // Используем navigate вместо window.location.href
      navigate(from);
      // Принудительно перезагружаем, чтобы обновить состояние навбара
      window.location.reload();
      
    } catch (err: any) {
      console.error('❌ Login error:', err);
      setError(err.response?.data?.detail || 'Неверный email или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center py-12 px-6">
      <div className="max-w-md w-full bg-gray-800 rounded-xl p-8 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Вход в систему</h1>
          <p className="text-gray-400">Войдите, чтобы купить билеты</p>
        </div>

        {error && (
          <div className="bg-blue-900/50 border border-blue-600 rounded-lg p-3 mb-6">
            <p className="text-blue-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
              placeholder="example@mail.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
              placeholder="Введите пароль"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg font-semibold text-white hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
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