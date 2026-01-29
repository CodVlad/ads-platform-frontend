import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api/endpoints';
import { useToast } from '../hooks/useToast';
import { parseError } from '../utils/errorParser';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { success: showSuccess, error: showError } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email) {
      setError('Email is required');
      return;
    }

    setLoading(true);

    try {
      await forgotPassword({ email });
      setSuccess(true);
      showSuccess('If an account exists with this email, a password reset link has been sent.');
    } catch (err) {
      setSuccess(false);
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
            {success ? (
              <>
                <h1 className="page-title text-center">Check Your Email</h1>
                <p className="page-subtitle text-center">
                  If an account exists with this email, a password reset link has been sent.
                </p>
                <Link to="/login" className="btn btn-primary btn-block">
                  Back to Login
                </Link>
              </>
            ) : (
              <>
                <h1 className="page-title text-center">Forgot Password?</h1>
                <p className="page-subtitle text-center">
                  Enter your email and we will send you a reset link
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
                  {error && <div className="auth-error">{error}</div>}
                  <button type="submit" disabled={loading} className="btn btn-primary btn-block">
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>

                <div className="auth-footer">
                  <p className="t-small">Remember your password? <Link to="/login">Sign in</Link></p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
