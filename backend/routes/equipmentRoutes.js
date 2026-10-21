const express = require('express');
const router = express.Router();
const {
  getEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
} = require('../controllers/equipmentController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getEquipment)
  .post(protect, authorizeRoles('admin'), createEquipment);

router.route('/:id')
  .get(protect, getEquipmentById)
  .put(protect, authorizeRoles('admin', 'manager'), updateEquipment)
  .delete(protect, authorizeRoles('admin'), deleteEquipment);

module.exports = router;
