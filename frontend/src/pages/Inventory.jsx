import React, { useState, useEffect } from 'react';
import API from '../services/api';
import StockModal from '../components/StockModal';
import { useAuth } from '../context/AuthContext';
import { canManageCatalog, canOperate } from '../utils/permissions';
import { 
  Package, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  ArrowDownLeft, 
  ArrowUpRight, 
  AlertCircle, 
  X,
  History
} from 'lucide-react';

const Inventory = () => {
  const { user } = useAuth();
  const isAdmin = canManageCatalog(user?.role);
  const canMoveStock = canOperate(user?.role);
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modals
  const [stockModalConfig, setStockModalConfig] = useState({ isOpen: false, mode: 'IN', product: null });
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Product Form State
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    category: 'Electronics',
    price: '',
    reorderLevel: '20',
    unit: 'Units',
  });
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/products?search=${search}&category=${selectedCategory}`);
      setProducts(res.data.data || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const res = await API.get('/inventory/movements');
      setMovements(res.data.data || []);
    } catch (err) {
      console.error('Failed to load movements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts();
    } else {
      fetchMovements();
    }
  }, [activeTab, search, selectedCategory]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      sku: '',
      name: '',
      description: '',
      category: 'Electronics',
      price: '',
      reorderLevel: '20',
      unit: 'Units',
    });
    setFormError('');
    setProductModalOpen(true);
  };

  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setFormData({
      sku: prod.sku,
      name: prod.name,
      description: prod.description || '',
      category: prod.category || 'General',
      price: prod.price?.toString() || '0',
      reorderLevel: prod.reorderLevel?.toString() || '20',
      unit: prod.unit || 'Units',
    });
    setFormError('');
    setProductModalOpen(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    try {
      if (editingProduct) {
        await API.put(`/products/${editingProduct._id}`, formData);
      } else {
        await API.post('/products', formData);
      }
      setFormSubmitting(false);
      setProductModalOpen(false);
      fetchProducts();
    } catch (err) {
      setFormSubmitting(false);
      setFormError(err.response?.data?.message || 'Failed to save product.');
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete product "${name}"?`)) return;
    try {
      await API.delete(`/products/${id}`);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot delete product.');
    }
  };

  const categories = ['All', 'Electronics', 'Automotive', 'Raw Materials', 'Packaging', 'Safety', 'General'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-[#E5E9E6]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#253746] tracking-tight">
            Inventory Management
          </h1>
          <p className="text-xs text-[#66736F] mt-0.5">
            Maintain product catalog, monitor stock thresholds across warehouse shelves, and audit stock movements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && <button
            onClick={handleOpenAdd}
            className="px-3 py-1.5 rounded-lg bg-[#477D78] hover:bg-[#3A6662] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Product
          </button>}
          {canMoveStock && <button
            onClick={() => setStockModalConfig({ isOpen: true, mode: 'IN', product: null })}
            className="px-3 py-1.5 rounded-lg bg-white border border-[#E5E9E6] hover:bg-[#F5F6F4] text-[#253746] text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-[#2E7D32]" />
            Stock In
          </button>}
          {canMoveStock && <button
            onClick={() => setStockModalConfig({ isOpen: true, mode: 'OUT', product: null })}
            className="px-3 py-1.5 rounded-lg bg-white border border-[#E5E9E6] hover:bg-[#F5F6F4] text-[#253746] text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-[#C62828]" />
            Stock Out
          </button>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E5E9E6]">
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-2.5 px-3.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
            activeTab === 'products'
              ? 'border-[#477D78] text-[#477D78]'
              : 'border-transparent text-[#66736F] hover:text-[#253746]'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          Product Catalog ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('movements')}
          className={`pb-2.5 px-3.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
            activeTab === 'movements'
              ? 'border-[#477D78] text-[#477D78]'
              : 'border-transparent text-[#66736F] hover:text-[#253746]'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          Movement History & Audit Log
        </button>
      </div>

      {/* TAB 1: PRODUCT CATALOG */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Unified Toolbar */}
          <div className="bg-white border border-[#E5E9E6] rounded-xl p-3 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-72">
              <Search className="w-3.5 h-3.5 text-[#66736F] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search SKU or product title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#E5E9E6] rounded-lg text-[#253746] text-xs focus:outline-none focus:border-[#477D78] focus:ring-1 focus:ring-[#477D78]"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-[#EDF3F2] text-[#477D78] font-semibold border border-[#D0DFDD]'
                      : 'text-[#66736F] hover:bg-[#F5F6F4] border border-transparent'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Clean Table */}
          <div className="bg-white border border-[#E5E9E6] rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#253746]">
                <thead className="bg-[#F5F6F4] uppercase text-[10px] tracking-wider text-[#66736F] border-b border-[#E5E9E6]">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">SKU</th>
                    <th className="py-2.5 px-4 font-semibold">Product Name</th>
                    <th className="py-2.5 px-4 font-semibold">Category</th>
                    <th className="py-2.5 px-4 font-semibold">Price</th>
                    <th className="py-2.5 px-4 font-semibold">Total Stock</th>
                    <th className="py-2.5 px-4 font-semibold">Reorder Level</th>
                    <th className="py-2.5 px-4 font-semibold">Status</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E9E6]">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-10 text-[#66736F]">
                        No products match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    products.map((prod) => {
                      const isLow = prod.isLowStock;
                      const isOut = prod.currentStock === 0;

                      return (
                        <tr key={prod._id} className="hover:bg-[#F5F6F4]/50 transition-colors">
                          <td className="py-2.5 px-4 font-mono font-medium text-[#477D78]">
                            <span className="bg-[#EDF3F2] px-1.5 py-0.5 rounded border border-[#D0DFDD]">
                              {prod.sku}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-medium text-[#253746]">
                            <div>{prod.name}</div>
                            {prod.description && (
                              <div className="text-[11px] text-[#66736F] truncate max-w-xs">
                                {prod.description}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-[#66736F]">{prod.category}</td>
                          <td className="py-2.5 px-4 text-[#253746] font-medium">
                            ${prod.price?.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="font-bold text-[#253746]">
                              {prod.currentStock}
                            </span>{' '}
                            <span className="text-[11px] text-[#66736F]">{prod.unit}</span>
                          </td>
                          <td className="py-2.5 px-4 text-[#66736F]">
                            {prod.reorderLevel} {prod.unit}
                          </td>
                          <td className="py-2.5 px-4">
                            {isOut ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#FDEEEF] text-[#C62828] border border-[#F9D2D4]">
                                Out of Stock
                              </span>
                            ) : isLow ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#FFF8E6] text-[#B25E00] border-[#FFE7B3]">
                                Low Stock
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#EBF5EC] text-[#2E7D32] border border-[#CBE6CE]">
                                Optimal
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {canMoveStock && <button
                                onClick={() => setStockModalConfig({ isOpen: true, mode: 'IN', product: prod })}
                                title="Stock In"
                                className="p-1.5 rounded hover:bg-[#EBF5EC] text-[#2E7D32] transition-colors"
                              >
                                <ArrowDownLeft className="w-3.5 h-3.5" />
                              </button>}
                              {canMoveStock && prod.currentStock > 0 && (
                                <button
                                  onClick={() => setStockModalConfig({ isOpen: true, mode: 'OUT', product: prod })}
                                  title="Stock Out"
                                  className="p-1.5 rounded hover:bg-[#FDEEEF] text-[#C62828] transition-colors"
                                >
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {isAdmin && <button
                                onClick={() => handleOpenEdit(prod)}
                                title="Edit Product"
                                className="p-1.5 rounded hover:bg-[#F5F6F4] text-[#66736F] hover:text-[#253746] transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>}
                              {isAdmin && <button
                                onClick={() => handleDeleteProduct(prod._id, prod.name)}
                                title="Delete Product"
                                className="p-1.5 rounded hover:bg-[#FDEEEF] text-[#66736F] hover:text-[#C62828] transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MOVEMENT HISTORY */}
      {activeTab === 'movements' && (
        <div className="bg-white border border-[#E5E9E6] rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#253746]">
              <thead className="bg-[#F5F6F4] uppercase text-[10px] tracking-wider text-[#66736F] border-b border-[#E5E9E6]">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Timestamp</th>
                  <th className="py-2.5 px-4 font-semibold">Type</th>
                  <th className="py-2.5 px-4 font-semibold">Product</th>
                  <th className="py-2.5 px-4 font-semibold">Quantity</th>
                  <th className="py-2.5 px-4 font-semibold">Shelf Location</th>
                  <th className="py-2.5 px-4 font-semibold">Reference #</th>
                  <th className="py-2.5 px-4 font-semibold">Operator</th>
                  <th className="py-2.5 px-4 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E9E6]">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-10 text-[#66736F]">
                      No stock movements recorded yet.
                    </td>
                  </tr>
                ) : (
                  movements.map((move) => {
                    const isOut = move.type === 'STOCK_OUT';
                    const isTransfer = move.type === 'TRANSFER';

                    return (
                      <tr key={move._id} className="hover:bg-[#F5F6F4]/50 transition-colors">
                        <td className="py-2.5 px-4 text-[#66736F] whitespace-nowrap">
                          {new Date(move.date).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                            isOut
                              ? 'bg-[#FDEEEF] text-[#C62828] border-[#F9D2D4]'
                              : isTransfer
                              ? 'bg-[#F0F4F8] text-[#253746] border-[#D0DFDD]'
                              : 'bg-[#EBF5EC] text-[#2E7D32] border-[#CBE6CE]'
                          }`}>
                            {move.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-medium text-[#253746]">
                          <div>{move.product?.name || 'Unknown'}</div>
                          <div className="text-[10px] font-mono text-[#477D78]">{move.product?.sku}</div>
                        </td>
                        <td className="py-2.5 px-4 font-semibold">
                          <span className={isOut ? 'text-[#C62828]' : 'text-[#2E7D32]'}>
                            {isOut ? '-' : '+'}{move.quantity} {move.product?.unit || 'Units'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[#253746]">
                          {isTransfer ? (
                            <span>{move.shelf?.code} → {move.targetShelf?.code}</span>
                          ) : (
                            <span>Shelf {move.shelf?.code || 'N/A'} ({move.shelf?.zone})</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[#66736F]">
                          {move.referenceNo || '—'}
                        </td>
                        <td className="py-2.5 px-4 text-[#66736F]">
                          {move.user?.username || 'System Admin'}
                        </td>
                        <td className="py-2.5 px-4 text-[#66736F] max-w-xs truncate">
                          {move.notes || '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product Add/Edit Modal */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-[#E5E9E6] rounded-xl w-full max-w-lg shadow-xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E9E6] mb-4">
              <h3 className="text-sm font-bold text-[#253746]">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setProductModalOpen(false)}
                className="p-1 rounded-lg text-[#66736F] hover:text-[#253746]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-2.5 rounded-lg bg-[#FDEEEF] border border-[#F9D2D4] text-[#C62828] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleProductSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#66736F] mb-1">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingProduct}
                    placeholder="e.g. PRD-101"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#E5E9E6] rounded-lg text-[#253746] focus:outline-none focus:border-[#477D78] focus:ring-1 focus:ring-[#477D78] disabled:bg-[#F5F6F4]"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#66736F] mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#E5E9E6] rounded-lg text-[#253746] focus:outline-none focus:border-[#477D78] focus:ring-1 focus:ring-[#477D78]"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Automotive">Automotive</option>
                    <option value="Raw Materials">Raw Materials</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Safety">Safety</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#66736F] mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Industrial Sensor Transceiver"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#E5E9E6] rounded-lg text-[#253746] focus:outline-none focus:border-[#477D78] focus:ring-1 focus:ring-[#477D78]"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#66736F] mb-1">
                  Description
                </label>
                <textarea
                  rows="2"
                  placeholder="Specifications, handling instructions..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#E5E9E6] rounded-lg text-[#253746] focus:outline-none focus:border-[#477D78] focus:ring-1 focus:ring-[#477D78]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#66736F] mb-1">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#E5E9E6] rounded-lg text-[#253746] focus:outline-none focus:border-[#477D78] focus:ring-1 focus:ring-[#477D78]"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#66736F] mb-1">
                    Reorder Alert Level
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.reorderLevel}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#E5E9E6] rounded-lg text-[#253746] focus:outline-none focus:border-[#477D78] focus:ring-1 focus:ring-[#477D78]"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#66736F] mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Units/Boxes/Kg"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#E5E9E6] rounded-lg text-[#253746] focus:outline-none focus:border-[#477D78] focus:ring-1 focus:ring-[#477D78]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#E5E9E6] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#66736F] hover:text-[#253746]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-[#477D78] hover:bg-[#3A6662] text-white text-xs font-semibold transition-colors"
                >
                  {formSubmitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Modal */}
      {stockModalConfig.isOpen && (
        <StockModal
          mode={stockModalConfig.mode}
          initialProduct={stockModalConfig.product}
          onClose={() => setStockModalConfig({ isOpen: false, mode: 'IN', product: null })}
          onSuccess={() => {
            fetchProducts();
            if (activeTab === 'movements') fetchMovements();
          }}
        />
      )}

    </div>
  );
};

export default Inventory;
