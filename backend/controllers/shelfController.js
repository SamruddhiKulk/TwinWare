const Shelf = require('../models/Shelf');
const InventoryItem = require('../models/InventoryItem');
const { syncSystemAlerts } = require('../services/alertService');

// @desc    Get all shelves with calculated occupancy, products, and grid layout info
// @route   GET /api/shelves
// @access  Private
const getShelves = async (req, res) => {
  try {
    const { zone } = req.query;
    const query = {};
    if (zone && zone !== 'All') {
      query.zone = zone;
    }

    const shelves = await Shelf.find(query).sort({ zone: 1, row: 1, column: 1 });

    // Aggregate inventory by shelf
    const inventoryItems = await InventoryItem.find({ quantity: { $gt: 0 } })
      .populate('product', 'name sku category price unit');

    const shelfInventoryMap = {};
    inventoryItems.forEach(item => {
      const shelfId = item.shelf.toString();
      if (!shelfInventoryMap[shelfId]) {
        shelfInventoryMap[shelfId] = {
          totalOccupancy: 0,
          items: [],
        };
      }
      shelfInventoryMap[shelfId].totalOccupancy += item.quantity;
      shelfInventoryMap[shelfId].items.push({
        _id: item._id,
        product: item.product,
        quantity: item.quantity,
        batchNumber: item.batchNumber,
        lastUpdated: item.lastUpdated,
      });
    });

    const enrichedShelves = shelves.map(shelf => {
      const inv = shelfInventoryMap[shelf._id.toString()] || { totalOccupancy: 0, items: [] };
      const occupancyPercentage = shelf.capacity > 0 
        ? Math.round((inv.totalOccupancy / shelf.capacity) * 100) 
        : 0;

      return {
        ...shelf.toObject(),
        currentOccupancy: inv.totalOccupancy,
        occupancyPercentage,
        isOverCapacity: inv.totalOccupancy > shelf.capacity,
        items: inv.items,
      };
    });

    res.json({
      success: true,
      count: enrichedShelves.length,
      data: enrichedShelves,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single shelf with its detailed inventory
// @route   GET /api/shelves/:id
// @access  Private
const getShelfById = async (req, res) => {
  try {
    const shelf = await Shelf.findById(req.params.id);
    if (!shelf) {
      return res.status(404).json({ success: false, message: 'Shelf not found' });
    }

    const items = await InventoryItem.find({ shelf: shelf._id, quantity: { $gt: 0 } })
      .populate('product');

    const totalOccupancy = items.reduce((sum, item) => sum + item.quantity, 0);
    const occupancyPercentage = shelf.capacity > 0 
      ? Math.round((totalOccupancy / shelf.capacity) * 100) 
      : 0;

    res.json({
      success: true,
      data: {
        ...shelf.toObject(),
        currentOccupancy: totalOccupancy,
        occupancyPercentage,
        items,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a shelf
// @route   POST /api/shelves
// @access  Private
const createShelf = async (req, res) => {
  try {
    const { code, zone, row, column, capacity, status, description } = req.body;

    if (!code || row === undefined || column === undefined || !capacity) {
      return res.status(400).json({ success: false, message: 'Code, row, column, and capacity are required' });
    }

    const existingCode = await Shelf.findOne({ code: code.trim().toUpperCase() });
    if (existingCode) {
      return res.status(400).json({ success: false, message: `Shelf code ${code} is already in use` });
    }

    const existingGrid = await Shelf.findOne({
      zone: zone || 'Zone A',
      row: Number(row),
      column: Number(column),
    });
    if (existingGrid) {
      return res.status(400).json({
        success: false,
        message: `Position Row ${row}, Column ${column} in ${zone || 'Zone A'} is already occupied by shelf ${existingGrid.code}`,
      });
    }

    const shelf = await Shelf.create({
      code: code.trim().toUpperCase(),
      zone: zone || 'Zone A',
      row: Number(row),
      column: Number(column),
      capacity: Number(capacity),
      status: status || 'Active',
      description: description || '',
    });

    res.status(201).json({ success: true, message: 'Shelf created successfully', data: shelf });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a shelf
// @route   PUT /api/shelves/:id
// @access  Private
const updateShelf = async (req, res) => {
  try {
    const { code, zone, row, column, capacity, status, description } = req.body;
    const shelf = await Shelf.findById(req.params.id);

    if (!shelf) {
      return res.status(404).json({ success: false, message: 'Shelf not found' });
    }

    if (code) shelf.code = code.trim().toUpperCase();
    if (zone) shelf.zone = zone;
    if (row !== undefined) shelf.row = Number(row);
    if (column !== undefined) shelf.column = Number(column);
    if (capacity !== undefined) shelf.capacity = Number(capacity);
    if (status) shelf.status = status;
    if (description !== undefined) shelf.description = description;

    await shelf.save();
    await syncSystemAlerts();

    res.json({ success: true, message: 'Shelf updated successfully', data: shelf });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a shelf
// @route   DELETE /api/shelves/:id
// @access  Private
const deleteShelf = async (req, res) => {
  try {
    const shelf = await Shelf.findById(req.params.id);
    if (!shelf) {
      return res.status(404).json({ success: false, message: 'Shelf not found' });
    }

    const itemsOnShelf = await InventoryItem.countDocuments({ shelf: shelf._id, quantity: { $gt: 0 } });
    if (itemsOnShelf > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete shelf holding active inventory. Please relocate or stock-out items first.',
      });
    }

    await InventoryItem.deleteMany({ shelf: shelf._id });
    await shelf.deleteOne();
    await syncSystemAlerts();

    res.json({ success: true, message: 'Shelf deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getShelves,
  getShelfById,
  createShelf,
  updateShelf,
  deleteShelf,
};
