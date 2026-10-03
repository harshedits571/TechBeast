import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Monitor, Cpu, ShieldCheck, ArrowRight, Sparkles, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

export default function PrebuiltPCs() {
  const [prebuilts, setPrebuilts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchPrebuilts();
  }, []);

  const fetchPrebuilts = async () => {
    try {
      setLoading(true);
      const uniqueMap = new Map<string, any>();

      // 1. Fetch from settings document 'prebuilts'
      try {
        const settingsSnap = await getDoc(doc(db, 'settings', 'prebuilts'));
        if (settingsSnap.exists() && settingsSnap.data().items) {
          const items = settingsSnap.data().items;
          Object.keys(items).forEach(key => {
            const item = items[key];
            if (item && item.status !== 'Offline') {
              uniqueMap.set(key, { id: key, ...item });
            }
          });
        }
      } catch (e) {
        console.warn("Settings prebuilts read error:", e);
      }

      // 2. Fetch from 'prebuilts' collection
      try {
        const snap = await getDocs(collection(db, "prebuilts"));
        snap.docs.forEach(d => {
          const item: any = d.data();
          if (item && item.status !== 'Offline') {
            const existing = uniqueMap.get(d.id) || {};
            uniqueMap.set(d.id, { ...existing, id: d.id, ...item });
          } else if (item && item.status === 'Offline') {
            uniqueMap.delete(d.id); // Explicitly remove if marked offline
          }
        });
      } catch (e) {
        console.warn("Prebuilt collection read error:", e);
      }

      // 3. Fetch from 'products' collection
      try {
        const prodSnap = await getDocs(collection(db, "products"));
        prodSnap.docs.forEach(d => {
          const data: any = d.data();
          const isPrebuilt = data.isPrebuilt || data.category === 'Pre-built PC' || data.category === 'Prebuilt PC' || (typeof data.category === 'string' && data.category.toLowerCase().includes('prebuilt'));
          if (isPrebuilt) {
            if (data.status !== 'Offline') {
              const existing = uniqueMap.get(d.id) || {};
              uniqueMap.set(d.id, { ...existing, id: d.id, ...data });
            } else {
              uniqueMap.delete(d.id);
            }
          }
        });
      } catch (e) {
        console.warn("Products read error for prebuilts:", e);
      }

      // 4. Fetch from 'prebuilt-pcs' collection
      try {
        const pcsSnap = await getDocs(collection(db, "prebuilt-pcs"));
        pcsSnap.docs.forEach(d => {
          const item: any = d.data();
          if (item && item.status !== 'Offline') {
            const existing = uniqueMap.get(d.id) || {};
            uniqueMap.set(d.id, { ...existing, id: d.id, ...item });
          } else if (item && item.status === 'Offline') {
            uniqueMap.delete(d.id);
          }
        });
      } catch (e) {}

      // Final pass: ensure strict filtering of any Offline items
      const finalList = Array.from(uniqueMap.values()).filter(p => p && p.status !== 'Offline');
      setPrebuilts(finalList);
    } catch (err) {
      console.error("Error fetching prebuilts for store:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStockBadge = (status: string) => {
    switch (status) {
      case 'Out of Stock':
        return {
          bg: 'bg-red-600 text-white',
          icon: <AlertCircle className="w-3 h-3" />,
          label: 'Out of Stock'
        };
      case 'Pre-Order':
        return {
          bg: 'bg-blue-600 text-white',
          icon: <Clock className="w-3 h-3" />,
          label: 'Pre-Order'
        };
      case 'In Stock':
      default:
        return {
          bg: 'bg-emerald-600 text-white',
          icon: <CheckCircle2 className="w-3 h-3" />,
          label: 'In Stock'
        };
    }
  };

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> High-Performance Gaming Desktops
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Prebuilt Gaming Rigs
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Explore custom pre-configured gaming desktops built by Tech Beast Hubli. Every rig comes tested with full warranty, high-tier components, and interactive component upgrades.
            </p>
          </div>
          <Monitor className="absolute right-8 bottom-4 w-64 h-64 text-white/5 pointer-events-none hidden md:block" />
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="p-16 text-center text-slate-500 text-sm font-medium">
            Loading Prebuilt Gaming Rigs...
          </div>
        ) : prebuilts.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 shadow-sm max-w-lg mx-auto">
            <Cpu className="w-12 h-12 text-purple-600 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">No Prebuilt Desktops Available Right Now</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              We are currently preparing new custom gaming desktops. In the meantime, build your own custom rig using our Custom PC Builder or check back soon!
            </p>
            <Link 
              to="/custom-pc" 
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-6 py-3 rounded-xl uppercase tracking-wider shadow-md transition-all"
            >
              Go to Custom PC Builder <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {prebuilts.map(rig => {
              const currentStatus = rig.status || 'In Stock';
              const isOutOfStock = currentStatus === 'Out of Stock';
              const badge = getStockBadge(currentStatus);

              return (
                <div 
                  key={rig.id} 
                  className={`bg-white border rounded-3xl p-6 flex flex-col justify-between transition-all group ${
                    isOutOfStock 
                      ? 'border-slate-200 opacity-90 hover:shadow-lg' 
                      : 'border-slate-200 hover:shadow-xl hover:border-purple-300'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Image */}
                    <div className="relative aspect-[4/3] bg-slate-100 rounded-2xl overflow-hidden p-4 flex items-center justify-center">
                      <img 
                        src={rig.imageUrl || (rig.imageUrls && rig.imageUrls[0]) || "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80"} 
                        alt={rig.title} 
                        loading="lazy"
                        className={`max-h-full max-w-full w-auto h-auto object-contain object-center transition-transform duration-300 mx-auto my-auto ${
                          isOutOfStock ? 'grayscale-[30%]' : 'group-hover:scale-105'
                        }`}
                      />
                      
                      {/* Stock Badge */}
                      <div className={`absolute top-3 right-3 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1 ${badge.bg}`}>
                        {badge.icon}
                        <span>{badge.label}</span>
                      </div>

                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/30 backdrop-blur-[0.5px] flex items-center justify-center pointer-events-none">
                          <span className="bg-red-600/95 text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                            Sold Out / Out of Stock
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Title & Price */}
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900 uppercase leading-tight group-hover:text-purple-700 transition-colors line-clamp-1">
                        {rig.title}
                      </h3>
                      <div className="flex items-baseline gap-2 mt-1.5">
                        <span className="text-2xl font-black text-purple-700">₹{Number(rig.price || 0).toLocaleString('en-IN')}</span>
                        {rig.oldPrice && Number(rig.oldPrice) > 0 && (
                          <span className="text-xs font-bold text-slate-400 line-through">₹{Number(rig.oldPrice).toLocaleString('en-IN')}</span>
                        )}
                      </div>
                    </div>

                    {/* Key Specs summary */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2 text-xs text-slate-600">
                      {rig.processor && <div className="line-clamp-1"><strong>CPU:</strong> {rig.processor}</div>}
                      {rig.gpu && <div className="line-clamp-1"><strong>GPU:</strong> {rig.gpu}</div>}
                      {rig.ram && <div className="line-clamp-1"><strong>RAM:</strong> {rig.ram}</div>}
                      {rig.primarySsd && <div className="line-clamp-1"><strong>Storage:</strong> {rig.primarySsd}</div>}
                    </div>

                    {/* Free Gift Badge if any */}
                    <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 text-purple-800 p-2.5 rounded-xl text-xs font-semibold">
                      <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                      <span className="line-clamp-1">{rig.freeGiftTitle || 'Free 3-Year Premium Warranty Included'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-5 mt-6 border-t border-slate-100">
                    {isOutOfStock ? (
                      <Link 
                        to={`/prebuilt-pc/${rig.id}`} 
                        className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-3 px-4 rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all"
                      >
                        View Rig Specs (Out of Stock) <ArrowRight className="w-4 h-4" />
                      </Link>
                    ) : (
                      <Link 
                        to={`/prebuilt-pc/${rig.id}`} 
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-3 px-4 rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-purple-600/20 transition-all"
                      >
                        Configure & Upgrade <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}

