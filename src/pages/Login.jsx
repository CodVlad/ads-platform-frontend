import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth.js';
import { useFavorites } from '../hooks/useFavorites';
import { login } from '../api/endpoints';
import { useToast } from '../hooks/useToast';
import { parseError } from '../utils/errorParser';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginSuccess } = useAuth();
  const { loadFavorites } = useFavorites();
  const { success, error: showError } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);

    try {
      const response = await login({ email, password });

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
      success('Logged in');
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
    <div className="page-container">
      <div className="auth-card-wrap">
        <div className="container">
          <div className="card">
            <h1 className="page-title text-center">Welcome Back</h1>
            <p className="page-subtitle text-center">
              Sign in to your account to continue
            </p>

            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  placeholder="Enter your email"
                  className="input"
                />
              </div>
              <div className="form-field">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  placeholder="Enter your password"
                  className="input"
                />
              </div>
              <div className="form-field" style={{ marginBottom: 24, textAlign: 'right' }}>
                <Link to="/forgot-password" className="t-small" style={{ color: 'var(--primary)' }}>
                  Forgot password?
                </Link>
              </div>
              {error && <div className="auth-error">{error}</div>}
              <button type="submit" disabled={loading} className="btn btn-primary btn-block">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="auth-footer">
              <p className="t-small">Don't have an account? <Link to="/register">Create one now</Link></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
