import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  ArrowLeft, 
  Package, 
  User, 
  MapPin,
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  MessageCircle,
  Download,
  Trash2,
  Edit
} from 'lucide-react';
import { FormSkeleton } from '../../components/ui/Skeleton';
import { generateSingleInvoicePdf } from '../../utils/pdfGenerator';

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'orders', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setOrder({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) return <FormSkeleton />;
  if (!order) return <div className="text-white p-8 text-center">Order not found.</div>;

  const getStatusColor = (status: string) => {
    const s = status?.toUpperCase() || '';
    if (['PAID', 'COMPLETE', 'COMPLETED', 'FULFILLED'].includes(s)) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (['PENDING', 'UNFULFILLED'].includes(s)) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    if (['CANCELLED', 'FAILED'].includes(s)) return 'text-red-400 bg-red-500/10 border-red-500/20';
    return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
  };

  const getStatusIcon = (status: string) => {
    const s = status?.toUpperCase() || '';
    if (['PAID', 'COMPLETE', 'COMPLETED', 'FULFILLED'].includes(s)) return <CheckCircle2 className="w-4 h-4" />;
    if (['PENDING', 'UNFULFILLED'].includes(s)) return <Clock className="w-4 h-4" />;
    if (['CANCELLED', 'FAILED'].includes(s)) return <XCircle className="w-4 h-4" />;
    return <Package className="w-4 h-4" />;
  };

  const subTotal = order.items?.reduce((sum: number, item: any) => sum + (Number(item.price) || 0), 0) || order.totalAmount;
  const discount = Math.max(0, subTotal - (order.totalAmount || 0));

  const handleWhatsApp = async () => {
    if (!order.customerPhone) {
      alert("No phone number available for this customer.");
      return;
    }
    
    // 1. Trigger PDF Download
    await generateSingleInvoicePdf(order);
    
    // 2. Open WhatsApp
    // Clean phone number (remove spaces, etc., ensure country code if necessary - defaulting to India +91 if none exists for this specific use case, though best to just pass as is if they entered it)
    let phone = order.customerPhone.replace(/[^0-9+]/g, '');
    if (phone.length === 10 && !phone.startsWith('+')) {
      phone = '+91' + phone; 
    }
    
    const text = `Hi ${order.customerName || 'Customer'},\n\nThank you for your order at Tech Beast! Your order #${order.orderNumber || ''} is confirmed.\n\nTotal: ₹${Number(order.totalAmount || 0).toLocaleString()}\n\nI have attached your invoice PDF below.`;
    const encodedText = encodeURIComponent(text);
    
    const waUrl = `https://wa.me/${phone}?text=${encodedText}`;
    window.open(waUrl, '_blank');
  };

  const handleDeleteOrder = async () => {
    if (!order?.id) return;
    if (window.confirm("Are you sure you want to delete this invoice/order?")) {
      try {
        await deleteDoc(doc(db, 'orders', order.id));
        alert("Order deleted successfully!");
        navigate('/admin/orders');
      } catch (error) {
        console.error("Error deleting order:", error);
        alert("Failed to delete order.");
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-6 mb-8">
        <div className="flex items-start gap-4">
          <Link to="/admin/orders" className="text-slate-500 hover:text-white transition-colors mt-1">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-3 break-all">
              Order {order.orderNumber}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-2">
              <Calendar className="w-4 h-4 shrink-0" /> 
              {new Date(order.createdAt).toLocaleDateString('en-US', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
              })}
            </p>
          </div>
        </div>
        
        <div className="lg:ml-auto flex flex-wrap items-center gap-3">
          <button 
            onClick={handleWhatsApp}
            title="Download PDF & Open WhatsApp"
            className="bg-[#25D366] hover:bg-[#128C7E] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-[#25D366]/20 flex-1 sm:flex-none justify-center"
          >
            <MessageCircle className="w-4 h-4 shrink-0" /> <span className="whitespace-nowrap">WhatsApp</span>
          </button>
          {order.deliveryType === 'In-Store POS' && (
            <Link 
              to={`/admin/offline-sale/edit/${order.id}`}
              title="Edit Invoice"
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-blue-500/20 flex-1 sm:flex-none"
            >
              <Edit className="w-4 h-4 shrink-0" /> <span className="whitespace-nowrap">Edit</span>
            </Link>
          )}
          <button 
            onClick={handleDeleteOrder}
            title="Delete Invoice"
            className="flex items-center justify-center gap-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/20 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex-1 sm:flex-none"
          >
            <Trash2 className="w-4 h-4 shrink-0" />
          </button>
          
          <div className={`px-3 py-2 rounded-lg border text-xs font-bold uppercase tracking-widest flex items-center gap-2 w-full sm:w-auto justify-center mt-2 sm:mt-0 ${getStatusColor(order.paymentStatus)}`}>
            <CreditCard className="w-4 h-4 shrink-0" /> {order.paymentStatus}
          </div>
          <div className={`px-3 py-2 rounded-lg border text-xs font-bold uppercase tracking-widest flex items-center gap-2 w-full sm:w-auto justify-center mt-2 sm:mt-0 ${getStatusColor(order.fulfillmentStatus)}`}>
            {getStatusIcon(order.fulfillmentStatus)} {order.fulfillmentStatus}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#141415] rounded-2xl border border-white/5 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/5">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Package className="w-4 h-4" /> Order Items
              </h2>
            </div>
            
            <div className="divide-y divide-white/5">
              {order.items && order.items.length > 0 ? (
                order.items.map((item: any, idx: number) => (
                  <div key={idx} className="p-6 flex gap-4 hover:bg-white/[0.02] transition-colors">
                    <div className="w-16 h-16 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                      <Package className="w-8 h-8 text-slate-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg">{item.name}</h3>
                      <div className="text-sm text-slate-500 mt-1 flex flex-wrap gap-4">
                        {item.sku && <span>SKU: {item.sku}</span>}
                        <span className="capitalize">Type: {item.type || 'Product'}</span>
                        <span>Qty: {item.quantity || 1}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-white">
                        {Number(item.price) === 0 ? <span className="text-emerald-500">FREE</span> : `₹${Number(item.price).toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6">
                  <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
                    <div>
                      <p className="font-bold text-white">Offline POS Sale</p>
                      <p className="text-sm text-slate-500">Legacy order format</p>
                    </div>
                    <p className="font-bold text-lg text-white">₹{Number(order.totalAmount).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-[#0d0d0e] border-t border-white/5">
              <div className="w-64 ml-auto space-y-3">
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Subtotal</span>
                  <span className="text-white font-bold">₹{subTotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-500">
                    <span>Discount</span>
                    <span className="font-bold">- ₹{discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-white pt-3 border-t border-white/10">
                  <span>Total</span>
                  <span>₹{Number(order.totalAmount || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Customer & Delivery Info */}
        <div className="space-y-6">
          
          <div className="bg-[#141415] rounded-2xl border border-white/5 shadow-2xl p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <User className="w-4 h-4" /> Customer Details
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Name</p>
                <p className="text-white font-bold">{order.customerName || 'N/A'}</p>
              </div>
              
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Contact Info</p>
                {order.customerEmail && <p className="text-blue-400 font-medium">{order.customerEmail}</p>}
                {order.customerPhone && <p className="text-slate-300">{order.customerPhone}</p>}
                {!order.customerEmail && !order.customerPhone && <p className="text-slate-600 italic">No contact provided</p>}
              </div>
            </div>
          </div>

          <div className="bg-[#141415] rounded-2xl border border-white/5 shadow-2xl p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <Truck className="w-4 h-4" /> Delivery Details
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Method</p>
                <div className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-sm font-bold text-white mt-1">
                  {order.deliveryType || 'Standard Shipping'}
                </div>
              </div>

              {order.shippingAddress && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-2 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Shipping Address
                  </p>
                  <div className="bg-white/5 rounded-xl p-4 text-sm text-slate-300">
                    <p className="font-bold text-white">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                    <p className="mt-1">{order.shippingAddress.address}</p>
                    {order.shippingAddress.apartment && <p>{order.shippingAddress.apartment}</p>}
                    <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
        </div>
        
      </div>
    </div>
  );
}
