import axios from 'axios';

// In development use a relative /api base so Vite's dev server proxy (vite.config.mjs)
// forwards requests to the backend without invoking browser CORS. In production
// use the configured VITE_API_URL or fallback to localhost.
const API_BASE = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:5001');

const api = axios.create({
  baseURL: (API_BASE ? API_BASE + '/api' : '/api'),
  // Do not force Content-Type globally so multipart/form-data (FormData) requests
  // from admin forms work correctly and let the browser set the boundary.
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