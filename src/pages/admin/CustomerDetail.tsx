import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Map, Calendar, ShoppingCart, Wrench, CheckCircle2, Clock, Trash2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { db } from '../../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';
import InvoiceModal from '../../components/admin/InvoiceModal';
import { FormSkeleton } from '../../components/ui/Skeleton';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<any>(null);
  const [repairs, setRepairs] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchCustomerData(id);
    }
  }, [id]);

  const fetchCustomerData = async (customerId: string) => {
    setLoading(true);
    try {
      // 1. Fetch Customer
      const docRef = doc(db, 'customers', customerId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const custData = { id: docSnap.id, ...docSnap.data() } as any;
        setCustomer(custData);
        
        // 2. Fetch Repairs associated with this customer by Phone or Email
        // If they have phone, search by phone
        if (custData.phone) {
          const repairsQuery = query(collection(db, 'repairs'), where('customerPhone', '==', custData.phone));
          const repairsSnap = await getDocs(repairsQuery);
          setRepairs(repairsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } else if (custData.email) {
          const repairsQuery = query(collection(db, 'repairs'), where('customerEmail', '==', custData.email));
          const repairsSnap = await getDocs(repairsQuery);
          setRepairs(repairsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        }

        // 3. Fetch Orders
        if (custData.phone) {
          const ordersQuery = query(collection(db, 'orders'), where('customerPhone', '==', custData.phone));
          const ordersSnap = await getDocs(ordersQuery);
          setOrders(ordersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } else if (custData.email) {
          const ordersQuery = query(collection(db, 'orders'), where('customerEmail', '==', custData.email));
          const ordersSnap = await getDocs(ordersQuery);
          setOrders(ordersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } else {
          setOrders([]);
        }
        
      } else {
        alert('Customer not found');
        navigate('/admin/customers');
      }
    } catch (error) {
      console.error("Error fetching CRM data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !id) return;
    
    const noteObj = {
      text: newNote.trim(),
      date: new Date().toISOString(),
      author: 'Admin'
    };

    try {
      await updateDoc(doc(db, 'customers', id), {
        notes: arrayUnion(noteObj)
      });
      setCustomer((prev: any) => ({
        ...prev,
        notes: [...(prev.notes || []), noteObj]
      }));
      setNewNote('');
    } catch (error) {
      console.error("Error adding note:", error);
      alert("Failed to add note.");
    }
  };

  if (loading) {
    return <FormSkeleton />;
  }

  if (!customer) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/customers')} className="text-slate-500 hover:text-white transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
              Customer Details
            </h1>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-full hover:bg-red-500/20 transition-all uppercase tracking-wider flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Delete Customer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:hidden">
        
        {/* LEFT COLUMN: Profile & Notes */}
        <div className="space-y-8">
          
          {/* Profile Card */}
          <div className="bg-[#0d0d0e] rounded-3xl border border-white/10 p-8 shadow-2xl flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-3xl uppercase border-4 border-[#0a0a0b] shadow-[0_0_20px_rgba(59,130,246,0.3)] mb-4">
              {customer.name?.substring(0,2)}
            </div>
            <h2 className="text-xl font-bold text-white mb-1">{customer.name}</h2>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-6">
              Joined {customer.createdAt ? format(new Date(customer.createdAt), 'MMM d, yyyy') : 'N/A'}
            </p>
            
            <div className="w-full flex justify-between px-6 py-4 bg-white/5 rounded-2xl border border-white/5">
              <div>
                <div className="text-2xl font-bold text-white">{orders.length}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Orders</div>
              </div>
              <div className="w-px bg-white/10"></div>
              <div>
                <div className="text-2xl font-bold text-white">{repairs.length}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Repairs</div>
              </div>
            </div>
          </div>

          {/* Contact & Address */}
          <div className="bg-[#0d0d0e] rounded-3xl border border-white/10 p-8 shadow-2xl space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest border-b border-white/5 pb-4">Contact Info</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4 text-sm">
                <Mail className="h-5 w-5 text-slate-500 shrink-0" />
                <div>
                  <div className="font-bold text-slate-300">Email Address</div>
                  <div className="text-blue-400 mt-1">{customer.email || 'Not provided'}</div>
                </div>
              </div>
              <div className="flex items-start gap-4 text-sm">
                <Phone className="h-5 w-5 text-slate-500 shrink-0" />
                <div>
                  <div className="font-bold text-slate-300">Phone Number</div>
                  <div className="text-slate-400 mt-1">{customer.phone || 'Not provided'}</div>
                </div>
              </div>
              <div className="flex items-start gap-4 text-sm">
                <MapPin className="h-5 w-5 text-slate-500 shrink-0" />
                <div>
                  <div className="font-bold text-slate-300">Default Address</div>
                  <div className="text-slate-400 mt-1 leading-relaxed">
                    {customer.address ? customer.address : 'No address provided'}
                    <br />
                    {customer.city ? customer.city : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes on Customer */}
          <div className="bg-[#0d0d0e] rounded-3xl border border-white/10 p-8 shadow-2xl flex flex-col h-[500px]">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest border-b border-white/5 pb-4 mb-4">Notes on Customer</h3>
            
            <form onSubmit={handleAddNote} className="mb-6">
              <textarea 
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={3} 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all resize-none" 
                placeholder="Type an internal note about this customer..."
              ></textarea>
              <button type="submit" disabled={!newNote.trim()} className="mt-3 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider">
                Add Note
              </button>
            </form>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
              {(!customer.notes || customer.notes.length === 0) ? (
                <div className="text-center text-sm text-slate-500 mt-10">No notes found for this customer.</div>
              ) : (
                [...customer.notes].reverse().map((note: any, idx: number) => (
                  <div key={idx} className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <p className="text-sm text-slate-300 leading-relaxed mb-3">{note.text}</p>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                      <span>{note.author}</span>
                      <span>{format(new Date(note.date), 'MMM d, yyyy h:mm a')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: History (Orders & Repairs) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Repairs Ticket History */}
          <div className="bg-[#0d0d0e] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Wrench className="h-5 w-5 text-blue-500" />
                Repair History ({repairs.length})
              </h2>
              <Link to="/admin/repairs/new" className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-all uppercase tracking-wider">
                New Repair
              </Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-left text-[10px] text-slate-500 uppercase tracking-tighter border-b border-white/5 bg-black/20">
                    <th className="px-6 py-4">Ticket</th>
                    <th className="px-6 py-4">Device</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Cost</th>
                    <th className="px-6 py-4 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {repairs.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No repair history found.</td></tr>
                  ) : (
                    repairs.map(repair => (
                      <tr key={repair.id} onClick={() => navigate(`/admin/repairs/${repair.id}`)} className="border-t border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold text-blue-400">REP-{repair.id.slice(0,4).toUpperCase()}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-200">{repair.deviceType} {repair.brand}</div>
                          <div className="text-xs text-slate-500 truncate max-w-[200px] mt-0.5">{repair.issue}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-[10px] font-bold rounded-md border ${
                            repair.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                            repair.status === 'Ready for Delivery' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                            'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          }`}>
                            {(repair.status || 'Pending').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-slate-300">
                          ₹{Number(repair.estimatedCost || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-xs text-slate-500">
                          {repair.createdAt ? format(new Date(repair.createdAt), 'MMM d, yyyy') : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* E-Commerce Orders History */}
          <div className="bg-[#0d0d0e] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-emerald-500" />
                Orders & Invoices ({orders.length})
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-left text-[10px] text-slate-500 uppercase tracking-tighter border-b border-white/5 bg-black/20">
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4">Payment</th>
                    <th className="px-6 py-4">Fulfillment</th>
                    <th className="px-6 py-4 text-right">Date</th>
                    <th className="px-6 py-4 text-right">Invoice</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {orders.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No product orders found for this customer.</td></tr>
                  ) : (
                    orders.map(order => (
                      <tr key={order.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold text-emerald-400">{order.orderNumber || `ORD-${order.id.slice(0,4).toUpperCase()}`}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-300">
                          ₹{Number(order.totalAmount || order.total || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-[10px] font-bold rounded-md border bg-emerald-500/10 text-emerald-500 border-emerald-500/20">{order.paymentStatus || 'PAID'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-[10px] font-bold rounded-md border bg-blue-500/10 text-blue-500 border-blue-500/20">{order.fulfillmentStatus || 'FULFILLED'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-xs text-slate-500">
                          {order.createdAt ? format(new Date(order.createdAt), 'MMM d, yyyy') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button onClick={() => setSelectedInvoice(order)} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors inline-block">
                            <FileText className="h-4 w-4" />
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
      </div>
      
      {selectedInvoice && (
        <InvoiceModal order={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
      )}
    </div>
  );
}
