import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const api = axios.create({
  baseURL: API_BASE + '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

export function setAuthToken(token) {
  if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete api.defaults.headers.common['Authorization'];
}

// Intercept 401 responses and clear auth so UI can prompt login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const message = err?.response?.data?.message;
    if (status === 401 && message && /token/i.test(message)) {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];
        // best-effort navigate to login
        window.location.href = '/login';
      } catch (e) {
        // ignore
      }
    }
    return Promise.reject(err);
  }
);

export default api;