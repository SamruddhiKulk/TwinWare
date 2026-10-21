import React, { useState, useEffect } from 'react';
import API from '../services/api';
import ShelfModal from '../components/ShelfModal';
import StockModal from '../components/StockModal';
import { useAuth } from '../context/AuthContext';
import { canOperate } from '../utils/permissions';
import { 
  Layers, 
  RefreshCw, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Maximize2, 
  Filter,
  Truck,
  Zap
} from 'lucide-react';

const DigitalTwin = () => {
  const { user } = useAuth();
  const canMoveStock = canOperate(user?.role);
  const [shelves, setShelves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState('All');
  const [selectedShelf, setSelectedShelf] = useState(null);
  
  // Modals
  const [stockModalConfig, setStockModalConfig] = useState({ isOpen: false, mode: 'IN', shelf: null });
  const [filterQuery, setFilterQuery] = useState('');

  const fetchShelves = async () => {
    try {
      setLoading(true);
      const res = await API.get('/shelves');
      setShelves(res.data.data || []);
    } catch (err) {
      console.error('Failed to load shelves for digital twin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShelves();
    const interval = setInterval(fetchShelves, 20000);
    return () => clearInterval(interval);
  }, []);

  // Filter shelves
  const filteredShelves = shelves.filter((s) => {
    const matchesZone = selectedZone === 'All' || s.zone === selectedZone;
    const matchesQuery = !filterQuery || s.code.toLowerCase().includes(filterQuery.toLowerCase());
    return matchesZone && matchesQuery;
  });

  // Calculate Twin Metrics
  const totalShelves = shelves.length;
  const totalCapacity = shelves.reduce((acc, s) => acc + s.capacity, 0);
  const totalOccupied = shelves.reduce((acc, s) => acc + s.currentOccupancy, 0);
  const avgOccupancy = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;
  const maintenanceCount = shelves.filter(s => s.status === 'Maintenance').length;
  const overcapacityCount = shelves.filter(s => s.currentOccupancy > s.capacity).length;

  const zones = Array.from(new Set(shelves.map(s => s.zone))).sort();

  // Subtle styling helper
  const getShelfStyle = (shelf) => {
    if (shelf.status === 'Maintenance') {
      return {
        cardBg: 'bg-[#FAF8F5] border-[#E5E9E6] hover:border-[#B25E00]',
        badge: 'bg-[#FFF8E6] text-[#B25E00] border-[#FFE7B3]',
        bar: 'bg-[#B25E00]',
        label: 'Maintenance',
      };
    }
    if (shelf.currentOccupancy > shelf.capacity) {
      return {
        cardBg: 'bg-[#FFFBFC] border-[#F9D2D4] hover:border-[#C62828]',
        badge: 'bg-[#FDEEEF] text-[#C62828] border-[#F9D2D4]',
        bar: 'bg-[#C62828]',
        label: 'Overfilled',
      };
    }
    const occ = shelf.occupancyPercentage || 0;
    if (occ >= 85) {
      return {
        cardBg: 'bg-white border-[#E5E9E6] hover:border-[#B25E00]',
        badge: 'bg-[#FFF8E6] text-[#B25E00] border-[#FFE7B3]',
        bar: 'bg-[#B25E00]',
        label: 'High',
      };
    }
    if (occ >= 45) {
      return {
        cardBg: 'bg-white border-[#E5E9E6] hover:border-[#477D78]',
        badge: 'bg-[#EDF3F2] text-[#477D78] border-[#D0DFDD]',
        bar: 'bg-[#477D78]',
        label: 'Optimal',
      };
    }
    if (occ > 0) {
      return {
        cardBg: 'bg-white border-[#E5E9E6] hover:border-[#477D78]',
        badge: 'bg-[#EDF3F2] text-[#477D78] border-[#D0DFDD]',
        bar: 'bg-[#6A9B96]',
        label: 'Low',
      };
    }
    return {
      cardBg: 'bg-[#FAFBF9] border-[#E5E9E6] hover:border-[#B6C2BC]',
      badge: 'bg-[#F5F6F4] text-[#66736F] border-[#E5E9E6]',
      bar: 'bg-[#CBD5E1]',
      label: 'Empty',
    };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-[#E5E9E6]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#253746] tracking-tight">
              Digital Twin Warehouse
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#EBF5EC] text-[#2E7D32] border border-[#CBE6CE]">
              2D Real-time
            </span>
          </div>
          <p className="text-xs text-[#66736F] mt-0.5">
            Interactive top-down representation of physical warehouse bays, shelves, and current load.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canMoveStock && <button
            onClick={() => setStockModalConfig({ isOpen: true, mode: 'IN', shelf: null })}
            className="px-3 py-1.5 rounded-lg bg-[#477D78] hover:bg-[#3A6662] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            Stock In
          </button>}
          {canMoveStock && <button
            onClick={() => setStockModalConfig({ isOpen: true, mode: 'OUT', shelf: null })}
            className="px-3 py-1.5 rounded-lg bg-white border border-[#E5E9E6] hover:bg-[#F5F6F4] text-[#253746] text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-[#C62828]" />
            Stock Out
          </button>}
          <button
            onClick={fetchShelves}
            title="Refresh Digital Twin Data"
            className="p-1.5 rounded-lg bg-white border border-[#E5E9E6] hover:bg-[#F5F6F4] text-[#66736F] transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#477D78]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Compact HUD Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-[#E5E9E6] rounded-xl p-3 shadow-xs">
          <div className="text-[11px] font-medium text-[#66736F]">Total Shelves</div>
          <div className="text-lg font-bold text-[#253746] mt-0.5">{totalShelves}</div>
          <div className="text-[10px] text-[#66736F]">{zones.length} Warehouse Zones</div>
        </div>

        <div className="bg-white border border-[#E5E9E6] rounded-xl p-3 shadow-xs">
          <div className="text-[11px] font-medium text-[#66736F]">Average Occupancy</div>
          <div className="text-lg font-bold text-[#253746] mt-0.5">{avgOccupancy}%</div>
          <div className="text-[10px] text-[#66736F]">{totalOccupied} / {totalCapacity} units stored</div>
        </div>

        <div className="bg-white border border-[#E5E9E6] rounded-xl p-3 shadow-xs">
          <div className="text-[11px] font-medium text-[#66736F]">Overfilled Bays</div>
          <div className={`text-lg font-bold mt-0.5 ${overcapacityCount > 0 ? 'text-[#C62828]' : 'text-[#253746]'}`}>
            {overcapacityCount}
          </div>
          <div className="text-[10px] text-[#66736F]">Capacity exceeded</div>
        </div>

        <div className="bg-white border border-[#E5E9E6] rounded-xl p-3 shadow-xs">
          <div className="text-[11px] font-medium text-[#66736F]">Maintenance Bays</div>
          <div className={`text-lg font-bold mt-0.5 ${maintenanceCount > 0 ? 'text-[#B25E00]' : 'text-[#253746]'}`}>
            {maintenanceCount}
          </div>
          <div className="text-[10px] text-[#66736F]">Restricted shelf status</div>
        </div>
      </div>

      {/* Control Bar: Zone Filter & Clean Legend */}
      <div className="bg-white border border-[#E5E9E6] rounded-xl p-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Zone switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-[#66736F] mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Zone:
          </span>
          <button
            onClick={() => setSelectedZone('All')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedZone === 'All'
                ? 'bg-[#EDF3F2] text-[#477D78] font-semibold border border-[#D0DFDD]'
                : 'text-[#66736F] hover:bg-[#F5F6F4] border border-transparent'
            }`}
          >
            All Zones ({shelves.length})
          </button>
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
              {z} ({shelves.filter(s => s.zone === z).length})
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center flex-wrap gap-2.5 text-[11px] text-[#66736F]">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#CBD5E1]"></span>
            <span>Empty</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#6A9B96]"></span>
            <span>1-44%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#477D78]"></span>
            <span>45-84%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#B25E00]"></span>
            <span>85-100%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#C62828]"></span>
            <span>Overfilled</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#FFE7B3] border border-[#B25E00]"></span>
            <span>Maintenance</span>
          </div>
        </div>
      </div>

      {/* 2D WAREHOUSE FLOOR CANVAS */}
      <div className="bg-white border border-[#E5E9E6] rounded-2xl p-5 sm:p-6 shadow-xs">
        
        {/* Floor Facility Header */}
        <div className="flex items-center justify-between border-b border-[#E5E9E6] pb-3 mb-5 text-[11px] text-[#66736F]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-medium text-[#253746]">
              <Truck className="w-3.5 h-3.5 text-[#477D78]" /> INBOUND DOCK BAYS 1-4
            </span>
            <span>•</span>
            <span>CENTRAL AISLEWAY</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-medium text-[#253746]">
              <Zap className="w-3.5 h-3.5 text-[#B25E00]" /> CHARGING STATION
            </span>
            <span>•</span>
            <span>OUTBOUND STAGING</span>
          </div>
        </div>

        {/* Zones Layout */}
        {(selectedZone === 'All' ? zones : [selectedZone]).map((zoneName) => {
          const zoneShelves = shelves.filter(s => s.zone === zoneName);
          const maxRow = Math.max(...zoneShelves.map(s => s.row), 1);
          const maxCol = Math.max(...zoneShelves.map(s => s.column), 1);

          return (
            <div key={zoneName} className="mb-7 last:mb-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#477D78]"></div>
                  <h2 className="text-sm font-bold text-[#253746]">{zoneName}</h2>
                  <span className="text-xs text-[#66736F]">
                    ({maxRow} Rows × {maxCol} Columns Grid)
                  </span>
                </div>
                <div className="text-[11px] text-[#66736F]">
                  Click any shelf to inspect inventory
                </div>
              </div>

              {/* 2D Grid Cells */}
              <div 
                className="grid gap-2.5 sm:gap-3 p-3.5 rounded-xl bg-[#F5F6F4] border border-[#E5E9E6]"
                style={{
                  gridTemplateColumns: `repeat(${maxCol}, minmax(0, 1fr))`,
                }}
              >
                {zoneShelves.map((shelf) => {
                  const style = getShelfStyle(shelf);
                  const occupancy = shelf.occupancyPercentage || 0;

                  return (
                    <div
                      key={shelf._id}
                      onClick={() => setSelectedShelf(shelf)}
                      className={`relative p-3 rounded-lg border transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-sm ${style.cardBg}`}
                    >
                      {/* Top: Code & Badge */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-mono font-bold text-[#253746]">
                          {shelf.code}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium border ${style.badge}`}>
                          {style.label}
                        </span>
                      </div>

                      {/* Middle: Units & Progress Bar */}
                      <div className="my-1">
                        <div className="flex justify-between text-[11px] text-[#66736F] mb-1">
                          <span>{shelf.currentOccupancy}/{shelf.capacity}</span>
                          <span className="font-semibold text-[#253746]">{occupancy}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#E5E9E6] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${style.bar}`}
                            style={{ width: `${Math.min(occupancy, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Bottom Info: Coordinates & Item count */}
                      <div className="mt-1.5 pt-1.5 border-t border-[#E5E9E6]/60 flex items-center justify-between text-[10px] text-[#66736F]">
                        <span>R{shelf.row} : C{shelf.column}</span>
                        <span>{shelf.items?.length || 0} items</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Footer */}
        <div className="mt-6 pt-3 border-t border-[#E5E9E6] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#66736F] gap-2">
          <span>Digital Twin nodes are dynamically calculated from the warehouse inventory database.</span>
          <span className="font-medium text-[#477D78]">Connected & Active</span>
        </div>
      </div>

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

      {/* Stock In / Out Modal */}
      {stockModalConfig.isOpen && (
        <StockModal
          mode={stockModalConfig.mode}
          initialShelf={stockModalConfig.shelf}
          onClose={() => setStockModalConfig({ isOpen: false, mode: 'IN', shelf: null })}
          onSuccess={() => {
            fetchShelves();
            if (selectedShelf) {
              API.get(`/shelves/${selectedShelf._id}`).then(res => {
                setSelectedShelf(res.data.data);
              }).catch(() => {});
            }
          }}
        />
      )}

    </div>
  );
};

export default DigitalTwin;
