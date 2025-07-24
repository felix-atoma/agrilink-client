import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://agrilink-1-zqcq.onrender.com/api/v1',
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => Promise.reject(error));

// Response interceptor
apiClient.interceptors.response.use(
  response => {
    // Standardize successful responses
    if (response.data && !response.data.success) {
      return Promise.reject({
        response: {
          status: 200,
          data: {
            message: 'Invalid response structure from server'
          }
        }
      });
    }
    return response;
  },
  error => {
    // Enhanced error handling
    const status = error.response?.status;
    let message = error.response?.data?.message || error.message;
    
    if (status === 401) {
      message = 'Session expired. Please login again';
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('unauthorized'));
    }
    
    const apiError = new Error(message);
    apiError.status = status;
    apiError.details = error.response?.data?.errors;
    return Promise.reject(apiError);
  }
);

export default apiClient;