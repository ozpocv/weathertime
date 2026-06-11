import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/meteo.css';

function AuthForm({ mode }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [form,  setForm]  = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy,  setBusy]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await register(form.username, form.email, form.password);
      navigate('/weather');
    } catch (err) {
      setError(err.message);
    } finally { setBusy(false); }
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <>
      <header className="header">
        <a className="logo" href="/" onClick={e => { e.preventDefault(); navigate('/'); }}>WeatherTime</a>
      </header>
      <div className="auth-page">
        <div className="auth-card">
          <h2 className="auth-title">{mode === 'login' ? 'Welcome back' : 'Create an account'}</h2>
          <p className="auth-sub">
            {mode === 'login'
              ? 'Sign in to access all features'
              : 'Free, no commitment'}
          </p>
          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <>
                <label className="auth-label">Username</label>
                <input className="auth-input" type="text" placeholder="weather_fan" value={form.username} onChange={set('username')} required />
              </>
            )}
            <label className="auth-label">Email</label>
            <input className="auth-input" type="email" placeholder="your@email.com" value={form.email} onChange={set('email')} required />
            <label className="auth-label">Password</label>
            <input className="auth-input" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required />
            {error && <p className="auth-error">{error}</p>}
            <button className="auth-submit" type="submit" disabled={busy}>
              {busy ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
          <p className="auth-switch">
            {mode === 'login'
              ? <><span>No account yet? </span><Link to="/register">Sign up</Link></>
              : <><span>Already have an account? </span><Link to="/login">Sign in</Link></>
            }
          </p>
        </div>
      </div>
    </>
  );
}

export function LoginPage()    { return <AuthForm mode="login" />; }
export function RegisterPage() { return <AuthForm mode="register" />; }
