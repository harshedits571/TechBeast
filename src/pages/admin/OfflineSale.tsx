import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, addDoc, updateDoc, doc, query, where, increment } from 'firebase/firestore';
import { ShoppingBag, Printer, ArrowLeft, Package, User, CheckCircle2, Gift, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FormSkeleton } from '../../components/ui/Skeleton';

export default function OfflineSale() {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invoiceGenerated, setInvoiceGenerated] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');

  // Data from DB
  const [products, setProducts] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  
  const [warrantyType, setWarrantyType] = useState('none');
  const [warrantyPrice, setWarrantyPrice] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const prodSnap = await getDocs(collection(db, 'products'));
        const invSnap = await getDocs(collection(db, 'inventory'));
        
        setProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter((p: any) => p.stock > 0));
        setInventory(invSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter((i: any) => i.quantity > 0));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const selectedAccessoriesData = inventory.filter(i => selectedAccessories.includes(i.id));
  
  const subTotal = (selectedProduct ? Number(selectedProduct.price) : 0) + warrantyPrice;
  const total = Math.max(0, subTotal - discountAmount);

  const handleWarrantyTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setWarrantyType(val);
    if (val === '6_months') setWarrantyPrice(500);
    else if (val === '1_year') setWarrantyPrice(1000);
    else setWarrantyPrice(0);
  };

  const toggleAccessory = (id: string) => {
    if (selectedAccessories.includes(id)) {
      setSelectedAccessories(selectedAccessories.filter(a => a !== id));
    } else {
      setSelectedAccessories([...selectedAccessories, id]);
    }
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    return `INV-${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !customerName || !customerPhone) {
      alert("Please select a product and provide customer details.");
      return;
    }

    setIsSubmitting(true);
    try {
      const invNumber = generateInvoiceNumber();
      const now = new Date().toISOString();

      const itemsPayload = [
        {
          type: 'product',
          id: selectedProduct.id,
          name: selectedProduct.title,
          price: selectedProduct.price,
          sku: selectedProduct.sku || ''
        },
        ...selectedAccessoriesData.map(a => ({
          type: 'accessory',
          id: a.id,
          name: a.name,
          price: 0 // Free accessories
        }))
      ];
      
      if (warrantyType !== 'none') {
        itemsPayload.push({
          type: 'warranty',
          id: `WARRANTY-${warrantyType}`,
          name: `Extended Warranty (${warrantyType === '6_months' ? '6 Months' : '1 Year'})`,
          price: warrantyPrice
        });
      }

      // 1. Create Order
      const orderData = {
        orderNumber: invNumber,
        customerName,
        customerPhone,
        customerEmail,
        totalAmount: total,
        paymentStatus: 'PAID',
        fulfillmentStatus: 'FULFILLED',
        deliveryType: 'In-Store POS',
        items: itemsPayload,
        createdAt: now
      };

      const orderRef = await addDoc(collection(db, 'orders'), orderData);
      
      // 2. Reduce Product Stock
      await updateDoc(doc(db, 'products', selectedProduct.id), {
        stock: increment(-1)
      });

      // 3. Reduce Accessories Inventory
      for (const acc of selectedAccessoriesData) {
        await updateDoc(doc(db, 'inventory', acc.id), {
          quantity: increment(-1)
        });
      }

      // 4. Create or Update Customer
      const q = query(collection(db, 'customers'), where('phone', '==', customerPhone));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Create new customer
        await addDoc(collection(db, 'customers'), {
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
          totalSpent: total,
          ordersCount: 1,
          createdAt: now,
          lastOrderDate: now
        });
      } else {
        // Update existing customer
        const custDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, 'customers', custDoc.id), {
          totalSpent: increment(total),
          ordersCount: increment(1),
          lastOrderDate: now
        });
      }

      setOrderId(invNumber);
      setInvoiceDate(now);
      setInvoiceGenerated(true);
    } catch (error: any) {
      console.error("Error processing checkout:", error);
      alert(`Failed to process sale. ${error?.message || "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <FormSkeleton />;
  }

  // --- INVOICE VIEW (PRINTABLE) ---
  if (invoiceGenerated) {
    return (
      <div className="bg-white min-h-screen text-black p-8 max-w-4xl mx-auto shadow-2xl relative print:shadow-none print:p-0 print:m-0">
        <div className="absolute top-8 right-8 print:hidden">
          <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-bold flex items-center gap-2">
            <Printer className="h-4 w-4" /> Print Invoice
          </button>
          <button onClick={() => window.location.reload()} className="mt-4 block text-center text-sm text-blue-600 hover:underline w-full">
            New Sale
          </button>
        </div>

        <div className="border-b-2 border-slate-200 pb-8 mb-8 flex justify-between items-start mt-8 print:mt-0">
          <div>
            <div className="text-3xl font-bold tracking-tight flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center font-bold text-white text-lg">TB</div>
              Tech Beast
            </div>
            <p className="text-sm text-slate-500">123 Tech Avenue, Silicon Valley, CA</p>
            <p className="text-sm text-slate-500">+1 (555) 123-4567 | support@techbeast.com</p>
          </div>
          <div className="text-right">
            <h2 className="text-4xl font-bold text-slate-200 uppercase tracking-widest mb-4">INVOICE</h2>
            <p className="text-sm font-bold text-slate-700">Invoice No: {orderId}</p>
            <p className="text-sm text-slate-500">Date: {new Date(invoiceDate).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="mb-12">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-200 pb-2">Bill To</h3>
          <p className="font-bold text-lg">{customerName}</p>
          <p className="text-sm text-slate-600">Phone: {customerPhone}</p>
          {customerEmail && <p className="text-sm text-slate-600">Email: {customerEmail}</p>}
        </div>

        <table className="w-full text-left mb-12 border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-900">
              <th className="py-3 font-bold text-sm uppercase tracking-widest">Description</th>
              <th className="py-3 font-bold text-sm uppercase tracking-widest text-center">Qty</th>
              <th className="py-3 font-bold text-sm uppercase tracking-widest text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="py-4">
                <p className="font-bold">{selectedProduct?.title}</p>
                <p className="text-xs text-slate-500">SKU: {selectedProduct?.sku || 'N/A'} | Condition: {selectedProduct?.condition}</p>
              </td>
              <td className="py-4 text-center">1</td>
              <td className="py-4 text-right font-bold">₹{Number(selectedProduct?.price).toLocaleString()}</td>
            </tr>
            {warrantyType !== 'none' && (
              <tr className="border-b border-slate-200">
                <td className="py-4">
                  <p className="font-semibold text-slate-700">Extended Warranty ({warrantyType === '6_months' ? '6 Months' : '1 Year'})</p>
                  <p className="text-xs text-slate-500">Add-on Service</p>
                </td>
                <td className="py-4 text-center">1</td>
                <td className="py-4 text-right font-bold">₹{warrantyPrice.toLocaleString()}</td>
              </tr>
            )}
            {selectedAccessoriesData.map((acc) => (
              <tr key={acc.id} className="border-b border-slate-200 bg-slate-50/50">
                <td className="py-4">
                  <p className="font-semibold text-slate-700">{acc.name}</p>
                  <p className="text-xs text-slate-500">Included Free Accessory</p>
                </td>
                <td className="py-4 text-center">1</td>
                <td className="py-4 text-right font-semibold text-emerald-600">FREE</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-64">
            <div className="flex justify-between py-2 border-b border-slate-200 text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-semibold">₹{subTotal.toLocaleString()}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between py-2 border-b border-slate-200 text-sm text-emerald-600">
                <span>Discount</span>
                <span className="font-semibold">- ₹{discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between py-4 text-xl font-bold">
              <span>Total</span>
              <span>₹{total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center border-t border-slate-200 pt-8">
          <p className="text-sm font-bold text-slate-700 mb-1">Thank you for your business!</p>
          <p className="text-xs text-slate-500">All electronics come with a standard testing warranty. Accessories are not covered under warranty.</p>
        </div>
      </div>
    );
  }

  // --- POS VIEW ---
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <div className="flex items-center gap-4">
        <Link to="/admin/orders" className="text-slate-500 hover:text-white transition-colors">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <ShoppingBag className="h-6 w-6 text-emerald-500" />
            New Offline Sale (POS)
          </h1>
          <p className="text-sm text-slate-500 mt-1">Generate an invoice and automatically deduct stock.</p>
        </div>
      </div>

      <form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Customer Details */}
          <div className="bg-[#0d0d0e] p-6 rounded-2xl border border-white/10 shadow-xl">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <User className="h-4 w-4" /> Customer Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input required type="text" placeholder="Customer Name *" value={customerName} onChange={e => setCustomerName(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500" />
              <input required type="tel" placeholder="Phone Number *" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500" />
              <input type="email" placeholder="Email Address (Optional)" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 md:col-span-2" />
            </div>
          </div>

          {/* Product Selection */}
          <div className="bg-[#0d0d0e] p-6 rounded-2xl border border-white/10 shadow-xl">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <Package className="h-4 w-4" /> Select Laptop / Main Product
            </h2>
            <select required value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer">
              <option value="" disabled className="bg-[#0d0d0e]">-- Select a product in stock --</option>
              {products.map(p => (
                <option key={p.id} value={p.id} className="bg-[#0d0d0e]">
                  {p.title} - ₹{Number(p.price).toLocaleString()} ({p.stock} in stock)
                </option>
              ))}
            </select>
          </div>

          {/* Extended Warranty */}
          <div className="bg-[#0d0d0e] p-6 rounded-2xl border border-white/10 shadow-xl">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-500" /> Extended Warranty
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <select value={warrantyType} onChange={handleWarrantyTypeChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer">
                <option value="none" className="bg-[#0d0d0e]">None (Standard 3 Months)</option>
                <option value="6_months" className="bg-[#0d0d0e]">6 Months</option>
                <option value="1_year" className="bg-[#0d0d0e]">1 Year</option>
              </select>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                <input type="number" min="0" value={warrantyPrice} onChange={e => setWarrantyPrice(Number(e.target.value))} disabled={warrantyType === 'none'} className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 disabled:opacity-50" placeholder="Price" />
              </div>
            </div>
          </div>

          {/* Free Accessories Selection */}
          <div className="bg-[#0d0d0e] p-6 rounded-2xl border border-white/10 shadow-xl">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <Gift className="h-4 w-4 text-amber-500" /> Included Free Accessories
            </h2>
            <p className="text-xs text-slate-500 mb-4">Select items to give for free. They will be deducted from inventory.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
              {inventory.map(item => (
                <label key={item.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selectedAccessories.includes(item.id) ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                  <input type="checkbox" checked={selectedAccessories.includes(item.id)} onChange={() => toggleAccessory(item.id)} className="w-4 h-4 rounded bg-black/50 border-white/20 text-emerald-500 focus:ring-emerald-500" />
                  <div>
                    <p className="text-sm font-bold text-white leading-tight">{item.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.quantity} in stock</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column - Summary */}
        <div>
          <div className="bg-[#0d0d0e] p-6 rounded-2xl border border-white/10 shadow-xl sticky top-24">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              {selectedProduct ? (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300 line-clamp-1 flex-1 pr-4">{selectedProduct.title}</span>
                  <span className="text-white font-bold whitespace-nowrap">₹{Number(selectedProduct.price).toLocaleString()}</span>
                </div>
              ) : (
                <div className="text-sm text-slate-600 italic">No product selected</div>
              )}
              
              {warrantyType !== 'none' && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300 line-clamp-1 flex-1 pr-4">Warranty ({warrantyType === '6_months' ? '6 Months' : '1 Year'})</span>
                  <span className="text-white font-bold whitespace-nowrap">₹{warrantyPrice.toLocaleString()}</span>
                </div>
              )}

              {selectedAccessoriesData.map(acc => (
                <div key={acc.id} className="flex justify-between text-sm">
                  <span className="text-slate-400 line-clamp-1 flex-1 pr-4 text-xs">+ {acc.name}</span>
                  <span className="text-emerald-500 font-bold text-xs whitespace-nowrap">FREE</span>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 pt-4 mb-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 font-bold uppercase">Subtotal</span>
                <span className="text-sm text-slate-300">₹{subTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 font-bold uppercase">Extra Discount</span>
                <input type="number" min="0" value={discountAmount} onChange={e => setDiscountAmount(Number(e.target.value))} className="w-24 bg-white/5 border border-white/10 rounded px-2 py-1 text-right text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 mb-8">
              <div className="flex justify-between items-end">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Total Pay</span>
                <span className="text-3xl font-bold text-white tracking-tight">₹{total.toLocaleString()}</span>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting || !selectedProductId} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white py-4 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-900/20 uppercase tracking-widest flex items-center justify-center gap-2">
              {isSubmitting ? 'Processing...' : (
                <>
                  <CheckCircle2 className="h-5 w-5" /> Finalize & Print Invoice
                </>
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
