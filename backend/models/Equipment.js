const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Equipment code is required'],
    unique: true,
    trim: true,
    uppercase: true,
  },
  name: {
    type: String,
    required: [true, 'Equipment name is required'],
    trim: true,
  },
  type: {
    type: String,
    required: [true, 'Equipment type is required'],
    enum: ['Forklift', 'Conveyor', 'Crane', 'Scanner', 'Robot AGV', 'HVAC / Chiller', 'Pallet Jack', 'Other'],
    default: 'Forklift',
  },
  zone: {
    type: String,
    required: [true, 'Zone is required'],
    trim: true,
    default: 'Zone A',
  },
  status: {
    type: String,
    enum: ['Operational', 'Maintenance', 'Offline'],
    default: 'Operational',
  },
  healthPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 100,
  },
  operator: {
    type: String,
    default: 'Unassigned',
    trim: true,
  },
  lastMaintenanceDate: {
    type: Date,
    default: Date.now,
  },
  nextMaintenanceDate: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  },
  notes: {
    type: String,
    default: '',
    trim: true,
  }
}, {
  timestamps: true,
});

const Equipment = mongoose.model('Equipment', equipmentSchema);
module.exports = Equipment;
