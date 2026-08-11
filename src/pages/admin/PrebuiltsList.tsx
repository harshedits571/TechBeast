import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, Eye, Cpu, Monitor } from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';

export default function PrebuiltsList() {
  const navigate = useNavigate();
  const [prebuilts, setPrebuilts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPrebuilts();
  }, []);

  const fetchPrebuilts = async () => {
    try {
      let list: any[] = [];
      
      // 1. Fetch from settings 'prebuilts'
      try {
        const settingsSnap = await getDoc(doc(db, 'settings', 'prebuilts'));
        if (settingsSnap.exists() && settingsSnap.data().items) {
          list = Object.values(settingsSnap.data().items);
        }
      } catch (e) {
        console.warn("Error reading settings prebuilts:", e);
      }

      // 2. Also fetch from products collection where isPrebuilt == true or category == 'Pre-built PC'
      try {
        const prodSnap = await getDocs(collection(db, "products"));
        const prodItems = prodSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter((p: any) => p.isPrebuilt || p.category === 'Pre-built PC');

        const combined = [...list, ...prodItems];
        const uniqueMap = new Map();
        combined.forEach(item => {
          if (!uniqueMap.has(item.id)) uniqueMap.set(item.id, item);
        });
        list = Array.from(uniqueMap.values());
      } catch (e) {
        console.warn("Error reading products for prebuilts:", e);
      }

      setPrebuilts(list);
    } catch (err) {
      console.error("Error fetching prebuilts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete prebuilt desktop "${title}"?`)) return;
    try {
      // Delete from settings
      const settingsRef = doc(db, 'settings', 'prebuilts');
      const settingsSnap = await getDoc(settingsRef);
      if (settingsSnap.exists() && settingsSnap.data().items) {
        const items = settingsSnap.data().items;
        delete items[id];
        await setDoc(settingsRef, { items }, { merge: true });
      }

      // Delete from products
      await deleteDoc(doc(db, "products", id)).catch(() => {});

      setPrebuilts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error("Error deleting prebuilt:", err);
    }
  };

  const filteredPrebuilts = prebuilts.filter(p => 
    (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.processor || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.gpu || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141415] border border-white/5 p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Monitor className="w-6 h-6 text-purple-400" /> Prebuilt Gaming Desktops
          </h1>
          <p className="text-xs text-slate-400 mt-1">Manage prebuilt gaming rigs, base hardware specifications, free warranty gifts, and upgrade options.</p>
        </div>

        <Link 
          to="/admin/prebuilt-pcs/new" 
          className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-purple-900/30"
        >
          <Plus className="w-4 h-4" /> Add New Prebuilt PC
        </Link>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4 bg-[#141415] border border-white/5 p-4 rounded-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search prebuilt desktops by title, processor, GPU..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#18181b] text-sm text-white pl-10 pr-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">{filteredPrebuilts.length} Rigs</span>
      </div>

      {/* Rigs Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading prebuilt desktops...</div>
      ) : filteredPrebuilts.length === 0 ? (
        <div className="bg-[#141415] border border-white/5 rounded-2xl p-12 text-center space-y-4">
          <Cpu className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Prebuilt Desktops Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">Create prebuilt desktops to offer pre-configured gaming PCs with custom upgrades and free warranty packages.</p>
          <Link 
            to="/admin/prebuilt-pcs/new" 
            className="inline-flex bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
          >
            Create First Prebuilt Desktop
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrebuilts.map(rig => (
            <div key={rig.id} className="bg-[#141415] border border-white/5 rounded-2xl p-5 space-y-4 flex flex-col justify-between hover:border-purple-500/30 transition-all">
              
              <div className="space-y-3">
                <div className="relative aspect-[4/3] bg-[#18181b] border border-white/5 rounded-xl overflow-hidden flex items-center justify-center p-2">
                  <img 
                    src={rig.imageUrl || "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80"} 
                    alt={rig.title} 
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-2 right-2 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    {rig.status || 'In Stock'}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-white text-base leading-tight uppercase">{rig.title}</h3>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-lg font-extrabold text-purple-400">₹{Number(rig.price || 0).toLocaleString('en-IN')}</span>
                    {rig.oldPrice && <span className="text-xs text-slate-500 line-through">₹{Number(rig.oldPrice).toLocaleString('en-IN')}</span>}
                  </div>
                </div>

                <div className="bg-[#18181b] p-3 rounded-xl space-y-1 text-xs text-slate-300">
                  <div className="line-clamp-1"><strong>CPU:</strong> {rig.processor}</div>
                  <div className="line-clamp-1"><strong>GPU:</strong> {rig.gpu}</div>
                  <div className="line-clamp-1"><strong>RAM:</strong> {rig.ram}</div>
                  <div className="line-clamp-1"><strong>SSD:</strong> {rig.primarySsd}</div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                <Link 
                  to={`/prebuilt-pc/${rig.id}`} 
                  target="_blank"
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-bold uppercase tracking-wider"
                >
                  <Eye className="w-3.5 h-3.5" /> Preview Store
                </Link>

                <div className="flex items-center gap-2">
                  <Link 
                    to={`/admin/prebuilt-pcs/edit/${rig.id}`} 
                    className="p-2 bg-white/5 hover:bg-purple-600 text-slate-300 hover:text-white rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Link>

                  <button 
                    onClick={() => handleDelete(rig.id, rig.title)}
                    className="p-2 bg-white/5 hover:bg-red-600 text-slate-300 hover:text-white rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
