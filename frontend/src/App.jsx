import { useEffect, useState } from 'react';
import AuthPage from './AuthPage';
import Dashboard from './Dashboard';
import api, { clearToken, withToken } from './api';

function authenticationError(error) {
  const response = error.response;
  const message = response?.data?.message;
  if (message) return message;

  if (response?.data?.errors && typeof response.data.errors === 'object') {
    return Object.values(response.data.errors).join(' ');
  }

  if (response) return `The server returned an unexpected response (${response.status}). Please try again.`;
  if (error.code === 'ECONNABORTED') return 'The server took too long to respond. Please try again.';
  return 'Unable to reach the server. Check that the backend is running at http://localhost:5000.';
}

export default function App() {
  const [session, setSession] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('sweety-session'));
      return saved?.token && saved?.user ? saved : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (session?.token) withToken(session.token);
    else clearToken();
  }, [session]);

  async function authenticate(mode, fields) {
    try {
      const response = await api.post(`/auth/${mode}`, fields);
      const nextSession = { user: response.data.user, token: response.data.token };
      localStorage.setItem('sweety-session', JSON.stringify(nextSession));
      setSession(nextSession);
      return {};
    } catch (error) {
      return { error: authenticationError(error) };
    }
  }

  function logout() {
    localStorage.removeItem('sweety-session');
    clearToken();
    setSession(null);
  }

  return session
    ? <Dashboard user={session.user} token={session.token} onLogout={logout} />
    : <AuthPage onAuthenticate={authenticate} />;
}
