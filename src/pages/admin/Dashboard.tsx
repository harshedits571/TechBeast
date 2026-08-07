import { useState, useEffect } from 'react';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import { 
  DollarSign, 
  ShoppingBag, 
  Wrench, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight,
  MonitorSmartphone,
  Cpu,
  Keyboard,
  HardDrive
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

export default function AdminDashboard() {
  const [repairs, setRepairs] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch Repairs
        const repairsSnap = await getDocs(query(collection(db, 'repairs'), orderBy('createdAt', 'desc')));
        const repairsData = repairsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRepairs(repairsData);

        // Fetch Inventory
        const invSnap = await getDocs(collection(db, 'inventory'));
        const invData = invSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setInventory(invData);

        // Fetch Orders for charts
        const ordersSnap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
        const ordersData = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setOrders(ordersData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Calculate Metrics
  const activeRepairs = repairs.filter(r => r.status !== 'Completed');
  const urgentRepairs = activeRepairs.filter(r => r.priority === 'High').length;
  
  const completedRepairs = repairs.filter(r => r.status === 'Completed');
  const totalRevenue = completedRepairs.reduce((sum, r) => sum + (Number(r.estimatedCost) || 0), 0);

  const lowStockItems = inventory.filter(i => Number(i.quantity) <= 5);
  const totalInventoryValue = inventory.reduce((sum, i) => sum + (Number(i.quantity || 0) * Number(i.costPrice || 0)), 0);

  // Generate chart data for the last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const revenueData = last7Days.map(date => {
    const dateStr = date.toDateString();
    const dayOrders = orders.filter(o => {
      if (!o.createdAt) return false;
      const oDate = new Date(o.createdAt);
      return oDate.toDateString() === dateStr && (o.paymentStatus === 'PAID' || o.paymentStatus === 'COMPLETE');
    });
    const total = dayOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    return {
      name: date.toLocaleDateString('en-US', { weekday: 'short' }),
      total: total
    };
  });

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      
      {/* KPI STATS */}
      <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-auto lg:h-28">
        <div className="bg-white/5 rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Service Revenue</span>
          <div className="flex items-end gap-2 mt-4 lg:mt-0">
            <span className="text-2xl font-bold text-white">₹{totalRevenue.toLocaleString('en-IN')}</span>
          </div>
        </div>
        <div className="bg-white/5 rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active Repairs</span>
          <div className="flex items-end gap-2 mt-4 lg:mt-0">
            <span className="text-2xl font-bold text-white">{activeRepairs.length}</span>
            {urgentRepairs > 0 && <span className="text-[10px] text-red-400 font-bold mb-1">{urgentRepairs} Urgent</span>}
          </div>
        </div>
        <div className="bg-white/5 rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Low Stock Alerts</span>
          <div className="flex items-end gap-2 mt-4 lg:mt-0">
            <span className="text-2xl font-bold text-white">{lowStockItems.length}</span>
            {lowStockItems.length > 0 && <span className="text-[10px] text-amber-400 font-bold mb-1">Review Needed</span>}
          </div>
        </div>
        <div className="bg-white/5 rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Inventory Cost</span>
          <div className="flex items-end gap-2 mt-4 lg:mt-0">
            <span className="text-2xl font-bold text-white">₹{totalInventoryValue.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* REPAIR MANAGEMENT HUB & CHARTS */}
      <div className="col-span-12 lg:col-span-8 space-y-6">
        <div className="bg-[#0d0d0e] rounded-3xl border border-white/10 flex flex-col overflow-hidden shadow-2xl">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> 
              Active Repair Queue
            </h3>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[10px] text-slate-500 uppercase tracking-tighter">
                  <th className="px-6 py-4">Ticket ID</th>
                  <th className="px-6 py-4">Client & Device</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Estimated</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {activeRepairs.slice(0, 5).map(repair => (
                  <tr key={repair.id} className="border-t border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
                    <td className="px-6 py-4 font-mono text-xs text-blue-400">#{repair.id.slice(0, 6)}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-200">{repair.customerName}</div>
                      <div className="text-[11px] text-slate-500">{repair.brand} {repair.model}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-[10px] font-bold rounded-md border 
                        ${repair.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                          repair.status === 'Waiting for Parts' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                          'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                        {repair.status || 'Received'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-300">₹{Number(repair.estimatedCost || 0).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
                {activeRepairs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-slate-500 text-xs">No active repairs found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Charts */}
        <div className="bg-[#141415] rounded-3xl border border-white/10 p-6 flex flex-col shadow-xl">
          <h3 className="text-sm font-bold text-white mb-6">Store Sales (Last 7 Days)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0d0d0e', borderRadius: '8px', border: '1px solid #ffffff10', color: '#fff' }}
                  itemStyle={{ color: '#3b82f6' }}
                  formatter={(value: number) => [`$${value}`, 'Activity']}
                />
                <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* INVENTORY / STOREFRONT PULSE */}
      <div className="col-span-12 lg:col-span-4 space-y-6 flex flex-col">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl flex flex-col justify-between h-[180px]">
          <div className="flex justify-between items-start">
            <div className="text-[10px] uppercase font-bold tracking-widest opacity-80">Store Pulse</div>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs">★</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{repairs.length}</div>
            <div className="text-xs opacity-80 mt-1">Total Repairs Logged</div>
          </div>
          <div className="flex gap-2">
            <div className="h-1.5 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div className="h-full bg-white w-3/4"></div>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-[#141415] rounded-3xl border border-white/10 p-6 flex flex-col shadow-xl">
          <h3 className="text-sm font-bold text-white mb-4">Inventory Alerts</h3>
          <div className="space-y-4">
            {lowStockItems.slice(0, 5).map(item => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center">
                    <HardDrive className="h-5 w-5 text-slate-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">{item.name}</div>
                    <div className="text-[10px] text-slate-500 tracking-tight">SKU: {item.sku || 'N/A'}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-white">{item.quantity} Units</div>
                  <div className={`text-[10px] ${Number(item.quantity) === 0 ? 'text-red-400' : 'text-amber-500'}`}>
                    {Number(item.quantity) === 0 ? 'Out of Stock' : 'Low Stock'}
                  </div>
                </div>
              </div>
            ))}
            {lowStockItems.length === 0 && (
              <div className="text-xs text-slate-500 text-center py-4">All inventory levels are healthy!</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
