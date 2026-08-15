import { useState, useEffect } from 'react';
import { 
  Search, 
  ChevronDown, 
  Download, 
  Plus,
  MoreVertical,
  Check,
  Clock,
  X,
  AlertCircle,
  MessageCircle,
  Trash2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, deleteDoc, doc, limit, startAfter, writeBatch, addDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAdmin } from '../../contexts/AdminContext';
import { exportToCsv } from '../../utils/exportCsv';
import { generateBulkInvoices, generateSingleInvoicePdf, shareInvoiceViaWhatsApp } from '../../utils/pdfGenerator';
import { TableBodySkeleton } from '../../components/ui/Skeleton';

// Mock data generator for testing
const MOCK_ORDERS = [
  { orderNumber: '#2453', totalAmount: 87, customerName: 'Carry Anna', customerAvatar: 'CA', paymentStatus: 'COMPLETE', fulfillmentStatus: 'CANCELLED', deliveryType: 'Cash on delivery', createdAt: '2023-12-12T12:56:00Z' },
  { orderNumber: '#2452', totalAmount: 7264, customerName: 'Milind Mikuja', customerAvatar: 'MM', paymentStatus: 'CANCELLED', fulfillmentStatus: 'READY TO PICKUP', deliveryType: 'Free shipping', createdAt: '2023-12-09T14:28:00Z' },
  { orderNumber: '#2451', totalAmount: 375, customerName: 'Stanly Drinkwater', customerAvatar: 'SD', paymentStatus: 'PENDING', fulfillmentStatus: 'COMPLETED', deliveryType: 'Local pickup', createdAt: '2023-12-04T12:56:00Z' },
  { orderNumber: '#2450', totalAmount: 657, customerName: 'Josef Stravinsky', customerAvatar: 'JS', paymentStatus: 'CANCELLED', fulfillmentStatus: 'PARTIALLY FULFILLED', deliveryType: 'Standard shipping', createdAt: '2023-12-01T04:07:00Z' },
  { orderNumber: '#2449', totalAmount: 9562, customerName: 'Igor Borvibson', customerAvatar: 'IB', paymentStatus: 'FAILED', fulfillmentStatus: 'PARTIALLY FULFILLED', deliveryType: 'Express', createdAt: '2023-11-28T19:28:00Z' },
  { orderNumber: '#2448', totalAmount: 46, customerName: 'Katerina Karenin', customerAvatar: 'KK', paymentStatus: 'PAID', fulfillmentStatus: 'UNFULFILLED', deliveryType: 'Local delivery', createdAt: '2023-11-24T10:16:00Z' },
  { orderNumber: '#2447', totalAmount: 953, customerName: 'Roy Anderson', customerAvatar: 'RA', paymentStatus: 'PENDING', fulfillmentStatus: 'FULFILLED', deliveryType: 'Cash on delivery', createdAt: '2023-11-18T17:43:00Z' },
  { orderNumber: '#2446', totalAmount: 12, customerName: 'Martina scorcese', customerAvatar: 'MS', paymentStatus: 'PENDING', fulfillmentStatus: 'FULFILLED', deliveryType: 'Standard shipping', createdAt: '2023-11-18T02:09:00Z' },
];

export default function OrderList() {
  const navigate = useNavigate();
  const { ordersState } = useAdmin();
  const { data: orders, loading, pageSize, setPageSize, currentPage, setCurrentPage, hasNextPage, setCursors } = ordersState;

  const [activeTab, setActiveTab] = useState('All');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [fulfillmentFilter, setFulfillmentFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  // Bulk Download
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bulkProgress, setBulkProgress] = useState('');

  const handleWhatsApp = async (order: any) => {
    await shareInvoiceViaWhatsApp(order);
  };

  const generateMockOrders = async () => {
    try {
      for (const order of MOCK_ORDERS) {
        await setDoc(doc(db, 'orders', order.orderNumber), order);
      }
    } catch (error) {
      alert("Error generating mock data. Check your Firebase Rules for 'orders' collection!");
    }
  };

  const getPaymentBadge = (status: string) => {
    switch(status?.toUpperCase()) {
      case 'COMPLETE':
      case 'PAID':
        return <span className="flex items-center gap-1 w-max px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold rounded-md tracking-widest uppercase"><Check className="w-3 h-3"/> {status}</span>;
      case 'PENDING':
        return <span className="flex items-center gap-1 w-max px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold rounded-md tracking-widest uppercase"><Clock className="w-3 h-3"/> {status}</span>;
      case 'FAILED':
        return <span className="flex items-center gap-1 w-max px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold rounded-md tracking-widest uppercase"><X className="w-3 h-3"/> {status}</span>;
      case 'CANCELLED':
        return <span className="flex items-center gap-1 w-max px-2 py-1 bg-slate-500/10 text-slate-400 border border-slate-500/20 text-[10px] font-bold rounded-md tracking-widest uppercase"><X className="w-3 h-3"/> {status}</span>;
      default:
        return <span className="flex items-center gap-1 w-max px-2 py-1 bg-slate-500/10 text-slate-400 border border-slate-500/20 text-[10px] font-bold rounded-md tracking-widest uppercase">{status}</span>;
    }
  };

  const getFulfillmentBadge = (status: string) => {
    switch(status?.toUpperCase()) {
      case 'COMPLETED':
      case 'FULFILLED':
        return <span className="flex items-center gap-1 w-max px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold rounded-md tracking-widest uppercase"><Check className="w-3 h-3"/> {status}</span>;
      case 'PARTIALLY FULFILLED':
        return <span className="flex items-center gap-1 w-max px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold rounded-md tracking-widest uppercase"><AlertCircle className="w-3 h-3"/> {status}</span>;
      case 'UNFULFILLED':
        return <span className="flex items-center gap-1 w-max px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold rounded-md tracking-widest uppercase"><X className="w-3 h-3"/> {status}</span>;
      case 'READY TO PICKUP':
        return <span className="flex items-center gap-1 w-max px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold rounded-md tracking-widest uppercase"><Clock className="w-3 h-3"/> {status}</span>;
      case 'CANCELLED':
      case 'CANCELED':
        return <span className="flex items-center gap-1 w-max px-2 py-1 bg-slate-500/10 text-slate-400 border border-slate-500/20 text-[10px] font-bold rounded-md tracking-widest uppercase"><X className="w-3 h-3"/> {status}</span>;
      default:
        return <span className="flex items-center gap-1 w-max px-2 py-1 bg-slate-500/10 text-slate-400 border border-slate-500/20 text-[10px] font-bold rounded-md tracking-widest uppercase">{status}</span>;
    }
  };

  const tabs = [
    { name: 'All', count: orders.length },
    { name: 'Pending payment', count: orders.filter(o => ['PENDING'].includes(o.paymentStatus?.toUpperCase())).length },
    { name: 'Unfulfilled', count: orders.filter(o => ['UNFULFILLED'].includes(o.fulfillmentStatus?.toUpperCase())).length },
    { name: 'Completed', count: orders.filter(o => ['COMPLETED', 'FULFILLED'].includes(o.fulfillmentStatus?.toUpperCase())).length },
    { name: 'Refunded', count: 0 },
    { name: 'Failed', count: orders.filter(o => ['FAILED'].includes(o.paymentStatus?.toUpperCase())).length }
  ];

  const handleDeleteOrder = async (orderId: string) => {
    if (window.confirm("Are you sure you want to delete this invoice/order?")) {
      try {
        await deleteDoc(doc(db, "orders", orderId));
        alert("Order deleted successfully!");
      } catch (error) {
        console.error("Error deleting order:", error);
        alert("Failed to delete order.");
      }
    }
  };

  const filteredOrders = orders.filter(order => {
    // Tab filtering
    if (activeTab === 'Pending payment' && !['PENDING'].includes(order.paymentStatus?.toUpperCase())) return false;
    if (activeTab === 'Unfulfilled' && !['UNFULFILLED'].includes(order.fulfillmentStatus?.toUpperCase())) return false;
    if (activeTab === 'Completed' && !['COMPLETED', 'FULFILLED'].includes(order.fulfillmentStatus?.toUpperCase())) return false;
    if (activeTab === 'Failed' && !['FAILED'].includes(order.paymentStatus?.toUpperCase())) return false;

    // Search filtering
    if (searchTerm && !(
      order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
    )) return false;

    // Dropdown filters
    if (paymentFilter && order.paymentStatus?.toUpperCase() !== paymentFilter.toUpperCase()) return false;
    if (fulfillmentFilter && order.fulfillmentStatus?.toUpperCase() !== fulfillmentFilter.toUpperCase()) return false;
    
    // Type filtering (Offline POS vs Online)
    if (typeFilter === 'OFFLINE' && order.deliveryType !== 'In-Store POS') return false;
    if (typeFilter === 'ONLINE' && order.deliveryType === 'In-Store POS') return false;

    return true;
  });

  return (
    <div className="text-slate-300 min-h-screen pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Page 1 &gt; Page 2 &gt; Default</div>
          <h1 className="text-3xl font-bold text-white">Orders</h1>
        </div>
      </div>

      <div className="bg-[#141415] border border-white/5 shadow-2xl rounded-xl overflow-hidden flex flex-col">
        
        {/* Tabs */}
        <div className="flex border-b border-white/5 overflow-x-auto custom-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`flex items-center px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors relative
                ${activeTab === tab.name ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {tab.name} <span className="ml-2 text-[10px] opacity-60">({tab.count})</span>
              {activeTab === tab.name && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
              )}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-white/5 flex flex-wrap items-center justify-between gap-4 bg-[#0d0d0e]">
          <div className="flex items-center gap-4 flex-1 min-w-[300px]">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search orders"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600"
              />
            </div>
            
            <div className="relative">
              <select 
                className="appearance-none bg-white/5 border border-white/10 rounded-lg py-2 pl-4 pr-10 text-sm text-slate-300 focus:outline-none focus:border-blue-500 transition-colors font-bold cursor-pointer"
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
              >
                <option value="" className="bg-[#0d0d0e]">Payment status</option>
                <option value="PAID" className="bg-[#0d0d0e]">Paid</option>
                <option value="PENDING" className="bg-[#0d0d0e]">Pending</option>
                <option value="FAILED" className="bg-[#0d0d0e]">Failed</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>

            <div className="relative">
              <select 
                className="appearance-none bg-white/5 border border-white/10 rounded-lg py-2 pl-4 pr-10 text-sm text-slate-300 focus:outline-none focus:border-blue-500 transition-colors font-bold cursor-pointer"
                value={fulfillmentFilter}
                onChange={(e) => setFulfillmentFilter(e.target.value)}
              >
                <option value="" className="bg-[#0d0d0e]">Fulfilment status</option>
                <option value="FULFILLED" className="bg-[#0d0d0e]">Fulfilled</option>
                <option value="UNFULFILLED" className="bg-[#0d0d0e]">Unfulfilled</option>
                <option value="CANCELLED" className="bg-[#0d0d0e]">Cancelled</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>

            <div className="relative">
              <select 
                className="appearance-none bg-white/5 border border-white/10 rounded-lg py-2 pl-4 pr-10 text-sm text-slate-300 focus:outline-none focus:border-blue-500 transition-colors font-bold cursor-pointer"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="" className="bg-[#0d0d0e]">Order Type</option>
                <option value="ONLINE" className="bg-[#0d0d0e]">Online Orders</option>
                <option value="OFFLINE" className="bg-[#0d0d0e]">Offline (POS)</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>

            <button className="px-4 py-2 border border-white/10 rounded-lg text-sm text-slate-300 hover:bg-white/5 transition-colors font-bold whitespace-nowrap">
              More filters
            </button>

            <div className="flex items-center gap-2 border-l border-white/10 pl-4">
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm text-slate-300 focus:outline-none focus:border-blue-500" title="Start Date" />
              <span className="text-slate-500 text-sm">to</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm text-slate-300 focus:outline-none focus:border-blue-500" title="End Date" />
              
              <button 
                onClick={() => {
                  if(!startDate || !endDate) { alert('Please select start and end dates'); return; }
                  generateBulkInvoices(
                    startDate, 
                    endDate, 
                    { paymentFilter, fulfillmentFilter, typeFilter, searchTerm, activeTab },
                    setBulkProgress
                  );
                }}
                disabled={!!bulkProgress}
                className="bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600/30 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap"
              >
                {bulkProgress ? 'Processing...' : 'Bulk Download PDFs'}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4 lg:mt-0 w-full lg:w-auto justify-end">
            {bulkProgress && <span className="text-xs text-purple-400 font-bold animate-pulse mr-2">{bulkProgress}</span>}
            <button onClick={() => exportToCsv('orders.csv', orders)} className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors font-bold whitespace-nowrap">
              <Download className="w-4 h-4" /> Export
            </button>
            <Link to="/admin/offline-sale" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
              <Plus className="w-4 h-4" /> Add order
            </Link>
            {orders.length === 0 && !loading && (
              <button onClick={generateMockOrders} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors">
                (Generate Mock Data)
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[10px] text-slate-500 uppercase tracking-widest">
                <th className="p-4 w-12 text-center">
                  <input type="checkbox" className="w-4 h-4 rounded bg-white/5 border-white/10 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                </th>
                <th className="p-4 font-bold">Order ⇅</th>
                <th className="p-4 font-bold">Total ⇅</th>
                <th className="p-4 font-bold">Customer ⇅</th>
                <th className="p-4 font-bold">Payment Status ⇅</th>
                <th className="p-4 font-bold">Fulfilment Status ⇅</th>
                <th className="p-4 font-bold">Delivery Type ⇅</th>
                <th className="p-4 font-bold">Date ⇅</th>
                <th className="p-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <TableBodySkeleton columns={9} rows={5} />
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">No orders found. Click (Generate Mock Data) to generate samples.</td>
                </tr>
              ) : (
                filteredOrders.map((order, i) => (
                  <tr 
                    key={order.id || i} 
                    onClick={() => order.id && navigate(`/admin/orders/${order.id}`)}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <td className="p-4 text-center">
                      <input type="checkbox" className="w-4 h-4 rounded bg-white/5 border-white/10 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                    </td>
                    <td className="p-4 font-mono text-blue-400 text-xs font-bold">{order.orderNumber}</td>
                    <td className="p-4 font-bold text-white">₹{Number(order.totalAmount).toLocaleString()}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0
                          ${['bg-emerald-600', 'bg-blue-600', 'bg-purple-600', 'bg-amber-600', 'bg-rose-600'][i % 5]}`}>
                          {order.customerAvatar || (order.customerName ? order.customerName.substring(0,2).toUpperCase() : 'CU')}
                        </div>
                        <div className="flex flex-col items-start">
                          <span 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              const targetId = order.customerId || order.customerPhone || order.customerEmail || order.customerName || '';
                              if (targetId) {
                                navigate(`/admin/customers/${encodeURIComponent(targetId)}`);
                              }
                            }}
                            title="View Customer Profile"
                            className="font-bold text-slate-300 hover:text-blue-400 hover:underline cursor-pointer"
                          >
                            {order.customerName || 'Customer'}
                          </span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleWhatsApp(order); }}
                            className="text-[10px] text-[#25D366] hover:text-[#128C7E] flex items-center gap-1 font-bold mt-1 px-2 py-0.5 rounded-full bg-[#25D366]/10 border border-[#25D366]/20 transition-colors"
                          >
                            <MessageCircle className="w-3 h-3" /> WhatsApp
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">{getPaymentBadge(order.paymentStatus)}</td>
                    <td className="p-4">{getFulfillmentBadge(order.fulfillmentStatus)}</td>
                    <td className="p-4 text-slate-400 text-xs font-bold">{order.deliveryType}</td>
                    <td className="p-4 text-slate-500 text-xs font-bold whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, {new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteOrder(order.id); }}
                        className="text-slate-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                        title="Delete Invoice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
    </div>
  );
}
