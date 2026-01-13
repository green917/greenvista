import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import RoleRoute from './components/RoleRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import OwnerDashboard from './pages/OwnerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Requests from './pages/Requests';
import Invoices from './pages/Invoices';
import Notices from './pages/Notices';
import Users from './pages/Users';
import Profile from './pages/Profile';

function AppContent() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect root path based on auth status
  useEffect(() => {
    if (!loading) {
      const currentPath = window.location.pathname;
      if (currentPath === '/') {
        if (!user) {
          navigate('/login', { replace: true });
        } else if (user.role === 'admin') {
          navigate('/admin-dashboard', { replace: true });
        } else {
          navigate('/owner-dashboard', { replace: true });
        }
      }
    }
  }, [user, loading, navigate]);

  // Redirect to dashboard if user logs in from login/register page
  useEffect(() => {
    if (!loading && user) {
      const currentPath = window.location.pathname;
      if (currentPath === '/login' || currentPath === '/register') {
        if (user.role === 'admin') {
          navigate('/admin-dashboard', { replace: true });
        } else {
          navigate('/owner-dashboard', { replace: true });
        }
      }
    }
  }, [user, loading, navigate]);

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* Admin Dashboard Route */}
        <Route
          path="/admin-dashboard"
          element={
            <RoleRoute requiredRole="admin">
              <AdminDashboard />
            </RoleRoute>
          }
        />
        
        {/* Owner Dashboard Route */}
        <Route
          path="/owner-dashboard"
          element={
            <PrivateRoute>
              <OwnerDashboard />
            </PrivateRoute>
          }
        />
        
        {/* Requests Route */}
        <Route
          path="/requests"
          element={
            <PrivateRoute>
              <Requests />
            </PrivateRoute>
          }
        />
        
        {/* Invoices Route */}
        <Route
          path="/invoices"
          element={
            <PrivateRoute>
              <Invoices />
            </PrivateRoute>
          }
        />
        
        {/* Notices Route */}
        <Route
          path="/notices"
          element={
            <PrivateRoute>
              <Notices />
            </PrivateRoute>
          }
        />
        
        {/* Users Route (Admin only) */}
        <Route
          path="/users"
          element={
            <RoleRoute requiredRole="admin">
              <Users />
            </RoleRoute>
          }
        />
        
        {/* Profile Route */}
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        
        {/* Dashboard Route - redirect to role-specific dashboard */}
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        
        {/* Root path and catch all - handled by useEffect */}
        <Route path="/" element={<div />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
