// Axios ka ek hi instance poori app ke liye.
// - Har request mein JWT token (Authorization: Bearer ...) khud lag jata hai
// - 401 aaye to app ko "session expired" ka signal milta hai
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

export const TOKEN_KEY = 'fitcloud_token';

const api = axios.create({ baseURL: API_BASE_URL, timeout: 20000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isLoginOrRegister = url.startsWith('/auth/login') || url.startsWith('/auth/register');
    // Login/register ka 401 ("Invalid email or password") session expiry nahi hai
    if (error.response?.status === 401 && !isLoginOrRegister) {
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(error);
  }
);

// Error se user ke liye friendly message nikalta hai
export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (error?.code === 'ECONNABORTED') return 'The request took too long. Please try again.';
  if (error?.response) return error.response.data?.message || fallback;
  if (error?.request) return 'Cannot reach the server. Please check your connection.';
  return error?.message || fallback;
};

export default api;
