import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, addDoc, updateDoc, doc, query, where, increment, runTransaction, getDoc } from 'firebase/firestore';
import { ShoppingBag, Printer, ArrowLeft, Package, User, CheckCircle2, Gift, ShieldCheck } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FormSkeleton } from '../../components/ui/Skeleton';
import { useAdmin } from '../../contexts/AdminContext';

export default function OfflineSale() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invoiceGenerated, setInvoiceGenerated] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');

  const { productsState, inventoryState, customersState } = useAdmin();
  const isLoading = productsState.loading || inventoryState.loading || customersState.loading;

  const products = productsState.data.filter((p: any) => p.stock > 0);
  const inventory = inventoryState.data.filter((i: any) => i.quantity > 0);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomerPhone(val);

    // Auto-fill logic
    const cleanVal = val.replace(/[\s\-+]/g, '');
    if (cleanVal.length >= 10) {
      const match = customersState.data.find((c: any) => {
        const cPhone = (c.phone || '').replace(/[\s\-+]/g, '');
        return cPhone === cleanVal || cPhone.endsWith(cleanVal.slice(-10));
      });
      if (match) {
        if (!customerName) setCustomerName(match.name || '');
        if (!customerEmail) setCustomerEmail(match.email || '');
      }
    }
  };

  interface SelectedProduct {
    id?: string;
    title: string;
    price: number;
    sku?: string;
    condition?: string;
    stock?: number;
    serialNumber?: string;
    conditionNote?: string;
  }
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customPrice, setCustomPrice] = useState<number | ''>('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]);
  const [discountAmount, setDiscountAmount] = useState(0);

  const [warrantyType, setWarrantyType] = useState('none');
  const [warrantyPrice, setWarrantyPrice] = useState(0);

  const [isEditing, setIsEditing] = useState(false);
  const [originalItems, setOriginalItems] = useState<any[]>([]);
  const [originalTotal, setOriginalTotal] = useState(0);
  const [initialLoading, setInitialLoading] = useState(!!id);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      setIsEditing(true);
      try {
        const orderSnap = await getDoc(doc(db, 'orders', id));
        if (orderSnap.exists()) {
          const data = orderSnap.data();
          setCustomerName(data.customerName || '');
          setCustomerPhone(data.customerPhone || '');
          setCustomerEmail(data.customerEmail || '');
          setOrderId(data.orderNumber || '');
          setPaymentMethod(data.paymentMethod || 'Cash');

          const items = data.items || [];
          setOriginalItems(items);

          const prods: SelectedProduct[] = [];
          const accs: string[] = [];
          let wType = 'none';
          let wPrice = 0;

          items.forEach((item: any) => {
            if (item.type === 'product') {
              prods.push({
                id: item.id?.startsWith('CUSTOM-') ? undefined : item.id,
                title: item.name,
                price: item.price,
                sku: item.sku,
                serialNumber: item.serialNumber,
                conditionNote: item.conditionNote
              });
            } else if (item.type === 'accessory') {
              accs.push(item.id);
            } else if (item.type === 'warranty') {
              if (item.id === 'WARRANTY-6_months') wType = '6_months';
              else if (item.id === 'WARRANTY-1_year') wType = '1_year';
              wPrice = item.price;
            }
          });

          setSelectedProducts(prods);
          setSelectedAccessories(accs);
          setWarrantyType(wType);
          setWarrantyPrice(wPrice);
          const calcSubTotal = prods.reduce((acc, p) => acc + Number(p.price), 0) + wPrice;
          const calcDiscount = Math.max(0, calcSubTotal - data.totalAmount);
          setDiscountAmount(calcDiscount);
          setOriginalTotal(data.totalAmount || 0);
        }
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const selectedAccessoriesData = inventory.filter(i => selectedAccessories.includes(i.id));

  const subTotal = selectedProducts.reduce((acc, p) => acc + Number(p.price), 0) + warrantyPrice;
  const total = Math.max(0, subTotal - discountAmount);

  const handleAddProduct = (product?: any) => {
    if (product) {
      setSelectedProducts([...selectedProducts, {
        id: product.id,
        title: product.title,
        price: product.price,
        sku: product.sku,
        condition: product.condition,
        stock: product.stock,
        serialNumber: '',
        conditionNote: ''
      }]);
      setSearchQuery('');
      setCustomPrice('');
      setShowSuggestions(false);
    } else {
      if (!searchQuery.trim()) { alert("Enter product name"); return; }
      if (customPrice === '' || Number(customPrice) < 0) { alert("Enter valid price"); return; }
      setSelectedProducts([...selectedProducts, {
        title: searchQuery.trim(),
        price: Number(customPrice),
        serialNumber: '',
        conditionNote: ''
      }]);
      setSearchQuery('');
      setCustomPrice('');
      setShowSuggestions(false);
    }
  };

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

  const generateInvoiceNumber = async () => {
    const counterRef = doc(db, 'settings', 'invoiceCounter');
    const newSeq = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      if (!counterDoc.exists()) {
        transaction.set(counterRef, { seq: 1 });
        return 1;
      }
      const newSeq = (counterDoc.data().seq || 0) + 1;
      transaction.update(counterRef, { seq: newSeq });
      return newSeq;
    });

    const date = new Date();
    return `INV-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${newSeq.toString().padStart(4, '0')}`;
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProducts.length === 0 || !customerName || !customerPhone) {
      alert("Please add at least one product and provide customer details.");
      return;
    }

    setIsSubmitting(true);
    try {
      let invNumber = orderId;
      if (!isEditing) {
        invNumber = await generateInvoiceNumber();
      }
      const now = new Date().toISOString();

      const itemsPayload = [
        ...selectedProducts.map(p => ({
          type: 'product',
          id: p.id || `CUSTOM-${Math.random().toString(36).substring(2, 9)}`,
          name: p.title,
          price: p.price,
          sku: p.sku || '',
          serialNumber: p.serialNumber || '',
          conditionNote: p.conditionNote || ''
        })),
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

      if (isEditing) {
        // 0. Restore Original Stock
        for (const item of originalItems) {
          if (item.type === 'product' && item.id && !item.id.startsWith('CUSTOM-')) {
            await updateDoc(doc(db, 'products', item.id), { stock: increment(1) }).catch(console.error);
          } else if (item.type === 'accessory' && item.id) {
            await updateDoc(doc(db, 'inventory', item.id), { quantity: increment(1) }).catch(console.error);
          }
        }
      }

      // 1. Create or Update Order
      const orderData: any = {
        orderNumber: invNumber,
        customerName,
        customerPhone,
        customerEmail,
        totalAmount: total,
        paymentStatus: 'PAID',
        paymentMethod,
        fulfillmentStatus: 'FULFILLED',
        deliveryType: 'In-Store POS',
        items: itemsPayload,
        updatedAt: now
      };

      if (isEditing) {
        await updateDoc(doc(db, 'orders', id!), orderData);
        setOrderId(invNumber);
      } else {
        orderData.createdAt = now;
        const orderRef = await addDoc(collection(db, 'orders'), orderData);
        setOrderId(invNumber);
      }

      // 2. Reduce Product Stock (only for DB products)
      for (const p of selectedProducts) {
        if (p.id && !p.id.startsWith('CUSTOM-')) {
          await updateDoc(doc(db, 'products', p.id), {
            stock: increment(-1)
          }).catch(console.error);
        }
      }

      // 3. Reduce Accessories Inventory
      for (const acc of selectedAccessoriesData) {
        await updateDoc(doc(db, 'inventory', acc.id), {
          quantity: increment(-1)
        }).catch(console.error);
      }

      // 4. Create or Update Customer
      const cleanPhone = customerPhone.replace(/[\s\-+]/g, '');
      const existingCust = customersState.data.find((c: any) => {
        const cPhone = (c.phone || '').replace(/[\s\-+]/g, '');
        return cPhone === cleanPhone || cPhone.endsWith(cleanPhone.slice(-10));
      });

      if (!existingCust) {
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
        const delta = isEditing ? total - originalTotal : total;
        const countDelta = isEditing ? 0 : 1;
        await updateDoc(doc(db, 'customers', existingCust.id), {
          totalSpent: increment(delta),
          ordersCount: increment(countDelta),
          lastOrderDate: now
        });
      }

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

  if (isLoading) {
    return <FormSkeleton />;
  }

  // --- INVOICE VIEW (PRINTABLE) ---
  if (invoiceGenerated) {
    return (
      <div className="bg-white min-h-screen print:min-h-0 text-black p-8 max-w-4xl mx-auto shadow-2xl relative print:shadow-none print:p-0 print:m-0">
        <div className="absolute top-8 right-8 print:hidden">
          <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-bold flex items-center gap-2">
            <Printer className="h-4 w-4" /> Print Invoice
          </button>
          <button onClick={() => window.location.reload()} className="mt-4 block text-center text-sm text-blue-600 hover:underline w-full">
            New Sale
          </button>
        </div>

        <div className="border-b-2 border-slate-200 pb-8 mb-8 flex justify-between items-start mt-8 print:mt-0 print:pb-4 print:mb-4">
          <div>
            <div className="text-3xl font-bold tracking-tight flex items-center gap-2 mb-2">
              <img src="/logo2.jpeg" alt="Store Logo" className="h-10 object-contain rounded" />
              Tech Beast
            </div>
            <p className="text-sm text-slate-500">Ground Floor, Shinde Complex,</p>
            <p className="text-sm text-slate-500">No.183 C Block, Hubballi, Karnataka 580029</p>
            <p className="text-sm text-slate-500">+91-9248071734 |techbeasthubli@gmail.com</p>
          </div>
          <div className="text-right">
            <h2 className="text-4xl font-bold text-slate-200 tracking-widest mb-4">Proforma Invoice</h2>
            <p className="text-sm font-bold text-slate-700">Invoice No: {orderId}</p>
            <p className="text-sm text-slate-500">Date: {new Date(invoiceDate).toLocaleDateString()}</p>
            <p className="text-sm font-bold text-emerald-600 mt-2 bg-emerald-50 inline-block px-2 py-1 rounded">Paid via {paymentMethod}</p>
          </div>
        </div>

        <div className="mb-12 print:mb-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-200 pb-2 print:mb-1 print:pb-1">Bill To</h3>
          <p className="font-bold text-lg print:text-base">{customerName}</p>
          <p className="text-sm print:text-xs text-slate-600">Phone: {customerPhone}</p>
          {customerEmail && <p className="text-sm print:text-xs text-slate-600">Email: {customerEmail}</p>}
        </div>

        <table className="w-full text-left mb-12 print:mb-4 border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-900">
              <th className="py-3 print:py-1 font-bold text-sm print:text-xs uppercase tracking-widest">Description</th>
              <th className="py-3 print:py-1 font-bold text-sm print:text-xs uppercase tracking-widest text-center">Qty</th>
              <th className="py-3 print:py-1 font-bold text-sm print:text-xs uppercase tracking-widest text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            {selectedProducts.map((p, i) => (
              <tr key={i} className="border-b border-slate-200">
                <td className="py-4 print:py-1.5">
                  <p className="font-bold print:text-sm">{p.title}</p>
                  <p className="text-xs text-slate-500 print:text-[10px]">
                    {p.id ? `SKU: ${p.sku || 'N/A'}` : 'Custom Item'}
                    {p.serialNumber && ` | SN: ${p.serialNumber}`}
                  </p>
                  {p.conditionNote && (
                    <p className="text-xs text-amber-600 print:text-[9px] mt-0.5">Condition: {p.conditionNote}</p>
                  )}
                </td>
                <td className="py-4 print:py-1.5 text-center print:text-sm">1</td>
                <td className="py-4 print:py-1.5 text-right font-bold print:text-sm">₹{Number(p.price).toLocaleString()}</td>
              </tr>
            ))}
            {warrantyType !== 'none' && (
              <tr className="border-b border-slate-200">
                <td className="py-4 print:py-1.5">
                  <p className="font-semibold text-slate-700 print:text-sm">Extended Warranty ({warrantyType === '6_months' ? '6 Months' : '1 Year'})</p>
                  <p className="text-xs text-slate-500 print:text-[10px]">Add-on Service</p>
                </td>
                <td className="py-4 print:py-1.5 text-center print:text-sm">1</td>
                <td className="py-4 print:py-1.5 text-right font-bold print:text-sm">₹{warrantyPrice.toLocaleString()}</td>
              </tr>
            )}
            {selectedAccessoriesData.map((acc) => (
              <tr key={acc.id} className="border-b border-slate-200 bg-slate-50/50 print:bg-transparent">
                <td className="py-4 print:py-1.5">
                  <p className="font-semibold text-slate-700 print:text-sm">{acc.name}</p>
                  <p className="text-xs text-slate-500 print:text-[10px]">Included Free Accessory</p>
                </td>
                <td className="py-4 print:py-1.5 text-center print:text-sm">1</td>
                <td className="py-4 print:py-1.5 text-right font-semibold text-emerald-600 print:text-sm">FREE</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-64 print:w-48">
            <div className="flex justify-between py-2 print:py-1 border-b border-slate-200 text-sm print:text-xs">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-semibold">₹{subTotal.toLocaleString()}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between py-2 print:py-1 border-b border-slate-200 text-sm print:text-xs text-emerald-600">
                <span>Discount</span>
                <span className="font-semibold">- ₹{discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between py-4 print:py-2 text-xl print:text-base font-bold">
              <span>Total</span>
              <span>₹{total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="mt-16 print:mt-4 border-t border-slate-200 pt-8 print:pt-4 flex flex-col md:flex-row print:flex-row justify-between items-end gap-8 print:gap-4">
          <div className="flex-1">
            <h4 className="text-sm print:text-xs font-bold text-slate-700 mb-2 print:mb-1 uppercase tracking-wider">Terms & Conditions</h4>
            <ul className="text-xs print:text-[9px] text-slate-500 list-disc pl-4 space-y-1 print:space-y-0 text-left">
              <li>All second-hand electronics come with a standard 3-month warranty.</li>
              <li>Extended warranty (if purchased) covers internal hardware failures and OS and softwere issues only.</li>
              <li>Physical damage, liquid damage, and short circuits are not covered under warranty.</li>
              <li>Accessories (chargers, Battery,) are covered under warranty.</li>
              <li>Goods once sold cannot be returned or exchanged.</li>
            </ul>
          </div>

          <div className="w-48 print:w-40 text-center mt-8 md:mt-0 print:mt-0 shrink-0">
            <div className="h-16 print:h-10 border-b border-slate-400 mb-2 print:mb-1"></div>
            <p className="text-sm print:text-xs font-bold text-slate-700">Authorized Signature</p>
            <p className="text-xs print:text-[10px] text-slate-500">Tech Beast</p>
          </div>
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
            {isEditing ? `Edit Invoice: ${orderId}` : 'New Offline Sale (POS)'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isEditing ? 'Update the details and save to automatically adjust inventory.' : 'Generate an invoice and automatically deduct stock.'}
          </p>
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
              <input required type="tel" placeholder="Phone Number *" value={customerPhone} onChange={handlePhoneChange} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500" />
              <input type="email" placeholder="Email Address (Optional)" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500" />
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 [&>option]:bg-[#1a1a1c]">
                <option value="Cash">Paid via Cash</option>
                <option value="UPI">Paid via UPI (PhonePe, GPay, etc.)</option>
                <option value="Credit/Debit Card">Paid via Credit/Debit Card</option>
                <option value="Bank Transfer">Paid via Bank Transfer</option>
              </select>
            </div>
          </div>

          {/* Product Selection */}
          <div className="bg-[#0d0d0e] p-6 rounded-2xl border border-white/10 shadow-xl relative z-20">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <Package className="h-4 w-4" /> Add Laptops / Products
            </h2>

            <div className="flex flex-col sm:flex-row gap-4 items-start mb-4 relative">
              <div className="w-full relative">
                <input
                  type="text"
                  placeholder="Type product name or custom item..."
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
                />

                {/* Autocomplete Dropdown */}
                {showSuggestions && searchQuery.trim().length > 0 && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowSuggestions(false)}></div>
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1c] border border-white/10 rounded-xl shadow-2xl max-h-60 overflow-y-auto z-50">
                      {products.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
                        products.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                          <div key={p.id} onClick={() => handleAddProduct(p)} className="p-3 hover:bg-white/10 cursor-pointer border-b border-white/5 last:border-0 flex justify-between items-center">
                            <div>
                              <p className="text-sm font-bold text-white">{p.title}</p>
                              <p className="text-xs text-slate-500">Stock: {p.stock} | SKU: {p.sku || 'N/A'}</p>
                            </div>
                            <span className="text-emerald-400 font-bold text-sm">₹{Number(p.price).toLocaleString()}</span>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-sm text-slate-400 italic">No matching products in inventory. Add as custom item.</div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="w-full sm:w-32 relative shrink-0">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Price"
                  value={customPrice}
                  onChange={e => setCustomPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-7 pr-3 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={() => handleAddProduct()}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-bold transition-colors shrink-0"
              >
                Add
              </button>
            </div>

            {/* Selected Products List */}
            {selectedProducts.length > 0 && (
              <div className="space-y-3 mt-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Added Items</h3>
                {selectedProducts.map((p, idx) => (
                  <div key={idx} className="flex flex-col bg-white/5 border border-white/10 p-4 rounded-xl gap-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
                      <div>
                        <p className="text-sm font-bold text-white">{p.title}</p>
                        <p className="text-xs text-slate-400">
                          {p.id ? `Inventory Item | SKU: ${p.sku || 'N/A'}` : 'Custom Item (No stock deduction)'}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <span className="text-sm font-bold text-white">₹{Number(p.price).toLocaleString()}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedProducts(selectedProducts.filter((_, i) => i !== idx))}
                          className="text-red-400 hover:text-red-300 text-sm p-1 font-bold"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    {/* Device Details Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                      <input
                        type="text"
                        placeholder="Serial Number / IMEI"
                        value={p.serialNumber || ''}
                        onChange={(e) => {
                          const newProds = [...selectedProducts];
                          newProds[idx].serialNumber = e.target.value;
                          setSelectedProducts(newProds);
                        }}
                        className="bg-[#0d0d0e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Condition Notes (e.g. Minor scratch)"
                        value={p.conditionNote || ''}
                        onChange={(e) => {
                          const newProds = [...selectedProducts];
                          newProds[idx].conditionNote = e.target.value;
                          setSelectedProducts(newProds);
                        }}
                        className="bg-[#0d0d0e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
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
              {selectedProducts.length > 0 ? (
                selectedProducts.map((p, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-slate-300 line-clamp-1 flex-1 pr-4">{p.title}</span>
                    <span className="text-white font-bold whitespace-nowrap">₹{Number(p.price).toLocaleString()}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-600 italic">No products added</div>
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

            <button
              type="submit"
              disabled={isSubmitting || (selectedProducts.length === 0)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors mt-6 shadow-xl shadow-emerald-900/20"
            >
              <Printer className="w-5 h-5" />
              {isSubmitting ? 'Processing...' : isEditing ? 'Update & Print Invoice' : 'Generate & Print Invoice'}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
