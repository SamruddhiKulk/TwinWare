import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { 
  X, 
  ArrowDownLeft, 
  ArrowUpRight, 
  RefreshCw, 
  AlertCircle 
} from 'lucide-react';

const StockModal = ({ mode = 'IN', initialShelf = null, initialProduct = null, onClose, onSuccess }) => {
  const [products, setProducts] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(initialProduct?._id || '');
  const [selectedShelfId, setSelectedShelfId] = useState(initialShelf?._id || '');
  const [targetShelfId, setTargetShelfId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [availableStock, setAvailableStock] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch dropdown data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodRes, shelfRes] = await Promise.all([
          API.get('/products'),
          API.get('/shelves'),
        ]);

        setProducts(prodRes.data.data || []);
        setShelves(shelfRes.data.data || []);

        if (initialProduct?._id) setSelectedProductId(initialProduct._id);
        if (initialShelf?._id) setSelectedShelfId(initialShelf._id);
      } catch (err) {
        setError('Failed to load products or shelves');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [initialProduct, initialShelf]);

  // Determine available stock when product & shelf are selected
  useEffect(() => {
    if ((mode === 'OUT' || mode === 'TRANSFER') && selectedProductId && selectedShelfId) {
      const selectedShelf = shelves.find(s => s._id === selectedShelfId);
      if (selectedShelf && selectedShelf.items) {
        const item = selectedShelf.items.find(i => (i.product?._id || i.product) === selectedProductId);
        setAvailableStock(item ? item.quantity : 0);
      } else {
        setAvailableStock(0);
      }
    } else {
      setAvailableStock(null);
    }
  }, [selectedProductId, selectedShelfId, shelves, mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      setError('Please enter a valid positive quantity.');
      return;
    }

    if ((mode === 'OUT' || mode === 'TRANSFER') && availableStock !== null && qty > availableStock) {
      setError(`Cannot issue ${qty} units. Only ${availableStock} units available on this shelf.`);
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'IN') {
        await API.post('/inventory/stock-in', {
          productId: selectedProductId,
          shelfId: selectedShelfId,
          quantity: qty,
          batchNumber,
          referenceNo,
          notes,
        });
      } else if (mode === 'OUT') {
        await API.post('/inventory/stock-out', {
          productId: selectedProductId,
          shelfId: selectedShelfId,
          quantity: qty,
          referenceNo,
          notes,
        });
      } else if (mode === 'TRANSFER') {
        await API.post('/inventory/transfer', {
          productId: selectedProductId,
          sourceShelfId: selectedShelfId,
          targetShelfId: targetShelfId,
          quantity: qty,
          notes,
        });
      }

      setSubmitting(false);
      onSuccess();
      onClose();
    } catch (err) {
      setSubmitting(false);
      setError(err.response?.data?.message || 'Operation failed.');
    }
  };

  const getTitle = () => {
    if (mode === 'IN') return 'Stock-In Entry';
    if (mode === 'OUT') return 'Stock-Out Entry';
    return 'Relocate Inventory';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-[#E5E9E6] rounded-xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#E5E9E6] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg border ${
              mode === 'IN' ? 'bg-[#EDF3F2] border-[#D0DFDD] text-[#477D78]' :
              mode === 'OUT' ? 'bg-[#FDEEEF] border-[#F9D2D4] text-[#C62828]' :
              'bg-[#F5F6F4] border-[#E5E9E6] text-[#253746]'
            }`}>
              {mode === 'IN' && <ArrowDownLeft className="w-4 h-4" />}
              {mode === 'OUT' && <ArrowUpRight className="w-4 h-4" />}
              {mode === 'TRANSFER' && <RefreshCw className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#253746]">{getTitle()}</h3>
              <p className="text-[11px] text-[#66736F]">Database-backed movement audit entry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#66736F] hover:text-[#253746] hover:bg-[#F5F6F4] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-[#FDEEEF] border border-[#F9D2D4] text-[#C62828] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-8 text-center text-[#66736F] text-xs">
              Loading inventory metadata...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Product Select */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#66736F] mb-1">
                  Product
                </label>
                <select
                  required
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E5E9E6] rounded-lg text-[#253746] text-xs focus:outline-none focus:border-[#477D78] focus:ring-1 focus:ring-[#477D78]"
                >
                  <option value="">-- Select Product --</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      [{p.sku}] {p.name} ({p.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Shelf Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#66736F] mb-1">
                    {mode === 'TRANSFER' ? 'Source Shelf' : 'Shelf Location'}
                  </label>
                  <select
                    required
                    value={selectedShelfId}
                    onChange={(e) => setSelectedShelfId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E5E9E6] rounded-lg text-[#253746] text-xs focus:outline-none focus:border-[#477D78] focus:ring-1 focus:ring-[#477D78]"
                  >
                    <option value="">-- Select Shelf --</option>
                    {shelves.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.code} ({s.zone} - {s.currentOccupancy}/{s.capacity} units)
                      </option>
                    ))}
                  </select>
                </div>

                {mode === 'TRANSFER' && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#66736F] mb-1">
                      Destination Shelf
                    </label>
                    <select
                      required
                      value={targetShelfId}
                      onChange={(e) => setTargetShelfId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#E5E9E6] rounded-lg text-[#253746] text-xs focus:outline-none focus:border-[#477D78] focus:ring-1 focus:ring-[#477D78]"
                    >
                      <option value="">-- Target Shelf --</option>
                      {shelves.filter(s => s._id !== selectedShelfId).map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.code} ({s.zone})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Available Stock Indicator */}
              {availableStock !== null && (
                <div className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                  availableStock > 0 
                    ? 'bg-[#EDF3F2] border-[#D0DFDD] text-[#477D78]' 
                    : 'bg-[#FDEEEF] border-[#F9D2D4] text-[#C62828]'
                }`}>
                  <span>Current Available Stock on Selected Shelf:</span>
                  <span className="font-bold">{availableStock} units</span>
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#66736F] mb-1">
                  Quantity ({mode === 'OUT' && availableStock !== null ? `Max: ${availableStock}` : 'Units'})
                </label>
                <input
                  type="number"
                  min="1"
                  max={(mode === 'OUT' || mode === 'TRANSFER') && availableStock !== null ? availableStock : undefined}
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 10"
                  className="w-full px-3 py-2 bg-white border border-[#E5E9E6] rounded-lg text-[#253746] text-xs focus:outline-none focus:border-[#477D78] focus:ring-1 focus:ring-[#477D78]"
                />
              </div>

              {/* Batch & Reference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {mode === 'IN' && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#66736F] mb-1">
                      Batch / Lot # (Optional)
                    </label>
                    <input
                      type="text"
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                      placeholder="BAT-2026-X1"
                      className="w-full px-3 py-2 bg-white border border-[#E5E9E6] rounded-lg text-[#253746] text-xs focus:outline-none focus:border-[#477D78] focus:ring-1 focus:ring-[#477D78]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#66736F] mb-1">
                    Reference / PO #
                  </label>
                  <input
                    type="text"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    placeholder={mode === 'IN' ? 'PO-90214' : 'DISP-44012'}
                    className="w-full px-3 py-2 bg-white border border-[#E5E9E6] rounded-lg text-[#253746] text-xs focus:outline-none focus:border-[#477D78] focus:ring-1 focus:ring-[#477D78]"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#66736F] mb-1">
                  Audit Notes / Reason
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Supplier intake / Assembly line transfer"
                  className="w-full px-3 py-2 bg-white border border-[#E5E9E6] rounded-lg text-[#253746] text-xs focus:outline-none focus:border-[#477D78] focus:ring-1 focus:ring-[#477D78]"
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-[#E5E9E6] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-[#66736F] hover:text-[#253746] hover:bg-[#F5F6F4] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || ((mode === 'OUT' || mode === 'TRANSFER') && availableStock === 0)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-50 ${
                    mode === 'IN' 
                      ? 'bg-[#477D78] hover:bg-[#3A6662]' 
                      : mode === 'OUT' 
                      ? 'bg-[#C62828] hover:bg-[#B71C1C]' 
                      : 'bg-[#253746] hover:bg-[#1A2733]'
                  }`}
                >
                  {submitting ? 'Recording...' : `Confirm ${mode === 'IN' ? 'Stock-In' : mode === 'OUT' ? 'Stock-Out' : 'Transfer'}`}
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};

export default StockModal;
