import { Outlet, Link, useLocation } from 'react-router-dom';
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
  MonitorSmartphone
} from 'lucide-react';

export default function AdminLayout() {
  const location = useLocation();
  
  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Repairs', href: '/admin/repairs', icon: Wrench },
    { name: 'Inventory', href: '/admin/inventory', icon: ShoppingCart },
    { name: 'Customers', href: '/admin/customers', icon: Users },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-slate-300 flex font-sans select-none">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0d0d0e] border-r border-white/5 flex flex-col fixed inset-y-0 z-10">
        <div className="h-20 flex items-center px-6 border-b border-white/5 gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">TB</div>
          <Link to="/" className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Tech Best <span className="text-blue-500 underline decoration-2 underline-offset-4 text-sm mt-1">ERP</span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-4 space-y-2">
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-4 px-2">System Core</div>
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || (item.href !== '/admin' && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-4 py-3 rounded-xl transition-colors ${
                    isActive 
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' 
                      : 'hover:bg-white/5 text-slate-300'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full mr-3 flex-shrink-0 ${isActive ? 'bg-blue-500' : 'bg-slate-600 group-hover:bg-slate-400'}`}></div>
                  <span className="text-sm">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-6 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 text-white font-bold">AD</div>
            <div>
              <div className="text-xs font-bold text-white">Admin User</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-tighter">Super Administrator</div>
            </div>
          </div>
          <button className="mt-4 flex items-center justify-center text-xs font-bold text-slate-400 hover:text-white w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 uppercase tracking-widest">
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col ml-64 min-h-screen">
        {/* Top Header */}
        <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between bg-[#0a0a0b] sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
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
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">System Time</div>
              <div className="text-sm font-mono text-white">{new Date().toISOString().split('T')[0]} | {new Date().toLocaleTimeString()}</div>
            </div>
            <Link to="/admin/repairs/new" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full text-xs font-bold transition-all shadow-lg shadow-blue-900/20 uppercase tracking-wider">
              + NEW REPAIR TICKET
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-8">
          <Outlet />
        </div>
        
        {/* Footer / Status Bar */}
        <footer className="h-10 bg-[#0d0d0e] border-t border-white/5 px-8 flex items-center justify-between text-[10px] uppercase tracking-widest text-slate-500">
          <div className="flex gap-6">
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div> Database Online</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div> Storefront Live</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]"></div> QR Engine Active</div>
          </div>
          <div className="font-bold flex gap-4">
            <Link to="/" className="hover:text-white transition-colors">View Storefront</Link>
            <span>Tech Best Ecosystem v1.0.0</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
