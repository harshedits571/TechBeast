import { Outlet, Link, useLocation } from 'react-router-dom';
import { SettingsProvider } from '../../contexts/SettingsContext';
import { AdminProvider } from '../../contexts/AdminContext';
import {
  LayoutDashboard,
  Package,
  Wrench,
  Users,
  ShoppingCart,
  Settings,
  LogOut,
  Bell,
  Search,
  MonitorSmartphone,
  ClipboardList,
  ShoppingBag,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminLayout() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Offline POS', href: '/admin/offline-sale', icon: ShoppingBag },
    { name: 'Orders', href: '/admin/orders', icon: ClipboardList },
    { name: 'All Products', href: '/admin/products', icon: Package },
    { name: 'Prebuilt PCs', href: '/admin/prebuilt-pcs', icon: MonitorSmartphone },
    { name: 'Custom PCs', href: '/admin/custom-pc-requests', icon: Package },
    { name: 'Repairs', href: '/admin/repairs', icon: Wrench },
    { name: 'Inventory', href: '/admin/inventory', icon: ShoppingCart },
    { name: 'Customers', href: '/admin/customers', icon: Users },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <AdminProvider>
      <SettingsProvider>
        <div className="min-h-[100dvh] bg-[#0a0a0b] text-slate-300 flex font-sans">
          {/* Mobile Overlay */}
          {isMobileMenuOpen && (
            <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
          )}

          {/* Sidebar */}
          <aside className={`w-64 bg-[#0d0d0e] border-r border-white/5 flex flex-col fixed inset-y-0 z-50 print:hidden transition-transform duration-300 lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="h-16 lg:h-20 flex items-center justify-between px-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <Link to="/" className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <img src="/logo2.jpeg" alt="Logo" className="h-8 object-contain rounded" />
                  Tech Beast
                </Link>
              </div>
              <button className="lg:hidden text-slate-400" onClick={() => setIsMobileMenuOpen(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
              <nav className="px-4 space-y-2">
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-4 px-2">System Core</div>
                {navigation.map((item) => {
                  let isActive = false;
                  if (item.href.includes('?')) {
                    isActive = location.pathname + location.search === item.href;
                  } else {
                    isActive = location.pathname === item.href || (item.href !== '/admin' && location.pathname.startsWith(item.href));
                  }
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`group flex items-center px-4 py-3 rounded-xl transition-colors ${isActive
                          ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                          : 'hover:bg-white/5 text-slate-300'
                        }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className={`w-2 h-2 rounded-full mr-3 flex-shrink-0 ${isActive ? 'bg-blue-500' : 'bg-slate-600 group-hover:bg-slate-400'}`}></div>
                      <span className="text-sm">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="p-6 border-t border-white/5">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 text-white font-bold shrink-0">
                  {user?.email ? user.email.charAt(0).toUpperCase() : 'AD'}
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-white truncate" title={user?.email || 'Admin User'}>
                    {user?.email || 'Admin User'}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-tighter truncate">Super Administrator</div>
                </div>
              </div>
              <button 
                onClick={logout}
                className="mt-4 flex items-center justify-center text-xs font-bold text-slate-400 hover:text-white w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 uppercase tracking-widest"
              >
                Sign Out
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 flex flex-col lg:ml-64 print:ml-0 min-h-[100dvh] w-full">
            {/* Top Header */}
            <header className="h-16 lg:h-20 border-b border-white/5 px-4 lg:px-8 flex items-center justify-between bg-[#0a0a0b] sticky top-0 z-30 print:hidden">
              <div className="flex items-center gap-2 lg:gap-4">
                <button className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white" onClick={() => setIsMobileMenuOpen(true)}>
                  <Menu className="w-6 h-6" />
                </button>
                <div className="relative hidden sm:block">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <div className="w-4 h-4 rounded-full border-2 border-slate-600"></div>
                  </div>
                  <input
                    type="text"
                    placeholder="Search Repairs, Products, Invoices..."
                    className="bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm w-80 focus:outline-none focus:ring-1 focus:ring-blue-500 text-white placeholder-slate-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 lg:gap-6">
                <div className="text-right hidden sm:block">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">System Time</div>
                  <div className="text-sm font-mono text-white">{new Date().toISOString().split('T')[0]} | {new Date().toLocaleTimeString()}</div>
                </div>
                <Link to="/admin/repairs/new" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full text-xs font-bold transition-all shadow-lg shadow-blue-900/20 uppercase tracking-wider">
                  + NEW REPAIR TICKET
                </Link>
              </div>
            </header>

            {/* Page Content */}
            <div className="flex-1 p-4 md:p-6 lg:p-8">
              <Outlet />
            </div>

            {/* Footer / Status Bar */}
            <footer className="bg-[#0d0d0e] border-t border-white/5 px-4 md:px-6 lg:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] uppercase tracking-widest text-slate-500 print:hidden">
              <div className="flex flex-wrap justify-center gap-4 md:gap-6">
                <div className="flex items-center gap-2 whitespace-nowrap"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] shrink-0"></div> Database Online</div>
                <div className="flex items-center gap-2 whitespace-nowrap"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] shrink-0"></div> Storefront Live</div>
                <div className="flex items-center gap-2 whitespace-nowrap"><div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6] shrink-0"></div> QR Engine Active</div>
              </div>
              <div className="font-bold flex flex-wrap justify-center gap-4 text-center">
                <Link to="/" className="hover:text-white transition-colors whitespace-nowrap">View Storefront</Link>
                <span className="whitespace-nowrap">Tech Beast Ecosystem v1.0.0</span>
              </div>
            </footer>
          </main>
        </div>
      </SettingsProvider>
    </AdminProvider>
  );
}
