const Alert = require('../models/Alert');
const Product = require('../models/Product');
const InventoryItem = require('../models/InventoryItem');
const Equipment = require('../models/Equipment');
const Shelf = require('../models/Shelf');

const unresolvedStatuses = ['Active', 'Acknowledged'];

const resolveConditionAlerts = async (type, referenceId) => {
  const resolvedAt = new Date();
  await Alert.updateMany(
    { type, referenceId, status: { $in: unresolvedStatuses } },
    {
      $set: {
        status: 'Resolved',
        resolvedAt,
        resolutionReason: 'system',
        conditionClearedAt: resolvedAt,
      },
      $unset: { conditionKey: 1 },
    }
  );
  await Alert.updateMany(
    { type, referenceId, status: 'Resolved', conditionClearedAt: null },
    { $set: { conditionClearedAt: resolvedAt } }
  );
};

const ensureConditionAlert = async (details) => {
  const { type, referenceId } = details;
  const conditionKey = `${type}:${referenceId}`;
  const unresolved = await Alert.findOne({
    type,
    referenceId,
    status: { $in: unresolvedStatuses },
  }).select('+conditionKey');

  if (unresolved) {
    if (!unresolved.conditionKey) {
      try {
        await Alert.updateOne(
          { _id: unresolved._id, conditionKey: { $exists: false } },
          { $set: { conditionKey } }
        );
      } catch (error) {
        if (error.code !== 11000) throw error;
      }
    }
    return;
  }

  const previous = await Alert.findOne({ type, referenceId }).sort({ createdAt: -1 });
  if (previous && (previous.status !== 'Resolved' || !previous.conditionClearedAt)) {
    return;
  }

  try {
    await Alert.create({ ...details, conditionKey });
  } catch (error) {
    if (error.code !== 11000) throw error;
  }
};

/**
 * Evaluates and synchronizes system alerts:
 * 1. Low stock for products
 * 2. Equipment in Maintenance or Offline states
 * 3. Shelves exceeding configured capacity
 *
 * Keeps one unresolved alert per condition and opens a new historical record
 * only after the condition has cleared and later recurs.
 */
const syncSystemAlerts = async () => {
    // 1. EVALUATE LOW STOCK
    const products = await Product.find({});
    for (const prod of products) {
      const stockAgg = await InventoryItem.aggregate([
        { $match: { product: prod._id } },
        { $group: { _id: '$product', totalQty: { $sum: '$quantity' } } }
      ]);

      const currentStock = stockAgg.length > 0 ? stockAgg[0].totalQty : 0;

      if (currentStock <= prod.reorderLevel) {
        await ensureConditionAlert({
            type: 'LOW_STOCK',
            severity: currentStock === 0 ? 'critical' : 'high',
            title: `Low Stock: ${prod.name} (${prod.sku})`,
            message: `Current stock of ${prod.name} is ${currentStock} ${prod.unit}, which is at or below the reorder threshold (${prod.reorderLevel} ${prod.unit}).`,
            referenceId: prod._id,
            referenceModel: 'Product',
        });
      } else {
        await resolveConditionAlerts('LOW_STOCK', prod._id);
      }
    }

    // 2. EVALUATE EQUIPMENT STATUS
    const allEquipment = await Equipment.find({});
    for (const eq of allEquipment) {
      if (eq.status === 'Offline' || eq.status === 'Maintenance') {
        const isOffline = eq.status === 'Offline';
        await ensureConditionAlert({
            type: 'EQUIPMENT_STATUS',
            severity: isOffline ? 'critical' : 'medium',
            title: `Equipment ${eq.status}: ${eq.name} (${eq.code})`,
            message: `${eq.type} '${eq.name}' in ${eq.zone} is currently ${eq.status.toUpperCase()}. Operator: ${eq.operator || 'Unassigned'}.`,
            referenceId: eq._id,
            referenceModel: 'Equipment',
        });
      } else if (eq.status === 'Operational') {
        await resolveConditionAlerts('EQUIPMENT_STATUS', eq._id);
      }
    }

    // 3. EVALUATE SHELF CAPACITY
    const shelves = await Shelf.find({});
    for (const shelf of shelves) {
      const shelfAgg = await InventoryItem.aggregate([
        { $match: { shelf: shelf._id } },
        { $group: { _id: '$shelf', totalItems: { $sum: '$quantity' } } }
      ]);

      const currentOccupancy = shelfAgg.length > 0 ? shelfAgg[0].totalItems : 0;

      if (currentOccupancy > shelf.capacity) {
        await ensureConditionAlert({
            type: 'OVERCAPACITY',
            severity: 'high',
            title: `Shelf Overcapacity: Shelf ${shelf.code}`,
            message: `Shelf ${shelf.code} holds ${currentOccupancy} units, exceeding its maximum capacity of ${shelf.capacity} units.`,
            referenceId: shelf._id,
            referenceModel: 'Shelf',
        });
      } else {
        await resolveConditionAlerts('OVERCAPACITY', shelf._id);
      }
    }
};

module.exports = { syncSystemAlerts };
