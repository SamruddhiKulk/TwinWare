const express = require('express');
const router = express.Router();
const {
  getInventory,
  stockIn,
  stockOut,
  transferStock,
  getMovements,
} = require('../controllers/inventoryController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/', protect, getInventory);
router.post('/stock-in', protect, authorizeRoles('admin', 'manager'), stockIn);
router.post('/stock-out', protect, authorizeRoles('admin', 'manager'), stockOut);
router.post('/transfer', protect, authorizeRoles('admin', 'manager'), transferStock);
router.get('/movements', protect, getMovements);

module.exports = router;
