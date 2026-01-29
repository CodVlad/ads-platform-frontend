import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../api/endpoints';
import { useToast } from '../hooks/useToast';
import { parseError } from '../utils/errorParser';

const ResetPassword = () => {
  const { token: tokenFromParams } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { success: showSuccess, error: showError } = useToast();

  const token = tokenFromParams || (() => {
    const hash = window.location.hash || '';
    const match = hash.match(/#\/reset-password\/(.+)/);
    return match ? match[1] : null;
  })();

  useEffect(() => {
    if (!token) {
      setError('Invalid reset token');
    }
  }, [token]);

  const handleRedirectToLogin = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
    setTimeout(() => { window.location.hash = '#/login'; }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError('Both password fields are required');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password.length > 128) {
      setError('Password must be less than 128 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!token) {
      setError('Invalid reset token');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(token, { password });
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setSuccess(true);
      showSuccess('Password reset successfully. Redirecting to login...');
      navigate('/login', { replace: true });
      setTimeout(() => { window.location.hash = '#/login'; }, 0);
      setTimeout(() => {
        if (!window.location.hash.includes('/login')) window.location.hash = '#/login';
      }, 50);
    } catch (err) {
      const errorMessage = parseError(err);
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="page-container">
        <div className="auth-card-wrap">
          <div className="container">
            <div className="card">
              <h1 className="page-title text-center">Password Reset Successful</h1>
              <p className="page-subtitle text-center">
                Your password has been reset successfully. Redirecting to login...
              </p>
              <button type="button" onClick={handleRedirectToLogin} className="btn btn-primary btn-block">
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="auth-card-wrap">
        <div className="container">
          <div className="card">
            <h1 className="page-title text-center">Reset Password</h1>
            <p className="page-subtitle text-center">
              Enter your new password below
            </p>

            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label htmlFor="password">New Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  minLength={6}
                  placeholder="Enter new password (min 6 characters)"
                  className="input"
                />
              </div>
              <div className="form-field">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  minLength={6}
                  placeholder="Confirm your new password"
                  className="input"
                />
              </div>
              {error && <div className="auth-error">{error}</div>}
              <button type="submit" disabled={loading} className="btn btn-primary btn-block">
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>

            <div className="auth-footer">
              <button type="button" onClick={handleRedirectToLogin} className="btn btn-secondary btn-block">
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
