const express = require('express');
const router = express.Router();
const {
  getInventoryReport,
  getShelfReport,
  getEquipmentReport,
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.get('/inventory', protect, getInventoryReport);
router.get('/shelves', protect, getShelfReport);
router.get('/equipment', protect, getEquipmentReport);

module.exports = router;
