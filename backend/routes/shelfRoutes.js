const express = require('express');
const router = express.Router();
const {
  getShelves,
  getShelfById,
  createShelf,
  updateShelf,
  deleteShelf,
} = require('../controllers/shelfController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getShelves)
  .post(protect, authorizeRoles('admin'), createShelf);

router.route('/:id')
  .get(protect, getShelfById)
  .put(protect, authorizeRoles('admin'), updateShelf)
  .delete(protect, authorizeRoles('admin'), deleteShelf);

module.exports = router;
