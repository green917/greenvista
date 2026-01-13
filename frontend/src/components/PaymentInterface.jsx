import React, { useState } from 'react';
import api from '../api/api';

const PaymentInterface = ({ invoice, onClose, onPaymentSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' or 'credit-card'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    upiId: '',
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateUPI = (upi) => {
    const upiRegex = /^[a-zA-Z0-9._-]{3,}@[a-zA-Z]{3,}$/;
    return upiRegex.test(upi);
  };

  const validateCard = (cardNumber) => {
    return cardNumber.replace(/\s/g, '').length === 16;
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (paymentMethod === 'upi') {
        if (!formData.upiId) {
          setError('Please enter UPI ID');
          setLoading(false);
          return;
        }
        if (!validateUPI(formData.upiId)) {
          setError('Invalid UPI ID format (e.g., user@upi)');
          setLoading(false);
          return;
        }
      } else {
        if (!formData.cardNumber || !formData.cardName || !formData.expiry || !formData.cvv) {
          setError('Please fill all card details');
          setLoading(false);
          return;
        }
        if (!validateCard(formData.cardNumber)) {
          setError('Card number must be 16 digits');
          setLoading(false);
          return;
        }
      }

      // Process payment via backend
      const response = await api.post('/api/invoices/process-payment', {
        invoiceId: invoice._id,
        amount: invoice.amount,
        paymentMethod,
        paymentDetails: paymentMethod === 'upi' 
          ? { upiId: formData.upiId }
          : { 
              cardNumber: formData.cardNumber.replace(/\s/g, '').slice(-4),
              cardName: formData.cardName
            }
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          onPaymentSuccess();
          onClose();
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <div style={styles.successContainer}>
            <div style={styles.successIcon}>✓</div>
            <h2>Payment Successful!</h2>
            <p>Amount: ₹{invoice.amount}</p>
            <p style={styles.successText}>Your payment has been processed successfully.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2>💳 Payment Interface</h2>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <div style={styles.invoiceInfo}>
          <div style={styles.infoRow}>
            <span>Invoice Amount:</span>
            <strong style={styles.amount}>₹{invoice.amount}</strong>
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handlePayment} style={styles.form}>
          {/* Payment Method Selection */}
          <div style={styles.methodSelector}>
            <label style={{
              ...styles.methodOption,
              ...(paymentMethod === 'upi' ? styles.methodSelected : {})
            }}>
              <input
                type="radio"
                name="paymentMethod"
                value="upi"
                checked={paymentMethod === 'upi'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={styles.radio}
              />
              📱 UPI Payment
            </label>
            <label style={{
              ...styles.methodOption,
              ...(paymentMethod === 'credit-card' ? styles.methodSelected : {})
            }}>
              <input
                type="radio"
                name="paymentMethod"
                value="credit-card"
                checked={paymentMethod === 'credit-card'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={styles.radio}
              />
              💳 Credit Card
            </label>
          </div>

          {/* UPI Payment Form */}
          {paymentMethod === 'upi' && (
            <div style={styles.formGroup}>
              <label style={styles.label}>UPI ID</label>
              <input
                type="text"
                name="upiId"
                placeholder="yourname@upi"
                value={formData.upiId}
                onChange={handleInputChange}
                style={styles.input}
                required
              />
              <small style={styles.help}>e.g., user@paytm, user@googlepay, user@phonepe</small>
            </div>
          )}

          {/* Credit Card Payment Form */}
          {paymentMethod === 'credit-card' && (
            <>
              <div style={styles.formGroup}>
                <label style={styles.label}>Card Holder Name</label>
                <input
                  type="text"
                  name="cardName"
                  placeholder="John Doe"
                  value={formData.cardName}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Card Number</label>
                <input
                  type="text"
                  name="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={formData.cardNumber}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\s/g, '');
                    if (value.length <= 16) {
                      value = value.replace(/(\d{4})/g, '$1 ').trim();
                      handleInputChange({ target: { name: 'cardNumber', value } });
                    }
                  }}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Expiry Date</label>
                  <input
                    type="text"
                    name="expiry"
                    placeholder="MM/YY"
                    value={formData.expiry}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '');
                      if (value.length >= 2) {
                        value = value.substring(0, 2) + '/' + value.substring(2, 4);
                      }
                      handleInputChange({ target: { name: 'expiry', value } });
                    }}
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>CVV</label>
                  <input
                    type="text"
                    name="cvv"
                    placeholder="123"
                    value={formData.cvv}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 3) {
                        handleInputChange({ target: { name: 'cvv', value } });
                      }
                    }}
                    style={styles.input}
                    maxLength="3"
                    required
                  />
                </div>
              </div>
            </>
          )}

          <button 
            type="submit" 
            disabled={loading}
            style={styles.payButton}
          >
            {loading ? 'Processing Payment...' : `Pay ₹${invoice.amount}`}
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={styles.cancelButton}
          >
            Cancel
          </button>
        </form>

        <div style={styles.security}>
          🔒 Your payment information is secure and encrypted.
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    maxWidth: '500px',
    width: '90%',
    padding: '30px',
    maxHeight: '90vh',
    overflowY: 'auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#999'
  },
  invoiceInfo: {
    backgroundColor: '#f0f8f5',
    padding: '15px',
    borderRadius: '6px',
    marginBottom: '20px',
    border: '1px solid #27ae60'
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  amount: {
    fontSize: '20px',
    color: '#27ae60'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  methodSelector: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px'
  },
  methodOption: {
    flex: 1,
    padding: '12px',
    border: '2px solid #ddd',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease'
  },
  methodSelected: {
    borderColor: '#27ae60',
    backgroundColor: '#f0f8f5'
  },
  radio: {
    cursor: 'pointer'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  formRow: {
    display: 'flex',
    gap: '10px'
  },
  label: {
    fontWeight: '600',
    color: '#2c3e50',
    fontSize: '14px'
  },
  input: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  help: {
    fontSize: '12px',
    color: '#7f8c8d',
    marginTop: '4px'
  },
  payButton: {
    padding: '12px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    marginTop: '10px'
  },
  cancelButton: {
    padding: '12px',
    backgroundColor: '#ecf0f1',
    color: '#2c3e50',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease'
  },
  error: {
    backgroundColor: '#e74c3c',
    color: 'white',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '15px',
    fontSize: '14px'
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
  },
  security: {
    textAlign: 'center',
    fontSize: '12px',
    color: '#27ae60',
    marginTop: '15px',
    paddingTop: '15px',
    borderTop: '1px solid #ecf0f1'
  }
};

export default PaymentInterface;
