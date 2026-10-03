import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, Eye, Cpu, Monitor, EyeOff, CheckCircle2, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc, deleteDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { useSecurityPin } from '../../contexts/SecurityPinContext';
import { deleteCloudinaryImage } from '../../utils/cloudinary';

export default function PrebuiltsList() {
  const { confirmWithPin } = useSecurityPin();
  const navigate = useNavigate();
  const [prebuilts, setPrebuilts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'In Stock' | 'Out of Stock' | 'Pre-Order' | 'Offline'>('All');
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  useEffect(() => {
    fetchPrebuilts();
  }, []);

  const fetchPrebuilts = async () => {
    try {
      setLoading(true);
      const uniqueMap = new Map<string, any>();

      // 1. Fetch from settings 'prebuilts' document
      try {
        const settingsSnap = await getDoc(doc(db, 'settings', 'prebuilts'));
        if (settingsSnap.exists() && settingsSnap.data().items) {
          const items = settingsSnap.data().items;
          Object.keys(items).forEach(key => {
            if (items[key]) {
              uniqueMap.set(key, { id: key, ...items[key] });
            }
          });
        }
      } catch (e) {
        console.warn("Error reading settings prebuilts:", e);
      }

      // 2. Fetch from 'prebuilts' collection
      try {
        const snap = await getDocs(collection(db, "prebuilts"));
        snap.docs.forEach(d => {
          const item = { id: d.id, ...d.data() };
          uniqueMap.set(d.id, { ...(uniqueMap.get(d.id) || {}), ...item });
        });
      } catch (e) {
        console.warn("Error reading prebuilts collection:", e);
      }

      // 3. Fetch from 'products' collection (isPrebuilt == true or prebuilt category)
      try {
        const prodSnap = await getDocs(collection(db, "products"));
        prodSnap.docs.forEach(d => {
          const data: any = d.data();
          if (data.isPrebuilt || data.category === 'Pre-built PC' || data.category === 'Prebuilt PC' || (typeof data.category === 'string' && data.category.toLowerCase().includes('prebuilt'))) {
            const item = { id: d.id, ...data };
            uniqueMap.set(d.id, { ...(uniqueMap.get(d.id) || {}), ...item });
          }
        });
      } catch (e) {
        console.warn("Error reading products for prebuilts:", e);
      }

      // 4. Fetch from 'prebuilt-pcs' collection
      try {
        const pcsSnap = await getDocs(collection(db, "prebuilt-pcs"));
        pcsSnap.docs.forEach(d => {
          const item = { id: d.id, ...d.data() };
          uniqueMap.set(d.id, { ...(uniqueMap.get(d.id) || {}), ...item });
        });
      } catch (e) {
        // collection might not exist yet, ignore
      }

      setPrebuilts(Array.from(uniqueMap.values()));
    } catch (err) {
      console.error("Error fetching prebuilts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      setUpdatingStatusId(id);
      // Immediate optimistic update
      setPrebuilts(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));

      const nowIso = new Date().toISOString();

      // 1. Update settings/prebuilts
      try {
        const settingsRef = doc(db, 'settings', 'prebuilts');
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists() && settingsSnap.data().items) {
          const items = { ...settingsSnap.data().items };
          if (items[id]) {
            items[id] = { ...items[id], status: newStatus, updatedAt: nowIso };
            await setDoc(settingsRef, { items }, { merge: true });
          }
        }
      } catch (e) {
        console.warn("Error updating settings prebuilts status:", e);
      }

      // 2. Update products collection
      try {
        await updateDoc(doc(db, "products", id), { status: newStatus, updatedAt: nowIso });
      } catch {
        try {
          await setDoc(doc(db, "products", id), { status: newStatus, updatedAt: nowIso }, { merge: true });
        } catch {}
      }

      // 3. Update prebuilts collection
      try {
        await updateDoc(doc(db, "prebuilts", id), { status: newStatus, updatedAt: nowIso });
      } catch {
        try {
          await setDoc(doc(db, "prebuilts", id), { status: newStatus, updatedAt: nowIso }, { merge: true });
        } catch {}
      }

      // 4. Update prebuilt-pcs collection
      try {
        await updateDoc(doc(db, "prebuilt-pcs", id), { status: newStatus, updatedAt: nowIso });
      } catch {}

    } catch (error) {
      console.error("Error updating prebuilt status:", error);
      alert("Failed to update status. Please try again.");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleDelete = (id: string, title: string) => {
    confirmWithPin({
      title: "Delete Prebuilt PC",
      itemName: title,
      description: `Enter your 4-digit Admin PIN to permanently delete "${title}" from all database collections, images, and storefront.`,
      confirmText: "Verify PIN & Delete Prebuilt",
      onConfirm: async () => {
        try {
          const itemToDelete = prebuilts.find(p => p.id === id);

          // 1. Delete images from Cloudinary
          const imagesToDelete: string[] = [];
          if (itemToDelete?.imageUrls && Array.isArray(itemToDelete.imageUrls)) {
            imagesToDelete.push(...itemToDelete.imageUrls);
          }
          if (itemToDelete?.imageUrl && !imagesToDelete.includes(itemToDelete.imageUrl)) {
            imagesToDelete.push(itemToDelete.imageUrl);
          }

          for (const url of imagesToDelete) {
            if (url && typeof url === 'string' && url.includes('cloudinary.com')) {
              await deleteCloudinaryImage(url).catch(() => {});
            }
          }

          // 2. Delete from settings document
          try {
            const settingsRef = doc(db, 'settings', 'prebuilts');
            const settingsSnap = await getDoc(settingsRef);
            if (settingsSnap.exists() && settingsSnap.data().items) {
              const items = { ...settingsSnap.data().items };
              delete items[id];
              await setDoc(settingsRef, { items }, { merge: true });
            }
          } catch (e) {
            console.warn("Error removing from settings/prebuilts:", e);
          }

          // 3. Delete from products collection
          await deleteDoc(doc(db, "products", id)).catch(() => {});

          // 4. Delete from prebuilts collection
          await deleteDoc(doc(db, "prebuilts", id)).catch(() => {});

          // 5. Delete from prebuilt-pcs collection
          await deleteDoc(doc(db, "prebuilt-pcs", id)).catch(() => {});

          // 6. Update local state
          setPrebuilts(prev => prev.filter(p => p.id !== id));
        } catch (err) {
          console.error("Error deleting prebuilt:", err);
          alert("Failed to delete prebuilt desktop: " + (err instanceof Error ? err.message : String(err)));
        }
      }
    });
  };

  const filteredPrebuilts = prebuilts.filter(p => {
    const matchesSearch = (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.processor || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.gpu || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.cabinet || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'All') return matchesSearch;
    const currentStatus = p.status || 'In Stock';
    return matchesSearch && currentStatus === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'In Stock':
        return {
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          icon: <CheckCircle2 className="w-3 h-3" />,
          label: 'In Stock'
        };
      case 'Out of Stock':
        return {
          bg: 'bg-red-500/10 text-red-400 border-red-500/20',
          icon: <AlertCircle className="w-3 h-3" />,
          label: 'Out of Stock'
        };
      case 'Pre-Order':
        return {
          bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          icon: <Clock className="w-3 h-3" />,
          label: 'Pre-Order'
        };
      case 'Offline':
        return {
          bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
          icon: <EyeOff className="w-3 h-3" />,
          label: 'Offline (Hidden)'
        };
      default:
        return {
          bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          icon: <CheckCircle2 className="w-3 h-3" />,
          label: status || 'In Stock'
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141415] border border-white/5 p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Monitor className="w-6 h-6 text-purple-400" /> Prebuilt Gaming Desktops
          </h1>
          <p className="text-xs text-slate-400 mt-1">Manage prebuilt gaming rigs, live stock availability, base hardware specs, free warranty packages, and upgrades.</p>
        </div>

        <Link 
          to="/admin/prebuilt-pcs/new" 
          className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-purple-900/30"
        >
          <Plus className="w-4 h-4" /> Add New Prebuilt PC
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4 bg-[#141415] border border-white/5 p-4 rounded-2xl">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search prebuilt desktops by title, processor, GPU, cabinet..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#18181b] text-sm text-white pl-10 pr-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 shrink-0">
            {filteredPrebuilts.length} of {prebuilts.length} Rigs
          </span>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {(['All', 'In Stock', 'Out of Stock', 'Pre-Order', 'Offline'] as const).map((tab) => {
            const count = tab === 'All' 
              ? prebuilts.length 
              : prebuilts.filter(p => (p.status || 'In Stock') === tab).length;

            return (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  statusFilter === tab
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                    : 'bg-[#18181b] text-slate-400 hover:text-white hover:bg-white/5 border border-white/5'
                }`}
              >
                <span>{tab}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  statusFilter === tab ? 'bg-black/20 text-white' : 'bg-white/5 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Rigs Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          <span>Loading prebuilt gaming desktops...</span>
        </div>
      ) : filteredPrebuilts.length === 0 ? (
        <div className="bg-[#141415] border border-white/5 rounded-2xl p-12 text-center space-y-4">
          <Cpu className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Prebuilt Desktops Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {searchQuery || statusFilter !== 'All' 
              ? 'No prebuilt PCs match your active filter criteria. Try clearing search or status filters.' 
              : 'Create prebuilt desktops to offer pre-configured gaming PCs with custom upgrades and free warranty packages.'}
          </p>
          {searchQuery || statusFilter !== 'All' ? (
            <button
              onClick={() => { setSearchQuery(''); setStatusFilter('All'); }}
              className="inline-flex bg-white/10 hover:bg-white/15 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
            >
              Reset Filters
            </button>
          ) : (
            <Link 
              to="/admin/prebuilt-pcs/new" 
              className="inline-flex bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
            >
              Create First Prebuilt Desktop
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrebuilts.map(rig => {
            const currentStatus = rig.status || 'In Stock';
            const badge = getStatusBadge(currentStatus);
            const isUpdating = updatingStatusId === rig.id;
            const isOffline = currentStatus === 'Offline';

            return (
              <div 
                key={rig.id} 
                className={`bg-[#141415] border rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all ${
                  isOffline 
                    ? 'border-dashed border-slate-700 opacity-80 hover:opacity-100 hover:border-slate-500' 
                    : 'border-white/5 hover:border-purple-500/30'
                }`}
              >
                
                <div className="space-y-3">
                  {/* Image & Status Overlay */}
                  <div className="relative aspect-[4/3] bg-[#18181b] border border-white/5 rounded-xl overflow-hidden flex items-center justify-center p-2">
                    <img 
                      src={rig.imageUrl || (rig.imageUrls && rig.imageUrls[0]) || "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80"} 
                      alt={rig.title} 
                      className={`w-full h-full object-contain transition-transform ${isOffline ? 'grayscale-[50%]' : ''}`}
                    />
                    
                    {/* Status Pill Badge */}
                    <div className={`absolute top-2 right-2 border px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-md ${badge.bg}`}>
                      {badge.icon}
                      <span>{badge.label}</span>
                    </div>

                    {isOffline && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center">
                        <span className="bg-black/80 border border-white/20 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                          <EyeOff className="w-3.5 h-3.5 text-amber-400" /> Hidden From Storefront
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Title & Price */}
                  <div>
                    <h3 className="font-bold text-white text-base leading-tight uppercase line-clamp-1">{rig.title}</h3>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-lg font-extrabold text-purple-400">₹{Number(rig.price || 0).toLocaleString('en-IN')}</span>
                      {rig.oldPrice && Number(rig.oldPrice) > 0 && (
                        <span className="text-xs text-slate-500 line-through">₹{Number(rig.oldPrice).toLocaleString('en-IN')}</span>
                      )}
                    </div>
                  </div>

                  {/* Key Hardware Specs */}
                  <div className="bg-[#18181b] p-3 rounded-xl space-y-1 text-xs text-slate-300">
                    {rig.processor && <div className="line-clamp-1"><strong>CPU:</strong> {rig.processor}</div>}
                    {rig.gpu && <div className="line-clamp-1"><strong>GPU:</strong> {rig.gpu}</div>}
                    {rig.ram && <div className="line-clamp-1"><strong>RAM:</strong> {rig.ram}</div>}
                    {rig.primarySsd && <div className="line-clamp-1"><strong>SSD:</strong> {rig.primarySsd}</div>}
                  </div>

                  {/* Quick Status Selector */}
                  <div className="pt-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Live Store Status:
                    </label>
                    <div className="relative">
                      <select
                        value={currentStatus}
                        disabled={isUpdating}
                        onChange={(e) => handleStatusUpdate(rig.id, e.target.value)}
                        className={`w-full text-xs font-semibold py-2 px-3 rounded-xl border transition-colors focus:outline-none appearance-none cursor-pointer ${
                          currentStatus === 'In Stock'
                            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300 hover:border-emerald-500/60'
                            : currentStatus === 'Out of Stock'
                            ? 'bg-red-950/40 border-red-500/30 text-red-300 hover:border-red-500/60'
                            : currentStatus === 'Pre-Order'
                            ? 'bg-blue-950/40 border-blue-500/30 text-blue-300 hover:border-blue-500/60'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        <option value="In Stock" className="bg-[#18181b] text-white">🟢 In Stock (Visible & Purchasable)</option>
                        <option value="Out of Stock" className="bg-[#18181b] text-white">🔴 Out of Stock (Visible, Ordering Disabled)</option>
                        <option value="Pre-Order" className="bg-[#18181b] text-white">🔵 Pre-Order (Custom Build)</option>
                        <option value="Offline" className="bg-[#18181b] text-white">⚪ Offline (Hidden from Storefront)</option>
                      </select>
                      {isUpdating && (
                        <div className="absolute right-3 top-2.5">
                          <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
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
                      title="Edit Desktop Details & Upgrades"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Link>

                    <button 
                      onClick={() => handleDelete(rig.id, rig.title)}
                      className="p-2 bg-white/5 hover:bg-red-600 text-slate-300 hover:text-white rounded-lg transition-colors"
                      title="Delete Prebuilt Desktop (PIN Required)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

