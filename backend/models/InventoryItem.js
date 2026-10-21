const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required'],
  },
  shelf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shelf',
    required: [true, 'Shelf is required'],
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 0,
  },
  batchNumber: {
    type: String,
    default: '',
    trim: true,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
});

inventoryItemSchema.index({ product: 1, shelf: 1 }, { unique: true });

const InventoryItem = mongoose.model('InventoryItem', inventoryItemSchema);
module.exports = InventoryItem;
