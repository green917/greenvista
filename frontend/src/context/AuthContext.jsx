import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../api/api';

export const AuthContext = createContext();

// Session timeout in milliseconds (30 minutes)
const SESSION_TIMEOUT = 15 * 60 * 1000;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionTimeoutId, setSessionTimeoutId] = useState(null);

  // Reload user from localStorage
  const reloadUser = useCallback(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (token && userData) {
      const userObj = JSON.parse(userData);
      setUser(userObj);
      setupSessionTimeout(userObj);
    } else {
      setUser(null);
    }
  }, []);

  // Check and validate session timeout for non-admin users
  const validateSession = useCallback(() => {
    const userData = localStorage.getItem('user');
    const userObj = userData ? JSON.parse(userData) : null;
    const sessionStartTime = localStorage.getItem('sessionStartTime');

    if (userObj && userObj.role !== 'admin' && sessionStartTime) {
      const currentTime = new Date().getTime();
      const sessionDuration = currentTime - parseInt(sessionStartTime);

      if (sessionDuration > SESSION_TIMEOUT) {
        // Session expired
        logout();
        return false;
      }
    }
    return true;
  }, []);

  // Set up session timeout for non-admin users
  const setupSessionTimeout = useCallback((userObj) => {
    // Clear previous timeout if any
    if (sessionTimeoutId) {
      clearTimeout(sessionTimeoutId);
    }

    if (userObj && userObj.role !== 'admin') {
      const newTimeoutId = setTimeout(() => {
        console.log('Session expired - logging out');
        logout();
        // Redirect to login
        window.location.href = '/login';
      }, SESSION_TIMEOUT);

      setSessionTimeoutId(newTimeoutId);
    }
  }, [sessionTimeoutId]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      // Validate session before setting user
      if (validateSession()) {
        const userObj = JSON.parse(userData);
        setUser(userObj);
        setupSessionTimeout(userObj);
      } else {
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  // Listen for storage changes (when tab/window updates localStorage)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'user' || e.key === 'token') {
        reloadUser();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [reloadUser]);

  // Check session periodically
  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        if (!validateSession()) {
          setUser(null);
        }
      }, 60000); // Check every minute

      return () => clearInterval(interval);
    }
  }, [user, validateSession]);

  const login = async (email, otp) => {
    try {
      // OTP-based login (compulsory)
      const response = await api.post('/api/auth/verify-otp', { email, otp });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Store session creation time for non-admin users
      if (user.role !== 'admin') {
        const sessionStartTime = new Date().getTime();
        localStorage.setItem('sessionStartTime', sessionStartTime.toString());
      }
      
      setUser(user);
      setupSessionTimeout(user);
      return user;
    } catch (error) {
      throw error.response?.data || error;
    }
  };

  const register = async (name, email, phone, password, apartmentNumber = '', address = '') => {
    try {
      const response = await api.post('/api/auth/register', {
        name,
        email,
        phone,
        password,
        apartmentNumber,
        address
      });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Store session creation time for non-admin users
      if (user.role !== 'admin') {
        const sessionStartTime = new Date().getTime();
        localStorage.setItem('sessionStartTime', sessionStartTime.toString());
      }
      
      setUser(user);
      setupSessionTimeout(user);
      return user;
    } catch (error) {
      throw error.response?.data || error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear session timeout
      if (sessionTimeoutId) {
        clearTimeout(sessionTimeoutId);
      }
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('sessionStartTime');
      setUser(null);
    }
  };

  const updateProfile = async (name, password) => {
    try {
      const response = await api.put('/api/auth/profile', { name, password });
      const updatedUser = response.data.user;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      throw error.response?.data || error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
