import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const authApi = axios.create({
  baseURL: `${API_URL}/api/auth`,
});

// Request interceptor for API calls
authApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const register = async (userData: any) => {
  const response = await authApi.post('/register', userData);
  return response.data;
};

export const login = async (userData: any) => {
  const response = await authApi.post('/login', userData);
  return response.data;
};

export const logout = async () => {
  const response = await authApi.post('/logout');
  return response.data;
};

export const getMe = async () => {
  const response = await authApi.get('/me');
  return response.data;
};
