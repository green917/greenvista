const express = require('express');
const authMiddleware = require('../middleware/auth');
const { isAdmin } = require('../middleware/roles');
const Invoice = require('../models/Invoice');

const router = express.Router();

router.get('/debug/all', async (req, res) => {
  try {
    const invoices = await Invoice.find().populate('ownerId', 'name email');
    res.json({ count: invoices.length, invoices });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/debug/my', authMiddleware, async (req, res) => {
  try {
    console.log('Debug /my endpoint - req.user:', req.user);
    const invoices = await Invoice.find({ ownerId: req.user.userId }).populate('ownerId', 'name email');
    res.json({ 
      userId: req.user.userId, 
      count: invoices.length, 
      invoices 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { ownerId, amount, dueDate } = req.body;
    console.log('[Invoice Create] Request received:', { ownerId, amount, dueDate });
    
    if (!ownerId || !amount || !dueDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Convert amount to number
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be a valid positive number' });
    }

    console.log('[Invoice Create] Creating invoice with amount:', parsedAmount);

    const invoice = new Invoice({ 
      ownerId, 
      amount: parsedAmount, 
      dueDate 
    });
    
    console.log('[Invoice Create] Invoice object before save:', invoice);
    
    await invoice.save();
    console.log('[Invoice Create] Invoice saved successfully');
    
    await invoice.populate('ownerId', 'name email phone address');
    console.log('[Invoice Create] Invoice populated:', invoice);
    
    res.status(201).json(invoice);
  } catch (error) {
    console.error('[Invoice Create] Error:', error);
    console.error('[Invoice Create] Error details:', error.message, error.errors);
    res.status(500).json({ error: error.message });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    let query = {};
    console.log('Invoices GET - req.user:', req.user);
    console.log('User role:', req.user.role);
    if (req.user.role === 'owner') {
      query = { ownerId: req.user.userId };
      console.log('Owner query:', query);
    }

    const invoices = await Invoice.find(query)
      .populate('ownerId', 'name email phone address');
    
    console.log('Found invoices:', invoices.length);
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/pay', authMiddleware, isAdmin, async (req, res) => {
  try {
    console.log('Mark paid request for invoice ID:', req.params.id);
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      console.log('Invoice not found with ID:', req.params.id);
      return res.status(404).json({ error: 'Invoice not found' });
    }
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { paid: true, paymentTxId: `TXN-${Date.now()}` },
      { new: true }
    ).populate('ownerId', 'name email phone address');
    console.log('Invoice marked as paid:', updatedInvoice._id);
    res.json(updatedInvoice);
  } catch (error) {
    console.error('Error marking invoice as paid:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Process payment from owner
router.post('/process-payment', authMiddleware, async (req, res) => {
  try {
    const { invoiceId, amount, paymentMethod, paymentDetails } = req.body;

    if (!invoiceId || !amount || !paymentMethod) {
      return res.status(400).json({ error: 'Missing required payment details' });
    }

    // Validate payment method
    if (!['upi', 'credit-card'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Invalid payment method' });
    }

    // Find invoice
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Verify invoice belongs to current user
    if (invoice.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized: This invoice does not belong to you' });
    }

    // Check if already paid
    if (invoice.paid) {
      return res.status(400).json({ error: 'Invoice already paid' });
    }

    // Verify amount matches
    if (parseFloat(amount) !== invoice.amount) {
      return res.status(400).json({ error: 'Amount mismatch' });
    }

    // Generate transaction ID
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Simulate payment processing
    console.log(`[Payment] Processing ${paymentMethod} payment for invoice ${invoiceId}`);
    console.log(`[Payment] Amount: ₹${amount}`);
    console.log(`[Payment] Transaction ID: ${transactionId}`);

    // In a real scenario, you would integrate with actual payment gateway here
    // For now, we'll simulate success

    // Update invoice as paid
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      invoiceId,
      {
        paid: true,
        paymentTxId: transactionId,
        paymentMethod: paymentMethod,
        paidAt: new Date()
      },
      { new: true }
    ).populate('ownerId', 'name email phone address');

    console.log(`[Payment] Invoice ${invoiceId} marked as paid with transaction ${transactionId}`);

    res.json({
      success: true,
      message: 'Payment processed successfully',
      transactionId: transactionId,
      invoice: updatedInvoice
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({ 
      error: error.message || 'Payment processing failed'
    });
  }
});

module.exports = router;
