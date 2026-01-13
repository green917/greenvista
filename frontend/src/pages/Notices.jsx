import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

const Notices = () => {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    visibleTo: 'all'
  });

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      setError('');
      const response = await api.get('/api/notices');
      // Handle both array and object responses
      const data = Array.isArray(response.data) ? response.data : response.data.notices || [];
      setNotices(data);
    } catch (err) {
      console.error('Failed to fetch notices:', err);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to fetch notices';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/api/notices', formData);
      setFormData({ title: '', body: '', visibleTo: 'all' });
      setShowForm(false);
      fetchNotices();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create notice');
    }
  };

  const handleDelete = async (noticeId) => {
    if (window.confirm('Are you sure you want to delete this notice?')) {
      try {
        setError('');
        await api.delete(`/api/notices/${noticeId}`);
        fetchNotices();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete notice');
      }
    }
  };

  if (loading) return <div style={styles.container}>Loading...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>📢 Notices</h1>
        {user?.role === 'admin' && (
          <button onClick={() => setShowForm(!showForm)} style={styles.createBtn}>
            {showForm ? 'Cancel' : '+ Create Notice'}
          </button>
        )}
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {showForm && user?.role === 'admin' && (
        <div style={styles.formContainer}>
          <h2>Create New Notice</h2>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label>Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Notice title"
                required
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label>Message</label>
              <textarea
                name="body"
                value={formData.body}
                onChange={handleChange}
                placeholder="Notice content"
                required
                style={{...styles.input, minHeight: '120px'}}
              />
            </div>

            <div style={styles.formGroup}>
              <label>Visible To</label>
              <select
                name="visibleTo"
                value={formData.visibleTo}
                onChange={handleChange}
                style={styles.select}
              >
                <option value="all">All Users</option>
                <option value="owners">Owners Only</option>
                <option value="admin">Admin Only</option>
              </select>
            </div>

            <button type="submit" style={styles.submitBtn}>Create Notice</button>
          </form>
        </div>
      )}

      <div style={styles.noticesGrid}>
        {notices.map((notice) => (
          <div key={notice._id} style={styles.noticeCard}>
            <h3 style={styles.noticeTitle}>{notice.title}</h3>
            <p style={styles.noticeBody}>{notice.body}</p>
            <div style={styles.noticeFooter}>
              <span style={styles.visibleBadge}>{notice.visibleTo}</span>
              <div style={styles.footerRight}>
                <span style={styles.dateText}>{new Date(notice.createdAt).toLocaleDateString()}</span>
                {user?.role === 'admin' && (
                  <button 
                    onClick={() => handleDelete(notice._id)} 
                    style={styles.deleteBtn}
                    title="Delete notice"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  createBtn: {
    padding: '10px 20px',
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
    marginBottom: '20px'
  },
  formContainer: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginTop: '15px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column'
  },
  label: {
    marginBottom: '5px',
    fontWeight: 'bold',
    fontSize: '14px'
  },
  input: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'inherit'
  },
  select: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  },
  submitBtn: {
    padding: '10px 20px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  noticesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px',
    marginTop: '20px'
  },
  noticeCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
    borderLeft: '4px solid #3498db',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden'
  },
  noticeTitle: {
    margin: '0 0 12px 0',
    fontSize: '18px',
    fontWeight: '600',
    color: '#2c3e50',
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
    hyphens: 'auto'
  },
  noticeBody: {
    margin: '0 0 auto 0',
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#34495e',
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
    hyphens: 'auto'
  },
  noticeFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '15px',
    paddingTop: '15px',
    borderTop: '1px solid #ecf0f1',
    flexShrink: 0
  },
  footerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'background-color 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  visibleBadge: {
    backgroundColor: '#ecf0f1',
    color: '#34495e',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  dateText: {
    fontSize: '12px',
    color: '#95a5a6'
  }
};

export default Notices;
