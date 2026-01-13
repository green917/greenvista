import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

const OwnerDashboard = () => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: '',
    details: '',
    requestedDate: '',
    requestedTime: ''
  });
  const [requests, setRequests] = useState([]);
  const [fetchingRequests, setFetchingRequests] = useState(true);

  useEffect(() => {
    fetchMyRequests();
    // Refresh every 5 seconds to get updates
    const interval = setInterval(fetchMyRequests, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchMyRequests = async () => {
    try {
      const response = await api.get('/api/requests/my');
      const data = Array.isArray(response.data) ? response.data : response.data.requests || [];
      setRequests(data);
    } catch (err) {
      console.error('Failed to fetch requests');
    } finally {
      setFetchingRequests(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.type || !formData.details) {
      setError('Please fill all fields');
      setLoading(false);
      return;
    }

    try {
      await api.post('/api/requests', {
        type: formData.type,
        details: formData.details,
        requestedDate: formData.requestedDate,
        requestedTime: formData.requestedTime
      });
      setFormData({ type: '', details: '', requestedDate: '', requestedTime: '' });
      setShowForm(false);
      fetchMyRequests();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1>Welcome, {user?.name}! 👋</h1>
      
      <div style={styles.grid}>
        <div style={styles.card}>
          <h3>📋 My Requests ({requests.length})</h3>
          <p>View and manage your service requests</p>
          <Link to="/requests" style={styles.linkBtn}>View Requests →</Link>
        </div>
        <div style={styles.card}>
          <h3>💰 My Invoices</h3>
          <p>View and pay your invoices</p>
          <Link to="/invoices" style={styles.linkBtn}>View Invoices →</Link>
        </div>
        <div style={styles.card}>
          <h3>📢 Notices</h3>
          <p>Read important announcements</p>
          <Link to="/notices" style={styles.linkBtn}>Read Notices →</Link>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2>Create Service Request</h2>
          <button onClick={() => setShowForm(!showForm)} style={styles.toggleBtn}>
            {showForm ? '✕ Cancel' : '+ New Request'}
          </button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {showForm && (
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label>Request Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                style={styles.select}
              >
                <option value="">-- Select Type --</option>
                <option value="plumbing">Plumbing</option>
                <option value="electrical">Electrical</option>
                <option value="maintenance">Maintenance</option>
                <option value="cleaning">Cleaning</option>
                <option value="gardening">Gardening</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label>Details</label>
              <textarea
                name="details"
                value={formData.details}
                onChange={handleChange}
                placeholder="Describe the issue or request"
                required
                style={{...styles.input, minHeight: '100px'}}
              />
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label>Requested Date</label>
                <input
                  type="date"
                  name="requestedDate"
                  value={formData.requestedDate}
                  onChange={handleChange}
                  min={getTodayDate()}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label>Requested Time</label>
                <input
                  type="time"
                  name="requestedTime"
                  value={formData.requestedTime}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} style={styles.submitBtn}>
              {loading ? 'Creating...' : 'Submit Request'}
            </button>
          </form>
        )}
      </div>

      <div style={styles.section}>
        <h2>Recent Requests</h2>
        {fetchingRequests ? (
          <p>Loading...</p>
        ) : requests.length === 0 ? (
          <p style={styles.emptyText}>No requests yet. Create one to get started!</p>
        ) : (
          <div style={styles.requestsList}>
            {requests.slice(0, 5).map((req) => (
              <div key={req._id} style={styles.requestItem}>
                <div style={styles.requestHeader}>
                  <strong>{req.type}</strong>
                  <span style={{
                    ...styles.badge,
                    backgroundColor: req.status === 'pending' ? '#f39c12' : req.status === 'approved' ? '#27ae60' : '#e74c3c'
                  }}>
                    {req.status}
                  </span>
                </div>
                <p>{req.details.substring(0, 100)}...</p>
                <small>{new Date(req.createdAt).toLocaleDateString()}</small>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    marginTop: '30px',
    marginBottom: '40px'
  },
  card: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    borderLeft: '4px solid #27ae60'
  },
  linkBtn: {
    display: 'inline-block',
    marginTop: '15px',
    color: '#27ae60',
    textDecoration: 'none',
    fontWeight: 'bold'
  },
  section: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  toggleBtn: {
    padding: '8px 16px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  error: {
    backgroundColor: '#e74c3c',
    color: 'white',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '15px'
  },
  form: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '15px',
    marginBottom: '15px',
    paddingBottom: '15px',
    borderBottom: '1px solid #eee'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '15px'
  },
  label: {
    marginBottom: '5px',
    fontWeight: 'bold',
    fontSize: '14px'
  },
  select: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  },
  input: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'inherit'
  },
  submitBtn: {
    padding: '10px 20px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    gridColumn: '1 / -1'
  },
  emptyText: {
    color: '#95a5a6',
    fontStyle: 'italic'
  },
  requestsList: {
    display: 'grid',
    gap: '12px'
  },
  requestItem: {
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    borderLeft: '3px solid #3498db'
  },
  requestHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  badge: {
    color: 'white',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold'
  }
};

export default OwnerDashboard;
