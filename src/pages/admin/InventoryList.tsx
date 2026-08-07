import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, MoreVertical, Edit, Trash2, Package } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { deleteCloudinaryImage } from '../../utils/cloudinary';
import { TableBodySkeleton } from '../../components/ui/Skeleton';
import ComboManagerModal from '../../components/admin/ComboManagerModal';

export default function InventoryList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [inventory, setInventory] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isComboModalOpen, setIsComboModalOpen] = useState(false);


  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Categories
      const settingsRef = doc(db, 'settings', 'inventory');
      const settingsSnap = await getDoc(settingsRef);
      let loadedCategories = ['Accessories', 'SSD', 'HDD', 'RAM', 'Cabinet', 'Keyboard', 'Mouse', 'Graphics Card', 'Processor', 'Motherboard', 'Power Supply', 'Monitor'];
      if (settingsSnap.exists() && settingsSnap.data().categories) {
        loadedCategories = settingsSnap.data().categories;
      } else {
        // Initialize if doesn't exist
        await setDoc(settingsRef, { categories: loadedCategories });
      }
      setCategories(loadedCategories);

      // Fetch Inventory
      const q = collection(db, 'inventory');
      const querySnapshot = await getDocs(q);
      const inventoryData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInventory(inventoryData);
    } catch (error) {
      console.error("Error fetching inventory data:", error);
    } finally {
      setLoading(false);
    }
  };


  const handleDeleteItem = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this inventory item? This will also delete its images from Cloudinary.")) {
      try {
        const itemToDelete = inventory.find(i => i.id === id);
        
        // Delete images from Cloudinary first
        if (itemToDelete?.imageUrls?.length > 0) {
          console.log(`Deleting ${itemToDelete.imageUrls.length} images from Cloudinary...`);
          for (const url of itemToDelete.imageUrls) {
            await deleteCloudinaryImage(url);
          }
        }

        await deleteDoc(doc(db, 'inventory', id));
        setInventory(inventory.filter(item => item.id !== id));
      } catch (error) {
        console.error("Error deleting item:", error);
        alert("Failed to delete item.");
      }
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = 
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <Package className="h-6 w-6 text-blue-500" />
            Inventory Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">Track parts, components, and accessories stock levels.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsComboModalOpen(true)} className="bg-white/5 hover:bg-white/10 text-white px-5 py-2 rounded-full text-xs font-bold transition-all shadow-lg border border-white/10 uppercase tracking-wider flex items-center gap-2">
            <Package className="h-4 w-4" />
            Combos
          </button>
          <Link to="/admin/inventory/new" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full text-xs font-bold transition-all shadow-lg shadow-blue-900/20 uppercase tracking-wider flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Item
          </Link>
        </div>
      </div>

      <div className="bg-[#0d0d0e] rounded-3xl border border-white/10 flex flex-col overflow-hidden shadow-2xl">
        {/* Toolbar */}
        <div className="p-6 border-b border-white/5 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-500" />
            </div>
            <input
              type="text"
              placeholder="Search items, SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-500 text-white placeholder-slate-500"
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-full text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white transition-colors uppercase tracking-widest relative">
            <Filter className="h-4 w-4" />
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="appearance-none bg-transparent outline-none cursor-pointer text-white pl-1 pr-4"
            >
              <option value="All" className="bg-[#0d0d0e]">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat} className="bg-[#0d0d0e]">{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-left text-[10px] text-slate-500 uppercase tracking-tighter border-b border-white/5">
                <th className="px-6 py-4">Item Details</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Cost Price</th>
                <th className="px-6 py-4">Selling Price</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <TableBodySkeleton columns={6} rows={5} />
              ) : filteredInventory.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center text-slate-500">No items found in inventory.</td></tr>
              ) : (
                filteredInventory.map((item) => (
                  <tr key={item.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-200">{item.name}</div>
                      <div className="text-xs text-slate-500 font-mono mt-1">{item.sku || 'No SKU'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-xs font-bold text-slate-300">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`font-bold ${Number(item.quantity) <= 5 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {item.quantity} units
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-400 font-medium">
                      ₹{Number(item.costPrice || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-white font-bold">
                      ₹{Number(item.sellingPrice || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => navigate(`/admin/inventory/edit/${item.id}`)} className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDeleteItem(item.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ComboManagerModal 
        isOpen={isComboModalOpen} 
        onClose={() => setIsComboModalOpen(false)} 
        inventory={inventory} 
      />
    </div>
  );
}
