const mongoose = require('mongoose');

const movementHistorySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['STOCK_IN', 'STOCK_OUT', 'TRANSFER'],
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product reference is required'],
  },
  shelf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shelf',
    required: [true, 'Source/Target shelf is required'],
  },
  targetShelf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shelf',
    default: null,
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  referenceNo: {
    type: String,
    trim: true,
    default: '',
  },
  notes: {
    type: String,
    trim: true,
    default: '',
  },
  date: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
});

const MovementHistory = mongoose.model('MovementHistory', movementHistorySchema);
module.exports = MovementHistory;
