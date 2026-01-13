import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

const ForgotPassword = () => {
  const [step, setStep] = useState('email'); // 'email', 'otp', 'reset'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const navigate = useNavigate();

  // Timer countdown
  React.useEffect(() => {
    let interval;
    if (timer > 0 && step === 'otp') {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer, step]);

  const formatTimer = () => {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/api/auth/forgot-password-send-otp', { email });
      setStep('otp');
      setTimer(60);
      setOtp('');
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }

    setStep('reset');
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('Please enter both passwords');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/api/auth/reset-password', {
        email,
        otp,
        newPassword,
        confirmPassword
      });

      if (response.data.success) {
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/api/auth/forgot-password-send-otp', { email });
      setTimer(60);
      setOtp('');
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 6) {
      setOtp(value);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {step === 'email' ? (
          <>
            <h1 style={styles.title}>🔐 Forgot Password</h1>
            <p style={styles.subtitle}>Enter your email to reset your password</p>

            {error && <div style={styles.error}>{error}</div>}

            <form onSubmit={handleEmailSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  style={styles.input}
                  required
                />
              </div>

              <button type="submit" disabled={loading} style={styles.button}>
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>

            <div style={styles.loginLink}>
              Remember your password? <a href="/login" style={styles.link}>Login here</a>
            </div>
          </>
        ) : step === 'otp' ? (
          <>
            <h1 style={styles.title}>✉️ Verify OTP</h1>
            <p style={styles.subtitle}>Enter the OTP sent to {email}</p>

            {error && <div style={styles.error}>{error}</div>}

            <form onSubmit={handleOtpSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Enter OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={handleOtpChange}
                  placeholder="000000"
                  maxLength={6}
                  style={styles.otpInput}
                  required
                />
                <p style={styles.helpText}>6-digit code sent to your email</p>
              </div>

              {timer > 0 ? (
                <div style={styles.timerText}>
                  Time remaining: {formatTimer()}
                </div>
              ) : (
                <div style={styles.resendContainer}>
                  <p>Didn't receive OTP?</p>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={loading}
                    style={styles.resendButton}
                  >
                    Resend OTP
                  </button>
                </div>
              )}

              <button type="submit" disabled={loading || otp.length !== 6} style={styles.button}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>

            <button
              type="button"
              onClick={() => setStep('email')}
              style={styles.backButton}
            >
              ← Back to Email
            </button>
          </>
        ) : (
          <>
            <h1 style={styles.title}>🔑 Reset Password</h1>
            <p style={styles.subtitle}>Create your new password</p>

            {error && <div style={styles.error}>{error}</div>}

            {loading ? (
              <div style={styles.successContainer}>
                <div style={styles.successIcon}>✓</div>
                <h2>Password Reset Successful!</h2>
                <p>You can now login with your new password.</p>
                <p style={styles.successText}>Redirecting to login...</p>
              </div>
            ) : (
              <>
                <form onSubmit={handleResetPassword} style={styles.form}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      style={styles.input}
                      required
                      minLength={6}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      style={styles.input}
                      required
                      minLength={6}
                    />
                  </div>

                  <button type="submit" disabled={loading} style={styles.button}>
                    Reset Password
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => setStep('otp')}
                  style={styles.backButton}
                >
                  ← Back to OTP
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: '20px',
    backgroundColor: '#f5f5f5'
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    maxWidth: '400px',
    width: '100%'
  },
  title: {
    marginBottom: '10px',
    color: '#2c3e50',
    fontSize: '24px',
    textAlign: 'center'
  },
  subtitle: {
    fontSize: '14px',
    color: '#7f8c8d',
    marginBottom: '20px',
    textAlign: 'center'
  },
  error: {
    backgroundColor: '#e74c3c',
    color: 'white',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '20px',
    fontSize: '14px'
  },
  form: {
    marginBottom: '20px'
  },
  formGroup: {
    marginBottom: '15px'
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#2c3e50'
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  otpInput: {
    width: '100%',
    padding: '16px',
    border: '2px solid #27ae60',
    borderRadius: '4px',
    fontSize: '28px',
    letterSpacing: '8px',
    textAlign: 'center',
    fontWeight: 'bold',
    boxSizing: 'border-box',
    fontFamily: 'monospace'
  },
  helpText: {
    fontSize: '12px',
    color: '#7f8c8d',
    marginTop: '6px',
    margin: '0'
  },
  timerText: {
    marginTop: '10px',
    fontSize: '13px',
    color: '#27ae60',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  resendContainer: {
    marginTop: '15px',
    padding: '12px',
    backgroundColor: '#fff3cd',
    borderRadius: '4px',
    textAlign: 'center'
  },
  resendButton: {
    marginTop: '10px',
    padding: '10px 20px',
    backgroundColor: '#ff9800',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease'
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'background-color 0.3s ease',
    marginTop: '10px'
  },
  backButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#ecf0f1',
    color: '#2c3e50',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
    marginTop: '10px',
    transition: 'background-color 0.3s ease'
  },
  loginLink: {
    textAlign: 'center',
    fontSize: '14px',
    color: '#7f8c8d'
  },
  link: {
    color: '#27ae60',
    textDecoration: 'none',
    fontWeight: 'bold',
    transition: 'color 0.3s ease'
  },
  successContainer: {
    textAlign: 'center',
    padding: '30px'
  },
  successIcon: {
    fontSize: '60px',
    color: '#27ae60',
    marginBottom: '15px'
  },
  successText: {
    color: '#7f8c8d',
    marginTop: '10px'
  }
};

export default ForgotPassword;
