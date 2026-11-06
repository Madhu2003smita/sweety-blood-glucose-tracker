import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  headers: { 'Content-Type': 'application/json' },
});

export function withToken(token) {
  api.defaults.headers.common.Authorization = `Bearer ${token}`;
  return api;
}

export function clearToken() {
  delete api.defaults.headers.common.Authorization;
}

export default api;
