const mongoose = require('mongoose');

const shelfSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Shelf code is required'],
    unique: true,
    trim: true,
    uppercase: true,
  },
  zone: {
    type: String,
    required: [true, 'Zone is required'],
    trim: true,
    default: 'Zone A',
  },
  row: {
    type: Number,
    required: [true, 'Row index is required'],
    min: 1,
  },
  column: {
    type: Number,
    required: [true, 'Column index is required'],
    min: 1,
  },
  capacity: {
    type: Number,
    required: [true, 'Shelf capacity is required'],
    min: [1, 'Capacity must be at least 1'],
    default: 100,
  },
  status: {
    type: String,
    enum: ['Active', 'Maintenance', 'Inactive'],
    default: 'Active',
  },
  description: {
    type: String,
    trim: true,
    default: '',
  }
}, {
  timestamps: true,
});

shelfSchema.index({ zone: 1, row: 1, column: 1 }, { unique: true });

const Shelf = mongoose.model('Shelf', shelfSchema);
module.exports = Shelf;
