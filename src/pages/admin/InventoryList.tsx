import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, MoreVertical, Edit, Trash2, Package } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { deleteCloudinaryImage } from '../../utils/cloudinary';

export default function InventoryList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [inventory, setInventory] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

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

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const catName = newCategoryName.trim();
    if (categories.includes(catName)) {
      alert("Category already exists.");
      return;
    }

    try {
      const updatedCategories = [...categories, catName].sort();
      await setDoc(doc(db, 'settings', 'inventory'), { categories: updatedCategories });
      setCategories(updatedCategories);
      setNewCategoryName('');
      setIsCategoryModalOpen(false);
    } catch (error) {
      console.error("Error adding category:", error);
      alert("Failed to add category.");
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
          <button onClick={() => setIsCategoryModalOpen(true)} className="px-5 py-2 text-xs font-bold text-slate-300 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all uppercase tracking-wider">
            Manage Categories
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
                <tr><td colSpan={6} className="px-6 py-4 text-center text-slate-500">Loading inventory...</td></tr>
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

      {/* Category Management Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#141415] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">Manage Categories</h2>
            <div className="mb-6 max-h-48 overflow-y-auto custom-scrollbar pr-2">
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <span key={cat} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-slate-300">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
            
            <form onSubmit={handleAddCategory}>
              <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Add New Category</label>
              <div className="flex gap-3">
                <input 
                  type="text" 
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Cables"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <button type="submit" disabled={!newCategoryName.trim()} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider">
                  Add
                </button>
              </div>
            </form>
            
            <div className="mt-6 flex justify-end">
              <button onClick={() => setIsCategoryModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
