import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import { 
  Boxes, 
  LayoutDashboard, 
  Layers, 
  Package, 
  Wrench, 
  Bell, 
  FileText, 
  LogOut, 
  Menu, 
  X,
  ShieldCheck
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);

  useEffect(() => {
    const fetchAlertCount = async () => {
      try {
        const res = await API.get('/alerts?status=Active');
        if (res.data?.counts?.active !== undefined) {
          setActiveAlertsCount(res.data.counts.active);
        }
      } catch (err) {
        // silent fail on polling
      }
    };

    fetchAlertCount();
    const interval = setInterval(fetchAlertCount, 15000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Digital Twin', path: '/digital-twin', icon: Layers },
    { name: 'Inventory', path: '/inventory', icon: Package },
    { name: 'Shelves', path: '/shelves', icon: Boxes },
    { name: 'Equipment', path: '/equipment', icon: Wrench },
    { name: 'Alerts', path: '/alerts', icon: Bell, badge: activeAlertsCount },
    { name: 'Reports', path: '/reports', icon: FileText },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-[#E5E9E6] sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & System Status */}
          <div className="flex items-center space-x-3.5">
            <Link to="/dashboard" className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#477D78] flex items-center justify-center text-white shadow-xs">
                <Boxes className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-[#253746]">
                  Twin<span className="text-[#477D78]">Ware</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider text-[#66736F] block -mt-1 font-medium">
                  Warehouse Twin
                </span>
              </div>
            </Link>

            <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#EBF5EC] border border-[#CBE6CE] text-[11px] text-[#2E7D32] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32]"></span>
              Live Sync
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors relative ${
                    active
                      ? 'bg-[#EDF3F2] text-[#477D78] font-semibold border border-[#D0DFDD]'
                      : 'text-[#66736F] hover:text-[#253746] hover:bg-[#F5F6F4] border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#477D78]' : 'text-[#66736F]'}`} />
                  <span>{link.name}</span>

                  {link.badge > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#FDEEEF] text-[#C62828] border border-[#F9D2D4]">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* User Profile & Actions */}
          <div className="hidden md:flex items-center space-x-3">
            <div className="flex items-center space-x-2 pl-3 border-l border-[#E5E9E6]">
              <div className="w-7 h-7 rounded-full bg-[#EDF3F2] text-[#477D78] border border-[#D0DFDD] flex items-center justify-center text-xs font-bold uppercase">
                {user?.username ? user.username.slice(0, 2) : 'TW'}
              </div>
              <div className="text-left text-xs">
                <div className="font-semibold text-[#253746] leading-tight">{user?.username}</div>
                <div className="text-[10px] text-[#66736F] capitalize">
                  {user?.role || 'Operator'}
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-[#66736F] hover:text-[#C62828] hover:bg-[#FDEEEF] transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden items-center space-x-2">
            {activeAlertsCount > 0 && (
              <Link to="/alerts" className="p-1.5 text-[#C62828] relative">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#C62828]"></span>
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg text-[#66736F] hover:text-[#253746] hover:bg-[#F5F6F4]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#E5E9E6] px-4 pt-2 pb-4 space-y-1">
          <div className="py-2 mb-2 border-b border-[#E5E9E6] flex items-center justify-between text-xs text-[#66736F]">
            <div>User: <span className="font-semibold text-[#253746]">{user?.username}</span> ({user?.role})</div>
            <button onClick={logout} className="text-[#C62828] hover:underline flex items-center gap-1 font-medium">
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>

          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium ${
                  active 
                    ? 'bg-[#EDF3F2] text-[#477D78] font-semibold border border-[#D0DFDD]' 
                    : 'text-[#66736F] hover:bg-[#F5F6F4] hover:text-[#253746]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </div>
                {link.badge > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#FDEEEF] text-[#C62828]">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
