import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [timer, setTimer] = useState({});

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  // Timer effect to update elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => ({ ...prev }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingRequests = async () => {
    try {
      setLoadingRequests(true);
      const response = await api.get('/api/requests');
      const pendingRequests = Array.isArray(response.data) 
        ? response.data.filter(req => req.status === 'pending' || req.status === 'open')
        : [];
      setRequests(pendingRequests);
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const updateRequestStatus = async (id, status) => {
    try {
      await api.put(`/api/requests/${id}`, { status });
      setRequests(prev => prev.filter(req => req._id !== id));
    } catch (err) {
      console.error('Error updating request:', err);
    }
  };

  const getElapsedTime = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now - created;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d ${diffHours % 24}h ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMins % 60}m ago`;
    } else if (diffMins > 0) {
      return `${diffMins}m ${diffSecs % 60}s ago`;
    } else {
      return `${diffSecs}s ago`;
    }
  };

  const getCountdownTime = (requestedDate, requestedTime) => {
    if (!requestedDate || !requestedTime) {
      return null;
    }

    const now = new Date();
    // Parse the date and time
    const [hours, minutes] = requestedTime.split(':');
    const requestedDateTime = new Date(requestedDate);
    requestedDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const diffMs = requestedDateTime - now;
    
    // If time has passed, show "Time's up!" or overdue
    if (diffMs < 0) {
      const absDiffMs = Math.abs(diffMs);
      const absDiffSecs = Math.floor(absDiffMs / 1000);
      const absDiffMins = Math.floor(absDiffSecs / 60);
      const absDiffHours = Math.floor(absDiffMins / 60);
      const absDiffDays = Math.floor(absDiffHours / 24);

      // Show "Time's up!" only for the first 5 minutes after expiry
      if (absDiffMins < 5) {
        return { text: "⏰ Time's up!", overdue: true };
      }

      if (absDiffDays > 0) {
        return { text: `${absDiffDays}d ${absDiffHours % 24}h overdue`, overdue: true };
      } else if (absDiffHours > 0) {
        return { text: `${absDiffHours}h ${absDiffMins % 60}m overdue`, overdue: true };
      } else if (absDiffMins > 0) {
        return { text: `${absDiffMins}m ${absDiffSecs % 60}s overdue`, overdue: true };
      } else {
        return { text: `${absDiffSecs}s overdue`, overdue: true };
      }
    }

    // Show time remaining
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return { text: `${diffDays}d ${diffHours % 24}h left`, overdue: false };
    } else if (diffHours > 0) {
      return { text: `${diffHours}h ${diffMins % 60}m left`, overdue: false };
    } else if (diffMins > 0) {
      return { text: `${diffMins}m ${diffSecs % 60}s left`, overdue: false };
    } else {
      return { text: `${diffSecs}s left`, overdue: false };
    }
  };

  return (
    <div style={styles.container}>
      {/* Animated Header */}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .dash-title { animation: slideDown 0.6s ease-out; }
        .pending-section { animation: slideInUp 0.7s ease-out; }
        .dash-card { animation: fadeIn 0.5s ease-out; }
        .request-card-item { animation: slideInUp 0.5s ease-out; }
        .dash-card:hover { transform: translateY(-8px); box-shadow: 0 12px 20px rgba(0,0,0,0.15); }
        .request-card-item:hover { background: linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%); }
      `}</style>

      <div style={styles.headerSection}>
        <div className="dash-title" style={styles.titleSection}>
          <h1 style={styles.mainTitle}>👨‍💼 Admin Dashboard</h1>
          <p style={styles.subtitle}>Welcome back, <span style={styles.userName}>{user?.name}</span>! 🎯</p>
        </div>
        <div style={styles.headerStats}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📋</div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{requests.length}</div>
              <div style={styles.statLabel}>Pending</div>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Requests Section */}
      {requests.length > 0 && (
        <div className="pending-section" style={styles.pendingSection}>
          <div style={styles.pendingHeader}>
            <h2 style={styles.pendingTitle}>⚠️ Urgent: Pending Requests</h2>
            <span style={styles.badge}>{requests.length} to review</span>
          </div>
          <div style={styles.requestsList}>
            {requests.slice(0, 3).map((req, idx) => (
              <div 
                key={req._id} 
                className="request-card-item"
                style={{...styles.requestCard, animationDelay: `${idx * 0.1}s`}}
              >
                <div style={styles.requestTypeIcon}>
                  {req.type === 'plumbing' && '🚿'}
                  {req.type === 'electrical' && '⚡'}
                  {req.type === 'maintenance' && '🔧'}
                  {!['plumbing', 'electrical', 'maintenance'].includes(req.type) && '🔨'}
                </div>
                <div style={styles.requestInfo}>
                  <h4 style={styles.requestType}>{req.type.charAt(0).toUpperCase() + req.type.slice(1)}</h4>
                  <p style={styles.requestOwner}>👤 {req.ownerId?.name}</p>
                  <p style={styles.requestDetails}>{req.details?.substring(0, 50)}...</p>
                  {(req.requestedDate || req.requestedTime) && (
                    <p style={styles.requestTiming}>
                      Requested date🕐 {req.requestedDate && new Date(req.requestedDate).toLocaleDateString()} 
                      {req.requestedTime && ` at ${req.requestedTime}`}
                    </p>
                  )}
                  {getCountdownTime(req.requestedDate, req.requestedTime) && (
                    <p style={{
                      ...styles.requestTimer,
                      ...(getCountdownTime(req.requestedDate, req.requestedTime).overdue && styles.requestTimerOverdue)
                    }}>
                      ⏱️ {getCountdownTime(req.requestedDate, req.requestedTime).text}
                    </p>
                  )}
                </div>
                <div style={styles.requestActions}>
                  <button
                    onClick={() => updateRequestStatus(req._id, 'approved')}
                    style={styles.approveBtn}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#229954'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#27ae60'}
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => updateRequestStatus(req._id, 'rejected')}
                    style={styles.rejectBtn}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#c0392b'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#e74c3c'}
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
          {requests.length > 3 && (
            <div style={styles.viewAllContainer}>
              <button 
                onClick={() => navigate('/requests')}
                style={styles.viewAllBtn}
              >
                View All {requests.length - 3} More →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Dashboard Cards Grid */}
      <div style={styles.grid}>
        {[
          { title: '📋 Service Requests', desc: 'Approve or reject service requests', icon: '📋', color: '#3498db', route: '/requests' },
          { title: '👥 Users', desc: 'View and manage all users', icon: '👥', color: '#9b59b6', route: '/users' },
          { title: '💰 Invoices', desc: 'Create invoices and track payments', icon: '💰', color: '#e74c3c', route: '/invoices' },
          { title: '📢 Notices', desc: 'Send announcements to owners', icon: '📢', color: '#f39c12', route: '/notices' }
        ].map((item, idx) => (
          <div
            key={idx}
            className="dash-card"
            style={{
              ...styles.card,
              borderTop: `4px solid ${item.color}`,
              animationDelay: `${idx * 0.1}s`
            }}
            onClick={() => navigate(item.route)}
            onMouseEnter={() => setHoveredCard(idx)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div style={styles.cardIconLarge}>{item.icon}</div>
            <h3 style={styles.cardTitle}>{item.title}</h3>
            <p style={styles.cardDesc}>{item.desc}</p>
            <button 
              style={{
                ...styles.btn,
                backgroundColor: item.color,
                transform: hoveredCard === idx ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.3s ease'
              }}
            >
              Access Module →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '30px 20px'
  },
  headerSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '40px',
    gap: '20px'
  },
  titleSection: {
    flex: 1
  },
  mainTitle: {
    fontSize: '36px',
    margin: '0 0 10px 0',
    color: '#2c3e50',
    fontWeight: '700'
  },
  subtitle: {
    fontSize: '18px',
    color: '#7f8c8d',
    margin: 0
  },
  userName: {
    color: '#3498db',
    fontWeight: 'bold'
  },
  headerStats: {
    display: 'flex',
    gap: '15px'
  },
  statCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    border: '2px solid #ecf0f1'
  },
  statIcon: {
    fontSize: '32px'
  },
  statContent: {},
  statNumber: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#e74c3c'
  },
  statLabel: {
    fontSize: '12px',
    color: '#95a5a6',
    marginTop: '5px'
  },
  pendingSection: {
    backgroundColor: 'linear-gradient(135deg, #fff8e1 0%, #fffde7 100%)',
    padding: '25px',
    borderRadius: '12px',
    marginBottom: '40px',
    border: '2px solid #ffc107',
    boxShadow: '0 4px 12px rgba(255, 193, 7, 0.2)'
  },
  pendingHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  pendingTitle: {
    margin: 0,
    color: '#e67e22',
    fontSize: '20px',
    fontWeight: '700'
  },
  badge: {
    backgroundColor: '#e74c3c',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  requestsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '15px'
  },
  requestCard: {
    backgroundColor: 'white',
    padding: '16px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    border: '1px solid #ffd89b',
    transition: 'all 0.3s ease'
  },
  requestTypeIcon: {
    fontSize: '32px',
    minWidth: '40px',
    textAlign: 'center'
  },
  requestInfo: {
    flex: 1
  },
  requestType: {
    margin: '0 0 5px 0',
    color: '#2c3e50',
    fontWeight: '700',
    fontSize: '14px'
  },
  requestOwner: {
    margin: '3px 0',
    fontSize: '13px',
    color: '#34495e',
    fontWeight: '500'
  },
  requestDetails: {
    margin: '3px 0',
    fontSize: '12px',
    color: '#7f8c8d'
  },
  requestTiming: {
    margin: '6px 0 0 0',
    fontSize: '12px',
    color: '#27ae60',
    fontWeight: '500',
    backgroundColor: '#ecf0f1',
    padding: '4px 8px',
    borderRadius: '4px',
    display: 'inline-block'
  },
  requestTimer: {
    margin: '6px 0 0 8px',
    fontSize: '12px',
    color: '#27ae60',
    fontWeight: '600',
    backgroundColor: '#d5f4e6',
    padding: '4px 8px',
    borderRadius: '4px',
    display: 'inline-block',
    animation: 'pulse 1.5s infinite'
  },
  requestTimerOverdue: {
    color: '#c0392b',
    backgroundColor: '#fadbd8'
  },
  requestActions: {
    display: 'flex',
    gap: '8px',
    flexShrink: 0
  },
  approveBtn: {
    padding: '10px 14px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 4px rgba(39, 174, 96, 0.3)'
  },
  rejectBtn: {
    padding: '10px 14px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 4px rgba(231, 76, 60, 0.3)'
  },
  viewAllContainer: {
    textAlign: 'center',
    marginTop: '10px'
  },
  viewAllBtn: {
    backgroundColor: '#3498db',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '13px',
    transition: 'all 0.3s ease'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '25px',
    marginTop: '20px'
  },
  card: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden'
  },
  cardIconLarge: {
    fontSize: '48px',
    marginBottom: '15px',
    display: 'block'
  },
  cardTitle: {
    fontSize: '18px',
    margin: '0 0 10px 0',
    color: '#2c3e50',
    fontWeight: '700'
  },
  cardDesc: {
    color: '#7f8c8d',
    fontSize: '14px',
    margin: '0 0 20px 0',
    lineHeight: '1.5'
  },
  btn: {
    width: '100%',
    padding: '12px 15px',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
  }
};

export default AdminDashboard;
