import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import StockModal from '../components/StockModal';
import { useAuth } from '../context/AuthContext';
import { canOperate } from '../utils/permissions';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  LayoutDashboard,
  Layers,
  Package,
  Boxes,
  Wrench,
  Bell,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const canOperateWarehouse = canOperate(user?.role);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stockModalConfig, setStockModalConfig] = useState({ isOpen: false, mode: 'IN' });

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await API.get('/dashboard/summary');
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to load dashboard summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 25000);
    return () => clearInterval(interval);
  }, []);

  const handleAcknowledgeAlert = async (alertId) => {
    try {
      await API.put(`/alerts/${alertId}/acknowledge`);
      fetchDashboard();
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
      fetchDashboard();
    }
  };

  const summary = data?.summary || {};
  const charts = data?.charts || {};
  const recentAlerts = data?.recentAlerts || [];
  const recentMovements = data?.recentMovements || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-[#E5E9E6]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#253746] tracking-tight">
            Warehouse Overview
          </h1>
          <p className="text-xs text-[#66736F] mt-0.5">
            Operational metrics, capacity status, and synchronized asset telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/digital-twin"
            className="px-3 py-1.5 rounded-lg bg-[#477D78] hover:bg-[#3A6662] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Layers className="w-3.5 h-3.5" />
            Launch Digital Twin
          </Link>
          {canOperateWarehouse && <button
            onClick={() => setStockModalConfig({ isOpen: true, mode: 'IN' })}
            className="px-3 py-1.5 rounded-lg bg-white border border-[#E5E9E6] hover:bg-[#F5F6F4] text-[#253746] text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-[#2E7D32]" />
            Stock In
          </button>}
          {canOperateWarehouse && <button
            onClick={() => setStockModalConfig({ isOpen: true, mode: 'OUT' })}
            className="px-3 py-1.5 rounded-lg bg-white border border-[#E5E9E6] hover:bg-[#F5F6F4] text-[#253746] text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-[#C62828]" />
            Stock Out
          </button>}
          <button
            onClick={fetchDashboard}
            title="Refresh Metrics"
            className="p-1.5 rounded-lg bg-white border border-[#E5E9E6] hover:bg-[#F5F6F4] text-[#66736F] transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#477D78]' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 Compact Operational KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Stored Units */}
        <div className="p-4 rounded-xl bg-white border border-[#E5E9E6] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-[#66736F]">Total Stored Units</span>
            <div className="w-7 h-7 rounded-lg bg-[#EDF3F2] text-[#477D78] flex items-center justify-center">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-[#253746]">
              {summary.totalStoredUnits?.toLocaleString() || 0}
            </span>
            <span className="text-xs text-[#66736F]">units</span>
          </div>
          <div className="mt-1 text-[11px] text-[#66736F]">
            {summary.totalProducts || 0} unique SKUs cataloged
          </div>
        </div>

        {/* KPI 2: Space Occupancy */}
        <div className="p-4 rounded-xl bg-white border border-[#E5E9E6] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-[#66736F]">Space Occupancy</span>
            <div className="w-7 h-7 rounded-lg bg-[#EDF3F2] text-[#477D78] flex items-center justify-center">
              <Boxes className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-[#253746]">
              {summary.warehouseOccupancyRate || 0}%
            </span>
            <span className="text-xs text-[#66736F]">utilized</span>
          </div>
          <div className="mt-1 text-[11px] text-[#66736F]">
            {summary.totalShelves || 0} shelves • {summary.totalCapacity || 0} total capacity
          </div>
        </div>

        {/* KPI 3: Active Alerts */}
        <div className="p-4 rounded-xl bg-white border border-[#E5E9E6] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-[#66736F]">Active Alerts</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              summary.activeAlertsCount > 0 ? 'bg-[#FDEEEF] text-[#C62828]' : 'bg-[#EBF5EC] text-[#2E7D32]'
            }`}>
              <Bell className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-[#253746]">
              {summary.activeAlertsCount || 0}
            </span>
            <span className="text-xs text-[#66736F]">open</span>
          </div>
          <div className="mt-1 text-[11px] text-[#66736F] flex items-center gap-1.5">
            <span>{summary.criticalAlertsCount || 0} critical</span>
            <span>•</span>
            <span>{summary.lowStockCount || 0} low-stock</span>
          </div>
        </div>

        {/* KPI 4: Fleet Health */}
        <div className="p-4 rounded-xl bg-white border border-[#E5E9E6] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-[#66736F]">Fleet Operational</span>
            <div className="w-7 h-7 rounded-lg bg-[#EBF5EC] text-[#2E7D32] flex items-center justify-center">
              <Wrench className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-[#253746]">
              {summary.equipment?.operationalRate || 0}%
            </span>
            <span className="text-xs text-[#66736F]">active</span>
          </div>
          <div className="mt-1 text-[11px] text-[#66736F]">
            {summary.equipment?.operational || 0} of {summary.equipment?.total || 0} machines online
          </div>
        </div>

      </div>

      {/* Clean Two-Column Chart Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Category Breakdown Bar Chart */}
        <div className="p-5 rounded-xl bg-white border border-[#E5E9E6] shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-[#253746]">Inventory by Category</h3>
              <p className="text-[11px] text-[#66736F]">Distribution of stock units across categories</p>
            </div>
            <Link to="/inventory" className="text-xs text-[#477D78] hover:underline flex items-center gap-1 font-medium">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="h-56 w-full">
            {charts.categoryData?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.categoryData} margin={{ top: 10, right: 10, left: -25, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E9E6" vertical={false} />
                  <XAxis dataKey="name" stroke="#66736F" fontSize={10} angle={-10} textAnchor="end" />
                  <YAxis stroke="#66736F" fontSize={10} />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#FFFFFF', 
                      borderColor: '#E5E9E6', 
                      borderRadius: '8px', 
                      color: '#253746', 
                      fontSize: '11px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                    }}
                  />
                  <Bar dataKey="stock" name="Units Stored" fill="#477D78" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#66736F]">
                No inventory records available.
              </div>
            )}
          </div>
        </div>

        {/* Zone Utilization Chart */}
        <div className="p-5 rounded-xl bg-white border border-[#E5E9E6] shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-[#253746]">Zone Space Utilization</h3>
              <p className="text-[11px] text-[#66736F]">Capacity limit versus current allocated units</p>
            </div>
            <Link to="/digital-twin" className="text-xs text-[#477D78] hover:underline flex items-center gap-1 font-medium">
              Digital Twin <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="h-56 w-full">
            {charts.zoneUtilization?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.zoneUtilization} margin={{ top: 10, right: 10, left: -25, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E9E6" vertical={false} />
                  <XAxis dataKey="zone" stroke="#66736F" fontSize={10} />
                  <YAxis stroke="#66736F" fontSize={10} />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#FFFFFF', 
                      borderColor: '#E5E9E6', 
                      borderRadius: '8px', 
                      color: '#253746', 
                      fontSize: '11px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '5px' }} />
                  <Bar dataKey="capacity" name="Total Capacity" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="occupied" name="Occupied Units" fill="#477D78" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#66736F]">
                No zone metrics available.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Activity & Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Recent Alerts Feed */}
        <div className="p-5 rounded-xl bg-white border border-[#E5E9E6] shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E5E9E6]">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#B25E00]" />
              <h3 className="text-sm font-bold text-[#253746]">Active System Alerts</h3>
            </div>
            <Link to="/alerts" className="text-xs text-[#477D78] hover:underline flex items-center gap-1 font-medium">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-72">
            {recentAlerts.length === 0 ? (
              <div className="text-center py-8 text-[#66736F] text-xs flex flex-col items-center gap-1.5">
                <CheckCircle2 className="w-6 h-6 text-[#2E7D32]" />
                <span>All clear! No active operational alerts.</span>
              </div>
            ) : (
              recentAlerts.map((alert) => (
                <div
                  key={alert._id}
                  className={`p-3 rounded-lg border flex items-start justify-between gap-3 text-xs ${
                    alert.status === 'Active'
                      ? 'bg-[#FFFDFB] border-[#FFE7B3]'
                      : 'bg-[#F5F6F4] border-[#E5E9E6]'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                      alert.severity === 'critical' ? 'text-[#C62828]' : 'text-[#B25E00]'
                    }`} />
                    <div>
                      <div className="font-semibold text-[#253746]">{alert.title}</div>
                      <p className="text-[11px] text-[#66736F] mt-0.5 leading-snug">{alert.message}</p>
                      <div className="text-[10px] text-[#66736F] mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  {alert.status === 'Active' && canOperateWarehouse ? (
                    <button
                      onClick={() => handleAcknowledgeAlert(alert._id)}
                      className="px-2 py-1 rounded bg-white hover:bg-[#F5F6F4] text-[11px] font-medium text-[#253746] border border-[#E5E9E6] flex-shrink-0 transition-colors"
                    >
                      Ack
                    </button>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#E5E9E6] text-[#66736F]">
                      {alert.status}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Stock Movements Feed */}
        <div className="p-5 rounded-xl bg-white border border-[#E5E9E6] shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E5E9E6]">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#477D78]" />
              <h3 className="text-sm font-bold text-[#253746]">Recent Movements</h3>
            </div>
            <Link to="/inventory" className="text-xs text-[#477D78] hover:underline flex items-center gap-1 font-medium">
              Audit Log <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto max-h-72">
            {recentMovements.length === 0 ? (
              <div className="text-center py-8 text-[#66736F] text-xs">
                No recent stock operations recorded.
              </div>
            ) : (
              recentMovements.map((move) => {
                const isOut = move.type === 'STOCK_OUT';
                return (
                  <div
                    key={move._id}
                    className="p-2.5 rounded-lg border border-[#E5E9E6] bg-white flex items-center justify-between gap-3 text-xs hover:border-[#D0DFDD] transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-md ${
                        isOut ? 'bg-[#FDEEEF] text-[#C62828]' : 'bg-[#EBF5EC] text-[#2E7D32]'
                      }`}>
                        {isOut ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <div className="font-medium text-[#253746]">
                          {move.product?.name || 'Product'}
                        </div>
                        <div className="text-[11px] text-[#66736F]">
                          Shelf {move.shelf?.code || 'N/A'} • {move.referenceNo || 'No Ref'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`font-semibold ${isOut ? 'text-[#C62828]' : 'text-[#2E7D32]'}`}>
                        {isOut ? '-' : '+'}{move.quantity} {move.product?.unit || 'Units'}
                      </div>
                      <div className="text-[10px] text-[#66736F]">
                        {new Date(move.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Stock Modal */}
      {stockModalConfig.isOpen && (
        <StockModal
          mode={stockModalConfig.mode}
          onClose={() => setStockModalConfig({ isOpen: false, mode: 'IN' })}
          onSuccess={fetchDashboard}
        />
      )}

    </div>
  );
};

export default Dashboard;
