const Equipment = require('../models/Equipment');
const { syncSystemAlerts } = require('../services/alertService');

// @desc    Get all equipment
// @route   GET /api/equipment
// @access  Private
const getEquipment = async (req, res) => {
  try {
    const { status, type, zone } = req.query;
    const filter = {};

    if (status && status !== 'All') filter.status = status;
    if (type && type !== 'All') filter.type = type;
    if (zone && zone !== 'All') filter.zone = zone;

    const equipmentList = await Equipment.find(filter).sort({ code: 1 });
    res.json({ success: true, count: equipmentList.length, data: equipmentList });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single equipment
// @route   GET /api/equipment/:id
// @access  Private
const getEquipmentById = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }
    res.json({ success: true, data: equipment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create equipment
// @route   POST /api/equipment
// @access  Private
const createEquipment = async (req, res) => {
  try {
    const { code, name, type, zone, status, healthPercentage, operator, lastMaintenanceDate, nextMaintenanceDate, notes } = req.body;

    if (!code || !name) {
      return res.status(400).json({ success: false, message: 'Equipment code and name are required' });
    }

    const existingCode = await Equipment.findOne({ code: code.trim().toUpperCase() });
    if (existingCode) {
      return res.status(400).json({ success: false, message: `Equipment with code ${code} already exists` });
    }

    const equipment = await Equipment.create({
      code: code.trim().toUpperCase(),
      name: name.trim(),
      type: type || 'Forklift',
      zone: zone || 'Zone A',
      status: status || 'Operational',
      healthPercentage: healthPercentage !== undefined ? Number(healthPercentage) : 100,
      operator: operator || 'Unassigned',
      lastMaintenanceDate: lastMaintenanceDate || new Date(),
      nextMaintenanceDate: nextMaintenanceDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      notes: notes || '',
    });

    await syncSystemAlerts();

    res.status(201).json({ success: true, message: 'Equipment added successfully', data: equipment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update equipment (including quick status toggle)
// @route   PUT /api/equipment/:id
// @access  Private
const updateEquipment = async (req, res) => {
  try {
    if (req.user.role === 'manager' && Object.keys(req.body).some((key) => key !== 'status')) {
      return res.status(403).json({ success: false, message: 'Managers may only change equipment status' });
    }

    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }

    const { name, type, zone, status, healthPercentage, operator, lastMaintenanceDate, nextMaintenanceDate, notes } = req.body;

    if (name) equipment.name = name.trim();
    if (type) equipment.type = type;
    if (zone) equipment.zone = zone;
    if (status) equipment.status = status;
    if (healthPercentage !== undefined) equipment.healthPercentage = Number(healthPercentage);
    if (operator !== undefined) equipment.operator = operator;
    if (lastMaintenanceDate) equipment.lastMaintenanceDate = lastMaintenanceDate;
    if (nextMaintenanceDate) equipment.nextMaintenanceDate = nextMaintenanceDate;
    if (notes !== undefined) equipment.notes = notes;

    await equipment.save();
    await syncSystemAlerts();

    res.json({ success: true, message: 'Equipment updated successfully', data: equipment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete equipment
// @route   DELETE /api/equipment/:id
// @access  Private
const deleteEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }

    await equipment.deleteOne();
    await syncSystemAlerts();

    res.json({ success: true, message: 'Equipment removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
};
