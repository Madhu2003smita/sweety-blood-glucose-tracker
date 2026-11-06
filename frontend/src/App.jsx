import { useEffect, useState } from 'react';
import AuthPage from './AuthPage';
import Dashboard from './Dashboard';
import api, { clearToken, withToken } from './api';

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
      return { error: error.response?.data?.message || 'Unable to connect. Please try again.' };
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
