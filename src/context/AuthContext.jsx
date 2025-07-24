import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [state, setState] = useState({
    user: null,
    loading: true,
    error: null
  });
  const navigate = useNavigate();
  const location = useLocation();

  const getDashboardPath = (role) => {
    switch (role) {
      case 'farmer': return '/dashboard/farmer';
      case 'buyer': return '/dashboard/buyer';
      case 'admin': return '/admin';
      default: return '/';
    }
  };

  const initializeAuth = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await apiClient.get('/auth/me');
      if (!response.data?.data?.user) {
        throw new Error('Invalid user data');
      }
      setState({ user: response.data.data.user, loading: false, error: null });
    } catch (error) {
      localStorage.removeItem('token');
      setState({ user: null, loading: false, error: error.message });
      
      if (!['/login', '/register'].includes(location.pathname)) {
        navigate('/login', {
          state: { from: location, reason: 'session-expired' },
          replace: true
        });
      }
    }
  }, [navigate, location]);

  useEffect(() => {
    initializeAuth();
    
    const handleUnauthorized = () => {
      setState({ user: null, loading: false, error: 'Session expired' });
      navigate('/login', { state: { reason: 'session-expired' } });
    };
    
    window.addEventListener('unauthorized', handleUnauthorized);
    return () => window.removeEventListener('unauthorized', handleUnauthorized);
  }, [initializeAuth, navigate]);

  const login = async (credentials) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await apiClient.post('/auth', credentials);
      if (!response.data?.data?.token || !response.data?.data?.user) {
        throw new Error('Invalid response data');
      }
      
      localStorage.setItem('token', response.data.data.token);
      setState({ 
        user: response.data.data.user, 
        loading: false, 
        error: null 
      });
      
      const from = location.state?.from?.pathname || getDashboardPath(response.data.data.user.role);
      navigate(from, { replace: true });
      
      toast.success('Login successful');
      return { success: true };
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      toast.error(error.message);
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await apiClient.post('/auth/register', userData);
      if (!response.data?.data?.token || !response.data?.data?.user) {
        throw new Error('Invalid response data');
      }
      
      localStorage.setItem('token', response.data.data.token);
      setState({ 
        user: response.data.data.user, 
        loading: false, 
        error: null 
      });
      
      navigate(getDashboardPath(response.data.data.user.role), { 
        state: { welcome: true },
        replace: true 
      });
      
      toast.success('Registration successful');
      return { success: true };
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      toast.error(error.message);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      setState({ user: null, loading: false, error: null });
      navigate('/login', { state: { loggedOut: true } });
      toast.info('Logged out successfully');
    }
  };

  const value = {
    ...state,
    isAuthenticated: !!state.user,
    login,
    register,
    logout,
    refreshAuth: initializeAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};