import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // Use environment variable
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMessage = error.response?.data?.message || error.message;
    const errorStatus = error.response?.status;
    const errorData = {
      status: errorStatus,
      message: errorMessage,
      errors: error.response?.data?.errors || [],
      url: error.config?.url,
      payload: error.config?.data,
    };

    console.error('[API Error]', errorData);

    if (errorStatus === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login?session=expired';
    }

    return Promise.reject(error);
  }
);

export default apiClient;