import { useState } from 'react';
import { Activity, ArrowRight, Eye, EyeOff, HeartPulse, ShieldCheck } from 'lucide-react';

export default function AuthPage({ onAuthenticate }) {
  const [mode, setMode] = useState('login');
  const [fields, setFields] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const result = await onAuthenticate(mode, fields);
    if (result?.error) setError(result.error);
    setBusy(false);
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    setError('');
    setShowPassword(false);
  }

  return (
    <main className="auth-page">
      <section className="auth-story">
        <a className="brand brand-light" href="/" aria-label="Sweety home">
          <span className="brand-mark"><HeartPulse size={22} /></span>
          <span>Sweety</span>
        </a>
        <div className="story-copy">
          <span className="eyebrow eyebrow-light"><span className="pulse-dot" /> YOUR HEALTH, IN YOUR HANDS</span>
          <h1>A little more clarity.<br /><em>A lot more peace.</em></h1>
          <p>Keep track of your glucose readings and notice your patterns, one gentle step at a time.</p>
          <div className="story-note">
            <div className="note-icon"><Activity size={20} /></div>
            <div><strong>Small moments add up</strong><span>Your daily check-ins make it easier to see the bigger picture.</span></div>
          </div>
        </div>
        <div className="story-footer"><ShieldCheck size={15} /> Your health data is private and secure.</div>
        <div className="decor decor-one" /><div className="decor decor-two" />
      </section>

      <section className="auth-panel">
        <div className="auth-form-wrap">
          <p className="eyebrow">{mode === 'login' ? 'WELCOME BACK' : 'A FRESH START'}</p>
          <h2>{mode === 'login' ? 'Good to see you.' : 'Let’s get started.'}</h2>
          <p className="auth-subtitle">{mode === 'login' ? 'Sign in to pick up where you left off.' : 'Create your private health tracking space.'}</p>

          <div className="auth-tabs" role="tablist" aria-label="Account options">
            <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => changeMode('login')}>Sign in</button>
            <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => changeMode('register')}>Create account</button>
          </div>

          <form onSubmit={submit} className="auth-form">
            {mode === 'register' && (
              <label>
                Your name
                <input autoComplete="name" value={fields.name} onChange={(event) => setFields({ ...fields, name: event.target.value })} placeholder="Alex Morgan" required />
              </label>
            )}
            <label>
              Email address
              <input type="email" autoComplete="email" value={fields.email} onChange={(event) => setFields({ ...fields, email: event.target.value })} placeholder="you@example.com" required />
            </label>
            <label>
              Password
              <span className="password-input-wrap">
                <input aria-label="Password" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={8} value={fields.password} onChange={(event) => setFields({ ...fields, password: event.target.value })} placeholder="At least 8 characters" required />
                <button
                  className="password-toggle"
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </label>
            {error && <div className="alert alert-error" role="alert">{error}</div>}
            <button className="button button-primary auth-submit" type="submit" disabled={busy}>
              {busy ? <span className="spinner" /> : <>{mode === 'login' ? 'Sign in' : 'Create my account'} <ArrowRight size={17} /></>}
            </button>
          </form>
          <p className="auth-privacy"><ShieldCheck size={15} /> Your information stays yours.</p>
        </div>
      </section>
    </main>
  );
}
