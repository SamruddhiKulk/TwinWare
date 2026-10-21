const Product = require('../models/Product');
const Shelf = require('../models/Shelf');
const InventoryItem = require('../models/InventoryItem');
const Equipment = require('../models/Equipment');
const MovementHistory = require('../models/MovementHistory');

// @desc    Generate comprehensive inventory report
// @route   GET /api/reports/inventory
// @access  Private
const getInventoryReport = async (req, res) => {
  try {
    const products = await Product.find().sort({ category: 1, name: 1 });
    const inventoryItems = await InventoryItem.find({ quantity: { $gt: 0 } }).populate('shelf', 'code zone');

    const productMap = {};
    products.forEach(p => {
      productMap[p._id.toString()] = {
        _id: p._id,
        sku: p.sku,
        name: p.name,
        category: p.category,
        unit: p.unit,
        price: p.price,
        reorderLevel: p.reorderLevel,
        currentStock: 0,
        stockValuation: 0,
        locations: [],
      };
    });

    inventoryItems.forEach(item => {
      const pId = item.product.toString();
      if (productMap[pId]) {
        productMap[pId].currentStock += item.quantity;
        productMap[pId].stockValuation += item.quantity * productMap[pId].price;
        if (item.shelf) {
          productMap[pId].locations.push({
            shelfCode: item.shelf.code,
            zone: item.shelf.zone,
            quantity: item.quantity,
          });
        }
      }
    });

    const report = Object.values(productMap).map(p => ({
      ...p,
      status: p.currentStock === 0 ? 'Out of Stock' : (p.currentStock <= p.reorderLevel ? 'Low Stock' : 'Adequate'),
    }));

    const totalValuation = report.reduce((sum, p) => sum + p.stockValuation, 0);
    const totalUnits = report.reduce((sum, p) => sum + p.currentStock, 0);

    res.json({
      success: true,
      meta: {
        totalProducts: report.length,
        totalUnits,
        totalValuation,
        generatedAt: new Date(),
      },
      data: report,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate shelf utilization report
// @route   GET /api/reports/shelves
// @access  Private
const getShelfReport = async (req, res) => {
  try {
    const shelves = await Shelf.find().sort({ zone: 1, row: 1, column: 1 });
    const items = await InventoryItem.find({ quantity: { $gt: 0 } }).populate('product', 'name sku category');

    const shelfMap = {};
    shelves.forEach(s => {
      shelfMap[s._id.toString()] = {
        _id: s._id,
        code: s.code,
        zone: s.zone,
        row: s.row,
        column: s.column,
        capacity: s.capacity,
        status: s.status,
        currentOccupancy: 0,
        productsCount: 0,
        items: [],
      };
    });

    items.forEach(item => {
      const sId = item.shelf.toString();
      if (shelfMap[sId]) {
        shelfMap[sId].currentOccupancy += item.quantity;
        shelfMap[sId].productsCount += 1;
        shelfMap[sId].items.push({
          productName: item.product ? item.product.name : 'Unknown',
          sku: item.product ? item.product.sku : '',
          quantity: item.quantity,
        });
      }
    });

    const report = Object.values(shelfMap).map(s => {
      const occupancyRate = s.capacity > 0 ? Math.round((s.currentOccupancy / s.capacity) * 100) : 0;
      let statusCategory = 'Empty';
      if (occupancyRate > 100) statusCategory = 'Overcapacity';
      else if (occupancyRate >= 80) statusCategory = 'High Occupancy';
      else if (occupancyRate >= 30) statusCategory = 'Normal';
      else if (occupancyRate > 0) statusCategory = 'Low Occupancy';

      return {
        ...s,
        occupancyRate,
        statusCategory,
      };
    });

    const totalCapacity = report.reduce((sum, s) => sum + s.capacity, 0);
    const totalOccupied = report.reduce((sum, s) => sum + s.currentOccupancy, 0);

    res.json({
      success: true,
      meta: {
        totalShelves: report.length,
        totalCapacity,
        totalOccupied,
        averageOccupancyRate: totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0,
        generatedAt: new Date(),
      },
      data: report,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate equipment status & health report
// @route   GET /api/reports/equipment
// @access  Private
const getEquipmentReport = async (req, res) => {
  try {
    const equipment = await Equipment.find().sort({ zone: 1, type: 1 });

    const operational = equipment.filter(e => e.status === 'Operational').length;
    const maintenance = equipment.filter(e => e.status === 'Maintenance').length;
    const offline = equipment.filter(e => e.status === 'Offline').length;

    const avgHealth = equipment.length > 0 
      ? Math.round(equipment.reduce((sum, e) => sum + (e.healthPercentage || 0), 0) / equipment.length) 
      : 100;

    res.json({
      success: true,
      meta: {
        totalCount: equipment.length,
        operational,
        maintenance,
        offline,
        fleetHealthAvg: avgHealth,
        generatedAt: new Date(),
      },
      data: equipment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getInventoryReport,
  getShelfReport,
  getEquipmentReport,
};
