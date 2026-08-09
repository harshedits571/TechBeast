import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, Printer, User, Laptop, Wrench, FileText } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, addDoc, doc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { FormSkeleton } from '../../components/ui/Skeleton';
import { useAdmin } from '../../contexts/AdminContext';

export default function RepairForm() {
  const { customersState } = useAdmin();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customerFound, setCustomerFound] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    deviceType: 'Laptop',
    brand: '',
    model: '',
    serialNumber: '',
    cosmeticCondition: '',
    accessories: [] as string[],
    issue: '',
    estimatedCost: '',
    deliveryDate: '',
    devicePassword: '',
    status: 'Pending'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, customerPhone: val }));
    
    const cleanVal = val.replace(/[\s\-+]/g, '');
    if (cleanVal.length >= 10) {
      const match = customersState.data.find((c: any) => {
        const cPhone = (c.phone || '').replace(/[\s\-+]/g, '');
        return cPhone === cleanVal || cPhone.endsWith(cleanVal.slice(-10));
      });
      if (match) {
        setFormData(prev => ({
          ...prev,
          customerName: prev.customerName || match.name || '',
          customerEmail: prev.customerEmail || match.email || ''
        }));
        setCustomerFound(true);
      } else {
        setCustomerFound(false);
      }
    } else {
      setCustomerFound(false);
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (e.target.checked) {
      setFormData({ ...formData, accessories: [...formData.accessories, value] });
    } else {
      setFormData({ ...formData, accessories: formData.accessories.filter(a => a !== value) });
    }
  };

  const generateTicketNumber = async () => {
    let newSeq = 1;
    try {
      const snap = await getDocs(query(collection(db, 'repairs'), orderBy('createdAt', 'desc'), limit(1)));
      if (!snap.empty) {
        const lastTicket = snap.docs[0].data();
        if (lastTicket.ticketNumber) {
          const parts = lastTicket.ticketNumber.split('-');
          if (parts.length === 3) {
            const numPart = parseInt(parts[2], 10);
            if (!isNaN(numPart)) newSeq = numPart + 1;
          }
        }
      }
    } catch (err) {
      console.warn("Could not fetch last ticket for sequential ID, using fallback", err);
      newSeq = Math.floor(Math.random() * 9000) + 1000;
    }
    const date = new Date();
    return `REP-${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${newSeq.toString().padStart(4, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerName || !formData.customerPhone || !formData.brand || !formData.model || !formData.serialNumber || !formData.issue) {
      alert("Please fill out all the required fields (Name, Phone, Brand, Model, Serial Number, and Issue).");
      return;
    }

    setIsSubmitting(true);
    try {
      // Auto-create customer if they don't exist
      try {
        const cleanPhone = formData.customerPhone.replace(/[\s\-+]/g, '');
        const existingCust = customersState.data.find((c: any) => {
          const cPhone = (c.phone || '').replace(/[\s\-+]/g, '');
          return cPhone === cleanPhone || cPhone.endsWith(cleanPhone.slice(-10));
        });
        
        if (!existingCust) {
          await addDoc(collection(db, 'customers'), {
            name: formData.customerName,
            phone: formData.customerPhone.trim(),
            email: formData.customerEmail,
            totalSpent: 0,
            ordersCount: 0,
            createdAt: new Date().toISOString()
          });
        }
      } catch (custError) {
        console.error("Non-fatal error creating customer record:", custError);
        // Continue to save repair ticket even if CRM update fails (e.g. permission rules)
      }

      const ticketNumber = await generateTicketNumber();

      const dataToSave = {
        ...formData,
        ticketNumber,
        estimatedCost: Number(formData.estimatedCost) || 0,
        createdAt: new Date().toISOString(),
        internalNotes: []
      };
      
      await addDoc(collection(db, "repairs"), dataToSave);
      navigate('/admin/repairs');
    } catch (error) {
      console.error("Error adding ticket: ", error);
      alert("Error generating ticket: " + (error as any).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <FormSkeleton />;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">New Service Ticket</h1>
          <p className="text-sm text-slate-500 mt-1">Create a new repair order and generate a service receipt.</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate('/admin/repairs')} className="px-5 py-2 text-xs font-bold text-slate-300 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all uppercase tracking-wider">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full text-xs font-bold transition-all shadow-lg shadow-blue-900/20 uppercase tracking-wider flex items-center gap-2">
            <Save className="h-4 w-4" />
            {isSubmitting ? "Saving..." : "Save & Generate Ticket"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Customer Information */}
          <div className="bg-[#0d0d0e] p-8 rounded-3xl border border-white/10 shadow-2xl">
            <h2 className="text-sm font-bold text-white flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                Customer Information
              </div>
              {customerFound && <span className="text-[10px] text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">Existing Customer Found</span>}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Phone Number *</label>
                <input required type="tel" name="customerPhone" value={formData.customerPhone} onChange={handlePhoneChange} placeholder="Enter customer phone" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors" />
                <p className="text-[10px] text-slate-500 mt-1">Type phone to auto-fetch details</p>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Full Name *</label>
                <input name="customerName" value={formData.customerName} onChange={handleChange} type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all" placeholder="e.g. John Doe" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Email Address</label>
                <input name="customerEmail" value={formData.customerEmail} onChange={handleChange} type="email" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all" placeholder="john@example.com" />
              </div>
            </div>
          </div>

          {/* Device Information */}
          <div className="bg-[#0d0d0e] p-8 rounded-3xl border border-white/10 shadow-2xl">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              Device Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Device Type *</label>
                <select name="deviceType" value={formData.deviceType} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all">
                  <option className="bg-[#0d0d0e] text-white" value="Laptop">Laptop</option>
                  <option className="bg-[#0d0d0e] text-white" value="Desktop">Desktop</option>
                  <option className="bg-[#0d0d0e] text-white" value="MacBook">MacBook</option>
                  <option className="bg-[#0d0d0e] text-white" value="iMac">iMac</option>
                  <option className="bg-[#0d0d0e] text-white" value="Tablet">Tablet</option>
                  <option className="bg-[#0d0d0e] text-white" value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Brand *</label>
                <input name="brand" value={formData.brand} onChange={handleChange} type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all" placeholder="e.g. Dell, Apple, HP" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Model *</label>
                <input name="model" value={formData.model} onChange={handleChange} type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all" placeholder="e.g. XPS 13, MacBook Pro" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Serial Number *</label>
                <input name="serialNumber" value={formData.serialNumber} onChange={handleChange} type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all" placeholder="S/N or Service Tag" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Device Password / PIN</label>
                <input name="devicePassword" value={formData.devicePassword} onChange={handleChange} type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all" placeholder="Leave blank if none or removed" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Cosmetic Condition</label>
                <input name="cosmeticCondition" value={formData.cosmeticCondition} onChange={handleChange} type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all" placeholder="e.g. Minor scratches on top cover, clean screen" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Accessories Submitted</label>
                <div className="flex flex-wrap gap-4 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" value="Charger" onChange={handleCheckboxChange} className="rounded text-blue-600 focus:ring-blue-500 border-white/20 bg-white/5" />
                    <span className="text-sm text-slate-300 font-bold">Charger / Adapter</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" value="Bag" onChange={handleCheckboxChange} className="rounded text-blue-600 focus:ring-blue-500 border-white/20 bg-white/5" />
                    <span className="text-sm text-slate-300 font-bold">Laptop Bag</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" value="Mouse" onChange={handleCheckboxChange} className="rounded text-blue-600 focus:ring-blue-500 border-white/20 bg-white/5" />
                    <span className="text-sm text-slate-300 font-bold">Mouse</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Issue Description */}
          <div className="bg-[#0d0d0e] p-8 rounded-3xl border border-white/10 shadow-2xl">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              Service Details
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Reported Issue *</label>
                <textarea name="issue" value={formData.issue} onChange={handleChange} rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all resize-none" placeholder="Describe the problem in detail..."></textarea>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Estimated Cost (₹)</label>
                <input name="estimatedCost" value={formData.estimatedCost} onChange={handleChange} type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all" placeholder="0" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Expected Delivery Date</label>
                <input name="deliveryDate" value={formData.deliveryDate} onChange={handleChange} type="date" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all" />
              </div>
            </div>
          </div>

          <div className="bg-[#141415] p-6 rounded-3xl border border-blue-500/20 text-sm text-slate-400">
            <p className="font-bold text-blue-400 mb-2 uppercase tracking-widest text-[10px]">Internal Note</p>
            Generating this ticket will instantly create a unique QR code. Print the labels immediately to tag the device and accessories to prevent mix-ups.
          </div>
        </div>
      </div>
    </form>
  );
}
