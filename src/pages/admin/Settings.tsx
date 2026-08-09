import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (!loading && settings) {
      // Initialize any missing arrays
      setFormData({
        ...settings,
        heroBanners: settings.heroBanners || [],
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
    setFormData({
      ...formData,
      heroBanners: [...formData.heroBanners, { imageUrl: '', link: '' }]
    });
  };

  const updateHeroBanner = (index: number, field: string, value: string) => {
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

            {/* Direct Gmail App Password Email Integration */}
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                Direct Gmail Sending (Google App Password & Anti-Spam Verified)
              </h3>
              <p className="text-xs text-slate-400">
                Send Proforma Invoice PDFs directly from your official Gmail (<code className="text-blue-400">techbeasthubli@gmail.com</code>) straight to customer inboxes with zero spam risk.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex flex-col gap-2 text-xs text-slate-400 font-bold uppercase tracking-widest">
                  Gmail Address
                  <input name="smtpEmail" value={formData.smtpEmail || formData.contactEmail || ''} onChange={handleChange} type="email" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case font-normal" placeholder="e.g. techbeasthubli@gmail.com" />
                </label>
                <label className="flex flex-col gap-2 text-xs text-slate-400 font-bold uppercase tracking-widest">
                  Google App Security Password (16-Digit Code)
                  <input name="smtpAppPassword" value={formData.smtpAppPassword || ''} onChange={handleChange} type="password" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case font-normal font-mono" placeholder="e.g. abcd efgh ijkl mnop" />
                </label>
              </div>

              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 space-y-2">
                <p className="font-bold text-blue-400">🔑 How to get your Google App Password in 1 minute:</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-300">
                  <li>Go to your Google Account (<strong>myaccount.google.com</strong>) ➔ <strong>Security</strong>.</li>
                  <li>Ensure <strong>2-Step Verification</strong> is ON.</li>
                  <li>Search for <strong>App passwords</strong>, select Mail, and click <strong>Create</strong>.</li>
                  <li>Paste the generated 16-character code into the Security Password box above!</li>
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
                        />
                      </div>
                      <div className="flex-1 space-y-4">
                        <label className="flex flex-col gap-2 text-xs text-slate-400 font-bold uppercase tracking-widest">
                          Link URL (Optional)
                          <input type="text" value={banner.link} onChange={(e) => updateHeroBanner(index, 'link', e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm normal-case" placeholder="/products?category=Laptops" />
                        </label>
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
