const express = require('express');
const router = express.Router();
const {
  getAlerts,
  acknowledgeAlert,
  resolveAlert,
} = require('../controllers/alertController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/', protect, getAlerts);
router.put('/:id/acknowledge', protect, authorizeRoles('admin', 'manager'), acknowledgeAlert);
router.put('/:id/resolve', protect, authorizeRoles('admin', 'manager'), resolveAlert);

module.exports = router;
