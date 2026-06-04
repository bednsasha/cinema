import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

const API_URL = 'http://127.0.0.1:8000/api';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const email = searchParams.get('email') || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/users/reset-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code,
          new_password: newPassword,
          confirm_new_password: confirmPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(data.error || data.detail || 'Ошибка сброса пароля');
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
          <h2 className="text-2xl font-bold text-white mb-2">Пароль изменён!</h2>
          <p className="text-gray-400 mb-6">Ваш пароль успешно изменён. Перенаправляем на страницу входа...</p>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition"
          >
            Войти
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center py-12 px-6">
      <div className="max-w-md w-full bg-gray-800 rounded-xl p-8 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Сброс пароля</h1>
          <p className="text-gray-400">Введите код и новый пароль</p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-600 rounded-lg p-3 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Код подтверждения</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-center text-2xl tracking-widest"
              placeholder="000000"
              maxLength={6}
              required
            />
            <p className="text-gray-500 text-xs mt-1">Код отправлен в консоль сервера</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Новый пароль</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              placeholder="Минимум 6 символов"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Подтвердите пароль</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              placeholder="Повторите пароль"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg font-semibold text-white hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Сброс...' : 'Сбросить пароль'}
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