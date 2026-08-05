import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

export default function Settings() {
  const { settings, updateSettings, loading } = useSettings();
  const [formData, setFormData] = useState(settings);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!loading) {
      setFormData(settings);
    }
  }, [settings, loading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg('');
    try {
      await updateSettings(formData);
      setSuccessMsg('Settings saved successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Error saving settings. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-white">Loading settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Global Store Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage global configuration for your storefront like contact info, default policies, and offers.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#0d0d0e] rounded-3xl border border-white/10 shadow-2xl p-8 space-y-8">
        
        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-500 px-4 py-3 rounded-xl text-sm font-semibold">
            {successMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
            Store Name
            <input required name="storeName" value={formData.storeName} onChange={handleChange} type="text" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal" placeholder="e.g. TechBeast" />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
            Contact Email
            <input required name="contactEmail" value={formData.contactEmail} onChange={handleChange} type="email" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal" placeholder="e.g. support@techbeast.com" />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
            Support Phone Number
            <input required name="supportPhone" value={formData.supportPhone} onChange={handleChange} type="text" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal" placeholder="e.g. +91-9248071734" />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
            Estimated Dispatch Time
            <input required name="estimatedDispatch" value={formData.estimatedDispatch} onChange={handleChange} type="text" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal" placeholder="e.g. 24 - 48hrs" />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
            Bank Offer Text (Global)
            <input required name="bankOfferText" value={formData.bankOfferText} onChange={handleChange} type="text" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal" placeholder="e.g. 7.5% Instant Discount Up To Rs.2000/- with HDFC Bank" />
            <span className="text-xs text-slate-500 normal-case tracking-normal font-normal">This offer text will be shown on all product pages.</span>
          </label>
          
          <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
            Default Warranty Text
            <input required name="warrantyText" value={formData.warrantyText} onChange={handleChange} type="text" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal" placeholder="e.g. 6 Months TechBeast Certified Warranty" />
          </label>
        </div>

        <div className="flex justify-end pt-6 border-t border-white/10">
          <button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full text-sm font-bold transition-all shadow-lg shadow-blue-900/20 uppercase tracking-wider flex items-center gap-2">
            <Save className="h-4 w-4" />
            {isSubmitting ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
