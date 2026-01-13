import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '60vh',
    padding: '20px',
    '@media (maxWidth: 768px)': {
      padding: '15px',
      minHeight: '50vh'
    },
    '@media (maxWidth: 480px)': {
      padding: '10px',
      minHeight: '40vh'
    }
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    maxWidth: '400px',
    width: '100%',
    '@media (maxWidth: 768px)': {
      padding: '30px',
      maxWidth: '100%'
    },
    '@media (maxWidth: 480px)': {
      padding: '20px',
      borderRadius: '6px'
    }
  },
  title: {
    marginBottom: '10px',
    color: '#2c3e50',
    fontSize: '28px',
    '@media (maxWidth: 480px)': {
      fontSize: '24px',
      marginBottom: '8px'
    }
  },
  subtitle: {
    fontSize: '14px',
    color: '#7f8c8d',
    marginBottom: '20px',
    '@media (maxWidth: 480px)': {
      fontSize: '12px',
      marginBottom: '15px'
    }
  },
  error: {
    backgroundColor: '#e74c3c',
    color: 'white',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '20px',
    fontSize: '14px',
    '@media (maxWidth: 480px)': {
      padding: '10px',
      fontSize: '13px',
      marginBottom: '15px'
    }
  },
  form: {
    marginBottom: '20px'
  },
  formGroup: {
    marginBottom: '20px',
    '@media (maxWidth: 480px)': {
      marginBottom: '15px'
    }
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#2c3e50',
    '@media (maxWidth: 480px)': {
      fontSize: '13px',
      marginBottom: '6px'
    }
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box',
    '@media (maxWidth: 480px)': {
      padding: '12px',
      fontSize: '16px'
    }
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
    fontFamily: 'monospace',
    '@media (maxWidth: 480px)': {
      padding: '12px',
      fontSize: '24px',
      letterSpacing: '6px'
    }
  },
  helpText: {
    fontSize: '12px',
    color: '#7f8c8d',
    marginTop: '6px',
    margin: '0'
  },
  otpSent: {
    fontSize: '13px',
    color: '#27ae60',
    marginBottom: '10px',
    fontWeight: 'bold'
  },
  expiredText: {
    fontSize: '12px',
    color: '#e74c3c',
    marginTop: '8px'
  },
  resendLink: {
    background: 'none',
    border: 'none',
    color: '#27ae60',
    cursor: 'pointer',
    fontWeight: 'bold',
    textDecoration: 'underline',
    padding: '0',
    fontSize: '12px'
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
    transition: 'background-color 0.3s ease',
    '@media (maxWidth: 480px)': {
      padding: '10px 15px',
      fontSize: '13px'
    }
  },
  timerText: {
    marginTop: '10px',
    fontSize: '13px',
    color: '#27ae60',
    fontWeight: 'bold',
    textAlign: 'center'
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
    '@media (maxWidth: 480px)': {
      padding: '14px',
      fontSize: '15px'
    }
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
    transition: 'background-color 0.3s ease',
    '@media (maxWidth: 480px)': {
      padding: '12px',
      fontSize: '13px'
    }
  },
  contactInfo: {
    backgroundColor: '#ecf0f1',
    padding: '15px',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#2c3e50',
    marginTop: '20px',
    '@media (maxWidth: 480px)': {
      padding: '12px',
      fontSize: '11px',
      lineHeight: '1.6'
    }
  },
  footer: {
    textAlign: 'center',
    marginTop: '15px',
    fontSize: '13px'
  },
  link: {
    color: '#27ae60',
    textDecoration: 'none',
    fontWeight: 'bold'
  }
};

const Login = () => {
  const [step, setStep] = useState('credentials'); // 'credentials' or 'otp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpId, setOtpId] = useState(null);
  const [timer, setTimer] = useState(0);
  const navigate = useNavigate();

  // Verify email and password, then send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Email and password are required');
      setLoading(false);
      return;
    }

    try {
      console.log('Sending login request with email:', email);
      // Verify credentials and send OTP
      const response = await api.post('/api/auth/verify-credentials-send-otp', { email, password });
      console.log('Login response:', response.data);
      setOtpId(response.data.otpId);
      setStep('otp');
      setTimer(60); // 1 minute
      setOtp('');
      setError('');
    } catch (err) {
      console.error('Login error:', err);
      const errorMsg = err.response?.data?.error;
      console.log('Error message:', errorMsg);
      if (errorMsg === 'Email not registered') {
        setError('📧 This email is not registered. Please register first.');
      } else if (errorMsg === 'Incorrect password') {
        setError('🔐 Password is incorrect. Please try again.');
      } else {
        setError(errorMsg || 'Failed to verify credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP and login
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/api/auth/verify-otp', { 
        email, 
        otp 
      });
      
      // Save token and user data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Store session creation time for non-admin users (5 minutes timeout)
      if (response.data.user.role !== 'admin') {
        const sessionStartTime = new Date().getTime();
        localStorage.setItem('sessionStartTime', sessionStartTime.toString());
      }
      
      // Reload page after successful login to ensure fresh state and session setup
      window.location.href = response.data.user.role === 'admin' ? '/admin-dashboard' : '/owner-dashboard';
    } catch (err) {
      setError(err.response?.data?.error || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setError('');
    setLoading(true);
    
    try {
      const response = await api.post('/api/auth/verify-credentials-send-otp', { email, password });
      setOtpId(response.data.otpId);
      setTimer(60); // Reset 1 minute
      setOtp('');
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP input - only allow numbers
  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only numbers
    setOtp(value);
  };

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
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}> Login</h1>
        <p style={styles.subtitle}>GREEN VISTA - Where Nature Meets Art</p>
        
        {error && <div style={styles.error}>{error}</div>}

        {step === 'credentials' ? (
          // Step 1: Enter Email & Password
          <form onSubmit={handleSendOTP} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>📧 Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                style={styles.input}
              />
              <p style={styles.helpText}>Enter your registered email address</p>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>🔐 Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={styles.input}
              />
              <p style={styles.helpText}>Enter your account password</p>
            </div>

            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? '⏳ Verifying...' : '📧 Send OTP'}
            </button>
          </form>
        ) : (
          // Step 2: Verify OTP
          <form onSubmit={handleVerifyOTP} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>🔑 Enter OTP</label>
              <p style={styles.otpSent}>OTP sent to: {email}</p>
              <input
                type="text"
                value={otp}
                onChange={handleOtpChange}
                placeholder="000000"
                maxLength="6"
                inputMode="numeric"
                required
                style={styles.otpInput}
              />
              <p style={styles.helpText}>Enter 6-digit OTP (valid for {formatTimer()})</p>
              
              {timer === 0 ? (
                <div style={styles.resendContainer}>
                  <p style={styles.expiredText}>⏱️ OTP expired</p>
                  <button 
                    type="button" 
                    onClick={handleResendOTP}
                    disabled={loading}
                    style={styles.resendButton}
                  >
                    {loading ? '⏳ Sending...' : '🔄 Resend OTP'}
                  </button>
                </div>
              ) : (
                <p style={styles.timerText}>⏱️ Wait {formatTimer()} to resend OTP</p>
              )}
            </div>

            <button type="submit" disabled={loading || otp.length !== 6} style={styles.button}>
              {loading ? '✓ Verifying...' : '✓ Verify & Login'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('credentials');
                setEmail('');
                setPassword('');
                setOtp('');
                setError('');
                setTimer(0);
              }}
              style={styles.backButton}
            >
              ← Back to Login
            </button>
          </form>
        )}

        <div style={styles.contactInfo}>
          <h3> Contact Information</h3>
          <p> Email: greenvista@zohomail.in</p>
          <p> Phone: +91 9019004060</p>
          <p> Hours: Monday - Friday, 9 AM - 6 PM</p>
        </div>

        <div style={styles.footer}>
          <p>Don't have an account? <a href="/register" style={styles.link}>Register here</a></p>
          <p><a href="/forgot-password" style={styles.link}>Forgot Password?</a></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
