import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, Filter, Users, Download, Mail, Phone, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { db } from '../../lib/firebase';
import { collection, getDocs, addDoc, query, orderBy, limit, startAfter } from 'firebase/firestore';
import { exportToCsv } from '../../utils/exportCsv';

export default function CustomerList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    address: ''
  });

  // Pagination state
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(0);
  const [cursors, setCursors] = useState<any[]>([null]);
  const [hasNextPage, setHasNextPage] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, [pageSize, currentPage]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      let q;
      const currentCursor = cursors[currentPage];
      
      if (currentCursor) {
        q = query(collection(db, "customers"), orderBy("createdAt", "desc"), startAfter(currentCursor), limit(pageSize));
      } else {
        q = query(collection(db, "customers"), orderBy("createdAt", "desc"), limit(pageSize));
      }

      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      }));
      setCustomers(data);
      setHasNextPage(querySnapshot.docs.length === pageSize);
      
      if (querySnapshot.docs.length > 0) {
        const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
        setCursors(prev => {
          const newCursors = [...prev];
          newCursors[currentPage + 1] = lastDoc;
          return newCursors;
        });
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) {
      alert("Name and Phone are required.");
      return;
    }
    try {
      const docRef = await addDoc(collection(db, 'customers'), {
        ...newCustomer,
        totalSpent: 0,
        ordersCount: 0,
        createdAt: new Date().toISOString()
      });
      setCustomers([{ id: docRef.id, ...newCustomer, totalSpent: 0, ordersCount: 0, createdAt: new Date().toISOString() }, ...customers]);
      setIsAddModalOpen(false);
      setNewCustomer({ name: '', email: '', phone: '', city: '', address: '' });
    } catch (error) {
      console.error("Error adding customer:", error);
      alert("Failed to add customer. Did you deploy firestore rules?");
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <Users className="h-6 w-6 text-blue-500" />
            Customers
          </h1>
          <div className="flex items-center gap-6 mt-3 text-sm font-bold">
            <span className="text-white border-b-2 border-blue-500 pb-1">All ({customers.length})</span>
            <span className="text-slate-500 hover:text-white cursor-pointer transition-colors">New (0)</span>
            <span className="text-slate-500 hover:text-white cursor-pointer transition-colors">VIP (0)</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => exportToCsv('customers.csv', customers)} className="px-5 py-2 text-xs font-bold text-slate-300 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all uppercase tracking-wider flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </button>
          <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full text-xs font-bold transition-all shadow-lg shadow-blue-900/20 uppercase tracking-wider flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Customer
          </button>
        </div>
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
              placeholder="Search customers by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-500 text-white placeholder-slate-500"
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-full text-xs font-bold text-slate-300 hover:bg-white/5 cursor-pointer transition-colors">
            Country <Filter className="h-3 w-3 ml-1" />
          </div>
          <div className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-full text-xs font-bold text-slate-300 hover:bg-white/5 cursor-pointer transition-colors">
            More filters
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-left text-[10px] text-slate-500 uppercase tracking-tighter border-b border-white/5">
                <th className="px-6 py-4 w-10"></th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Email & Phone</th>
                <th className="px-6 py-4 text-center">Orders</th>
                <th className="px-6 py-4 text-right">Total Spent</th>
                <th className="px-6 py-4">City</th>
                <th className="px-6 py-4 text-right">Last Seen</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-4 text-center text-slate-500">Loading customers...</td></tr>
              ) : filteredCustomers.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-4 text-center text-slate-500">No customers found.</td></tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} onClick={() => navigate(`/admin/customers/${customer.id}`)} className="border-t border-white/5 hover:bg-white/5 transition-colors cursor-pointer group">
                    <td className="px-6 py-4 text-slate-600 group-hover:text-slate-400">
                      <div className="w-4 h-4 rounded border border-current"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs uppercase border border-blue-500/30">
                          {customer.name?.substring(0,2)}
                        </div>
                        <div className="font-bold text-slate-200">{customer.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Mail className="h-3 w-3 text-slate-500" />
                          {customer.email || 'N/A'}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Phone className="h-3 w-3 text-slate-500" />
                          {customer.phone || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-slate-300 font-mono">
                      {customer.ordersCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-emerald-400 font-bold">
                      ₹{Number(customer.totalSpent || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                      {customer.city || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs text-slate-500">
                      {customer.createdAt ? format(new Date(customer.createdAt), 'MMM d, yyyy') : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-6 border-t border-white/5 flex items-center justify-between text-xs text-slate-500 uppercase tracking-widest font-bold">
          <div className="flex items-center gap-4">
            <span className="whitespace-nowrap">Rows per page:</span>
            <select 
              value={pageSize} 
              onChange={(e) => { 
                setPageSize(Number(e.target.value)); 
                setCurrentPage(0); 
                setCursors([null]); 
              }} 
              className="bg-[#1a1a1c] border border-white/10 rounded-md py-1 px-2 text-white outline-none cursor-pointer"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={75}>75</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div className="flex gap-2 items-center">
            <span className="mr-4">Page {currentPage + 1}</span>
            <button 
              onClick={() => setCurrentPage(p => p - 1)}
              disabled={currentPage === 0 || loading}
              className="px-4 py-2 border border-white/10 rounded-full hover:bg-white/5 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button 
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={!hasNextPage || loading}
              className="px-4 py-2 border border-white/10 rounded-full hover:bg-white/5 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#141415] border border-white/10 rounded-3xl p-6 w-full max-w-lg shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6">Add New Customer</h2>
            
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Full Name *</label>
                  <input required type="text" value={newCustomer.name} onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500" placeholder="e.g. Carry Anna" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Phone Number *</label>
                  <input required type="tel" value={newCustomer.phone} onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500" placeholder="+91..." />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Email Address</label>
                  <input type="email" value={newCustomer.email} onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500" placeholder="carry@example.com" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">City</label>
                  <input type="text" value={newCustomer.city} onChange={(e) => setNewCustomer({...newCustomer, city: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500" placeholder="e.g. Mumbai" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Full Address</label>
                  <textarea value={newCustomer.address} onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})} rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none" placeholder="123 Street Name..."></textarea>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2 text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider">
                  Cancel
                </button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider">
                  Add Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
