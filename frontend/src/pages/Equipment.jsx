import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { canManageCatalog, canOperate } from '../utils/permissions';
import { 
  Wrench, 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  AlertCircle,
  Filter
} from 'lucide-react';

const Equipment = () => {
  const { user } = useAuth();
  const isAdmin = canManageCatalog(user?.role);
  const canManageStatus = canOperate(user?.role);
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'Forklift',
    zone: 'Zone A',
    status: 'Operational',
    healthPercentage: 100,
    operator: '',
    notes: '',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/equipment?status=${statusFilter}&type=${typeFilter}`);
      setEquipmentList(res.data.data || []);
    } catch (err) {
      console.error('Failed to load equipment:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, [statusFilter, typeFilter]);

  const handleQuickStatusChange = async (id, newStatus) => {
    try {
      await API.put(`/equipment/${id}`, { status: newStatus });
      fetchEquipment();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update equipment status.');
    }
  };

  const handleOpenAdd = () => {
    setEditingEquipment(null);
    setFormData({
      code: '',
      name: '',
      type: 'Forklift',
      zone: 'Zone A',
      status: 'Operational',
      healthPercentage: 100,
      operator: '',
      notes: '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingEquipment(item);
    setFormData({
      code: item.code,
      name: item.name,
      type: item.type,
      zone: item.zone,
      status: item.status,
      healthPercentage: item.healthPercentage ?? 100,
      operator: item.operator || '',
      notes: item.notes || '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      if (editingEquipment) {
        await API.put(`/equipment/${editingEquipment._id}`, formData);
      } else {
        await API.post('/equipment', formData);
      }
      setSubmitting(false);
      setModalOpen(false);
      fetchEquipment();
    } catch (err) {
      setSubmitting(false);
      setFormError(err.response?.data?.message || 'Failed to save equipment.');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove machine ${name}?`)) return;
    try {
      await API.delete(`/equipment/${id}`);
      fetchEquipment();
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot remove equipment.');
    }
  };

  const types = ['All', 'Forklift', 'Conveyor', 'Crane', 'Scanner', 'Robot AGV'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-[#E5E9E6]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#253746] tracking-tight">
            Equipment Fleet
          </h1>
          <p className="text-xs text-[#66736F] mt-0.5">
            Monitor warehouse machines, track health states, and trigger automatic maintenance alerts.
          </p>
        </div>

        {isAdmin && <button
          onClick={handleOpenAdd}
          className="px-3 py-1.5 rounded-lg bg-[#477D78] hover:bg-[#3A6662] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Register Machine
        </button>}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-[#E5E9E6] rounded-xl p-3 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Status filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-[#66736F] mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Status:
          </span>
          {['All', 'Operational', 'Maintenance', 'Offline'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-[#EDF3F2] text-[#477D78] font-semibold border border-[#D0DFDD]'
                  : 'text-[#66736F] hover:bg-[#F5F6F4] border border-transparent'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-[#66736F] mr-1">Type:</span>
          {types.map((tp) => (
            <button
              key={tp}
              onClick={() => setTypeFilter(tp)}
              className={`px-2 py-0.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                typeFilter === tp
                  ? 'bg-[#253746] text-white font-semibold'
                  : 'text-[#66736F] hover:bg-[#F5F6F4]'
              }`}
            >
              {tp}
            </button>
          ))}
        </div>
      </div>

      {/* High Density Equipment Table */}
      <div className="bg-white border border-[#E5E9E6] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#253746]">
            <thead className="bg-[#F5F6F4] uppercase text-[10px] tracking-wider text-[#66736F] border-b border-[#E5E9E6]">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Code</th>
                <th className="py-2.5 px-4 font-semibold">Machine / Model</th>
                <th className="py-2.5 px-4 font-semibold">Type</th>
                <th className="py-2.5 px-4 font-semibold">Zone</th>
                <th className="py-2.5 px-4 font-semibold">Health</th>
                <th className="py-2.5 px-4 font-semibold">Current Status</th>
                <th className="py-2.5 px-4 font-semibold">Quick Status Toggle</th>
                <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E9E6]">
              {equipmentList.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-[#66736F]">
                    No equipment found matching the filters.
                  </td>
                </tr>
              ) : (
                equipmentList.map((item) => {
                  const isOperational = item.status === 'Operational';
                  const isMaintenance = item.status === 'Maintenance';
                  const isOffline = item.status === 'Offline';

                  return (
                    <tr key={item._id} className="hover:bg-[#F5F6F4]/50 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-medium text-[#477D78]">
                        <span className="bg-[#EDF3F2] px-1.5 py-0.5 rounded border border-[#D0DFDD]">
                          {item.code}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-medium text-[#253746]">
                        <div>{item.name}</div>
                        <div className="text-[11px] text-[#66736F]">Op: {item.operator || 'Unassigned'}</div>
                      </td>
                      <td className="py-2.5 px-4 text-[#66736F]">{item.type}</td>
                      <td className="py-2.5 px-4 text-[#66736F]">{item.zone}</td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-14 h-1.5 bg-[#E5E9E6] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                item.healthPercentage >= 80 ? 'bg-[#2E7D32]' :
                                item.healthPercentage >= 50 ? 'bg-[#B25E00]' : 'bg-[#C62828]'
                              }`}
                              style={{ width: `${item.healthPercentage}%` }}
                            />
                          </div>
                          <span className="font-semibold text-[#253746]">{item.healthPercentage}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                          isOperational ? 'bg-[#EBF5EC] text-[#2E7D32] border-[#CBE6CE]' :
                          isMaintenance ? 'bg-[#FFF8E6] text-[#B25E00] border-[#FFE7B3]' :
                          'bg-[#FDEEEF] text-[#C62828] border-[#F9D2D4]'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        {/* Compact Quick Status Buttons */}
                        {canManageStatus ? <div className="inline-flex rounded-lg border border-[#E5E9E6] p-0.5 bg-[#F5F6F4]">
                          <button
                            onClick={() => handleQuickStatusChange(item._id, 'Operational')}
                            disabled={isOperational}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                              isOperational
                                ? 'bg-white text-[#2E7D32] shadow-2xs font-bold'
                                : 'text-[#66736F] hover:text-[#253746]'
                            }`}
                          >
                            Active
                          </button>
                          <button
                            onClick={() => handleQuickStatusChange(item._id, 'Maintenance')}
                            disabled={isMaintenance}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                              isMaintenance
                                ? 'bg-white text-[#B25E00] shadow-2xs font-bold'
                                : 'text-[#66736F] hover:text-[#253746]'
                            }`}
                          >
                            Maint
                          </button>
                          <button
                            onClick={() => handleQuickStatusChange(item._id, 'Offline')}
                            disabled={isOffline}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                              isOffline
                                ? 'bg-white text-[#C62828] shadow-2xs font-bold'
                                : 'text-[#66736F] hover:text-[#253746]'
                            }`}
                          >
                            Offline
                          </button>
                        </div> : <span className="text-[#9AA5A1]">Read only</span>}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {isAdmin && <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Equipment"
                            className="p-1.5 rounded hover:bg-[#F5F6F4] text-[#66736F] hover:text-[#253746] transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id, item.name)}
                            title="Remove Equipment"
                            className="p-1.5 rounded hover:bg-[#FDEEEF] text-[#66736F] hover:text-[#C62828] transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Equipment Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-[#E5E9E6] rounded-xl w-full max-w-lg shadow-xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E9E6] mb-4">
              <h3 className="text-sm font-bold text-[#253746]">
                {editingEquipment ? `Edit Machine: ${editingEquipment.name}` : 'Register Machinery'}
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
                    Machine Code
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingEquipment}
                    placeholder="e.g. FL-03"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#E5E9E6] rounded-lg text-[#253746] focus:outline-none focus:border-[#477D78] focus:ring-1 focus:ring-[#477D78] uppercase disabled:bg-[#F5F6F4]"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#66736F] mb-1">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#E5E9E6] rounded-lg text-[#253746] focus:outline-none focus:border-[#477D78] focus:ring-1 focus:ring-[#477D78]"
                  >
                    <option value="Forklift">Forklift</option>
                    <option value="Conveyor">Conveyor Belt</option>
                    <option value="Crane">Crane / Hoist</option>
                    <option value="Scanner">Scanner / Terminal</option>
                    <option value="Robot AGV">Robot AGV</option>
                    <option value="HVAC / Chiller">HVAC / Chiller</option>
                    <option value="Pallet Jack">Pallet Jack</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#66736F] mb-1">
                  Machine Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hyster Electric Counterbalance Forklift"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#E5E9E6] rounded-lg text-[#253746] focus:outline-none focus:border-[#477D78] focus:ring-1 focus:ring-[#477D78]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#66736F] mb-1">
                    Zone
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Zone A"
                    value={formData.zone}
                    onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
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
                    <option value="Operational">Operational</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#66736F] mb-1">
                    Health (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={formData.healthPercentage}
                    onChange={(e) => setFormData({ ...formData, healthPercentage: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-[#E5E9E6] rounded-lg text-[#253746] focus:outline-none focus:border-[#477D78] focus:ring-1 focus:ring-[#477D78]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#66736F] mb-1">
                  Operator
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mike Vance (Badge #109)"
                  value={formData.operator}
                  onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#E5E9E6] rounded-lg text-[#253746] focus:outline-none focus:border-[#477D78] focus:ring-1 focus:ring-[#477D78]"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#66736F] mb-1">
                  Maintenance Notes
                </label>
                <textarea
                  rows="2"
                  placeholder="Sensors, inspection schedule notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                  {submitting ? 'Saving...' : editingEquipment ? 'Update Machine' : 'Register Machine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Equipment;
