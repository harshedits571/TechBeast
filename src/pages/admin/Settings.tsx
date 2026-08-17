import React, { useState, useEffect, useRef } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import { FormSkeleton } from '../../components/ui/Skeleton';
import { useSettings } from '../../contexts/SettingsContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import ImageUpload from '../../components/admin/ImageUpload';
import { deleteCloudinaryImage } from '../../utils/cloudinary';

export default function Settings() {
  const { settings, updateSettings, loading } = useSettings();
  const [formData, setFormData] = useState(settings);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  const [activeTab, setActiveTab] = useState('general');
  const [allProducts, setAllProducts] = useState<any[]>([]);

  const canvasRef = useRef<HTMLDivElement>(null);
  const [activeAction, setActiveAction] = useState<{
    type: 'drag' | 'resize';
    index: number;
    startX: number;
    startY: number;
    startXPercent: number;
    startYPercent: number;
    startWPercent: number;
    startHPercent: number;
  } | null>(null);

  useEffect(() => {
    if (!activeAction) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const dx = e.clientX - activeAction.startX;
      const dy = e.clientY - activeAction.startY;
      const dxPercent = (dx / canvasRect.width) * 100;
      const dyPercent = (dy / canvasRect.width) * 100;

      const newBanners = [...formData.heroBanners];
      const banner = newBanners[activeAction.index];

      if (activeAction.type === 'drag') {
        let newX = Math.round(activeAction.startXPercent + dxPercent);
        let newY = Math.round(activeAction.startYPercent + dyPercent);
        
        // Snapping boundaries
        if (Math.abs(newX) < 2) newX = 0;
        if (Math.abs(newY) < 2) newY = 0;
        const currentW = banner.w || 50;
        const currentH = banner.h || 50;
        if (Math.abs(newX + currentW - 100) < 2) newX = 100 - currentW;
        if (Math.abs(newY + currentH - 100) < 2) newY = 100 - currentH;

        newBanners[activeAction.index] = {
          ...banner,
          x: Math.max(0, Math.min(100 - currentW, newX)),
          y: Math.max(0, Math.min(1000, newY))
        };
      } else if (activeAction.type === 'resize') {
        let newW = Math.round(activeAction.startWPercent + dxPercent);
        let newH = Math.round(activeAction.startHPercent + dyPercent);

        newW = Math.max(5, Math.min(100 - (banner.x || 0), newW));
        newH = Math.max(5, Math.min(1000, newH));

        newBanners[activeAction.index] = {
          ...banner,
          w: newW,
          h: newH
        };
      }

      setFormData(prev => ({ ...prev, heroBanners: newBanners }));
    };

    const handleMouseUp = () => {
      setActiveAction(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeAction, formData.heroBanners]);

  useEffect(() => {
    if (!loading && settings) {
      // Initialize any missing arrays
      setFormData({
        ...settings,
        heroBanners: settings.heroBanners || [],
        heroAspectRatio: settings.heroAspectRatio || 1.5,
        flashSaleProductIds: settings.flashSaleProductIds || [],
        bestSellerIds: settings.bestSellerIds || [],
        newArrivalIds: settings.newArrivalIds || []
      });
    }
  }, [settings, loading]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snap = await getDocs(collection(db, 'products'));
        setAllProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error(err);
      }
    };
    fetchProducts();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleMultiSelect = (e: React.ChangeEvent<HTMLSelectElement>, field: string) => {
    const options = e.target.options;
    const selected: string[] = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setFormData({ ...formData, [field]: selected });
  };

  const renderProductSelector = (field: 'bestSellerIds' | 'newArrivalIds' | 'flashSaleProductIds', title: string, desc: string) => {
    const selectedIds = formData[field] || [];
    
    const handleAdd = (id: string) => {
      if (id && !selectedIds.includes(id)) {
        setFormData({ ...formData, [field]: [...selectedIds, id] });
      }
    };

    const handleRemove = (id: string) => {
      setFormData({ ...formData, [field]: selectedIds.filter(itemId => itemId !== id) });
    };

    const unselectedProducts = allProducts.filter(p => !selectedIds.includes(p.id));

    return (
      <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
        <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest mb-4">
          {title}
          <span className="text-xs text-slate-500 normal-case font-normal">{desc}</span>
        </label>
        
        <div className="space-y-2 mb-4">
          {selectedIds.length === 0 ? (
            <p className="text-sm text-slate-500 italic">No products selected.</p>
          ) : (
            selectedIds.map(id => {
              const prod = allProducts.find(p => p.id === id);
              return (
                <div key={id} className="flex items-center justify-between bg-black/40 border border-white/5 p-3 rounded-lg group hover:border-white/10 transition-colors">
                  <span className="text-sm text-slate-200 line-clamp-1">{prod ? prod.title : 'Unknown Product'}</span>
                  <button type="button" onClick={() => handleRemove(id)} className="text-slate-500 hover:text-red-400 p-1 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
        
        <select 
          onChange={(e) => { handleAdd(e.target.value); e.target.value = ''; }}
          className="w-full bg-[#0d0d0e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
          defaultValue=""
        >
          <option value="" disabled>-- Select a product to add --</option>
          {unselectedProducts.map(p => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
      </div>
    );
  };

  const addHeroBanner = () => {
    const defaultCoords = [
      { x: 0, y: 0, w: 66, h: 100 },      // Banner 1
      { x: 68, y: 0, w: 32, h: 48 },     // Banner 2
      { x: 68, y: 52, w: 32, h: 48 },    // Banner 3
      { x: 0, y: 105, w: 100, h: 25 }    // Banner 4
    ];
    const index = formData.heroBanners.length;
    const coords = defaultCoords[index] || { x: 0, y: 0, w: 50, h: 50 };

    setFormData({
      ...formData,
      heroBanners: [...formData.heroBanners, { 
        imageUrl: '', 
        link: '',
        x: coords.x,
        y: coords.y,
        w: coords.w,
        h: coords.h
      }]
    });
  };

  const updateHeroBanner = (index: number, field: string, value: any) => {
    const newBanners = [...formData.heroBanners];
    newBanners[index] = { ...newBanners[index], [field]: value };
    setFormData({ ...formData, heroBanners: newBanners });
  };

  const removeHeroBanner = async (index: number) => {
    const bannerToRemove = formData.heroBanners[index];
    if (bannerToRemove && bannerToRemove.imageUrl) {
      try {
        await deleteCloudinaryImage(bannerToRemove.imageUrl);
      } catch (err) {
        console.error("Failed to delete banner image from Cloudinary:", err);
      }
    }
    const newBanners = formData.heroBanners.filter((_, i) => i !== index);
    setFormData({ ...formData, heroBanners: newBanners });
  };

  const autoFitBannerImage = (index: number) => {
    const banner = formData.heroBanners[index];
    if (!banner.imageUrl) return;

    const img = new Image();
    img.src = banner.imageUrl;
    img.onload = () => {
      const imageAspect = img.width / img.height;
      const currentW = banner.w || 50;
      let newH = Math.round(currentW / imageAspect);
      newH = Math.max(5, Math.min(1000, newH));

      const newBanners = [...formData.heroBanners];
      newBanners[index] = {
        ...banner,
        h: newH
      };
      setFormData(prev => ({ ...prev, heroBanners: newBanners }));
    };
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

  if (loading) return <FormSkeleton />;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Store Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage global configuration, homepage design, and product curation.</p>
      </div>

      <div className="flex border-b border-white/10">
        <button onClick={() => setActiveTab('general')} className={`px-6 py-3 text-sm font-bold uppercase tracking-wider ${activeTab === 'general' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-300'}`}>General</button>
        <button onClick={() => setActiveTab('homepage')} className={`px-6 py-3 text-sm font-bold uppercase tracking-wider ${activeTab === 'homepage' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-300'}`}>Homepage & Offers</button>
        <button onClick={() => setActiveTab('curation')} className={`px-6 py-3 text-sm font-bold uppercase tracking-wider ${activeTab === 'curation' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-300'}`}>Product Curation</button>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#0d0d0e] rounded-3xl border border-white/10 shadow-2xl p-8 space-y-8 relative">
        
        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-500 px-4 py-3 rounded-xl text-sm font-semibold">
            {successMsg}
          </div>
        )}

        {/* GENERAL TAB */}
        {activeTab === 'general' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
                Store Name
                <input required name="storeName" value={formData.storeName} onChange={handleChange} type="text" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal" placeholder="e.g. TechBeast" />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
                Contact Email
                <input required name="contactEmail" value={formData.contactEmail} onChange={handleChange} type="email" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal" placeholder="e.g.techbeasthubli@gmail.com" />
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
                <input name="bankOfferText" value={formData.bankOfferText} onChange={handleChange} type="text" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal" placeholder="e.g. 7.5% Instant Discount Up To Rs.2000/- with HDFC Bank" />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
                Default Warranty Text
                <input required name="warrantyText" value={formData.warrantyText} onChange={handleChange} type="text" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal" placeholder="e.g. 6 Months TechBeast Certified Warranty" />
              </label>
            </div>

            {/* Direct Gmail Serverless Email Integration */}
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  🛡️ Direct Gmail Sending (Secure Vercel Environment)
                </h3>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                  Credentials Secured
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Send Proforma Invoice PDFs directly from your official Gmail (<code className="text-blue-400">techbeasthubli@gmail.com</code>) straight to customer inboxes with zero spam risk.
              </p>
              <div>
                <label className="flex flex-col gap-2 text-xs text-slate-400 font-bold uppercase tracking-widest">
                  Official Store Sender Email
                  <input name="contactEmail" value={formData.contactEmail || ''} onChange={handleChange} type="email" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case font-normal" placeholder="e.g. techbeasthubli@gmail.com" />
                </label>
              </div>

              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 space-y-2">
                <p className="font-bold text-blue-400">🔒 Secure Vercel Deployment Instructions:</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-300">
                  <li>In your <strong>Vercel Dashboard</strong>, navigate to <strong>Project Settings ➔ Environment Variables</strong>.</li>
                  <li>Add <code>SMTP_EMAIL</code> = <code>{formData.contactEmail || 'techbeasthubli@gmail.com'}</code></li>
                  <li>Add <code>SMTP_APP_PASSWORD</code> = your 16-character Google App Password (e.g. <code>abcd efgh ijkl mnop</code>).</li>
                  <li>Credentials stay strictly encrypted on the serverless backend and are never exposed to browser clients!</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* HOMEPAGE TAB */}
        {activeTab === 'homepage' && (
          <div className="space-y-8">
            {/* Promo Banner */}
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4">Top Promotional Banner</h3>
              <div className="flex items-center gap-4 mb-4">
                <input type="checkbox" id="promoBannerEnabled" name="promoBannerEnabled" checked={formData.promoBannerEnabled} onChange={handleChange} className="w-5 h-5 rounded bg-white/5 border border-white/20 text-blue-600 focus:ring-blue-500" />
                <label htmlFor="promoBannerEnabled" className="text-sm font-bold text-slate-300 cursor-pointer">Enable Promo Banner</label>
              </div>
              {formData.promoBannerEnabled && (
                <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
                  Promo Text
                  <input type="text" name="promoBannerText" value={formData.promoBannerText} onChange={handleChange} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 normal-case font-normal" placeholder="e.g. Weekend Sale! Get 20% off all accessories." />
                </label>
              )}
            </div>

            {/* Hero Banners */}
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white">Hero Banners (Slider)</h3>
                <button type="button" onClick={addHeroBanner} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider">
                  <Plus className="h-4 w-4" /> Add Banner
                </button>
              </div>
              
              {/* CANVAS ASPECT RATIO CONTROL */}
              {formData.heroBanners.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/40 p-4 rounded-xl border border-white/5 mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Canvas Height Adjuster</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Drag the slider to adjust the height (aspect ratio) of the main hero section.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Taller</span>
                    <input 
                      type="range" 
                      min="0.8" 
                      max="3.0" 
                      step="0.05" 
                      value={formData.heroAspectRatio !== undefined ? formData.heroAspectRatio : 1.5}
                      onChange={(e) => setFormData(prev => ({ ...prev, heroAspectRatio: Number(e.target.value) }))}
                      className="w-48 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Wider</span>
                    <span className="text-xs bg-blue-600 text-white font-bold px-2 py-1 rounded text-mono">
                      {(formData.heroAspectRatio !== undefined ? formData.heroAspectRatio : 1.5).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* VISUAL LAYOUT BUILDER CANVAS */}
              {formData.heroBanners.length > 0 && (
                <div className="mb-6 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block">
                    🖥️ Visual Canvas Designer (Photoshop Style - Click & Drag to Position, Drag Corner to Resize)
                  </span>
                  <div 
                    ref={canvasRef}
                    style={{ aspectRatio: `${formData.heroAspectRatio || 1.5} / 1` }}
                    className="relative w-full bg-slate-950 rounded-2xl border border-white/10 overflow-hidden select-none"
                  >
                    {formData.heroBanners.map((banner, index) => {
                      const x = banner.x !== undefined ? banner.x : 0;
                      const y = banner.y !== undefined ? banner.y : 0;
                      const w = banner.w !== undefined ? banner.w : 50;
                      const h = banner.h !== undefined ? banner.h : 50;

                      return (
                        <div
                          key={index}
                          style={{
                            position: 'absolute',
                            left: `${x}%`,
                            top: `${y * (formData.heroAspectRatio || 1.5)}%`,
                            width: `${w}%`,
                            height: `${h * (formData.heroAspectRatio || 1.5)}%`,
                          }}
                          className={`group/banner rounded-xl overflow-hidden border-2 ${
                            activeAction?.index === index ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-white/20 hover:border-blue-500/50'
                          } bg-slate-900 transition-shadow`}
                        >
                          {banner.imageUrl ? (
                            banner.fitMode === 'contain-blur' || !banner.fitMode ? (
                              <div className="relative w-full h-full overflow-hidden bg-slate-950 flex items-center justify-center">
                                <img 
                                  src={banner.imageUrl} 
                                  alt="Blur Background" 
                                  className="absolute inset-0 w-full h-full object-cover blur-xl opacity-40 scale-110 pointer-events-none"
                                />
                                <img 
                                  src={banner.imageUrl} 
                                  alt={`Banner ${index + 1}`}
                                  className="w-full h-full object-contain relative z-10 pointer-events-none"
                                />
                              </div>
                            ) : (
                              <img 
                                src={banner.imageUrl} 
                                alt={`Banner ${index + 1}`}
                                className={`w-full h-full pointer-events-none ${
                                  banner.fitMode === 'contain' ? 'object-contain bg-slate-900/50' : 
                                  banner.fitMode === 'fill' ? 'object-fill' : 'object-cover'
                                }`}
                              />
                            )
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-semibold">
                              No Image
                            </div>
                          )}

                          <div 
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setActiveAction({
                                type: 'drag',
                                index,
                                startX: e.clientX,
                                startY: e.clientY,
                                startXPercent: x,
                                startYPercent: y,
                                startWPercent: w,
                                startHPercent: h
                              });
                            }}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover/banner:opacity-100 transition-opacity flex flex-col justify-between p-2 cursor-move"
                          >
                            <div className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded self-start">
                              Banner {index + 1}
                            </div>
                            
                            <div className="text-[10px] text-slate-300 font-bold self-start">
                              Drag to move
                            </div>
                          </div>

                          <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-sm border border-white/15 px-1.5 py-0.5 rounded text-[9px] font-black text-white z-20 pointer-events-none group-hover/banner:hidden">
                            #{index + 1}
                          </div>

                          <div 
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setActiveAction({
                                type: 'resize',
                                index,
                                startX: e.clientX,
                                startY: e.clientY,
                                startXPercent: x,
                                startYPercent: y,
                                startWPercent: w,
                                startHPercent: h
                              });
                            }}
                            className="absolute bottom-1 right-1 w-4 h-4 bg-blue-500 hover:bg-blue-600 border border-white/20 rounded cursor-se-resize flex items-center justify-center shadow z-30"
                          >
                            <svg width="6" height="6" viewBox="0 0 6 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M6 0L0 6M6 3L3 6" stroke="white" strokeWidth="1" strokeLinecap="round" />
                            </svg>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {formData.heroBanners.length === 0 ? (
                <p className="text-slate-500 text-sm italic">No banners added. Homepage will use default design.</p>
              ) : (
                <div className="space-y-6">
                  {formData.heroBanners.map((banner, index) => (
                    <div key={index} className="flex gap-6 items-start p-4 bg-[#0d0d0e] rounded-xl border border-white/5">
                      <div className="w-48 flex-shrink-0">
                        <ImageUpload
                          images={banner.imageUrl ? [banner.imageUrl] : []}
                          onChange={(urls) => updateHeroBanner(index, 'imageUrl', urls[0] || '')}
                          maxImages={1}
                        />
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <label className="flex flex-col gap-2 text-xs text-slate-400 font-bold uppercase tracking-widest">
                            Link URL (Optional)
                            <input type="text" value={banner.link} onChange={(e) => updateHeroBanner(index, 'link', e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm normal-case font-normal" placeholder="/products?category=Laptops" />
                          </label>

                          <label className="flex flex-col gap-2 text-xs text-slate-400 font-bold uppercase tracking-widest">
                            Image Fit Mode
                            <div className="flex gap-2">
                              <select 
                                value={banner.fitMode || 'cover'} 
                                onChange={(e) => updateHeroBanner(index, 'fitMode', e.target.value)} 
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 font-normal font-sans"
                              >
                                <option value="cover" className="bg-[#0d0d0e]">Cover (Fill & Crop)</option>
                                <option value="contain" className="bg-[#0d0d0e]">Contain (Fit Fully)</option>
                                <option value="fill" className="bg-[#0d0d0e]">Stretch (Distort to Fit)</option>
                              </select>
                              {banner.imageUrl && (
                                <button
                                  type="button"
                                  onClick={() => autoFitBannerImage(index)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                                  title="Automatically adjusts height to match image aspect ratio perfectly"
                                >
                                  Auto-Fit Size
                                </button>
                              )}
                            </div>
                          </label>
                        </div>

                        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/5">
                          <label className="flex flex-col gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            X Pos (%)
                            <input 
                              type="number" 
                              value={banner.x !== undefined ? banner.x : 0} 
                              onChange={(e) => updateHeroBanner(index, 'x', Number(e.target.value))} 
                              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-xs text-center font-normal" 
                            />
                          </label>
                          <label className="flex flex-col gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Y Pos (%)
                            <input 
                              type="number" 
                              value={banner.y !== undefined ? banner.y : 0} 
                              onChange={(e) => updateHeroBanner(index, 'y', Number(e.target.value))} 
                              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-xs text-center font-normal" 
                            />
                          </label>
                          <label className="flex flex-col gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Width (%)
                            <input 
                              type="number" 
                              value={banner.w !== undefined ? banner.w : 50} 
                              onChange={(e) => updateHeroBanner(index, 'w', Number(e.target.value))} 
                              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-xs text-center font-normal" 
                            />
                          </label>
                          <label className="flex flex-col gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Height (%)
                            <input 
                              type="number" 
                              value={banner.h !== undefined ? banner.h : 50} 
                              onChange={(e) => updateHeroBanner(index, 'h', Number(e.target.value))} 
                              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-xs text-center font-normal" 
                            />
                          </label>
                        </div>
                      </div>
                      <button type="button" onClick={() => removeHeroBanner(index)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Promo Cards */}
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4">Promotional Cards</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {['card1', 'card2'].map((cardKey, index) => {
                  const card = formData.promoCards?.[cardKey as keyof typeof formData.promoCards] || { subtitle: '', title: '', link: '', bgColor: 'blue' };
                  return (
                    <div key={cardKey} className="p-4 bg-[#0d0d0e] rounded-xl border border-white/5 space-y-4">
                      <h4 className="text-white font-bold mb-2">Card {index + 1}</h4>
                      <label className="flex flex-col gap-2 text-xs text-slate-400 font-bold uppercase tracking-widest">
                        Subtitle (Small Text)
                        <input type="text" value={card.subtitle} onChange={(e) => setFormData({...formData, promoCards: {...formData.promoCards, [cardKey]: {...card, subtitle: e.target.value}}})} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm normal-case" placeholder="e.g. Weekend Deals" />
                      </label>
                      <label className="flex flex-col gap-2 text-xs text-slate-400 font-bold uppercase tracking-widest">
                        Title (Large Text)
                        <input type="text" value={card.title} onChange={(e) => setFormData({...formData, promoCards: {...formData.promoCards, [cardKey]: {...card, title: e.target.value}}})} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm normal-case" placeholder="e.g. Next-gen gaming console" />
                      </label>
                      <label className="flex flex-col gap-2 text-xs text-slate-400 font-bold uppercase tracking-widest">
                        Link URL
                        <input type="text" value={card.link} onChange={(e) => setFormData({...formData, promoCards: {...formData.promoCards, [cardKey]: {...card, link: e.target.value}}})} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm normal-case" placeholder="/products" />
                      </label>
                      <label className="flex flex-col gap-2 text-xs text-slate-400 font-bold uppercase tracking-widest">
                        Background Color
                        <select value={card.bgColor} onChange={(e) => setFormData({...formData, promoCards: {...formData.promoCards, [cardKey]: {...card, bgColor: e.target.value}}})} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm normal-case">
                          <option value="blue" className="bg-[#0d0d0e]">Blue</option>
                          <option value="red" className="bg-[#0d0d0e]">Red</option>
                          <option value="green" className="bg-[#0d0d0e]">Green</option>
                          <option value="dark" className="bg-[#0d0d0e]">Dark Slate</option>
                        </select>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Flash Sale */}
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4">Flash Sale Deals</h3>
              <div className="flex items-center gap-4 mb-4">
                <input type="checkbox" id="flashSaleEnabled" name="flashSaleEnabled" checked={formData.flashSaleEnabled} onChange={handleChange} className="w-5 h-5 rounded bg-white/5 border border-white/20 text-blue-600 focus:ring-blue-500" />
                <label htmlFor="flashSaleEnabled" className="text-sm font-bold text-slate-300 cursor-pointer">Enable Flash Sale Section</label>
              </div>
              
              {formData.flashSaleEnabled && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
                      Flash Sale Badge Text
                      <input type="text" name="flashSaleTitle" value={formData.flashSaleTitle || ''} onChange={handleChange} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 normal-case font-normal" placeholder="e.g. Flash Sale" />
                    </label>
                    <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
                      Flash Sale Subtitle
                      <input type="text" name="flashSaleSubtitle" value={formData.flashSaleSubtitle || ''} onChange={handleChange} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 normal-case font-normal" placeholder="e.g. Today's Special Deals" />
                    </label>
                  </div>
                  <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
                    End Date/Time
                    <input type="datetime-local" name="flashSaleEndTime" value={formData.flashSaleEndTime ? new Date(formData.flashSaleEndTime).toISOString().slice(0, 16) : ''} onChange={(e) => setFormData({...formData, flashSaleEndTime: new Date(e.target.value).toISOString()})} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 normal-case font-normal" />
                  </label>
                  
                  <div className="pt-4">
                    {renderProductSelector('flashSaleProductIds', 'Flash Sale Products', 'Select which products are part of the current flash sale.')}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CURATION TAB */}
        {activeTab === 'curation' && (
          <div className="space-y-8">
            {renderProductSelector('bestSellerIds', 'Best Sellers', 'Select which products to showcase in the Best Sellers section on the homepage.')}
            {renderProductSelector('newArrivalIds', 'New Arrivals', 'Select which products to showcase in the New Arrivals section.')}
          </div>
        )}

        <div className="flex justify-end pt-6 border-t border-white/10 pb-2">
          <button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full text-sm font-bold transition-all shadow-lg shadow-blue-900/20 uppercase tracking-wider flex items-center gap-2">
            <Save className="h-4 w-4" />
            {isSubmitting ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
