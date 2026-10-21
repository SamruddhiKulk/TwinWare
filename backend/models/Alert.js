const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['LOW_STOCK', 'EQUIPMENT_STATUS', 'OVERCAPACITY', 'SYSTEM'],
    required: true,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  referenceModel: {
    type: String,
    enum: ['Product', 'Equipment', 'Shelf', null],
    default: null,
  },
  status: {
    type: String,
    enum: ['Active', 'Acknowledged', 'Resolved'],
    default: 'Active',
  },
  acknowledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  acknowledgedAt: {
    type: Date,
    default: null,
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  resolvedAt: {
    type: Date,
    default: null,
  },
  resolutionReason: {
    type: String,
    enum: ['manual', 'system', null],
    default: null,
  },
  conditionClearedAt: {
    type: Date,
    default: null,
  },
  conditionKey: {
    type: String,
    select: false,
  },
}, {
  timestamps: true,
});

alertSchema.index({ conditionKey: 1 }, { unique: true, sparse: true });

const Alert = mongoose.model('Alert', alertSchema);
module.exports = Alert;
