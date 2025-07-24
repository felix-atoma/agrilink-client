import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import LoginForm from '../components/auth/LoginForm';

const Login = () => {
  const { t } = useTranslation();
  const { isAuthenticated, user, loading, error, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (isAuthenticated && user) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location]);

  const handleSubmit = async (email, password) => {
    setFormError('');
    if (!email || !password) {
      setFormError(t('auth.errors.required_fields'));
      return;
    }

    const result = await login({ email, password });
    if (!result.success) {
      setFormError(result.error || t('auth.errors.login_failed'));
    }
  };

  const sessionError = location.state?.reason === 'session-expired' 
    ? t('auth.errors.session_expired') 
    : null;

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">{t('auth.login_title')}</h1>
      
      {sessionError && (
        <div className="mb-4 bg-yellow-100 text-yellow-800 px-4 py-2 rounded">
          {sessionError}
        </div>
      )}
      
      {error && (
        <div className="mb-4 bg-red-100 text-red-800 px-4 py-2 rounded">
          {error}
        </div>
      )}
      
      {formError && (
        <div className="mb-4 bg-red-100 text-red-800 px-4 py-2 rounded">
          {formError}
        </div>
      )}

      <LoginForm 
        onSubmit={handleSubmit} 
        loading={loading} 
      />

      <p className="mt-4 text-center text-gray-600">
        {t('auth.no_account')}{' '}
        <a 
          href="/register" 
          className="text-green-600 hover:underline font-medium"
        >
          {t('auth.register_here')}
        </a>
      </p>
    </div>
  );
};

export default Login;