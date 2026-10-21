const Product = require('../models/Product');
const Shelf = require('../models/Shelf');
const InventoryItem = require('../models/InventoryItem');
const Equipment = require('../models/Equipment');
const Alert = require('../models/Alert');
const MovementHistory = require('../models/MovementHistory');
const { syncSystemAlerts } = require('../services/alertService');

// @desc    Get dashboard metrics, charts, and recent events
// @route   GET /api/dashboard/summary
// @access  Private
const getDashboardSummary = async (req, res) => {
  try {
    // Run alert sync first
    await syncSystemAlerts();

    // 1. Basic Counts
    const totalProducts = await Product.countDocuments();
    const totalShelves = await Shelf.countDocuments();
    const totalEquipment = await Equipment.countDocuments();
    const operationalEquipment = await Equipment.countDocuments({ status: 'Operational' });
    const maintenanceEquipment = await Equipment.countDocuments({ status: 'Maintenance' });
    const offlineEquipment = await Equipment.countDocuments({ status: 'Offline' });

    // 2. Capacity & Occupancy
    const shelves = await Shelf.find();
    const totalCapacity = shelves.reduce((sum, s) => sum + (s.capacity || 0), 0);

    const inventoryAgg = await InventoryItem.aggregate([
      { $match: { quantity: { $gt: 0 } } },
      { $group: { _id: null, totalUnits: { $sum: '$quantity' } } }
    ]);
    const totalStoredUnits = inventoryAgg.length > 0 ? inventoryAgg[0].totalUnits : 0;
    const warehouseOccupancyRate = totalCapacity > 0 
      ? Math.round((totalStoredUnits / totalCapacity) * 100) 
      : 0;

    // 3. Alerts
    const activeAlertsCount = await Alert.countDocuments({ status: 'Active' });
    const criticalAlertsCount = await Alert.countDocuments({ status: 'Active', severity: 'critical' });
    const recentAlerts = await Alert.find({ status: { $in: ['Active', 'Acknowledged'] } })
      .sort({ createdAt: -1 })
      .limit(5);

    // 4. Low stock items
    const lowStockProducts = await Product.find();
    const itemStockAgg = await InventoryItem.aggregate([
      { $group: { _id: '$product', total: { $sum: '$quantity' } } }
    ]);
    const stockMap = {};
    itemStockAgg.forEach(i => { stockMap[i._id.toString()] = i.total; });

    let lowStockCount = 0;
    lowStockProducts.forEach(p => {
      const current = stockMap[p._id.toString()] || 0;
      if (current <= p.reorderLevel) lowStockCount++;
    });

    // 5. Category Distribution
    const categoryAgg = await Product.aggregate([
      {
        $lookup: {
          from: 'inventoryitems',
          localField: '_id',
          foreignField: 'product',
          as: 'inventory',
        }
      },
      {
        $project: {
          category: 1,
          totalStock: { $sum: '$inventory.quantity' }
        }
      },
      {
        $group: {
          _id: '$category',
          productCount: { $sum: 1 },
          stockUnits: { $sum: '$totalStock' }
        }
      },
      { $sort: { stockUnits: -1 } }
    ]);

    const categoryData = categoryAgg.map(c => ({
      name: c._id || 'Unassigned',
      products: c.productCount,
      stock: c.stockUnits,
    }));

    // 6. Zone-wise Shelf Utilization
    const zoneMap = {};
    const shelfItems = await InventoryItem.find({ quantity: { $gt: 0 } });
    const shelfQtyMap = {};
    shelfItems.forEach(item => {
      const sId = item.shelf.toString();
      shelfQtyMap[sId] = (shelfQtyMap[sId] || 0) + item.quantity;
    });

    shelves.forEach(shelf => {
      const z = shelf.zone || 'Zone A';
      if (!zoneMap[z]) {
        zoneMap[z] = { zone: z, capacity: 0, occupied: 0 };
      }
      zoneMap[z].capacity += shelf.capacity;
      zoneMap[z].occupied += (shelfQtyMap[shelf._id.toString()] || 0);
    });

    const zoneUtilization = Object.values(zoneMap).map(z => ({
      ...z,
      occupancyPercent: z.capacity > 0 ? Math.round((z.occupied / z.capacity) * 100) : 0,
    }));

    // 7. Recent Movements
    const recentMovements = await MovementHistory.find()
      .populate('product', 'name sku unit')
      .populate('shelf', 'code zone')
      .sort({ date: -1 })
      .limit(6);

    res.json({
      success: true,
      data: {
        summary: {
          totalProducts,
          totalStoredUnits,
          totalShelves,
          totalCapacity,
          warehouseOccupancyRate,
          activeAlertsCount,
          criticalAlertsCount,
          lowStockCount,
          equipment: {
            total: totalEquipment,
            operational: operationalEquipment,
            maintenance: maintenanceEquipment,
            offline: offlineEquipment,
            operationalRate: totalEquipment > 0 ? Math.round((operationalEquipment / totalEquipment) * 100) : 100,
          }
        },
        charts: {
          categoryData,
          zoneUtilization,
        },
        recentAlerts,
        recentMovements,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboardSummary };
