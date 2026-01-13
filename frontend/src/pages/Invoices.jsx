import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import PaymentInterface from '../components/PaymentInterface';

const Invoices = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [formData, setFormData] = useState({
    ownerId: '',
    amount: '',
    dueDate: ''
  });

  useEffect(() => {
    fetchInvoices();
    if (user?.role === 'admin') {
      fetchOwners();
    }
  }, []);

  const fetchInvoices = async () => {
    try {
      setError('');
      const response = await api.get('/api/invoices');
      console.log('Fetched invoices response:', response.data);
      // Handle both array and object responses
      const data = Array.isArray(response.data) ? response.data : response.data.invoices || [];
      console.log('Invoices after parsing:', data);
      setInvoices(data);
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to fetch invoices';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchOwners = async () => {
    try {
      setError('');
      const response = await api.get('/api/users');
      console.log('Fetched owners response:', response.data);
      const data = Array.isArray(response.data) ? response.data : response.data.users || [];
      const ownersList = data.filter(u => u.role === 'owner');
      console.log('Filtered owners:', ownersList);
      setOwners(ownersList);
    } catch (err) {
      console.error('Failed to fetch owners:', err);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to fetch owners';
      setError(errorMsg);
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
      await api.post('/api/invoices', formData);
      setFormData({ ownerId: '', amount: '', dueDate: '' });
      setShowForm(false);
      fetchInvoices();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create invoice');
    }
  };

  const markAsPaid = async (id) => {
    try {
      console.log('Marking invoice as paid with ID:', id);
      const response = await api.put(`/api/invoices/${id}/pay`, {});
      console.log('Mark paid response:', response.data);
      // Update the invoices list immediately
      setInvoices(prev => 
        prev.map(inv => 
          inv._id === id 
            ? { ...inv, paid: true, paymentTxId: response.data.paymentTxId || `TXN-${Date.now()}` }
            : inv
        )
      );
    } catch (err) {
      console.error('Mark paid error:', err);
      setError('Failed to mark as paid: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return <div style={styles.container}>Loading...</div>;

  const isAdmin = user?.role === 'admin';

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>💰 {isAdmin ? 'Invoices Management' : 'My Invoices'}</h1>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)} style={styles.createBtn}>
            {showForm ? 'Cancel' : '+ Create Invoice'}
          </button>
        )}
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {showForm && isAdmin && (
        <div style={styles.formContainer}>
          <h2>Create New Invoice</h2>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label>Select Owner</label>
              <select
                name="ownerId"
                value={formData.ownerId}
                onChange={handleChange}
                required
                style={styles.select}
              >
                <option value="">-- Select Owner --</option>
                {owners.map(owner => (
                  <option key={owner._id} value={owner._id}>
                    {owner.name} ({owner.email})
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label>Amount</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="Enter amount"
                required
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label>Due Date</label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>

            <button type="submit" style={styles.submitBtn}>Create Invoice</button>
          </form>
        </div>
      )}

      {isAdmin ? (
        // Admin view - table
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.headerRow}>
                <th style={styles.th}>Owner</th>
                <th style={styles.th}>Amount</th>
                <th style={styles.th}>Due Date</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv._id} style={styles.row}>
                  <td style={styles.td}>{inv.ownerId?.name || 'N/A'}</td>
                  <td style={styles.td}>₹{inv.amount}</td>
                  <td style={styles.td}>{new Date(inv.dueDate).toLocaleDateString()}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge,
                      backgroundColor: inv.paid ? '#27ae60' : '#e74c3c'
                    }}>
                      {inv.paid ? 'Paid' : 'Pending'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {!inv.paid && (
                      <button
                        onClick={() => markAsPaid(inv._id)}
                        style={{...styles.button, backgroundColor: '#27ae60'}}
                      >
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        // Owner view - cards (with Pay button)
        <div style={styles.cardGrid}>
          {invoices.length === 0 ? (
            <div style={styles.emptyContainer}>
              <p style={styles.emptyText}>No invoices yet</p>
              <p style={styles.emptySubtext}>If admin just created invoices for you, please log out and log back in to refresh.</p>
            </div>
          ) : (
            invoices.map((inv) => (
              <div key={inv._id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3>Invoice</h3>
                  <span style={{
                    ...styles.badge,
                    backgroundColor: inv.paid ? '#27ae60' : '#e74c3c'
                  }}>
                    {inv.paid ? '✓ Paid' : '⏳ Pending'}
                  </span>
                </div>
                <div style={styles.cardBody}>
                  <div style={styles.cardRow}>
                    <span>Amount:</span>
                    <strong style={styles.amountText}>₹{inv.amount}</strong>
                  </div>
                  <div style={styles.cardRow}>
                    <span>Due Date:</span>
                    <strong>{new Date(inv.dueDate).toLocaleDateString()}</strong>
                  </div>
                  <div style={styles.cardRow}>
                    <span>Created:</span>
                    <small>{new Date(inv.createdAt).toLocaleDateString()}</small>
                  </div>
                </div>
                
                {!inv.paid && (
                  <button
                    onClick={() => {
                      setSelectedInvoice(inv);
                      setShowPaymentModal(true);
                    }}
                    style={styles.payBtn}
                  >
                    💳 Pay ₹{inv.amount}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {showPaymentModal && selectedInvoice && (
        <PaymentInterface
          invoice={selectedInvoice}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedInvoice(null);
          }}
          onPaymentSuccess={() => {
            fetchInvoices();
          }}
        />
      )}
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
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
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
    fontSize: '14px'
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
    fontWeight: 'bold',
    gridColumn: '1 / -1'
  },
  tableWrapper: {
    overflowX: 'auto',
    marginTop: '20px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  headerRow: {
    backgroundColor: '#34495e',
    color: 'white'
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    fontWeight: 'bold'
  },
  row: {
    borderBottom: '1px solid #ddd'
  },
  td: {
    padding: '12px'
  },
  badge: {
    color: 'white',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  button: {
    padding: '6px 12px',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  emptyContainer: {
    gridColumn: '1 / -1',
    padding: '40px 20px',
    textAlign: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e9ecef'
  },
  emptyText: {
    color: '#95a5a6',
    fontStyle: 'italic',
    fontSize: '16px',
    margin: '0 0 10px 0'
  },
  emptySubtext: {
    color: '#7f8c8d',
    fontSize: '14px',
    margin: 0
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
    marginTop: '20px'
  },
  card: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    borderLeft: '4px solid #3498db'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    paddingBottom: '10px',
    borderBottom: '1px solid #eee'
  },
  cardBody: {
    marginBottom: '15px'
  },
  cardRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #f0f0f0'
  },
  paidNote: {
    backgroundColor: '#e8f8f5',
    color: '#27ae60',
    padding: '10px',
    borderRadius: '4px',
    fontSize: '12px'
  },
  payBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    marginTop: '15px'
  },
  amountText: {
    color: '#27ae60',
    fontSize: '16px'
  }
};

export default Invoices;
