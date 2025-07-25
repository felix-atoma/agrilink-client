import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Helper function to get dashboard path
  const getDashboardPath = (role) => {
    switch (role) {
      case 'farmer':
        return '/dashboard/farmer';
      case 'buyer':
        return '/dashboard/buyer';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/';
    }
  };

  // Initialize auth state
  const initializeAuth = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (token) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await apiClient.get('/auth/me');
        
        if (!response.data?.success || !response.data?.data) {
          throw new Error('Invalid user data from server');
        }
        
        setUser(response.data.data);
      }
    } catch (err) {
      console.error('Auth initialization error:', err);
      localStorage.removeItem('token');
      delete apiClient.defaults.headers.common['Authorization'];
      setUser(null);
      
      if (location.pathname !== '/login') {
        navigate('/login', {
          state: { from: location, sessionExpired: true }
        });
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, location]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Login function
  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);

      if (!credentials.email?.trim() || !credentials.password?.trim()) {
        throw new Error('Email and password are required');
      }

      const response = await apiClient.post('/auth/login', credentials);
      
      if (!response.data?.success || !response.data?.data?.token || !response.data?.data?.user) {
        throw new Error('Invalid server response structure');
      }

      const { user, token } = response.data.data;
      
      localStorage.setItem('token', token);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);

      const dashboardPath = getDashboardPath(user.role);
      navigate(dashboardPath, { replace: true });

      toast.success(`Welcome back, ${user.name}!`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      return { success: true, user };
    } catch (err) {
      let errorMessage = 'Login failed';
      
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Invalid email or password';
        } else {
          errorMessage = err.response.data?.message || errorMessage;
        }
      } else {
        errorMessage = err.message;
      }

      setError(errorMessage);
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Register function (without verification endpoint)
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      // Validate required fields client-side first
      const requiredFields = ['name', 'email', 'password', 'confirmPassword', 'role', 'contact'];
      const missingFields = requiredFields.filter(field => !userData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Password confirmation check
      if (userData.password !== userData.confirmPassword) {
        throw new Error('Password and confirmation do not match');
      }

      // Build complete payload
      const payload = {
        name: userData.name.trim(),
        email: userData.email.trim().toLowerCase(),
        password: userData.password,
        role: userData.role,
        contact: userData.contact,
        ...(userData.role === 'farmer' && {
          farmName: userData.farmName?.trim(),
          lat: userData.lat,
          lng: userData.lng
        })
      };

      const response = await apiClient.post('/auth/register', payload);
      
      // Validate server response
      if (!response.data?.success) {
        const serverError = response.data?.error || 
                          (response.data?.errors ? response.data.errors.map(e => e.message).join(', ') : null) ||
                          'Registration failed';
        throw new Error(serverError);
      }

      // Check if we got token and user data directly from registration
      if (response.data.data?.token && response.data.data?.user) {
        const { user, token } = response.data.data;
        
        localStorage.setItem('token', token);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(user);

        const dashboardPath = getDashboardPath(user.role);
        navigate(dashboardPath, { 
          state: { 
            welcome: true,
            newUser: true 
          }, 
          replace: true 
        });

        toast.success(
          <div>
            <h4>Welcome to AgriLink, {user.name}!</h4>
            <p>Your {user.role} account was successfully created</p>
          </div>, 
          {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          }
        );

        return { success: true, user };
      }

      // If no token in response but registration was successful
      // (e.g., when email verification is required)
      toast.success(
        <div>
          <h4>Registration Successful!</h4>
          <p>Please check your email to verify your account</p>
        </div>, 
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );

      navigate('/login', { state: { registrationSuccess: true } });
      return { success: true };

    } catch (err) {
      let errorMessage = 'Registration failed';
      
      // Parse different error formats
      if (err.response) {
        // Handle validation errors
        if (err.response.status === 400) {
          if (err.response.data?.errors) {
            errorMessage = err.response.data.errors
              .map(error => `${error.param ? `${error.param}: ` : ''}${error.msg || error.message}`)
              .join('\n');
          } else if (err.response.data?.message) {
            errorMessage = err.response.data.message;
          }
        } 
        // Handle duplicate email
        else if (err.response.status === 409) {
          errorMessage = 'This email is already registered. Please login instead.';
        }
        // Handle other API errors
        else {
          errorMessage = err.response.data?.message || errorMessage;
        }
      } else {
        errorMessage = err.message;
      }

      console.error('Registration error:', errorMessage);
      setError(errorMessage);

      toast.error(
        <div>
          <h4>Registration Error</h4>
          <p>{errorMessage}</p>
        </div>,
        {
          position: "top-right",
          autoClose: 8000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    delete apiClient.defaults.headers.common['Authorization'];
    setUser(null);
    navigate('/login', {
      state: { 
        loggedOut: true,
        from: location.pathname 
      }
    });
  };

  // Context value
  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    refreshAuth: initializeAuth,
    getDashboardPath
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};