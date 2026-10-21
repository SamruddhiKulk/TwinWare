import React from 'react';
import { 
  X, 
  Package, 
  ArrowDownLeft, 
  ArrowUpRight, 
  AlertTriangle, 
  MapPin,
  Tag
} from 'lucide-react';

const ShelfModal = ({ shelf, onClose, onStockIn, onStockOut, canMoveStock = true }) => {
  if (!shelf) return null;

  const occupancy = shelf.occupancyPercentage || 0;
  const isOver = shelf.currentOccupancy > shelf.capacity;

  const getStatusColor = () => {
    if (shelf.status === 'Maintenance') return 'text-[#B25E00] bg-[#FFF8E6] border-[#FFE7B3]';
    if (isOver) return 'text-[#C62828] bg-[#FDEEEF] border-[#F9D2D4]';
    if (occupancy >= 85) return 'text-[#B25E00] bg-[#FFF8E6] border-[#FFE7B3]';
    if (occupancy >= 40) return 'text-[#477D78] bg-[#EDF3F2] border-[#D0DFDD]';
    return 'text-[#2E7D32] bg-[#EBF5EC] border-[#CBE6CE]';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-[#E5E9E6] rounded-xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-[#E5E9E6] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#EDF3F2] border border-[#D0DFDD] flex items-center justify-center text-[#477D78] font-bold text-sm">
              {shelf.code}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#253746]">Shelf {shelf.code}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${getStatusColor()}`}>
                  {shelf.status === 'Maintenance' ? 'Maintenance' : `${occupancy}% Utilized`}
                </span>
              </div>
              <p className="text-xs text-[#66736F] flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3 h-3 text-[#66736F]" />
                <span>{shelf.zone}</span>
                <span>•</span>
                <span>Row {shelf.row}, Column {shelf.column}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#66736F] hover:text-[#253746] hover:bg-[#F5F6F4] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Capacity Progress Bar */}
          <div className="p-3.5 rounded-lg bg-[#F5F6F4] border border-[#E5E9E6]">
            <div className="flex justify-between items-center text-xs text-[#66736F] mb-1.5">
              <span className="font-medium">Space Capacity</span>
              <span className="font-semibold text-[#253746]">
                {shelf.currentOccupancy} / {shelf.capacity} units
              </span>
            </div>
            <div className="w-full h-2 bg-[#E5E9E6] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  isOver 
                    ? 'bg-[#C62828]' 
                    : occupancy >= 85 
                    ? 'bg-[#B25E00]' 
                    : 'bg-[#477D78]'
                }`}
                style={{ width: `${Math.min(occupancy, 100)}%` }}
              />
            </div>
            {isOver && (
              <div className="mt-2 text-xs text-[#C62828] flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Over capacity limit by {shelf.currentOccupancy - shelf.capacity} units</span>
              </div>
            )}
          </div>

          {/* Stored Inventory Items */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#66736F] mb-2.5 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-[#477D78]" />
              Stored Products ({shelf.items?.length || 0})
            </h4>

            {(!shelf.items || shelf.items.length === 0) ? (
              <div className="text-center py-6 px-4 rounded-lg border border-dashed border-[#E5E9E6] bg-white">
                <Package className="w-6 h-6 text-[#66736F] mx-auto mb-1.5 opacity-60" />
                <p className="text-xs font-medium text-[#253746]">Shelf is currently empty</p>
                <p className="text-[11px] text-[#66736F] mt-0.5">
                  Available to receive inventory packages.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {shelf.items.map((item, idx) => {
                  const prod = item.product || {};
                  return (
                    <div
                      key={item._id || idx}
                      className="p-3 rounded-lg bg-white border border-[#E5E9E6] flex items-center justify-between hover:border-[#D0DFDD] transition-colors"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-medium text-[#477D78] bg-[#EDF3F2] px-1.5 py-0.2 rounded border border-[#D0DFDD]">
                            {prod.sku || 'N/A'}
                          </span>
                          <span className="text-xs font-semibold text-[#253746] truncate">
                            {prod.name || 'Unnamed Product'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-[#66736F]">
                          <span>{prod.category || 'General'}</span>
                          {item.batchNumber && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Tag className="w-2.5 h-2.5 opacity-70" /> {item.batchNumber}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="text-xs font-bold text-[#253746]">
                          {item.quantity} <span className="text-[11px] font-normal text-[#66736F]">{prod.unit || 'Units'}</span>
                        </div>
                        {prod.price && (
                          <div className="text-[10px] text-[#2E7D32] font-medium">
                            ≈ ${(item.quantity * prod.price).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer / Actions */}
        <div className="px-5 py-3 border-t border-[#E5E9E6] bg-[#F5F6F4] flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-[#66736F] hover:text-[#253746] hover:bg-[#E5E9E6] transition-colors"
          >
            Close
          </button>
          
          {canMoveStock && <div className="flex items-center gap-2">
            {shelf.currentOccupancy > 0 && (
              <button
                onClick={() => {
                  onClose();
                  onStockOut(shelf);
                }}
                className="px-3 py-1.5 rounded-lg bg-white border border-[#E5E9E6] hover:border-[#F9D2D4] hover:bg-[#FDEEEF] text-[#C62828] text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                Stock Out
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                onStockIn(shelf);
              }}
              className="px-3 py-1.5 rounded-lg bg-[#477D78] hover:bg-[#3A6662] text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              Stock In Here
            </button>
          </div>}
        </div>

      </div>
    </div>
  );
};

export default ShelfModal;
