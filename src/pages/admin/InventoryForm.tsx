import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Package } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, addDoc, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import ImageUpload from '../../components/admin/ImageUpload';
import { FormSkeleton } from '../../components/ui/Skeleton';

export default function InventoryForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    sku: '',
    quantity: '',
    costPrice: '',
    sellingPrice: '',
    isFreeAccessory: false,
    imageUrls: [] as string[]
  });

  useEffect(() => {
    const fetchCategoriesAndData = async () => {
      try {
        // Fetch categories first
        const settingsRef = doc(db, 'settings', 'inventory');
        const settingsSnap = await getDoc(settingsRef);
        let loadedCats = ['Accessories', 'SSD', 'HDD', 'RAM', 'Cabinet', 'Keyboard', 'Mouse', 'Graphics Card', 'Processor', 'Motherboard', 'Power Supply', 'Monitor']; // Fallback
        if (settingsSnap.exists() && settingsSnap.data().categories) {
          loadedCats = settingsSnap.data().categories;
        }
        setCategories(loadedCats);
        
        // Default category
        if (!isEditing && loadedCats.length > 0) {
          setFormData(prev => ({ ...prev, category: loadedCats[0] }));
        }

        // Fetch data if editing
        if (isEditing && id) {
          const docRef = doc(db, 'inventory', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setFormData({
              name: data.name || '',
              category: data.category || (loadedCats.length > 0 ? loadedCats[0] : ''),
              sku: data.sku || '',
              quantity: data.quantity || '',
              costPrice: data.costPrice || '',
              sellingPrice: data.sellingPrice || '',
              isFreeAccessory: data.isFreeAccessory || false,
              imageUrls: data.imageUrls || []
            });
          } else {
            alert('Item not found');
            navigate('/admin/inventory');
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategoriesAndData();
  }, [id, isEditing, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category || !formData.quantity) {
      alert("Please fill required fields (Name, Category, Quantity).");
      return;
    }

    setIsSubmitting(true);
    try {
      const dataToSave = {
        name: formData.name,
        category: formData.category,
        sku: formData.sku,
        quantity: Number(formData.quantity) || 0,
        costPrice: Number(formData.costPrice) || 0,
        sellingPrice: Number(formData.sellingPrice) || 0,
        isFreeAccessory: formData.isFreeAccessory,
        imageUrls: formData.imageUrls,
        updatedAt: new Date().toISOString()
      };

      if (isEditing && id) {
        await updateDoc(doc(db, 'inventory', id), dataToSave);
      } else {
        await addDoc(collection(db, "inventory"), {
          ...dataToSave,
          createdAt: new Date().toISOString()
        });
      }
      navigate('/admin/inventory');
    } catch (error) {
      console.error("Error saving inventory item:", error);
      alert("Failed to save item.");
    } finally {
      setIsSubmitting(false);
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
      setFormData(prev => ({ ...prev, category: catName }));
      setNewCategoryName('');
      setIsCategoryModalOpen(false);
    } catch (error) {
      console.error("Error adding category:", error);
      alert("Failed to add category.");
    }
  };

  return (
    <>
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => navigate('/admin/inventory')} className="text-slate-500 hover:text-white transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
              <Package className="h-6 w-6 text-blue-500" />
              {isEditing ? 'Edit Inventory Item' : 'New Inventory Item'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">Manage details, stock levels, and pricing for this item.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setIsCategoryModalOpen(true)} className="px-5 py-2 text-xs font-bold text-slate-300 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all uppercase tracking-wider">
            Manage Categories
          </button>
          <button type="button" onClick={() => navigate('/admin/inventory')} className="px-5 py-2 text-xs font-bold text-slate-300 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all uppercase tracking-wider">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full text-xs font-bold transition-all shadow-lg shadow-blue-900/20 uppercase tracking-wider flex items-center gap-2">
            <Save className="h-4 w-4" />
            {isSubmitting ? "Saving..." : "Save Item"}
          </button>
        </div>
      </div>

      {loading ? (
        <FormSkeleton />
      ) : (
        <div className="bg-[#0d0d0e] p-8 rounded-3xl border border-white/10 shadow-2xl space-y-8">
          
          <div className="border-b border-slate-800 pb-8 mb-8">
          <label className="flex flex-col gap-2 text-sm text-slate-500 font-bold uppercase tracking-widest mb-4">
            Item Images
          </label>
          <ImageUpload 
            images={formData.imageUrls} 
            onChange={(urls) => setFormData({ ...formData, imageUrls: urls })} 
          />
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Item Name *</label>
            <input 
              required 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              type="text" 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all" 
              placeholder="e.g. Kingston 1TB NVMe M.2 SSD" 
            />
          </div>
          
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Category *</label>
            <select 
              required 
              name="category" 
              value={formData.category} 
              onChange={handleChange} 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
            >
              <option value="" disabled className="bg-[#0d0d0e]">Select a category...</option>
              {categories.map(cat => (
                <option key={cat} value={cat} className="bg-[#0d0d0e]">{cat}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">SKU / Barcode</label>
            <input 
              name="sku" 
              value={formData.sku} 
              onChange={handleChange} 
              type="text" 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono" 
              placeholder="e.g. KNG-1TB-NVME" 
            />
          </div>
        </div>

        <hr className="border-white/5" />

        {/* Stock & Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Current Stock *</label>
            <input 
              required 
              name="quantity" 
              value={formData.quantity} 
              onChange={handleChange} 
              type="number" 
              min="0"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all" 
              placeholder="0" 
            />
          </div>
          
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Cost Price (₹)</label>
            <input 
              name="costPrice" 
              value={formData.costPrice} 
              onChange={handleChange} 
              type="number" 
              min="0"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all" 
              placeholder="0" 
            />
          </div>
          
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Selling Price (₹)</label>
            <input 
              name="sellingPrice" 
              value={formData.sellingPrice} 
              onChange={handleChange} 
              type="number" 
              min="0"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all" 
              placeholder="0" 
            />
          </div>
        </div>

        <hr className="border-white/5" />

        <div className="flex items-center gap-3">
          <input 
            type="checkbox" 
            id="isFreeAccessory"
            name="isFreeAccessory"
            checked={formData.isFreeAccessory}
            onChange={handleChange}
            className="w-5 h-5 rounded border-white/20 bg-white/5 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <div>
            <label htmlFor="isFreeAccessory" className="text-sm font-bold text-white cursor-pointer">Mark as Free Accessory</label>
            <p className="text-xs text-slate-400 mt-1">If checked, this item will appear as a selectable free accessory when adding new products.</p>
          </div>
        </div>
        
      </div>
      )}
    </form>

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
            <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider">
              Close
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
