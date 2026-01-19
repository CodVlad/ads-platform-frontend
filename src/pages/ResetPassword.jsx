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

  // Extract token from params or hash
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

    // Validation
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
        <div className="container" style={{ maxWidth: '450px' }}>
          <div className="card">
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
              <h1 style={{ 
                fontSize: '2rem', 
                fontWeight: '700', 
                color: '#1a1a1a',
                marginBottom: '8px',
              }}>
                Password Reset Successful
              </h1>
              <p style={{ color: '#666', fontSize: '15px' }}>
                Your password has been reset successfully. Redirecting to login...
              </p>
            </div>
            <button 
              type="button" 
              onClick={handleRedirectToLogin}
              className="btn-primary"
              style={{ 
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                fontWeight: '600',
              }}
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="container" style={{ maxWidth: '450px' }}>
        <div className="card">
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ 
              fontSize: '2rem', 
              fontWeight: '700', 
              color: '#1a1a1a',
              marginBottom: '8px',
            }}>
              Reset Password
            </h1>
            <p style={{ color: '#666', fontSize: '15px' }}>
              Enter your new password below
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="password">New Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                minLength={6}
                placeholder="Enter new password (min 6 characters)"
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                minLength={6}
                placeholder="Confirm your new password"
                style={{ width: '100%' }}
              />
            </div>
            {error && (
              <div style={{ 
                color: '#c53030', 
                backgroundColor: '#fff5f5',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '20px',
                fontSize: '14px',
                border: '1px solid #fed7d7',
              }}>
                {error}
              </div>
            )}
            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary"
              style={{ 
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                fontWeight: '600',
              }}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <div style={{ 
            marginTop: '24px', 
            textAlign: 'center',
            paddingTop: '24px',
            borderTop: '1px solid #e0e0e0',
          }}>
            <button 
              type="button" 
              onClick={handleRedirectToLogin}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#007bff', 
                cursor: 'pointer', 
                textDecoration: 'none',
                padding: 0,
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              ← Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
