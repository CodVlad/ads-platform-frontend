import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth.js';
import { useFavorites } from '../hooks/useFavorites';
import { register } from '../api/endpoints';
import { useToast } from '../hooks/useToast';
import { parseError } from '../utils/errorParser';

const Register = () => {
  const [name, setName] = useState('');
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
    <div className="page-container">
      <div className="auth-card-wrap">
        <div className="container">
          <div className="card">
            <h1 className="page-title text-center">Create Account</h1>
            <p className="page-subtitle text-center">
              Join us and start posting your ads today
            </p>

            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  placeholder="Enter your full name"
                  className="input"
                />
              </div>
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
                  placeholder="Create a password"
                  className="input"
                />
              </div>
              {error && <div className="auth-error">{error}</div>}
              <button type="submit" disabled={loading} className="btn btn-primary btn-block">
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <div className="auth-footer">
              <p className="t-small">Already have an account? <Link to="/login">Sign in</Link></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
