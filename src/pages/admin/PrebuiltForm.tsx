import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, ShieldCheck } from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

import ImageUpload from '../../components/admin/ImageUpload';

interface UpgradeOption {
  id: string;
  name: string;
  price: number;
}

export default function PrebuiltForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(!!id);

  const [formData, setFormData] = useState({
    title: '',
    price: 0,
    oldPrice: 0,
    status: 'In Stock',
    imageUrl: '',
    imageUrls: [] as string[],

    // Base Hardware Specifications
    cabinet: '',
    processor: '',
    motherboard: '',
    gpu: '',
    psu: '',
    ram: '',
    cooler: '',
    primarySsd: '',
    secStorage: 'No Secondary Storage',
    os: 'Windows 11 Professional 64 Bit',
    monitor: '',
    keyboard: '',
    mouse: '',

    // Free Gift / Warranty Package
    freeGiftTitle: 'Premium Warranty Package (Worth ₹9,999) - FREE',
    freeGiftSubtext: 'Includes expert troubleshooting and free pick-up & drop. (Exclusively from Tech Beast Hubli)',
    freeGifts: '',

    // Configurable Component Upgrades
    ramUpgrades: [] as UpgradeOption[],
    coolerUpgrades: [] as UpgradeOption[],
    ssdUpgrades: [] as UpgradeOption[],
    secStorageUpgrades: [] as UpgradeOption[],
  });

  useEffect(() => {
    if (!id) return;
    const fetchDoc = async () => {
      try {
        // Try settings prebuilts first
        const settingsSnap = await getDoc(doc(db, 'settings', 'prebuilts'));
        if (settingsSnap.exists() && settingsSnap.data().items && settingsSnap.data().items[id]) {
          const docData = settingsSnap.data().items[id];
          setFormData(prev => ({ 
            ...prev, 
            ...docData, 
            imageUrls: docData.imageUrls || (docData.imageUrl ? [docData.imageUrl] : [])
          }));
          setLoading(false);
          return;
        }

        // Try products collection
        const prodSnap = await getDoc(doc(db, "products", id));
        if (prodSnap.exists()) {
          const docData = prodSnap.data();
          setFormData(prev => ({ 
            ...prev, 
            ...docData,
            imageUrls: docData.imageUrls || (docData.imageUrl ? [docData.imageUrl] : [])
          }));
        }
      } catch (err) {
        console.error("Error fetching prebuilt doc:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  // Helper for Array Upgrades
  const addUpgrade = (key: 'ramUpgrades' | 'coolerUpgrades' | 'ssdUpgrades' | 'secStorageUpgrades') => {
    setFormData(prev => ({
      ...prev,
      [key]: [...prev[key], { id: `upg-${Date.now()}`, name: '', price: 0 }]
    }));
  };

  const updateUpgrade = (key: 'ramUpgrades' | 'coolerUpgrades' | 'ssdUpgrades' | 'secStorageUpgrades', index: number, field: 'name' | 'price', val: any) => {
    setFormData(prev => {
      const list = [...prev[key]];
      list[index] = { ...list[index], [field]: field === 'price' ? Number(val) : val };
      return { ...prev, [key]: list };
    });
  };

  const removeUpgrade = (key: 'ramUpgrades' | 'coolerUpgrades' | 'ssdUpgrades' | 'secStorageUpgrades', index: number) => {
    setFormData(prev => {
      const list = [...prev[key]];
      list.splice(index, 1);
      return { ...prev, [key]: list };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert("Please enter a desktop title");
      return;
    }

    setIsSubmitting(true);
    try {
      const prebuiltId = id || `prebuilt-${Date.now()}`;
      const dataToSave: any = {
        ...formData,
        id: prebuiltId,
        category: 'Pre-built PC',
        isPrebuilt: true,
        price: Number(formData.price || 0),
        oldPrice: Number(formData.oldPrice || 0),
        imageUrls: formData.imageUrls || [],
        imageUrl: formData.imageUrls && formData.imageUrls.length > 0 ? formData.imageUrls[0] : '',
        updatedAt: new Date().toISOString()
      };

      // 1. Save to settings collection 'prebuilts' (always permitted)
      const settingsRef = doc(db, 'settings', 'prebuilts');
      const settingsSnap = await getDoc(settingsRef);
      const existingData = settingsSnap.exists() ? settingsSnap.data() : {};
      const existingItems = existingData.items || {};
      existingItems[prebuiltId] = dataToSave;
      await setDoc(settingsRef, { items: existingItems }, { merge: true });

      // 2. Save to products collection
      await setDoc(doc(db, "products", prebuiltId), dataToSave, { merge: true }).catch(() => {});

      navigate('/admin/prebuilt-pcs');
    } catch (err) {
      console.error("Error saving prebuilt desktop:", err);
      alert("Failed to save prebuilt desktop: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading prebuilt desktop data...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <button 
          onClick={() => navigate('/admin/prebuilt-pcs')}
          className="text-slate-400 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Prebuilt Desktops
        </button>

        <h1 className="text-xl font-bold text-white">
          {id ? 'Edit Prebuilt Gaming Desktop' : 'Create New Prebuilt Gaming Desktop'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* SECTION 1: BASIC DESKTOP INFORMATION */}
        <div className="bg-[#141415] border border-white/5 rounded-2xl p-6 space-y-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-3">
            1. Desktop Overview & Pricing
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block">Prebuilt Desktop Title *</label>
              <input 
                type="text" 
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. ADLER FLUX GAMING PREBUILT"
                required
                className="w-full bg-[#18181b] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block">Base Selling Price (₹) *</label>
              <input 
                type="number" 
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="98500"
                required
                className="w-full bg-[#18181b] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block">Old / List Price (₹)</label>
              <input 
                type="number" 
                name="oldPrice"
                value={formData.oldPrice}
                onChange={handleChange}
                placeholder="108000"
                className="w-full bg-[#18181b] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block">Stock Status</label>
              <select 
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-[#18181b] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                <option value="In Stock">In Stock</option>
                <option value="Pre-Order">Pre-Order / Custom Build</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2 border-t border-white/5 pt-4">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-2">Desktop Images</label>
              <ImageUpload 
                images={formData.imageUrls || []} 
                onChange={(urls) => setFormData({ ...formData, imageUrls: urls })} 
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: BASE HARDWARE SPECIFICATIONS */}
        <div className="bg-[#141415] border border-white/5 rounded-2xl p-6 space-y-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-3">
            2. Base Hardware Specifications (Appears in "Review Your PreBuilt")
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block">Cabinet / Case</label>
              <input 
                type="text" 
                name="cabinet"
                value={formData.cabinet}
                onChange={handleChange}
                placeholder="e.g. Ant Esports Crystal X6 ATX Mid Tower With 6 ARGB Fans"
                className="w-full bg-[#18181b] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block">Processor (CPU)</label>
              <input 
                type="text" 
                name="processor"
                value={formData.processor}
                onChange={handleChange}
                placeholder="e.g. AMD RYZEN 5 9600X (Upto 5.4GHz, 6 Cores- 12 Threads)"
                className="w-full bg-[#18181b] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block">Motherboard</label>
              <input 
                type="text" 
                name="motherboard"
                value={formData.motherboard}
                onChange={handleChange}
                placeholder="e.g. B850 GAMING X WiFi6E"
                className="w-full bg-[#18181b] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block">Graphics Card (GPU)</label>
              <input 
                type="text" 
                name="gpu"
                value={formData.gpu}
                onChange={handleChange}
                placeholder="e.g. RADEON RX 9060 XT 16GB GDDR6 128 Bit Dual Fan"
                className="w-full bg-[#18181b] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block">Power Supply (PSU)</label>
              <input 
                type="text" 
                name="psu"
                value={formData.psu}
                onChange={handleChange}
                placeholder="e.g. Deepcool 750 WATT 80 PLUS GOLD ATX 3.1"
                className="w-full bg-[#18181b] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block">Memory (RAM)</label>
              <input 
                type="text" 
                name="ram"
                value={formData.ram}
                onChange={handleChange}
                placeholder="e.g. 16GB DDR5 6000 MHZ CORSAIR/GSKILL"
                className="w-full bg-[#18181b] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block">CPU Cooler</label>
              <input 
                type="text" 
                name="cooler"
                value={formData.cooler}
                onChange={handleChange}
                placeholder="e.g. AORUS WATERFORCE II 240 ARGB Liquid CPU Cooler"
                className="w-full bg-[#18181b] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block">Primary Storage (SSD)</label>
              <input 
                type="text" 
                name="primarySsd"
                value={formData.primarySsd}
                onChange={handleChange}
                placeholder="e.g. 1 TB NVMe Gen 5.0 11,000 MB/s Crucial P510"
                className="w-full bg-[#18181b] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block">Secondary Storage</label>
              <input 
                type="text" 
                name="secStorage"
                value={formData.secStorage}
                onChange={handleChange}
                placeholder="e.g. No Secondary Storage"
                className="w-full bg-[#18181b] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block">Operating System</label>
              <input 
                type="text" 
                name="os"
                value={formData.os}
                onChange={handleChange}
                placeholder="e.g. Windows 11 professional 64 Bit"
                className="w-full bg-[#18181b] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block">Monitor (Optional)</label>
              <input 
                type="text" 
                name="monitor"
                value={formData.monitor}
                onChange={handleChange}
                placeholder='e.g. 19" Krysta LED Monitor'
                className="w-full bg-[#18181b] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block">Keyboard (Optional)</label>
              <input 
                type="text" 
                name="keyboard"
                value={formData.keyboard}
                onChange={handleChange}
                placeholder="e.g. USB Keyboard"
                className="w-full bg-[#18181b] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block">Mouse (Optional)</label>
              <input 
                type="text" 
                name="mouse"
                value={formData.mouse}
                onChange={handleChange}
                placeholder="e.g. USB Optical Mouse"
                className="w-full bg-[#18181b] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: FREE GIFT / WARRANTY PACKAGE CARD */}
        <div className="bg-[#141415] border border-white/5 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-400" /> 3. Free Warranty & Gift Package Card
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block">Free Package Title</label>
              <input 
                type="text" 
                name="freeGiftTitle"
                value={formData.freeGiftTitle}
                onChange={handleChange}
                placeholder="Premium Warranty Package (Worth ₹9,999) - FREE"
                className="w-full bg-[#18181b] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block">Package Subtext / Benefits</label>
              <input 
                type="text" 
                name="freeGiftSubtext"
                value={formData.freeGiftSubtext}
                onChange={handleChange}
                placeholder="Includes expert troubleshooting and free pick-up & drop."
                className="w-full bg-[#18181b] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block">Included Free Gifts (Comma separated)</label>
              <input 
                type="text" 
                name="freeGifts"
                value={formData.freeGifts}
                onChange={handleChange}
                placeholder="e.g. USB Keyboard, Gaming Mouse, WiFi Receiver, Mousepad, USB Speaker"
                className="w-full bg-[#18181b] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: CONFIGURABLE COMPONENT UPGRADES */}
        <div className="bg-[#141415] border border-white/5 rounded-2xl p-6 space-y-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-3">
            4. Component Upgrades (Appears in "Upgrade your prebuilt")
          </h2>

          {/* RAM Upgrades */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-300">RAM Upgrades</label>
              <button 
                type="button" 
                onClick={() => addUpgrade('ramUpgrades')}
                className="text-xs text-purple-400 hover:text-purple-300 font-bold uppercase tracking-wider flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add RAM Option
              </button>
            </div>
            {formData.ramUpgrades.map((u, i) => (
              <div key={i} className="flex items-center gap-3">
                <input 
                  type="text" 
                  placeholder="e.g. Upgrade to 32GB DDR5 6000MHz RAM"
                  value={u.name}
                  onChange={(e) => updateUpgrade('ramUpgrades', i, 'name', e.target.value)}
                  className="flex-1 bg-[#18181b] border border-white/10 rounded-xl p-2.5 text-xs text-white"
                />
                <input 
                  type="number" 
                  placeholder="Price (+₹)"
                  value={u.price}
                  onChange={(e) => updateUpgrade('ramUpgrades', i, 'price', e.target.value)}
                  className="w-32 bg-[#18181b] border border-white/10 rounded-xl p-2.5 text-xs text-white"
                />
                <button type="button" onClick={() => removeUpgrade('ramUpgrades', i)} className="p-2 text-slate-500 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Cooler Upgrades */}
          <div className="space-y-3 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-300">Cooler Upgrades</label>
              <button 
                type="button" 
                onClick={() => addUpgrade('coolerUpgrades')}
                className="text-xs text-purple-400 hover:text-purple-300 font-bold uppercase tracking-wider flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Cooler Option
              </button>
            </div>
            {formData.coolerUpgrades.map((u, i) => (
              <div key={i} className="flex items-center gap-3">
                <input 
                  type="text" 
                  placeholder="e.g. Upgrade to 360mm ARGB Liquid CPU Cooler"
                  value={u.name}
                  onChange={(e) => updateUpgrade('coolerUpgrades', i, 'name', e.target.value)}
                  className="flex-1 bg-[#18181b] border border-white/10 rounded-xl p-2.5 text-xs text-white"
                />
                <input 
                  type="number" 
                  placeholder="Price (+₹)"
                  value={u.price}
                  onChange={(e) => updateUpgrade('coolerUpgrades', i, 'price', e.target.value)}
                  className="w-32 bg-[#18181b] border border-white/10 rounded-xl p-2.5 text-xs text-white"
                />
                <button type="button" onClick={() => removeUpgrade('coolerUpgrades', i)} className="p-2 text-slate-500 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* SSD Upgrades */}
          <div className="space-y-3 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-300">Primary SSD Upgrades</label>
              <button 
                type="button" 
                onClick={() => addUpgrade('ssdUpgrades')}
                className="text-xs text-purple-400 hover:text-purple-300 font-bold uppercase tracking-wider flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add SSD Option
              </button>
            </div>
            {formData.ssdUpgrades.map((u, i) => (
              <div key={i} className="flex items-center gap-3">
                <input 
                  type="text" 
                  placeholder="e.g. Upgrade to 2TB Gen4 M.2 NVMe SSD"
                  value={u.name}
                  onChange={(e) => updateUpgrade('ssdUpgrades', i, 'name', e.target.value)}
                  className="flex-1 bg-[#18181b] border border-white/10 rounded-xl p-2.5 text-xs text-white"
                />
                <input 
                  type="number" 
                  placeholder="Price (+₹)"
                  value={u.price}
                  onChange={(e) => updateUpgrade('ssdUpgrades', i, 'price', e.target.value)}
                  className="w-32 bg-[#18181b] border border-white/10 rounded-xl p-2.5 text-xs text-white"
                />
                <button type="button" onClick={() => removeUpgrade('ssdUpgrades', i)} className="p-2 text-slate-500 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* SUBMIT ACTION BAR */}
        <div className="flex items-center justify-end gap-4 bg-[#141415] border border-white/5 p-4 rounded-2xl">
          <button 
            type="button" 
            onClick={() => navigate('/admin/prebuilt-pcs')}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-bold text-xs uppercase tracking-wider"
          >
            Cancel
          </button>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-purple-900/30 transition-all"
          >
            <Save className="w-4 h-4" /> {isSubmitting ? 'Saving Prebuilt Desktop...' : 'Save Prebuilt Desktop'}
          </button>
        </div>

      </form>
    </div>
  );
}
