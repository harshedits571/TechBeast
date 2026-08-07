import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Wrench, MoreVertical, ArrowUpDown, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { TableBodySkeleton } from '../../components/ui/Skeleton';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'In Progress': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'Waiting for Parts': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    case 'Ready for Delivery': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    case 'Received': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    case 'Pending': return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
  }
};

export default function RepairsList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('received_desc');
  const [repairs, setRepairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRepairs = async () => {
      try {
        const q = query(collection(db, "repairs"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const repairsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRepairs(repairsData);
      } catch (error) {
        console.error("Error fetching repairs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRepairs();
  }, []);

  const filteredRepairs = repairs.filter(repair => {
    const matchesSearch = 
      repair.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair.deviceType?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'All' || repair.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const sortedRepairs = [...filteredRepairs].sort((a, b) => {
    if (sortOrder === 'expected_asc') {
      const dateA = a.deliveryDate ? new Date(a.deliveryDate).getTime() : Infinity;
      const dateB = b.deliveryDate ? new Date(b.deliveryDate).getTime() : Infinity;
      return dateA - dateB;
    }
    if (sortOrder === 'expected_desc') {
      const dateA = a.deliveryDate ? new Date(a.deliveryDate).getTime() : 0;
      const dateB = b.deliveryDate ? new Date(b.deliveryDate).getTime() : 0;
      return dateB - dateA;
    }
    if (sortOrder === 'received_asc') {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : Infinity;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : Infinity;
      return dateA - dateB;
    }
    // Default 'received_desc' (Firestore already provides this order, but let's ensure it)
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Repair Tickets</h1>
          <p className="text-sm text-slate-500 mt-1">Manage service requests and track repair progress.</p>
        </div>
        <Link to="/admin/repairs/new" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full text-xs font-bold transition-all shadow-lg shadow-blue-900/20 uppercase tracking-wider flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Ticket
        </Link>
      </div>

      <div className="bg-[#0d0d0e] rounded-3xl border border-white/10 flex flex-col overflow-hidden shadow-2xl">
        {/* Toolbar */}
        <div className="p-6 border-b border-white/5 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-500" />
            </div>
            <input
              type="text"
              placeholder="Search by ticket #, customer name, device..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-500 text-white placeholder-slate-500"
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-full text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white transition-colors uppercase tracking-widest relative">
            <Filter className="h-4 w-4" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-transparent outline-none cursor-pointer text-white pl-1 pr-4"
            >
              <option value="All" className="bg-[#0d0d0e]">All Statuses</option>
              <option value="Pending" className="bg-[#0d0d0e]">Pending</option>
              <option value="Diagnosing" className="bg-[#0d0d0e]">Diagnosing</option>
              <option value="Waiting for Parts" className="bg-[#0d0d0e]">Waiting for Parts</option>
              <option value="Waiting for Approval" className="bg-[#0d0d0e]">Waiting for Approval</option>
              <option value="In Progress" className="bg-[#0d0d0e]">In Progress</option>
              <option value="Quality Check" className="bg-[#0d0d0e]">Quality Check</option>
              <option value="Ready for Delivery" className="bg-[#0d0d0e]">Ready for Delivery</option>
              <option value="Completed" className="bg-[#0d0d0e]">Completed</option>
            </select>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-full text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white transition-colors uppercase tracking-widest relative">
            <ArrowUpDown className="h-4 w-4" />
            <select 
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="appearance-none bg-transparent outline-none cursor-pointer text-white pl-1 pr-4"
            >
              <option value="received_desc" className="bg-[#0d0d0e]">Newest Received</option>
              <option value="received_asc" className="bg-[#0d0d0e]">Oldest Received</option>
              <option value="expected_asc" className="bg-[#0d0d0e]">Earliest Expected (Due Soon)</option>
              <option value="expected_desc" className="bg-[#0d0d0e]">Latest Expected</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-left text-[10px] text-slate-500 uppercase tracking-tighter border-b border-white/5">
                <th className="px-6 py-4">Ticket ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Device & Issue</th>
                <th className="px-6 py-4">Dates</th>
                <th className="px-6 py-4">Est. Cost</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <TableBodySkeleton columns={7} rows={5} />
              ) : filteredRepairs.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-4 text-center text-slate-500">No repair tickets found.</td></tr>
              ) : (
                sortedRepairs.map((ticket) => (
                  <tr key={ticket.id} onClick={() => navigate(`/admin/repairs/${ticket.id}`)} className="border-t border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-xs text-blue-400">REP-{ticket.id.slice(0,4).toUpperCase()}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-slate-200">{ticket.customerName}</div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="text-sm font-bold text-slate-200 truncate">{ticket.deviceType} {ticket.brand}</div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">{ticket.issue}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5" title="Date Received">
                          <span className="text-[10px] uppercase font-bold text-slate-500 w-12">Recv:</span>
                          <span className="text-slate-300">{ticket.createdAt ? format(new Date(ticket.createdAt), 'MMM d, yyyy') : 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Expected Delivery">
                          <span className="text-[10px] uppercase font-bold text-slate-500 w-12">Exp:</span>
                          <span className={`${ticket.deliveryDate && new Date(ticket.deliveryDate) < new Date() && ticket.status !== 'Completed' && ticket.status !== 'Ready for Delivery' ? 'text-red-400 font-bold' : 'text-amber-400 font-bold'}`}>
                            {ticket.deliveryDate ? format(parseISO(ticket.deliveryDate), 'MMM d, yyyy') : 'Not set'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-bold">
                      ₹{Number(ticket.estimatedCost || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-[10px] font-bold rounded-md border ${getStatusColor(ticket.status || 'Pending')}`}>
                        {(ticket.status || 'Pending').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-slate-500 hover:text-white transition-colors p-1">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
