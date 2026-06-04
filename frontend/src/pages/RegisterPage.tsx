import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    first_name: '',
    last_name: '',
    patronimic: '',
    password: '',
    confirm_password: '',
    receive_newsletter: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    if (fieldErrors[name]) {
      setFieldErrors({ ...fieldErrors, [name]: [] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});

    if (formData.password !== formData.confirm_password) {
      setError('Пароли не совпадают');
      setLoading(false);
      return;
    }

    try {
      await authAPI.register({
        email: formData.email,
        phone: formData.phone,
        first_name: formData.first_name,
        last_name: formData.last_name,
        patronimic: formData.patronimic,
        password: formData.password,
        confirm_password: formData.confirm_password,
        receive_newsletter: formData.receive_newsletter,
      });
      
      const loginResponse = await authAPI.login(formData.email, formData.password);
      const { access, refresh } = loginResponse.data;
      
      authAPI.setTokens(access, refresh);
      navigate('/');
    } catch (err: any) {
      if (err.response?.status === 400) {
        const errorData = err.response.data;
        if (typeof errorData === 'object') {
          setFieldErrors(errorData);
          const messages: string[] = [];
          Object.entries(errorData).forEach(([field, errors]) => {
            if (Array.isArray(errors)) {
              messages.push(`${field}: ${errors.join(', ')}`);
            } else {
              messages.push(`${field}: ${errors}`);
            }
          });
          setError(messages.join('; '));
        } else {
          setError(String(errorData));
        }
      } else {
        setError('Ошибка соединения с сервером');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center py-8 md:py-12 px-4 md:px-6">
      <div className="max-w-md w-full bg-gray-800 rounded-lg md:rounded-xl p-6 md:p-8 shadow-xl">
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Регистрация</h1>
          <p className="text-gray-400 text-sm md:text-base">Создайте аккаунт для покупки билетов</p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-600 rounded-lg p-2 md:p-3 mb-4 md:mb-6">
            <p className="text-red-400 text-xs md:text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1 md:mb-2">Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm md:text-base"
              required
            />
            {fieldErrors.email && (
              <p className="text-red-400 text-xs mt-1">{fieldErrors.email.join(', ')}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1 md:mb-2">Телефон *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+7 XXX XXX XX XX"
              className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm md:text-base"
              required
            />
            {fieldErrors.phone && (
              <p className="text-red-400 text-xs mt-1">{fieldErrors.phone.join(', ')}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1 md:mb-2">Имя *</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm md:text-base"
                required
              />
              {fieldErrors.first_name && (
                <p className="text-red-400 text-xs mt-1">{fieldErrors.first_name.join(', ')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1 md:mb-2">Фамилия *</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm md:text-base"
                required
              />
              {fieldErrors.last_name && (
                <p className="text-red-400 text-xs mt-1">{fieldErrors.last_name.join(', ')}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1 md:mb-2">Отчество</label>
            <input
              type="text"
              name="patronimic"
              value={formData.patronimic}
              onChange={handleChange}
              className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm md:text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1 md:mb-2">Пароль *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm md:text-base"
              required
            />
            {fieldErrors.password && (
              <p className="text-red-400 text-xs mt-1">{fieldErrors.password.join(', ')}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1 md:mb-2">Подтверждение пароля *</label>
            <input
              type="password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm md:text-base"
              required
            />
            {fieldErrors.confirm_password && (
              <p className="text-red-400 text-xs mt-1">{fieldErrors.confirm_password.join(', ')}</p>
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer py-1">
            <input
              type="checkbox"
              name="receive_newsletter"
              checked={formData.receive_newsletter}
              onChange={handleChange}
              className="w-3 h-3 md:w-4 md:h-4 rounded border-gray-600 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-xs md:text-sm text-gray-300">Получать новости и акции</span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 md:py-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg font-semibold text-white text-sm md:text-base hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className="mt-4 md:mt-6 text-center">
          <p className="text-gray-400 text-xs md:text-sm">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}