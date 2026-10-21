import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { canOperate } from '../utils/permissions';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Filter, 
  RefreshCw, 
  User, 
  Package,
  Wrench,
  Boxes
} from 'lucide-react';

const Alerts = () => {
  const { user } = useAuth();
  const canManageAlerts = canOperate(user?.role);
  const [alerts, setAlerts] = useState([]);
  const [counts, setCounts] = useState({ total: 0, active: 0, acknowledged: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('Active');
  const [typeFilter, setTypeFilter] = useState('All');

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/alerts?status=${statusFilter}&type=${typeFilter}`);
      setAlerts(res.data.data || []);
      if (res.data.counts) setCounts(res.data.counts);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter, typeFilter]);

  const handleAcknowledge = async (id) => {
    try {
      await API.put(`/alerts/${id}/acknowledge`);
      await fetchAlerts();
    } catch (err) {
      await fetchAlerts();
      alert(err.response?.data?.message || 'Failed to acknowledge alert.');
    }
  };

  const handleResolve = async (id) => {
    try {
      await API.put(`/alerts/${id}/resolve`);
      await fetchAlerts();
    } catch (err) {
      await fetchAlerts();
      alert(err.response?.data?.message || 'Failed to resolve alert.');
    }
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'critical':
        return 'bg-[#FDEEEF] text-[#C62828] border-[#F9D2D4]';
      case 'high':
        return 'bg-[#FFF8E6] text-[#B25E00] border-[#FFE7B3]';
      case 'medium':
        return 'bg-[#FFF8E6] text-[#B25E00] border-[#FFE7B3]';
      default:
        return 'bg-[#EDF3F2] text-[#477D78] border-[#D0DFDD]';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'LOW_STOCK':
        return <Package className="w-3.5 h-3.5 text-[#B25E00]" />;
      case 'EQUIPMENT_STATUS':
        return <Wrench className="w-3.5 h-3.5 text-[#C62828]" />;
      case 'OVERCAPACITY':
        return <Boxes className="w-3.5 h-3.5 text-[#B25E00]" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-[#477D78]" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-[#E5E9E6]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#253746] tracking-tight">
            System Alerts & Exceptions
          </h1>
          <p className="text-xs text-[#66736F] mt-0.5">
            Real-time warnings for low stock levels, equipment status shifts, and bay capacity limits.
          </p>
        </div>

        <button
          onClick={fetchAlerts}
          className="px-3 py-1.5 rounded-lg bg-white border border-[#E5E9E6] hover:bg-[#F5F6F4] text-[#253746] text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#477D78]' : 'text-[#66736F]'}`} />
          Refresh
        </button>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div 
          onClick={() => setStatusFilter('Active')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-colors ${
            statusFilter === 'Active' 
              ? 'bg-[#EDF3F2] border-[#D0DFDD]' 
              : 'bg-white border-[#E5E9E6] hover:border-[#D0DFDD]'
          }`}
        >
          <div className="text-[11px] text-[#66736F] font-medium">Active / Unhandled</div>
          <div className="text-xl font-bold text-[#C62828] mt-0.5">{counts.active}</div>
          <div className="text-[10px] text-[#66736F]">Requires attention</div>
        </div>

        <div 
          onClick={() => setStatusFilter('Acknowledged')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-colors ${
            statusFilter === 'Acknowledged' 
              ? 'bg-[#EDF3F2] border-[#D0DFDD]' 
              : 'bg-white border-[#E5E9E6] hover:border-[#D0DFDD]'
          }`}
        >
          <div className="text-[11px] text-[#66736F] font-medium">Acknowledged</div>
          <div className="text-xl font-bold text-[#B25E00] mt-0.5">{counts.acknowledged}</div>
          <div className="text-[10px] text-[#66736F]">Under investigation</div>
        </div>

        <div 
          onClick={() => setStatusFilter('Resolved')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-colors ${
            statusFilter === 'Resolved' 
              ? 'bg-[#EDF3F2] border-[#D0DFDD]' 
              : 'bg-white border-[#E5E9E6] hover:border-[#D0DFDD]'
          }`}
        >
          <div className="text-[11px] text-[#66736F] font-medium">Resolved</div>
          <div className="text-xl font-bold text-[#2E7D32] mt-0.5">{counts.resolved}</div>
          <div className="text-[10px] text-[#66736F]">Historical records</div>
        </div>

        <div 
          onClick={() => setStatusFilter('All')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-colors ${
            statusFilter === 'All' 
              ? 'bg-[#EDF3F2] border-[#D0DFDD]' 
              : 'bg-white border-[#E5E9E6] hover:border-[#D0DFDD]'
          }`}
        >
          <div className="text-[11px] text-[#66736F] font-medium">Lifetime Total</div>
          <div className="text-xl font-bold text-[#253746] mt-0.5">{counts.total}</div>
          <div className="text-[10px] text-[#66736F]">Audited logs</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-[#E5E9E6] rounded-xl p-3 shadow-xs flex items-center gap-1.5 overflow-x-auto">
        <span className="text-xs font-semibold text-[#66736F] mr-2 flex items-center gap-1">
          <Filter className="w-3 h-3" /> Category:
        </span>
        {['All', 'LOW_STOCK', 'EQUIPMENT_STATUS', 'OVERCAPACITY'].map((tp) => (
          <button
            key={tp}
            onClick={() => setTypeFilter(tp)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              typeFilter === tp
                ? 'bg-[#EDF3F2] text-[#477D78] font-semibold border border-[#D0DFDD]'
                : 'text-[#66736F] hover:bg-[#F5F6F4] border border-transparent'
            }`}
          >
            {tp === 'LOW_STOCK' ? 'Low Stock' : tp === 'EQUIPMENT_STATUS' ? 'Equipment' : tp === 'OVERCAPACITY' ? 'Overcapacity' : 'All Types'}
          </button>
        ))}
      </div>

      {/* Alerts Feed List */}
      <div className="space-y-2.5">
        {alerts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-[#E5E9E6] text-[#66736F] text-xs flex flex-col items-center gap-1.5">
            <CheckCircle2 className="w-6 h-6 text-[#2E7D32]" />
            <span>No alerts found matching the selected filter.</span>
          </div>
        ) : (
          alerts.map((alert) => {
            const isActive = alert.status === 'Active';
            const isAck = alert.status === 'Acknowledged';

            return (
              <div
                key={alert._id}
                className="bg-white border border-[#E5E9E6] rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-[#D0DFDD] transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#F5F6F4] border border-[#E5E9E6] flex-shrink-0 mt-0.5">
                    {getTypeIcon(alert.type)}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-[#253746]">{alert.title}</h3>
                      <span className={`px-2 py-0.2 rounded text-[10px] font-semibold uppercase border ${getSeverityBadge(alert.severity)}`}>
                        {alert.severity}
                      </span>
                      <span className={`px-2 py-0.2 rounded text-[10px] font-medium border ${
                        isActive ? 'bg-[#FDEEEF] text-[#C62828] border-[#F9D2D4]' :
                        isAck ? 'bg-[#FFF8E6] text-[#B25E00] border-[#FFE7B3]' :
                        'bg-[#EBF5EC] text-[#2E7D32] border-[#CBE6CE]'
                      }`}>
                        {alert.status}
                      </span>
                    </div>

                    <p className="text-[#66736F] mt-1 text-xs leading-relaxed max-w-2xl">
                      {alert.message}
                    </p>

                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-[#66736F] flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(alert.createdAt).toLocaleString()}
                      </span>

                      {alert.acknowledgedBy && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-[#477D78]" /> Acknowledged by: {alert.acknowledgedBy?.username}
                        </span>
                      )}
                      {alert.resolvedBy && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-[#477D78]" /> Resolved by: {alert.resolvedBy?.username}
                        </span>
                      )}
                      {alert.resolvedAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Resolved: {new Date(alert.resolvedAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {canManageAlerts && <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                  {isActive && (
                    <button
                      onClick={() => handleAcknowledge(alert._id)}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#F5F6F4] text-[#253746] text-xs font-medium border border-[#E5E9E6] transition-colors"
                    >
                      Acknowledge
                    </button>
                  )}

                  {(isActive || isAck) && (
                    <button
                      onClick={() => handleResolve(alert._id)}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#EBF5EC] text-[#2E7D32] text-xs font-medium border border-[#E5E9E6] hover:border-[#CBE6CE] transition-colors"
                    >
                      Resolve
                    </button>
                  )}
                </div>}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

export default Alerts;
