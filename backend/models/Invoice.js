const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  paid: {
    type: Boolean,
    default: false
  },
  paymentTxId: {
    type: String
  },
  paymentMethod: {
    type: String,
    enum: ['upi', 'credit-card', 'manual', null],
    default: null
  },
  paidAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Invoice', invoiceSchema);
