import axios from 'axios';

export const TOKEN_KEY = 'ev_token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    // Session expired / invalid token → drop it and send the user to sign in.
    if (error.response?.status === 401 && localStorage.getItem(TOKEN_KEY)
        && !error.config?.url?.startsWith('/auth/')) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.assign('/login?expired=1');
    }
    return Promise.reject(error);
  },
);

/** Turns an axios error into { message, code, fieldErrors } from the backend's ApiError body. */
export function parseError(error) {
  const data = error?.response?.data;
  if (data && typeof data === 'object') {
    return {
      message: data.message || 'Something went wrong',
      code: data.code || null,
      fieldErrors: data.fieldErrors || {},
    };
  }
  return {
    message: error?.response ? 'Something went wrong' : 'Cannot reach the server. Is the backend running?',
    code: null,
    fieldErrors: {},
  };
}

export default api;
