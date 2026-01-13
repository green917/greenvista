import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

const Register = () => {
  const [step, setStep] = useState('form'); // 'form' or 'otp'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    apartmentNumber: '',
    address: ''
  });
  const [otp, setOtp] = useState('');
  const [otpId, setOtpId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      // Send registration details and trigger OTP sending
      const response = await api.post('/api/auth/register-send-otp', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        apartmentNumber: formData.apartmentNumber,
        address: formData.address
      });
      
      setOtpId(response.data.otpId);
      setStep('otp');
      setTimer(60); // 1 minute
      setOtp('');
      setError('');
    } catch (err) {
      const errorMsg = err.response?.data?.error;
      if (errorMsg && errorMsg.includes('already exists')) {
        setError('📧 Email already registered. Please use a different email or login.');
      } else {
        setError(errorMsg || 'Failed to send verification OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/api/auth/verify-registration-otp', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        apartmentNumber: formData.apartmentNumber,
        address: formData.address,
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

      // Reload page after successful registration
      window.location.href = response.data.user.role === 'admin' ? '/admin-dashboard' : '/owner-dashboard';
    } catch (err) {
      setError(err.response?.data?.error || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setLoading(true);
    
    try {
      const response = await api.post('/api/auth/register-send-otp', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        apartmentNumber: formData.apartmentNumber,
        address: formData.address
      });
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

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only numbers
    if (value.length <= 6) {
      setOtp(value);
    }
  };

  const handleBackToForm = () => {
    setStep('form');
    setOtp('');
    setOtpId('');
    setTimer(0);
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
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {step === 'form' ? (
          <>
            <h1 style={styles.title}>Register as Property Owner</h1>
            <p style={styles.subtitle}>Create your account to submit maintenance requests</p>
            
            {error && <div style={styles.error}>{error}</div>}

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 XXXXX XXXXX"
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter your property address"
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Apartment Number (Optional)</label>
                <input
                  type="text"
                  name="apartmentNumber"
                  value={formData.apartmentNumber}
                  onChange={handleChange}
                  placeholder="A101"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Password (min 6 characters)</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter secure password"
                  required
                  minLength={6}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  required
                  minLength={6}
                  style={styles.input}
                />
              </div>

              <button type="submit" disabled={loading} style={styles.button}>
                {loading ? 'Sending OTP...' : 'Continue to Verify Email'}
              </button>
            </form>

            <div style={styles.loginLink}>
              Already have an account? <a href="/login" style={styles.link}>Login here</a>
            </div>
          </>
        ) : (
          <>
            <h1 style={styles.title}>Verify Email Address</h1>
            <p style={styles.subtitle}>Enter the OTP sent to {formData.email}</p>
            
            {error && <div style={styles.error}>{error}</div>}

            <form onSubmit={handleVerifyOTP} style={styles.form}>
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
                {loading ? 'Verifying...' : 'Complete Registration'}
              </button>
            </form>

            <button
              type="button"
              onClick={handleBackToForm}
              disabled={loading}
              style={styles.backButton}
            >
              ← Back to Form
            </button>
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
    backgroundColor: '#f5f5f5',
    '@media (maxWidth: 768px)': {
      padding: '15px',
      minHeight: 'auto',
      paddingTop: '20px',
      paddingBottom: '20px'
    },
    '@media (maxWidth: 480px)': {
      padding: '10px'
    }
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    maxWidth: '500px',
    width: '100%',
    '@media (maxWidth: 768px)': {
      padding: '30px',
      borderRadius: '6px'
    },
    '@media (maxWidth: 480px)': {
      padding: '20px',
      borderRadius: '6px'
    }
  },
  title: {
    marginBottom: '10px',
    color: '#2c3e50',
    fontSize: '24px',
    '@media (maxWidth: 768px)': {
      fontSize: '22px'
    },
    '@media (maxWidth: 480px)': {
      fontSize: '20px',
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
    marginBottom: '15px',
    '@media (maxWidth: 480px)': {
      marginBottom: '12px'
    }
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#2c3e50',
    '@media (maxWidth: 480px)': {
      fontSize: '13px'
    }
  },
  input: {
    width: '100%',
    padding: '10px',
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
    transition: 'background-color 0.3s ease',
    '@media (maxWidth: 480px)': {
      padding: '10px 15px',
      fontSize: '13px'
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
    '@media (maxWidth: 480px)': {
      padding: '14px',
      fontSize: '15px'
    }
  },
  loginLink: {
    textAlign: 'center',
    fontSize: '14px',
    color: '#7f8c8d',
    '@media (maxWidth: 480px)': {
      fontSize: '12px'
    }
  },
  link: {
    color: '#27ae60',
    textDecoration: 'none',
    fontWeight: 'bold',
    transition: 'color 0.3s ease'
  }
};

export default Register;
