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

const revenueData = [
  { name: 'Mon', total: 1200 },
  { name: 'Tue', total: 2100 },
  { name: 'Wed', total: 1800 },
  { name: 'Thu', total: 2400 },
  { name: 'Fri', total: 3200 },
  { name: 'Sat', total: 4100 },
  { name: 'Sun', total: 2800 },
];

const repairsData = [
  { name: 'Laptops', count: 45 },
  { name: 'Desktops', count: 20 },
  { name: 'Accessories', count: 12 },
];

export default function AdminDashboard() {
  return (
    <div className="grid grid-cols-12 gap-6">
      
      {/* KPI STATS */}
      <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-auto lg:h-28">
        <div className="bg-white/5 rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Daily Revenue</span>
          <div className="flex items-end gap-2 mt-4 lg:mt-0">
            <span className="text-2xl font-bold text-white">$12,450.00</span>
            <span className="text-[10px] text-emerald-400 font-bold mb-1">+14%</span>
          </div>
        </div>
        <div className="bg-white/5 rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active Repairs</span>
          <div className="flex items-end gap-2 mt-4 lg:mt-0">
            <span className="text-2xl font-bold text-white">48</span>
            <span className="text-[10px] text-blue-400 font-bold mb-1">12 Urgent</span>
          </div>
        </div>
        <div className="bg-white/5 rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Low Stock Alerts</span>
          <div className="flex items-end gap-2 mt-4 lg:mt-0">
            <span className="text-2xl font-bold text-white">15</span>
            <span className="text-[10px] text-amber-400 font-bold mb-1">Review Needed</span>
          </div>
        </div>
        <div className="bg-white/5 rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Inventory Value</span>
          <div className="flex items-end gap-2 mt-4 lg:mt-0">
            <span className="text-2xl font-bold text-white">$482.9k</span>
            <span className="text-[10px] text-slate-500 font-bold mb-1">Last Synced 2m ago</span>
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
            <span className="text-[10px] text-slate-500 uppercase tracking-widest cursor-pointer hover:text-white transition-colors">View Full Board</span>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[10px] text-slate-500 uppercase tracking-tighter">
                  <th className="px-6 py-4">Ticket ID</th>
                  <th className="px-6 py-4">Client & Device</th>
                  <th className="px-6 py-4">Assigned Engineer</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Estimated</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-t border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
                  <td className="px-6 py-4 font-mono text-xs text-blue-400">#TB-9401</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-200">Johnathan Doe</div>
                    <div className="text-[11px] text-slate-500">MacBook Pro M2 - Logic Board Repair</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center text-[10px] text-white">SK</div>
                      <span className="text-xs text-slate-300">S. Kumar</span>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-bold rounded-md border border-amber-500/20">UNDER DIAGNOSIS</span></td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-300">$340.00</td>
                </tr>
                <tr className="border-t border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
                  <td className="px-6 py-4 font-mono text-xs text-blue-400">#TB-9382</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-200">Alice Walker</div>
                    <div className="text-[11px] text-slate-500">Custom Build PC - RTX 4090 Install</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center text-[10px] text-white">MJ</div>
                      <span className="text-xs text-slate-300">M. Jackson</span>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-500/10 text-blue-500 text-[10px] font-bold rounded-md border border-blue-500/20">WAITING FOR PARTS</span></td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-300">$2,100.00</td>
                </tr>
                <tr className="border-t border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
                  <td className="px-6 py-4 font-mono text-xs text-blue-400">#TB-9355</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-200">TechCorp Solutions</div>
                    <div className="text-[11px] text-slate-500">Dell XPS 15 - Keyboard Replacement</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center text-[10px] text-white">SK</div>
                      <span className="text-xs text-slate-300">S. Kumar</span>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded-md border border-emerald-500/20">READY FOR DELIVERY</span></td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-300">$185.00</td>
                </tr>
                <tr className="border-t border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
                  <td className="px-6 py-4 font-mono text-xs text-blue-400">#TB-9310</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-200">Mark Robinson</div>
                    <div className="text-[11px] text-slate-500">SSD Upgrade - 2TB NVMe Samsung</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center text-[10px] text-white">MJ</div>
                      <span className="text-xs text-slate-300">M. Jackson</span>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-500/10 text-slate-500 text-[10px] font-bold rounded-md border border-slate-500/20">COMPLETED</span></td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-300">$220.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Charts */}
        <div className="bg-[#141415] rounded-3xl border border-white/10 p-6 flex flex-col shadow-xl">
          <h3 className="text-sm font-bold text-white mb-6">Revenue Overview</h3>
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
                  formatter={(value: number) => [`$${value}`, 'Revenue']}
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
            <div className="text-[10px] uppercase font-bold tracking-widest opacity-80">Top Selling Category</div>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs">★</div>
          </div>
          <div>
            <div className="text-3xl font-bold">Premium Used Laptops</div>
            <div className="text-xs opacity-80 mt-1">24 units sold this week. Grade A focus.</div>
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center">
                  <HardDrive className="h-5 w-5 text-slate-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">Samsung 980 Pro 2TB</div>
                  <div className="text-[10px] text-slate-500 tracking-tight">SKU: SAM-980-2T</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-white">8 Units</div>
                <div className="text-[10px] text-emerald-400">Healthy</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center">
                  <Wrench className="h-5 w-5 text-slate-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">Thermal Grizzly Paste</div>
                  <div className="text-[10px] text-slate-500 tracking-tight">SKU: TG-KRYO-1G</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-white">2 Units</div>
                <div className="text-[10px] text-amber-500">Low Stock</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center">
                  <Cpu className="h-5 w-5 text-slate-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">DDR5 RAM 32GB Kit</div>
                  <div className="text-[10px] text-slate-500 tracking-tight">SKU: CRU-DDR5-32</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-white">0 Units</div>
                <div className="text-[10px] text-red-400">Out of Stock</div>
              </div>
            </div>
          </div>
          <button className="mt-6 w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-slate-300 transition-all border border-white/5 uppercase tracking-widest">
            Purchase Stock
          </button>
        </div>
      </div>
    </div>
  );
}
