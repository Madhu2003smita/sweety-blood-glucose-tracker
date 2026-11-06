import axios from 'axios';

const apiBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '');

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
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
