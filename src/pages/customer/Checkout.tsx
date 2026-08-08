import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { db } from '../../lib/firebase';
import { collection, addDoc, updateDoc, doc, increment, getDocs, query, where } from 'firebase/firestore';
import { ShoppingBag, MapPin, CreditCard, AlertCircle, Loader2, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Checkout() {
  const { cart, totalPrice, clearCart } = useCart();
  const { user, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    pincode: '',
    paymentMethod: 'COD'
  });

  if (cart.length === 0 && !isSubmitted) {
    return <Navigate to="/products" />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const now = new Date().toISOString();
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

      // 1. Create Order
      const orderData = {
        orderNumber,
        customerName: formData.name,
        customerPhone: formData.phone,
        customerEmail: formData.email,
        shippingAddress: `${formData.address}, ${formData.city} - ${formData.pincode}`,
        totalAmount: totalPrice,
        paymentStatus: formData.paymentMethod === 'COD' ? 'PENDING' : 'PAID',
        fulfillmentStatus: 'UNFULFILLED',
        deliveryType: 'Online Delivery',
        items: cart.map(item => ({
          type: 'product',
          id: item.id,
          name: item.title,
          price: item.price,
          quantity: item.quantity,
          sku: item.id // Fallback
        })),
        createdAt: now
      };

      await addDoc(collection(db, 'orders'), orderData);

      // 2. Update Customer Record
      const q = query(collection(db, 'customers'), where('phone', '==', formData.phone));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        await addDoc(collection(db, 'customers'), {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          totalSpent: totalPrice,
          ordersCount: 1,
          createdAt: now,
          lastOrderDate: now
        });
      } else {
        const custDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, 'customers', custDoc.id), {
          totalSpent: increment(totalPrice),
          ordersCount: increment(1),
          lastOrderDate: now
        });
      }

      setIsSubmitted(true);
      clearCart();
      navigate('/checkout/success', { state: { orderNumber } });

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to process checkout. Please try again later.');
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 min-h-[60vh] flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-100">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Sign in to Checkout</h2>
          <p className="text-slate-500 mb-8">
            You need an account to place an order. This helps you track your orders easily.
          </p>
          <button 
            onClick={openAuthModal}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-blue-500/20"
          >
            Sign In / Create Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Checkout</h1>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 mb-8 border border-red-100">
            <AlertCircle className="h-5 w-5" />
            <p className="font-medium text-sm">{error}</p>
          </div>
        )}

        <form id="checkout-form" onSubmit={handleCheckout} className="flex flex-col lg:flex-row gap-12">
          {/* Left Column: Form */}
          <div className="flex-1 space-y-8">
            <div className="space-y-8">
              
              {/* Contact Details */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">1</div>
                  <h2 className="text-xl font-bold text-slate-900">Contact Details</h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Full Name</label>
                    <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Email Address (Optional)</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" placeholder="john@example.com" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-semibold text-slate-700">Phone Number</label>
                    <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" placeholder="+91 98765 43210" />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold"><MapPin className="h-4 w-4" /></div>
                  <h2 className="text-xl font-bold text-slate-900">Delivery Address</h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-semibold text-slate-700">Street Address</label>
                    <input required type="text" name="address" value={formData.address} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" placeholder="123 Main St, Apt 4B" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">City</label>
                    <input required type="text" name="city" value={formData.city} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" placeholder="Mumbai" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">PIN Code</label>
                    <input required type="text" name="pincode" value={formData.pincode} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" placeholder="400001" />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="w-full lg:w-[400px]">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <ShoppingBag className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-bold text-slate-900">Order Summary</h2>
              </div>
              
              <div className="space-y-4 max-h-[300px] overflow-y-auto mb-6 pr-2">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-4 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">{item.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">Qty: {item.quantity}</p>
                    </div>
                    <div className="font-semibold text-slate-900 text-sm">
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 pt-6 space-y-4">
                <div className="flex justify-between text-slate-600 text-sm">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">₹{totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600 text-sm">
                  <span>Shipping</span>
                  <span className="font-semibold text-emerald-600">FREE</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <span className="text-base font-bold text-slate-900">Total</span>
                  <span className="text-2xl font-black text-slate-900">₹{totalPrice.toLocaleString()}</span>
                </div>
              </div>

              <button
                type="submit"
                form="checkout-form"
                disabled={loading}
                className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2 uppercase tracking-wide disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    Submit Inquiry
                  </>
                )}
              </button>
              
              <p className="text-center text-xs text-slate-500 mt-4">
                By submitting this inquiry, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
