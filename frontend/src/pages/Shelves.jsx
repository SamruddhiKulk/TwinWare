import React, { useState, useEffect } from 'react';
import API from '../services/api';
import ShelfModal from '../components/ShelfModal';
import StockModal from '../components/StockModal';
import { useAuth } from '../context/AuthContext';
import { canManageCatalog, canOperate } from '../utils/permissions';
import { 
  Boxes, 
  Plus, 
  Edit3, 
  Trash2, 
  MapPin, 
  Layers, 
  AlertCircle, 
  X, 
  Filter
} from 'lucide-react';

const Shelves = () => {
  const { user } = useAuth();
  const isAdmin = canManageCatalog(user?.role);
  const canMoveStock = canOperate(user?.role);
  const [shelves, setShelves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState('All');
  
  // Inspection & Stock Modals
  const [selectedShelf, setSelectedShelf] = useState(null);
  const [stockModalConfig, setStockModalConfig] = useState({ isOpen: false, mode: 'IN', shelf: null });

  // Add/Edit Shelf Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingShelf, setEditingShelf] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    zone: 'Zone A',
    row: 1,
    column: 1,
    capacity: 100,
    status: 'Active',
    description: '',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchShelves = async () => {
    try {
      setLoading(true);
      const res = await API.get('/shelves');
      setShelves(res.data.data || []);
    } catch (err) {
      console.error('Failed to load shelves:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShelves();
  }, []);

  const handleOpenAdd = () => {
    setEditingShelf(null);
    setFormData({
      code: '',
      zone: 'Zone A',
      row: 1,
      column: 1,
      capacity: 100,
      status: 'Active',
      description: '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (shelf) => {
    setEditingShelf(shelf);
    setFormData({
      code: shelf.code,
      zone: shelf.zone,
      row: shelf.row,
      column: shelf.column,
      capacity: shelf.capacity,
      status: shelf.status,
      description: shelf.description || '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      if (editingShelf) {
        await API.put(`/shelves/${editingShelf._id}`, formData);
      } else {
        await API.post('/shelves', formData);
      }
      setSubmitting(false);
      setModalOpen(false);
      fetchShelves();
    } catch (err) {
      setSubmitting(false);
      setFormError(err.response?.data?.message || 'Failed to save shelf.');
    }
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Are you sure you want to delete shelf ${code}?`)) return;
    try {
      await API.delete(`/shelves/${id}`);
      fetchShelves();
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot delete shelf.');
    }
  };

  const filteredShelves = shelves.filter((s) => selectedZone === 'All' || s.zone === selectedZone);
  const zones = ['All', ...Array.from(new Set(shelves.map(s => s.zone)))];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-[#E5E9E6]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#253746] tracking-tight">
            Warehouse Shelves
          </h1>
          <p className="text-xs text-[#66736F] mt-0.5">
            Configure shelf racks, dimensional coordinates, volumetric capacities, and operational statuses.
          </p>
        </div>

        {isAdmin && <button
          onClick={handleOpenAdd}
          className="px-3 py-1.5 rounded-lg bg-[#477D78] hover:bg-[#3A6662] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Shelf Rack
        </button>}
      </div>

      {/* Filter by Zone */}
      <div className="bg-white border border-[#E5E9E6] rounded-xl p-3 shadow-xs flex items-center gap-1.5 overflow-x-auto">
        <span className="text-xs font-semibold text-[#66736F] mr-2 flex items-center gap-1">
          <Filter className="w-3 h-3" /> Zone:
        </span>
        {zones.map((z) => (
          <button
            key={z}
            onClick={() => setSelectedZone(z)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedZone === z
                ? 'bg-[#EDF3F2] text-[#477D78] font-semibold border border-[#D0DFDD]'
                : 'text-[#66736F] hover:bg-[#F5F6F4] border border-transparent'
            }`}
          >
            {z} ({z === 'All' ? shelves.length : shelves.filter(s => s.zone === z).length})
          </button>
        ))}
      </div>

      {/* Shelves Table */}
      <div className="bg-white border border-[#E5E9E6] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#253746]">
            <thead className="bg-[#F5F6F4] uppercase text-[10px] tracking-wider text-[#66736F] border-b border-[#E5E9E6]">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Shelf Code</th>
                <th className="py-2.5 px-4 font-semibold">Zone</th>
                <th className="py-2.5 px-4 font-semibold">Coordinates</th>
                <th className="py-2.5 px-4 font-semibold">Occupancy / Capacity</th>
                <th className="py-2.5 px-4 font-semibold">Occupancy Rate</th>
                <th className="py-2.5 px-4 font-semibold">Items Stored</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
                <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E9E6]">
              {filteredShelves.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-[#66736F]">
                    No shelves found for this zone.
                  </td>
                </tr>
              ) : (
                filteredShelves.map((shelf) => {
                  const occ = shelf.occupancyPercentage || 0;
                  const isOver = shelf.currentOccupancy > shelf.capacity;

                  return (
                    <tr key={shelf._id} className="hover:bg-[#F5F6F4]/50 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-medium text-[#477D78]">
                        <button
                          onClick={() => setSelectedShelf(shelf)}
                          className="bg-[#EDF3F2] px-1.5 py-0.5 rounded border border-[#D0DFDD] hover:underline"
                        >
                          {shelf.code}
                        </button>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="flex items-center gap-1 text-[#66736F]">
                          <MapPin className="w-3 h-3 text-[#66736F]" />
                          {shelf.zone}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-[#66736F]">
                        Row {shelf.row}, Col {shelf.column}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-[#253746]">
                        {shelf.currentOccupancy} / {shelf.capacity} units
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-[#E5E9E6] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isOver ? 'bg-[#C62828]' : occ >= 85 ? 'bg-[#B25E00]' : 'bg-[#477D78]'
                              }`}
                              style={{ width: `${Math.min(occ, 100)}%` }}
                            />
                          </div>
                          <span className={`font-semibold ${isOver ? 'text-[#C62828]' : 'text-[#253746]'}`}>
                            {occ}%
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-[#66736F]">
                        {shelf.items?.length || 0} SKUs
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                          shelf.status === 'Maintenance'
                            ? 'bg-[#FFF8E6] text-[#B25E00] border-[#FFE7B3]'
                            : shelf.status === 'Inactive'
                            ? 'bg-[#F5F6F4] text-[#66736F] border-[#E5E9E6]'
                            : 'bg-[#EBF5EC] text-[#2E7D32] border-[#CBE6CE]'
                        }`}>
                          {shelf.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedShelf(shelf)}
                            title="Inspect in Digital Twin"
                            className="p-1.5 rounded hover:bg-[#EDF3F2] text-[#477D78] transition-colors"
                          >
                            <Layers className="w-3.5 h-3.5" />
                          </button>
                          {isAdmin && <button
                            onClick={() => handleOpenEdit(shelf)}
                            title="Edit Shelf"
                            className="p-1.5 rounded hover:bg-[#F5F6F4] text-[#66736F] hover:text-[#253746] transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>}
                          {isAdmin && <button
                            onClick={() => handleDelete(shelf._id, shelf.code)}
                            title="Delete Shelf"
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

      {/* Add / Edit Shelf Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-[#E5E9E6] rounded-xl w-full max-w-md shadow-xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E9E6] mb-4">
              <h3 className="text-sm font-bold text-[#253746]">
                {editingShelf ? `Edit Shelf ${editingShelf.code}` : 'Add New Shelf Rack'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
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

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#66736F] mb-1">
                    Shelf Code
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingShelf}
                    placeholder="e.g. A-13"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#E5E9E6] rounded-lg text-[#253746] focus:outline-none focus:border-[#477D78] focus:ring-1 focus:ring-[#477D78] uppercase disabled:bg-[#F5F6F4]"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#66736F] mb-1">
                    Zone
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Zone A"
                    value={formData.zone}
                    onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#E5E9E6] rounded-lg text-[#253746] focus:outline-none focus:border-[#477D78] focus:ring-1 focus:ring-[#477D78]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#66736F] mb-1">
                    Row Position
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.row}
                    onChange={(e) => setFormData({ ...formData, row: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-[#E5E9E6] rounded-lg text-[#253746] focus:outline-none focus:border-[#477D78] focus:ring-1 focus:ring-[#477D78]"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#66736F] mb-1">
                    Column Position
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.column}
                    onChange={(e) => setFormData({ ...formData, column: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-[#E5E9E6] rounded-lg text-[#253746] focus:outline-none focus:border-[#477D78] focus:ring-1 focus:ring-[#477D78]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#66736F] mb-1">
                    Max Capacity (Units)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-[#E5E9E6] rounded-lg text-[#253746] focus:outline-none focus:border-[#477D78] focus:ring-1 focus:ring-[#477D78]"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#66736F] mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#E5E9E6] rounded-lg text-[#253746] focus:outline-none focus:border-[#477D78] focus:ring-1 focus:ring-[#477D78]"
                  >
                    <option value="Active">Active</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#66736F] mb-1">
                  Description / Bay Notes
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Ground level high load bay..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#E5E9E6] rounded-lg text-[#253746] focus:outline-none focus:border-[#477D78] focus:ring-1 focus:ring-[#477D78]"
                />
              </div>

              <div className="pt-3 border-t border-[#E5E9E6] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#66736F] hover:text-[#253746]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg bg-[#477D78] hover:bg-[#3A6662] text-white text-xs font-semibold transition-colors"
                >
                  {submitting ? 'Saving...' : editingShelf ? 'Save Changes' : 'Create Shelf'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shelf Inspection Modal */}
      {selectedShelf && (
        <ShelfModal
          shelf={selectedShelf}
          canMoveStock={canMoveStock}
          onClose={() => setSelectedShelf(null)}
          onStockIn={(shelf) => {
            setStockModalConfig({ isOpen: true, mode: 'IN', shelf });
          }}
          onStockOut={(shelf) => {
            setStockModalConfig({ isOpen: true, mode: 'OUT', shelf });
          }}
        />
      )}

      {/* Stock Modal */}
      {stockModalConfig.isOpen && (
        <StockModal
          mode={stockModalConfig.mode}
          initialShelf={stockModalConfig.shelf}
          onClose={() => setStockModalConfig({ isOpen: false, mode: 'IN', shelf: null })}
          onSuccess={fetchShelves}
        />
      )}

    </div>
  );
};

export default Shelves;
