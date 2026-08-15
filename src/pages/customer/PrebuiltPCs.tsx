import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Monitor, Cpu, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, getDoc, collection, getDocs, query, limit } from 'firebase/firestore';

export default function PrebuiltPCs() {
  const [prebuilts, setPrebuilts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchPrebuilts();
  }, []);

  const fetchPrebuilts = async () => {
    try {
      let list: any[] = [];

      // 1. Fetch from settings document 'prebuilts'
      try {
        const settingsSnap = await getDoc(doc(db, 'settings', 'prebuilts'));
        if (settingsSnap.exists() && settingsSnap.data().items) {
          list = Object.values(settingsSnap.data().items);
        }
      } catch (e) {
        console.warn("Settings prebuilts read error:", e);
      }

      // 2. Fetch from prebuilts collection or products
      try {
        const snap = await getDocs(query(collection(db, "prebuilts"), limit(30)));
        const collectionList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        const prodSnap = await getDocs(query(collection(db, "products"), limit(50)));
        const prodList = prodSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter((p: any) => p.isPrebuilt || p.category === 'Pre-built PC');

        const combined = [...list, ...collectionList, ...prodList];
        const uniqueMap = new Map();
        combined.forEach(item => {
          if (!uniqueMap.has(item.id)) uniqueMap.set(item.id, item);
        });

        list = Array.from(uniqueMap.values());
      } catch (e) {
        console.warn("Prebuilt collection read error:", e);
      }

      setPrebuilts(list);
    } catch (err) {
      console.error("Error fetching prebuilts for store:", err);
    } finally {
      setLoading(false);
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
            Loading Prebuilt Gaming Rigs from Admin Panel...
          </div>
        ) : prebuilts.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 shadow-sm max-w-lg mx-auto">
            <Cpu className="w-12 h-12 text-purple-600 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">No Prebuilt Desktops Added Yet</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Admin hasn't added any prebuilt gaming desktops to the store yet. Please check back soon or build your own desktop using our Custom PC Builder!
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
            {prebuilts.map(rig => (
              <div 
                key={rig.id} 
                className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between hover:shadow-xl hover:border-purple-300 transition-all group"
              >
                <div className="space-y-4">
                  {/* Image */}
                  <div className="relative aspect-[4/3] bg-slate-100 rounded-2xl overflow-hidden p-4 flex items-center justify-center">
                    <img 
                      src={rig.imageUrl || "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80"} 
                      alt={rig.title} 
                      loading="lazy"
                      className="max-h-full max-w-full w-auto h-auto object-contain object-center group-hover:scale-105 transition-transform duration-300 mx-auto my-auto"
                    />
                    <div className="absolute top-3 right-3 bg-purple-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                      {rig.status || 'In Stock'}
                    </div>
                  </div>

                  {/* Title & Price */}
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 uppercase leading-tight group-hover:text-purple-700 transition-colors">
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
                  <Link 
                    to={`/prebuilt-pc/${rig.id}`} 
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-3 px-4 rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-purple-600/20 transition-all"
                  >
                    Configure & Upgrade <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
