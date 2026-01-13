import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

const Requests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');
      let response;
      
      if (user?.role === 'admin') {
        // Admin sees all requests
        response = await api.get('/api/requests');
      } else {
        // Owner sees only their requests
        response = await api.get('/api/requests/my');
      }
      
      // Handle both array and paginated response
      const data = Array.isArray(response.data) ? response.data : response.data.requests || [];
      setRequests(data);
    } catch (err) {
      console.error('Fetch requests error:', err);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to fetch requests';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (id, status) => {
    try {
      await api.put(`/api/requests/${id}`, { status });
      // Update the requests list immediately
      setRequests(prev =>
        prev.map(req =>
          req._id === id ? { ...req, status } : req
        )
      );
    } catch (err) {
      setError('Failed to update request: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return <div style={styles.container}><div style={styles.loadingSpinner}>⏳ Loading requests...</div></div>;

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes slideInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .req-title { animation: slideInDown 0.5s ease-out; }
        .req-error { animation: slideInDown 0.4s ease-out; }
        .req-card { animation: slideInUp 0.5s ease-out; }
        .req-row { animation: fadeIn 0.4s ease-out; }
        .req-card:hover { transform: translateY(-6px); box-shadow: 0 8px 16px rgba(0,0,0,0.12); }
        .req-btn { transition: all 0.3s ease; }
        .req-btn:hover { transform: scale(1.1); }
      `}</style>
      
      <h1 className="req-title">
        {user?.role === 'admin' ? '📋 All Service Requests' : '📋 My Service Requests'}
      </h1>
      {error && <div style={styles.error} className="req-error">{error}</div>}

      {requests.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyIcon}>📭</p>
          <p style={styles.emptyText}>No requests found</p>
          {user?.role === 'owner' && (
            <p style={styles.emptySubtext}>Create your first service request from the dashboard, or log out and back in to refresh if admin created one for you.</p>
          )}
        </div>
      ) : user?.role === 'admin' ? (
        // Admin view - table with approve/reject
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.headerRow}>
                <th style={styles.th}>Owner</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Details</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req, idx) => (
                <tr key={req._id} style={styles.row} className="req-row">
                  <td style={styles.td}>
                    <strong>{req.ownerId?.name}</strong>
                    <br />
                    <small style={styles.phone}>{req.ownerId?.phone}</small>
                  </td>
                  <td style={styles.td}>{req.type}</td>
                  <td style={styles.td}>{req.details?.substring(0, 40)}...</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge,
                      backgroundColor: req.status === 'pending' ? '#f39c12' : req.status === 'open' ? '#f39c12' : req.status === 'approved' ? '#27ae60' : '#e74c3c'
                    }}>
                      {req.status === 'open' ? 'pending' : req.status}
                    </span>
                  </td>
                  <td style={styles.td}><small>{new Date(req.createdAt).toLocaleDateString()}</small></td>
                  <td style={styles.td}>
                    {(req.status === 'pending' || req.status === 'open') && (
                      <div style={styles.actionButtons}>
                        <button
                          onClick={() => updateRequestStatus(req._id, 'approved')}
                          style={{...styles.button, ...styles.approveBtn}}
                          className="req-btn"
                          title="Approve"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => updateRequestStatus(req._id, 'rejected')}
                          style={{...styles.button, ...styles.rejectBtn}}
                          className="req-btn"
                          title="Reject"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        // Owner view - card layout
        <div style={styles.cardGrid}>
          {requests.map((req, idx) => (
            <div 
              key={req._id} 
              style={{...styles.card, animationDelay: `${idx * 0.1}s`}}
              className="req-card"
            >
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>{req.type}</h3>
                <span style={{
                  ...styles.badge,
                  backgroundColor: req.status === 'pending' ? '#f39c12' : req.status === 'open' ? '#f39c12' : req.status === 'approved' ? '#27ae60' : '#e74c3c'
                }}>
                  {req.status === 'open' ? 'pending' : req.status}
                </span>
              </div>
              <p style={styles.cardDetails}>{req.details}</p>
              <div style={styles.cardFooter}>
                <small>📅 {new Date(req.createdAt).toLocaleDateString()}</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '30px 20px'
  },
  loadingSpinner: {
    textAlign: 'center',
    padding: '60px 20px',
    fontSize: '18px',
    color: '#7f8c8d'
  },
  error: {
    backgroundColor: '#e74c3c',
    color: 'white',
    padding: '14px 16px',
    borderRadius: '6px',
    marginBottom: '20px',
    boxShadow: '0 4px 6px rgba(231, 76, 60, 0.2)',
    fontWeight: '500'
  },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    borderRadius: '12px',
    color: '#95a5a6'
  },
  emptyIcon: {
    fontSize: '48px',
    margin: '0 0 15px 0'
  },
  emptyText: {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '10px 0',
    color: '#2c3e50'
  },
  emptySubtext: {
    fontSize: '14px',
    color: '#7f8c8d'
  },
  tableWrapper: {
    overflowX: 'auto',
    marginTop: '20px',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: 'white'
  },
  headerRow: {
    backgroundColor: 'linear-gradient(135deg, #34495e 0%, #2c3e50 100%)',
    color: 'white'
  },
  th: {
    padding: '14px',
    textAlign: 'left',
    fontWeight: '700',
    fontSize: '13px'
  },
  row: {
    borderBottom: '1px solid #ecf0f1',
    transition: 'all 0.3s ease'
  },
  td: {
    padding: '14px'
  },
  phone: {
    color: '#95a5a6'
  },
  badge: {
    color: 'white',
    padding: '6px 14px',
    borderRadius: '16px',
    fontSize: '11px',
    fontWeight: 'bold',
    display: 'inline-block'
  },
  actionButtons: {
    display: 'flex',
    gap: '6px'
  },
  button: {
    padding: '8px 12px',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  approveBtn: {
    backgroundColor: '#27ae60'
  },
  rejectBtn: {
    backgroundColor: '#e74c3c'
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '24px',
    marginTop: '20px'
  },
  card: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    borderLeft: '5px solid #3498db',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
    paddingBottom: '10px',
    borderBottom: '2px solid #ecf0f1'
  },
  cardTitle: {
    margin: 0,
    fontSize: '16px',
    color: '#2c3e50',
    fontWeight: '700'
  },
  cardDetails: {
    color: '#555',
    lineHeight: '1.6',
    marginBottom: '15px',
    fontSize: '14px'
  },
  cardFooter: {
    paddingTop: '12px',
    borderTop: '1px solid #ecf0f1',
    color: '#95a5a6',
    fontSize: '12px'
  }
};

export default Requests;
