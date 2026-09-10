import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Map, Calendar, ShoppingCart, Wrench, CheckCircle2, Clock, Trash2, FileText, Eye, Laptop, Monitor, MessageCircle, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { db } from '../../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';
import InvoiceModal from '../../components/admin/InvoiceModal';
import { FormSkeleton } from '../../components/ui/Skeleton';
import { generateWhatsAppInquiryUrl } from '../../utils/activityTracker';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<any>(null);
  const [repairs, setRepairs] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [viewedProducts, setViewedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const safeFormatDate = (dateVal: any) => {
    if (!dateVal) return '-';
    try {
      let d: Date;
      if (typeof dateVal === 'object' && dateVal.seconds) {
        d = new Date(dateVal.seconds * 1000);
      } else if (typeof dateVal === 'object' && typeof dateVal.toDate === 'function') {
        d = dateVal.toDate();
      } else {
        d = new Date(dateVal);
      }
      if (isNaN(d.getTime())) return '-';
      return format(d, 'MMM d, yyyy');
    } catch (err) {
      return '-';
    }
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const targetId = decodeURIComponent(id).trim();

    let rawCustomers: any[] = [];
    let rawRepairs: any[] = [];
    let rawOrders: any[] = [];
    let rawViews: any[] = [];

    const syncCRMData = () => {
      // 1. Locate customer in rawCustomers
      let custData: any = null;
      
      // Match by ID
      const directMatch = rawCustomers.find(c => c.id === targetId);
      if (directMatch) {
        custData = { ...directMatch };
      } else {
        // Match by phone, email, or name
        const match = rawCustomers.find(c => 
          (c.phone && c.phone === targetId) ||
          (c.email && c.email.toLowerCase() === targetId.toLowerCase()) ||
          (c.name && c.name.toLowerCase() === targetId.toLowerCase())
        );
        if (match) custData = { ...match };
      }

      const searchPhone = custData?.phone || (targetId.match(/^[0-9+]{8,}$/) ? targetId : '');
      const searchEmail = custData?.email || (targetId.includes('@') ? targetId : '');
      const searchName = custData?.name || targetId;

      // 2. Filter Repairs
      const filteredRepairs = rawRepairs.filter(r => 
        (searchPhone && r.customerPhone === searchPhone) ||
        (searchEmail && r.customerEmail?.toLowerCase() === searchEmail.toLowerCase()) ||
        (searchName && r.customerName?.toLowerCase() === searchName.toLowerCase())
      );

      // 3. Filter Orders
      const filteredOrders = rawOrders.filter(o => 
        (searchPhone && o.customerPhone === searchPhone) ||
        (searchEmail && o.customerEmail?.toLowerCase() === searchEmail.toLowerCase()) ||
        (searchName && o.customerName?.toLowerCase() === searchName.toLowerCase())
      );

      // 4. Merge Viewed Products
      let mergedViews: any[] = [];
      if (Array.isArray(custData?.viewedProducts)) {
        mergedViews = [...custData.viewedProducts];
      }

      const relevantViews = rawViews.filter(v => 
        (targetId && (v.customerId === targetId || v.userId === targetId)) ||
        (searchPhone && (v.customerId === searchPhone || v.customerPhone === searchPhone)) ||
        (searchEmail && v.customerEmail?.toLowerCase() === searchEmail.toLowerCase())
      );

      relevantViews.forEach(rv => {
        const existingIdx = mergedViews.findIndex(fv => fv.productId === rv.productId);
        if (existingIdx >= 0) {
          mergedViews[existingIdx].viewCount = Math.max(mergedViews[existingIdx].viewCount || 1, rv.viewCount || 1);
        } else {
          mergedViews.push({
            productId: rv.productId,
            title: rv.productTitle,
            category: rv.productCategory || 'General',
            price: Number(rv.productPrice || 0),
            imageUrl: rv.productImage || '',
            condition: rv.productCondition || '',
            brand: rv.productBrand || '',
            sku: rv.productSku || '',
            viewedAt: rv.lastViewedAt || rv.viewedAt,
            viewCount: rv.viewCount || 1
          });
        }
      });

      mergedViews.sort((a, b) => new Date(b.viewedAt || 0).getTime() - new Date(a.viewedAt || 0).getTime());

      // 5. Fallback customer record if not pre-existing
      if (!custData) {
        const firstOrder = filteredOrders[0];
        const firstRepair = filteredRepairs[0];

        custData = {
          id: targetId,
          name: searchName || firstOrder?.customerName || firstRepair?.customerName || 'Customer',
          phone: searchPhone || firstOrder?.customerPhone || firstRepair?.customerPhone || '',
          email: searchEmail || firstOrder?.customerEmail || firstRepair?.customerEmail || '',
          address: firstOrder?.shippingAddress?.address || firstOrder?.customerAddress || '',
          city: firstOrder?.shippingAddress?.city || '',
          notes: []
        };
      }

      setCustomer(custData);
      setRepairs(filteredRepairs);
      setOrders(filteredOrders);
      setViewedProducts(mergedViews);
      setLoading(false);
    };

    // Subscriptions
    const unsubCustomers = onSnapshot(collection(db, 'customers'), (snap) => {
      rawCustomers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      syncCRMData();
    }, (err) => console.error("Customer CRM sync error:", err));

    const unsubRepairs = onSnapshot(collection(db, 'repairs'), (snap) => {
      rawRepairs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      syncCRMData();
    }, (err) => console.error("Repairs CRM sync error:", err));

    const unsubOrders = onSnapshot(collection(db, 'orders'), (snap) => {
      rawOrders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      syncCRMData();
    }, (err) => console.error("Orders CRM sync error:", err));

    const unsubViews = onSnapshot(collection(db, 'customer_views'), (snap) => {
      rawViews = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      syncCRMData();
    }, (err) => console.error("Views CRM sync error:", err));

    return () => {
      unsubCustomers();
      unsubRepairs();
      unsubOrders();
      unsubViews();
    };
  }, [id]);

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

  if (!customer) {
    return (
      <div className="p-8 text-center text-white bg-[#0d0d0e] rounded-2xl border border-white/10 max-w-xl mx-auto mt-12 space-y-4">
        <h2 className="text-xl font-bold">Customer Profile Not Found</h2>
        <p className="text-sm text-slate-400">Could not find record for this customer.</p>
        <button onClick={() => navigate('/admin/orders')} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-bold">
          Back to Orders
        </button>
      </div>
    );
  }

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
            
            <div className="w-full grid grid-cols-3 gap-2 px-3 py-4 bg-white/5 rounded-2xl border border-white/5 text-center">
              <div>
                <div className="text-xl font-bold text-white">{orders.length}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Orders</div>
              </div>
              <div className="border-x border-white/10">
                <div className="text-xl font-bold text-white">{repairs.length}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Repairs</div>
              </div>
              <div>
                <div className="text-xl font-bold text-emerald-400">{viewedProducts.length}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Views</div>
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

        {/* RIGHT COLUMN: History (Viewed Products, Orders & Repairs) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Products Viewed & Browsing Lead History */}
          <div className="bg-[#0d0d0e] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Eye className="h-5 w-5 text-emerald-400" />
                Products Viewed & Online Interest ({viewedProducts.length})
              </h2>
              {customer.phone && viewedProducts.length > 0 && (
                <a
                  href={generateWhatsAppInquiryUrl(
                    customer.phone,
                    customer.name,
                    viewedProducts[0].title,
                    viewedProducts[0].price,
                    viewedProducts[0].category
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#25D366] hover:bg-[#128C7E] rounded-full transition-all uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Inquire on WhatsApp
                </a>
              )}
            </div>

            <div className="p-6">
              {viewedProducts.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No browsing history or product views recorded for this customer yet.
                </div>
              ) : (
                <div className="overflow-x-auto border border-white/10 rounded-2xl bg-white/[0.02]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/5 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-3 pl-4">Product Details</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Price</th>
                        <th className="p-3 text-center">View Count</th>
                        <th className="p-3">Last Viewed</th>
                        <th className="p-3 pr-4 text-right">Inquiry</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {viewedProducts.map((prod, idx) => (
                        <tr key={idx} className="hover:bg-white/5 transition-colors group">
                          {/* Product */}
                          <td className="p-3 pl-4">
                            <div className="flex items-center gap-3">
                              {prod.imageUrl ? (
                                <img 
                                  src={prod.imageUrl} 
                                  alt={prod.title} 
                                  className="w-8 h-8 object-contain rounded bg-white/10 p-0.5 shrink-0" 
                                />
                              ) : (
                                <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center shrink-0 text-slate-500">
                                  <Laptop className="w-4 h-4" />
                                </div>
                              )}
                              <div className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors line-clamp-1 max-w-[200px]">
                                {prod.title}
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="p-3 whitespace-nowrap">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-widest">
                              {prod.category || 'Product'}
                            </span>
                          </td>

                          {/* Price */}
                          <td className="p-3 whitespace-nowrap font-extrabold text-emerald-400">
                            ₹{Number(prod.price || 0).toLocaleString('en-IN')}
                          </td>

                          {/* View count */}
                          <td className="p-3 text-center whitespace-nowrap">
                            <span className="font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 text-[10px]">
                              {prod.viewCount || 1}x Views
                            </span>
                          </td>

                          {/* Last Viewed */}
                          <td className="p-3 whitespace-nowrap text-slate-400 text-[11px]">
                            {safeFormatDate(prod.viewedAt)}
                          </td>

                          {/* Actions */}
                          <td className="p-3 pr-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              {customer.phone && (
                                <a
                                  href={generateWhatsAppInquiryUrl(
                                    customer.phone,
                                    customer.name,
                                    prod.title,
                                    prod.price,
                                    prod.category
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 uppercase tracking-wider shadow-sm"
                                  title="Inquire on WhatsApp"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  Inquire
                                </a>
                              )}
                              <a
                                href={prod.category?.includes('Prebuilt') ? `/prebuilt-pc/${prod.productId}` : `/products/${prod.productId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-all border border-white/10"
                                title="Open product page on website"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

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
                          <span className="font-mono text-xs font-bold text-blue-400">{repair.ticketNumber || `REP-${repair.id.slice(0,4).toUpperCase()}`}</span>
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
                          {safeFormatDate(repair.createdAt)}
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
                          {safeFormatDate(order.createdAt)}
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
