const InventoryItem = require('../models/InventoryItem');
const Product = require('../models/Product');
const Shelf = require('../models/Shelf');
const MovementHistory = require('../models/MovementHistory');
const { syncSystemAlerts } = require('../services/alertService');

// @desc    Get all inventory records
// @route   GET /api/inventory
// @access  Private
const getInventory = async (req, res) => {
  try {
    const { shelfId, productId } = req.query;
    const filter = { quantity: { $gt: 0 } };

    if (shelfId) filter.shelf = shelfId;
    if (productId) filter.product = productId;

    const items = await InventoryItem.find(filter)
      .populate('product', 'name sku category price reorderLevel unit')
      .populate('shelf', 'code zone row column capacity')
      .sort({ updatedAt: -1 });

    res.json({ success: true, count: items.length, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Stock-In Operation (Adds inventory to a shelf & records movement)
// @route   POST /api/inventory/stock-in
// @access  Private
const stockIn = async (req, res) => {
  try {
    const { productId, shelfId, quantity, batchNumber, referenceNo, notes } = req.body;

    const qty = Number(quantity);
    if (!productId || !shelfId || !qty || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid Product, Shelf, and positive Quantity are required.',
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const shelf = await Shelf.findById(shelfId);
    if (!shelf) {
      return res.status(404).json({ success: false, message: 'Shelf not found' });
    }

    // Find or create InventoryItem for this product-shelf combination
    let item = await InventoryItem.findOne({ product: productId, shelf: shelfId });

    if (item) {
      item.quantity += qty;
      if (batchNumber) item.batchNumber = batchNumber;
      item.lastUpdated = new Date();
      await item.save();
    } else {
      item = await InventoryItem.create({
        product: productId,
        shelf: shelfId,
        quantity: qty,
        batchNumber: batchNumber || '',
        lastUpdated: new Date(),
      });
    }

    // Record movement history
    const movement = await MovementHistory.create({
      type: 'STOCK_IN',
      product: productId,
      shelf: shelfId,
      quantity: qty,
      user: req.user ? req.user._id : null,
      referenceNo: referenceNo || 'IN-' + Date.now().toString().slice(-6),
      notes: notes || 'Stock received into warehouse',
      date: new Date(),
    });

    // Synchronize alerts (low-stock resolve, capacity checks)
    await syncSystemAlerts();

    res.status(201).json({
      success: true,
      message: `Successfully stocked in ${qty} ${product.unit} of ${product.name} to Shelf ${shelf.code}`,
      data: { item, movement },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Stock-Out Operation (Deducts inventory & records movement with strict negative stock prevention)
// @route   POST /api/inventory/stock-out
// @access  Private
const stockOut = async (req, res) => {
  try {
    const { productId, shelfId, quantity, referenceNo, notes } = req.body;

    const qty = Number(quantity);
    if (!productId || !shelfId || !qty || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid Product, Shelf, and positive Quantity are required.',
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const shelf = await Shelf.findById(shelfId);
    if (!shelf) {
      return res.status(404).json({ success: false, message: 'Shelf not found' });
    }

    // Find InventoryItem
    const item = await InventoryItem.findOne({ product: productId, shelf: shelfId });

    if (!item || item.quantity < qty) {
      const currentAvailable = item ? item.quantity : 0;
      return res.status(400).json({
        success: false,
        message: `Insufficient stock on Shelf ${shelf.code}. Requested: ${qty}, Available: ${currentAvailable} ${product.unit}. Cannot fulfill negative quantity.`,
      });
    }

    // Deduct stock
    item.quantity -= qty;
    item.lastUpdated = new Date();
    await item.save();

    // Record movement history
    const movement = await MovementHistory.create({
      type: 'STOCK_OUT',
      product: productId,
      shelf: shelfId,
      quantity: qty,
      user: req.user ? req.user._id : null,
      referenceNo: referenceNo || 'OUT-' + Date.now().toString().slice(-6),
      notes: notes || 'Stock issued from warehouse',
      date: new Date(),
    });

    // Synchronize alerts (may trigger low-stock alert)
    await syncSystemAlerts();

    res.json({
      success: true,
      message: `Successfully dispatched ${qty} ${product.unit} of ${product.name} from Shelf ${shelf.code}`,
      data: { item, movement },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Transfer stock between shelves
// @route   POST /api/inventory/transfer
// @access  Private
const transferStock = async (req, res) => {
  try {
    const { productId, sourceShelfId, targetShelfId, quantity, notes } = req.body;

    const qty = Number(quantity);
    if (!productId || !sourceShelfId || !targetShelfId || !qty || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Product, Source Shelf, Target Shelf, and positive Quantity are required.',
      });
    }

    if (sourceShelfId === targetShelfId) {
      return res.status(400).json({
        success: false,
        message: 'Source and target shelves must be different.',
      });
    }

    const sourceItem = await InventoryItem.findOne({ product: productId, shelf: sourceShelfId });
    if (!sourceItem || sourceItem.quantity < qty) {
      const available = sourceItem ? sourceItem.quantity : 0;
      return res.status(400).json({
        success: false,
        message: `Insufficient stock on source shelf. Available: ${available}, Requested: ${qty}`,
      });
    }

    // Deduct from source
    sourceItem.quantity -= qty;
    await sourceItem.save();

    // Add to target
    let targetItem = await InventoryItem.findOne({ product: productId, shelf: targetShelfId });
    if (targetItem) {
      targetItem.quantity += qty;
      targetItem.lastUpdated = new Date();
      await targetItem.save();
    } else {
      targetItem = await InventoryItem.create({
        product: productId,
        shelf: targetShelfId,
        quantity: qty,
        lastUpdated: new Date(),
      });
    }

    // Log movement
    const movement = await MovementHistory.create({
      type: 'TRANSFER',
      product: productId,
      shelf: sourceShelfId,
      targetShelf: targetShelfId,
      quantity: qty,
      user: req.user ? req.user._id : null,
      referenceNo: 'TRF-' + Date.now().toString().slice(-6),
      notes: notes || 'Internal shelf relocation',
      date: new Date(),
    });

    await syncSystemAlerts();

    res.json({
      success: true,
      message: `Successfully transferred ${qty} units to target shelf`,
      data: { movement },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get movement history
// @route   GET /api/inventory/movements
// @access  Private
const getMovements = async (req, res) => {
  try {
    const { type, limit } = req.query;
    const filter = {};
    if (type) filter.type = type;

    const movements = await MovementHistory.find(filter)
      .populate('product', 'name sku category unit')
      .populate('shelf', 'code zone')
      .populate('targetShelf', 'code zone')
      .populate('user', 'username email')
      .sort({ date: -1 })
      .limit(limit ? Number(limit) : 100);

    res.json({ success: true, count: movements.length, data: movements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getInventory,
  stockIn,
  stockOut,
  transferStock,
  getMovements,
};
