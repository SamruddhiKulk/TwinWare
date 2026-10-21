const Product = require('../models/Product');
const InventoryItem = require('../models/InventoryItem');
const { syncSystemAlerts } = require('../services/alertService');

// @desc    Get all products (with optional search, category filter, and calculated stock)
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res) => {
  try {
    const { search, category } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    const products = await Product.find(query).sort({ createdAt: -1 });

    // Calculate current stock across all shelves for each product
    const productStockMap = {};
    const stockAgg = await InventoryItem.aggregate([
      {
        $group: {
          _id: '$product',
          totalStock: { $sum: '$quantity' },
          shelvesCount: { $sum: 1 }
        }
      }
    ]);

    stockAgg.forEach(item => {
      productStockMap[item._id.toString()] = {
        totalStock: item.totalStock,
        shelvesCount: item.shelvesCount,
      };
    });

    const enrichedProducts = products.map(prod => {
      const stockInfo = productStockMap[prod._id.toString()] || { totalStock: 0, shelvesCount: 0 };
      return {
        ...prod.toObject(),
        currentStock: stockInfo.totalStock,
        shelvesCount: stockInfo.shelvesCount,
        isLowStock: stockInfo.totalStock <= prod.reorderLevel,
      };
    });

    res.json({ success: true, count: enrichedProducts.length, data: enrichedProducts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Private
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Get shelf breakdown
    const shelfItems = await InventoryItem.find({ product: product._id }).populate('shelf', 'code zone row column capacity');
    const totalStock = shelfItems.reduce((acc, curr) => acc + curr.quantity, 0);

    res.json({
      success: true,
      data: {
        ...product.toObject(),
        currentStock: totalStock,
        isLowStock: totalStock <= product.reorderLevel,
        locations: shelfItems,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private
const createProduct = async (req, res) => {
  try {
    const { sku, name, description, category, price, reorderLevel, unit } = req.body;

    if (!sku || !name) {
      return res.status(400).json({ success: false, message: 'SKU and product name are required' });
    }

    const existingProduct = await Product.findOne({ sku: sku.trim().toUpperCase() });
    if (existingProduct) {
      return res.status(400).json({ success: false, message: `Product with SKU ${sku} already exists` });
    }

    const product = await Product.create({
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      description: description || '',
      category: category || 'General',
      price: Number(price) >= 0 ? Number(price) : 0,
      reorderLevel: Number(reorderLevel) >= 0 ? Number(reorderLevel) : 20,
      unit: unit || 'Units',
    });

    await syncSystemAlerts();

    res.status(201).json({ success: true, message: 'Product created successfully', data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = async (req, res) => {
  try {
    const { name, description, category, price, reorderLevel, unit } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (name) product.name = name.trim();
    if (description !== undefined) product.description = description;
    if (category) product.category = category;
    if (price !== undefined) product.price = Number(price);
    if (reorderLevel !== undefined) product.reorderLevel = Number(reorderLevel);
    if (unit) product.unit = unit;

    await product.save();
    await syncSystemAlerts();

    res.json({ success: true, message: 'Product updated successfully', data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check if there are active inventory items
    const inventoryCount = await InventoryItem.countDocuments({ product: product._id, quantity: { $gt: 0 } });
    if (inventoryCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete product with existing inventory in warehouse. Please stock-out all items first.',
      });
    }

    // Delete zero quantity items
    await InventoryItem.deleteMany({ product: product._id });
    await product.deleteOne();
    await syncSystemAlerts();

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
