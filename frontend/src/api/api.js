import axios from 'axios';

// In production, use relative paths (/api). In development, use localhost:5001
const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Use relative API path in production (served from same origin)
  if (import.meta.env.MODE === 'production') {
    return '';
  }
  return 'http://localhost:5001';
};

const api = axios.create({
  baseURL: getBaseURL(),
  // Do not force Content-Type globally so multipart/form-data (FormData) requests
  // from admin forms work correctly and let the browser set the boundary.
  withCredentials: false,
});
export function setAuthToken(token) {
  if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete api.defaults.headers.common['Authorization'];
}

// Initialize Authorization header from localStorage token (so callers don't need to call setAuthToken)
const initialToken = localStorage.getItem('token');
if (initialToken) api.defaults.headers.common['Authorization'] = `Bearer ${initialToken}`;

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