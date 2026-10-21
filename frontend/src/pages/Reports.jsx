import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { 
  FileText, 
  Package, 
  Boxes, 
  Wrench, 
  Printer
} from 'lucide-react';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('inventory');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async (tab) => {
    try {
      setLoading(true);
      let endpoint = '/reports/inventory';
      if (tab === 'shelves') endpoint = '/reports/shelves';
      if (tab === 'equipment') endpoint = '/reports/equipment';

      const res = await API.get(endpoint);
      setReportData(res.data);
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(activeTab);
  }, [activeTab]);

  const handlePrint = () => {
    window.print();
  };

  const meta = reportData?.meta || {};
  const data = reportData?.data || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-[#E5E9E6]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#253746] tracking-tight">
            Analytics & Reports
          </h1>
          <p className="text-xs text-[#66736F] mt-0.5">
            Exportable database audit reports for inventory valuation, space usage, and machine reliability.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-3 py-1.5 rounded-lg bg-white border border-[#E5E9E6] hover:bg-[#F5F6F4] text-[#253746] text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs self-start sm:self-auto"
        >
          <Printer className="w-3.5 h-3.5 text-[#477D78]" />
          Print / Export PDF
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E5E9E6]">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-2.5 px-3.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
            activeTab === 'inventory'
              ? 'border-[#477D78] text-[#477D78]'
              : 'border-transparent text-[#66736F] hover:text-[#253746]'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          Inventory Valuation & Stock
        </button>
        <button
          onClick={() => setActiveTab('shelves')}
          className={`pb-2.5 px-3.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
            activeTab === 'shelves'
              ? 'border-[#477D78] text-[#477D78]'
              : 'border-transparent text-[#66736F] hover:text-[#253746]'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          Shelf Capacity & Utilization
        </button>
        <button
          onClick={() => setActiveTab('equipment')}
          className={`pb-2.5 px-3.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
            activeTab === 'equipment'
              ? 'border-[#477D78] text-[#477D78]'
              : 'border-transparent text-[#66736F] hover:text-[#253746]'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          Machinery Fleet Reliability
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-[#66736F] text-xs">
          Compiling report records...
        </div>
      ) : (
        <div className="space-y-5">
          
          {/* TAB 1: INVENTORY REPORT */}
          {activeTab === 'inventory' && (
            <>
              {/* Meta Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-white border border-[#E5E9E6] shadow-xs">
                  <div className="text-[11px] text-[#66736F] font-medium">Total Inventory Value</div>
                  <div className="text-xl font-bold text-[#2E7D32] mt-0.5">
                    ${meta.totalValuation?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                  </div>
                  <div className="text-[10px] text-[#66736F]">Calculated across active stock</div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-[#E5E9E6] shadow-xs">
                  <div className="text-[11px] text-[#66736F] font-medium">Physical Units In-Stock</div>
                  <div className="text-xl font-bold text-[#253746] mt-0.5">
                    {meta.totalUnits?.toLocaleString() || 0}
                  </div>
                  <div className="text-[10px] text-[#66736F]">Across all warehouse shelves</div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-[#E5E9E6] shadow-xs">
                  <div className="text-[11px] text-[#66736F] font-medium">Monitored Product Lines</div>
                  <div className="text-xl font-bold text-[#477D78] mt-0.5">
                    {meta.totalProducts || 0}
                  </div>
                  <div className="text-[10px] text-[#66736F]">Cataloged items in WMS</div>
                </div>
              </div>

              {/* Inventory Table */}
              <div className="bg-white border border-[#E5E9E6] rounded-xl overflow-hidden shadow-xs">
                <div className="p-3 border-b border-[#E5E9E6] font-semibold text-[#253746] text-xs flex items-center justify-between">
                  <span>Product Inventory Valuation Breakdown</span>
                  <span className="text-[11px] font-normal text-[#66736F]">
                    Generated: {new Date(meta.generatedAt).toLocaleString()}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-[#253746]">
                    <thead className="bg-[#F5F6F4] uppercase text-[10px] tracking-wider text-[#66736F] border-b border-[#E5E9E6]">
                      <tr>
                        <th className="py-2.5 px-4 font-semibold">SKU</th>
                        <th className="py-2.5 px-4 font-semibold">Product Name</th>
                        <th className="py-2.5 px-4 font-semibold">Category</th>
                        <th className="py-2.5 px-4 font-semibold">Unit Price</th>
                        <th className="py-2.5 px-4 font-semibold">Current Stock</th>
                        <th className="py-2.5 px-4 font-semibold">Valuation</th>
                        <th className="py-2.5 px-4 font-semibold">Status</th>
                        <th className="py-2.5 px-4 font-semibold">Shelf Locations</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E9E6]">
                      {data.map((item) => (
                        <tr key={item._id} className="hover:bg-[#F5F6F4]/50">
                          <td className="py-2.5 px-4 font-mono font-medium text-[#477D78]">{item.sku}</td>
                          <td className="py-2.5 px-4 font-medium text-[#253746]">{item.name}</td>
                          <td className="py-2.5 px-4 text-[#66736F]">{item.category}</td>
                          <td className="py-2.5 px-4">${item.price?.toFixed(2)}</td>
                          <td className="py-2.5 px-4 font-semibold text-[#253746]">
                            {item.currentStock} {item.unit}
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-[#2E7D32]">
                            ${item.stockValuation?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                              item.status === 'Out of Stock' ? 'bg-[#FDEEEF] text-[#C62828] border-[#F9D2D4]' :
                              item.status === 'Low Stock' ? 'bg-[#FFF8E6] text-[#B25E00] border-[#FFE7B3]' :
                              'bg-[#EBF5EC] text-[#2E7D32] border-[#CBE6CE]'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {item.locations?.length > 0 ? (
                                item.locations.map((loc, idx) => (
                                  <span key={idx} className="px-1.5 py-0.2 rounded bg-[#F5F6F4] text-[10px] text-[#66736F] border border-[#E5E9E6]">
                                    {loc.shelfCode} ({loc.quantity})
                                  </span>
                                ))
                              ) : (
                                <span className="text-[#66736F] text-[11px]">—</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: SHELF UTILIZATION REPORT */}
          {activeTab === 'shelves' && (
            <>
              {/* Meta Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-white border border-[#E5E9E6] shadow-xs">
                  <div className="text-[11px] text-[#66736F] font-medium">Average Space Occupancy</div>
                  <div className="text-xl font-bold text-[#477D78] mt-0.5">
                    {meta.averageOccupancyRate}%
                  </div>
                  <div className="text-[10px] text-[#66736F]">{meta.totalOccupied} / {meta.totalCapacity} Units Stored</div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-[#E5E9E6] shadow-xs">
                  <div className="text-[11px] text-[#66736F] font-medium">Configured Shelf Bays</div>
                  <div className="text-xl font-bold text-[#253746] mt-0.5">
                    {meta.totalShelves}
                  </div>
                  <div className="text-[10px] text-[#66736F]">Top-down digital nodes</div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-[#E5E9E6] shadow-xs">
                  <div className="text-[11px] text-[#66736F] font-medium">Overcapacity Racks</div>
                  <div className="text-xl font-bold text-[#C62828] mt-0.5">
                    {data.filter(s => s.statusCategory === 'Overcapacity').length}
                  </div>
                  <div className="text-[10px] text-[#66736F]">Requiring rebalance</div>
                </div>
              </div>

              {/* Shelf Table */}
              <div className="bg-white border border-[#E5E9E6] rounded-xl overflow-hidden shadow-xs">
                <div className="p-3 border-b border-[#E5E9E6] font-semibold text-[#253746] text-xs flex items-center justify-between">
                  <span>Shelf Utilization Analytics Matrix</span>
                  <span className="text-[11px] font-normal text-[#66736F]">
                    Generated: {new Date(meta.generatedAt).toLocaleString()}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-[#253746]">
                    <thead className="bg-[#F5F6F4] uppercase text-[10px] tracking-wider text-[#66736F] border-b border-[#E5E9E6]">
                      <tr>
                        <th className="py-2.5 px-4 font-semibold">Shelf Code</th>
                        <th className="py-2.5 px-4 font-semibold">Zone</th>
                        <th className="py-2.5 px-4 font-semibold">Coordinates</th>
                        <th className="py-2.5 px-4 font-semibold">Occupancy / Capacity</th>
                        <th className="py-2.5 px-4 font-semibold">Occupancy Rate</th>
                        <th className="py-2.5 px-4 font-semibold">Status Category</th>
                        <th className="py-2.5 px-4 font-semibold">Products on Shelf</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E9E6]">
                      {data.map((shelf) => (
                        <tr key={shelf._id} className="hover:bg-[#F5F6F4]/50">
                          <td className="py-2.5 px-4 font-mono font-medium text-[#253746]">{shelf.code}</td>
                          <td className="py-2.5 px-4 text-[#66736F]">{shelf.zone}</td>
                          <td className="py-2.5 px-4 text-[#66736F]">Row {shelf.row}, Col {shelf.column}</td>
                          <td className="py-2.5 px-4 font-medium text-[#253746]">
                            {shelf.currentOccupancy} / {shelf.capacity} units
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-[#477D78]">
                            {shelf.occupancyRate}%
                          </td>
                          <td className="py-2.5 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                              shelf.statusCategory === 'Overcapacity' ? 'bg-[#FDEEEF] text-[#C62828] border-[#F9D2D4]' :
                              shelf.statusCategory === 'High Occupancy' ? 'bg-[#FFF8E6] text-[#B25E00] border-[#FFE7B3]' :
                              shelf.statusCategory === 'Empty' ? 'bg-[#F5F6F4] text-[#66736F] border-[#E5E9E6]' :
                              'bg-[#EBF5EC] text-[#2E7D32] border-[#CBE6CE]'
                            }`}>
                              {shelf.statusCategory}
                            </span>
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="flex flex-wrap gap-1 max-w-sm">
                              {shelf.items?.length > 0 ? (
                                shelf.items.map((i, idx) => (
                                  <span key={idx} className="px-1.5 py-0.2 rounded bg-[#F5F6F4] text-[10px] text-[#66736F] border border-[#E5E9E6]">
                                    {i.productName} ({i.quantity})
                                  </span>
                                ))
                              ) : (
                                <span className="text-[#66736F] text-[11px]">Empty Shelf</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TAB 3: EQUIPMENT RELIABILITY REPORT */}
          {activeTab === 'equipment' && (
            <>
              {/* Meta Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-white border border-[#E5E9E6] shadow-xs">
                  <div className="text-[11px] text-[#66736F] font-medium">Fleet Health Average</div>
                  <div className="text-xl font-bold text-[#477D78] mt-0.5">
                    {meta.fleetHealthAvg}%
                  </div>
                  <div className="text-[10px] text-[#66736F]">Machine fleet telemetry</div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-[#E5E9E6] shadow-xs">
                  <div className="text-[11px] text-[#66736F] font-medium">Operational Units</div>
                  <div className="text-xl font-bold text-[#2E7D32] mt-0.5">
                    {meta.operational} / {meta.totalCount}
                  </div>
                  <div className="text-[10px] text-[#66736F]">Active machines</div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-[#E5E9E6] shadow-xs">
                  <div className="text-[11px] text-[#66736F] font-medium">Under Maintenance</div>
                  <div className="text-xl font-bold text-[#B25E00] mt-0.5">
                    {meta.maintenance}
                  </div>
                  <div className="text-[10px] text-[#66736F]">Servicing in progress</div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-[#E5E9E6] shadow-xs">
                  <div className="text-[11px] text-[#66736F] font-medium">Offline Equipment</div>
                  <div className="text-xl font-bold text-[#C62828] mt-0.5">
                    {meta.offline}
                  </div>
                  <div className="text-[10px] text-[#66736F]">Requires repairs</div>
                </div>
              </div>

              {/* Equipment Table */}
              <div className="bg-white border border-[#E5E9E6] rounded-xl overflow-hidden shadow-xs">
                <div className="p-3 border-b border-[#E5E9E6] font-semibold text-[#253746] text-xs flex items-center justify-between">
                  <span>Machinery Reliability & Maintenance Log</span>
                  <span className="text-[11px] font-normal text-[#66736F]">
                    Generated: {new Date(meta.generatedAt).toLocaleString()}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-[#253746]">
                    <thead className="bg-[#F5F6F4] uppercase text-[10px] tracking-wider text-[#66736F] border-b border-[#E5E9E6]">
                      <tr>
                        <th className="py-2.5 px-4 font-semibold">Code</th>
                        <th className="py-2.5 px-4 font-semibold">Machine Name</th>
                        <th className="py-2.5 px-4 font-semibold">Type</th>
                        <th className="py-2.5 px-4 font-semibold">Zone</th>
                        <th className="py-2.5 px-4 font-semibold">Health</th>
                        <th className="py-2.5 px-4 font-semibold">Status</th>
                        <th className="py-2.5 px-4 font-semibold">Operator</th>
                        <th className="py-2.5 px-4 font-semibold">Next Inspection</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E9E6]">
                      {data.map((eq) => (
                        <tr key={eq._id} className="hover:bg-[#F5F6F4]/50">
                          <td className="py-2.5 px-4 font-mono font-medium text-[#477D78]">{eq.code}</td>
                          <td className="py-2.5 px-4 font-medium text-[#253746]">{eq.name}</td>
                          <td className="py-2.5 px-4 text-[#66736F]">{eq.type}</td>
                          <td className="py-2.5 px-4 text-[#66736F]">{eq.zone}</td>
                          <td className="py-2.5 px-4 font-semibold text-[#253746]">{eq.healthPercentage}%</td>
                          <td className="py-2.5 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                              eq.status === 'Operational' ? 'bg-[#EBF5EC] text-[#2E7D32] border-[#CBE6CE]' :
                              eq.status === 'Maintenance' ? 'bg-[#FFF8E6] text-[#B25E00] border-[#FFE7B3]' :
                              'bg-[#FDEEEF] text-[#C62828] border-[#F9D2D4]'
                            }`}>
                              {eq.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-[#66736F]">{eq.operator || 'Unassigned'}</td>
                          <td className="py-2.5 px-4 text-[#66736F]">
                            {eq.nextMaintenanceDate ? new Date(eq.nextMaintenanceDate).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

        </div>
      )}

    </div>
  );
};

export default Reports;
