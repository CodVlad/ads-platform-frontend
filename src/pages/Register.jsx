import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth.js';
import { useFavorites } from '../hooks/useFavorites';
import { register } from '../api/endpoints';
import { useToast } from '../hooks/useToast';
import { parseError } from '../utils/errorParser';
import '../styles/auth.css';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginSuccess } = useAuth();
  const { loadFavorites } = useFavorites();
  const { success, error: showError } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('All fields are required');
      return;
    }

    setLoading(true);

    try {
      const response = await register({ name, email, password });

      let token, user;
      if (response.data?.data?.token && response.data?.data?.user) {
        token = response.data.data.token;
        user = response.data.data.user;
      } else if (response.data?.token && response.data?.user) {
        token = response.data.token;
        user = response.data.user;
      } else {
        throw new Error('Invalid response format');
      }

      loginSuccess({ token, user });
      await loadFavorites();
      success('Account created');
      const hash = window.location.hash || '';
      const isResetFlow = hash.startsWith('#/reset-password') || hash.startsWith('#/forgot-password');
      if (!isResetFlow) {
        navigate('/');
      }
    } catch (err) {
      const errorMessage = parseError(err);
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <aside className="auth-side">
          <h2 className="auth-side__brand">ADS Platform</h2>
          <p className="auth-side__tagline">A premium marketplace experience</p>
          <ul className="auth-side__bullets">
            <li className="auth-side__bullet">
              <span className="auth-side__bullet-icon" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </span>
              Secure
            </li>
            <li className="auth-side__bullet">
              <span className="auth-side__bullet-icon" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </span>
              Fast
            </li>
            <li className="auth-side__bullet">
              <span className="auth-side__bullet-icon" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </span>
              Verified listings
            </li>
          </ul>
        </aside>

        <main className="auth-main">
          <div className="auth-main__card">
            <h1 className="auth-main__title">Create your account</h1>
            <p className="auth-main__subtitle">Join and start posting premium listings.</p>

            <form onSubmit={handleSubmit}>
              <div className="auth-field">
                <label htmlFor="register-name" className="auth-field__label">Full Name</label>
                <input
                  type="text"
                  id="register-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  placeholder="Enter your full name"
                  className="auth-field__input"
                  autoComplete="name"
                />
              </div>

              <div className="auth-field">
                <label htmlFor="register-email" className="auth-field__label">Email Address</label>
                <input
                  type="email"
                  id="register-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  placeholder="Enter your email"
                  className="auth-field__input"
                  autoComplete="email"
                />
              </div>

              <div className="auth-field">
                <label htmlFor="register-password" className="auth-field__label">Password</label>
                <div className="auth-field__password-wrap">
                  <input
                    type={showPass ? 'text' : 'password'}
                    id="register-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    placeholder="Create a password"
                    className="auth-field__input"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="auth-field__password-toggle"
                    onClick={() => setShowPass((p) => !p)}
                    disabled={loading}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPass ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="auth-error-box" role="alert">
                  <span className="auth-error-box__icon" aria-hidden>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </span>
                  <p className="auth-error-box__text">{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading} className="auth-submit">
                {loading ? (
                  <>
                    <span className="auth-submit__spinner" aria-hidden />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <div className="auth-footer">
              <p>Already have an account? <Link to="/login">Sign in</Link></p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Register;
