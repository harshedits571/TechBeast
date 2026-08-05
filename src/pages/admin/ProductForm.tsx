import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, addDoc, doc, getDoc, updateDoc, getDocs, query, where } from 'firebase/firestore';
import ImageUpload from '../../components/admin/ImageUpload';

export default function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [availableAccessories, setAvailableAccessories] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    brand: '',
    sku: '',
    category: 'Laptops',
    condition: 'New',
    stock: 1,
    price: 0,
    status: 'In Stock',
    processor: '',
    ram: '',
    storage: '',
    graphics: '',
    description: '',
    accessories: '',
    modelNumber: '',
    processorGen: '',
    ramType: '',
    storageType: '',
    displayType: '',
    os: '',
    color: '',
    imageUrls: [] as string[],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Default predefined free accessories (works even if Firebase rules block inventory fetch)
        const defaultAccessories = [
          'Laptop Bag', 
          'Wireless Mouse', 
          'Wired Mouse', 
          'Power Adapter / Charger', 
          'Cleaning Kit', 
          'Mousepad',
          'Cooling Pad',
          'Keyboard Cover'
        ];

        let inventoryAccessories: string[] = [];
        try {
          // Fetch available accessories from inventory
          const accQuery = query(collection(db, 'inventory'), where('isFreeAccessory', '==', true));
          const accSnap = await getDocs(accQuery);
          inventoryAccessories = accSnap.docs.map(d => d.data().name).filter(Boolean);
        } catch (err) {
          console.error("Inventory fetch blocked by Firebase Rules - using defaults only", err);
        }

        // Combine defaults with inventory ones, removing duplicates
        const combinedAccessories = [...new Set([...defaultAccessories, ...inventoryAccessories])];
        setAvailableAccessories(combinedAccessories);

        if (id) {
          const docRef = doc(db, "products", id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setFormData(docSnap.data() as any);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAccessoryCheck = (accName: string, checked: boolean) => {
    const current = formData.accessories ? formData.accessories.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
    let updated;
    if (checked) {
      updated = [...new Set([...current, accName])];
    } else {
      updated = current.filter((s: string) => s !== accName);
    }
    setFormData({ ...formData, accessories: updated.join(', ') });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const dataToSave: any = {
        ...formData,
        stock: Number(formData.stock),
        price: Number(formData.price),
      };
      
      if (id) {
        dataToSave.updatedAt = new Date().toISOString();
        await updateDoc(doc(db, "products", id), dataToSave);
      } else {
        dataToSave.createdAt = new Date().toISOString();
        await addDoc(collection(db, "products"), dataToSave);
      }
      navigate('/admin/products');
    } catch (error) {
      console.error("Error saving document: ", error);
      alert("Error saving item. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-white">Loading product details...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/products')} className="text-slate-500 hover:text-white transition-colors">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{id ? 'Edit Product' : 'Add New Product'}</h1>
          <p className="text-sm text-slate-500 mt-1">{id ? 'Update the details of your inventory item.' : 'Enter the details for your new inventory item.'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#0d0d0e] rounded-3xl border border-white/10 shadow-2xl p-8 space-y-8">
        
        <div className="border-b border-white/10 pb-8 mb-8">
          <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest mb-4">
            Product Images
          </label>
          <ImageUpload 
            images={formData.imageUrls} 
            onChange={(urls) => setFormData({ ...formData, imageUrls: urls })} 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
            Product Title *
            <input required name="title" value={formData.title} onChange={handleChange} type="text" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal" placeholder="e.g. MacBook Pro 16" />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
            Brand (Optional)
            <input name="brand" value={formData.brand} onChange={handleChange} type="text" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal" placeholder="e.g. Apple, Asus, Dell" />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
            SKU / Serial Number *
            <input required name="sku" value={formData.sku} onChange={handleChange} type="text" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal" placeholder="e.g. LAP-APP-001" />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
            Category *
            <select name="category" value={formData.category} onChange={handleChange} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal">
              <option value="Laptops" className="bg-[#0d0d0e]">Laptops</option>
              <option value="Desktops" className="bg-[#0d0d0e]">Desktops</option>
              <option value="Components" className="bg-[#0d0d0e]">Components</option>
              <option value="Accessories" className="bg-[#0d0d0e]">Accessories</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
            Condition *
            <select name="condition" value={formData.condition} onChange={handleChange} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal">
              <option value="New" className="bg-[#0d0d0e]">New</option>
              <option value="Used - Like New" className="bg-[#0d0d0e]">Used - Like New</option>
              <option value="Used - Good" className="bg-[#0d0d0e]">Used - Good</option>
              <option value="Used - Fair" className="bg-[#0d0d0e]">Used - Fair</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
            Price (₹) *
            <input required name="price" value={formData.price} onChange={handleChange} type="number" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal" />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
            Stock Quantity *
            <input required name="stock" value={formData.stock} onChange={handleChange} type="number" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal" />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
            Status *
            <select name="status" value={formData.status} onChange={handleChange} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal">
              <option value="In Stock" className="bg-[#0d0d0e]">In Stock</option>
              <option value="Out of Stock" className="bg-[#0d0d0e]">Out of Stock</option>
            </select>
          </label>
        </div>

        <div className="pt-6 border-t border-white/10">
          <h3 className="text-lg font-bold text-white mb-6">Detailed Specifications (Optional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
              Processor (CPU)
              <input name="processor" value={formData.processor} onChange={handleChange} type="text" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal" />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
              Memory (RAM)
              <input name="ram" value={formData.ram} onChange={handleChange} type="text" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal" />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
              Storage
              <input name="storage" value={formData.storage} onChange={handleChange} type="text" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal" />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
              Graphics (GPU)
              <input name="graphics" value={formData.graphics} onChange={handleChange} type="text" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal" />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
              Model Number
              <input name="modelNumber" value={formData.modelNumber} onChange={handleChange} type="text" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal" />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
              Processor Generation
              <input name="processorGen" value={formData.processorGen} onChange={handleChange} type="text" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal" placeholder="e.g. 12th Gen, 13th Gen" />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
              RAM Type & Speed
              <input name="ramType" value={formData.ramType} onChange={handleChange} type="text" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal" placeholder="e.g. DDR5 4800MHz" />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
              Storage Type
              <input name="storageType" value={formData.storageType} onChange={handleChange} type="text" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal" placeholder="e.g. NVMe PCIe 4.0" />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
              Display Type / Refresh Rate
              <input name="displayType" value={formData.displayType} onChange={handleChange} type="text" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal" placeholder="e.g. 15.6' FHD IPS 144Hz" />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
              Operating System
              <input name="os" value={formData.os} onChange={handleChange} type="text" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal" placeholder="e.g. Windows 11 Home" />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
              Color
              <input name="color" value={formData.color} onChange={handleChange} type="text" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal" placeholder="e.g. Space Gray" />
            </label>
          </div>
          <div className="mb-8">
            <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest mb-4">
              Included Free Accessories
            </label>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-3">
              {availableAccessories.length === 0 ? (
                <p className="text-xs text-slate-500">No accessories found in Inventory. Add items to Inventory with category "Accessories" to see them here.</p>
              ) : (
                <div className="flex flex-wrap gap-4">
                  {availableAccessories.map((acc, idx) => {
                    const isChecked = formData.accessories ? formData.accessories.split(',').map((s:string) => s.trim()).includes(acc) : false;
                    return (
                      <label key={idx} className="flex items-center gap-2 cursor-pointer bg-[#0d0d0e] border border-white/10 px-3 py-2 rounded-lg hover:border-blue-500/50 transition-colors">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={(e) => handleAccessoryCheck(acc, e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500 border-white/20 bg-white/5" 
                        />
                        <span className="text-sm text-slate-300 font-bold">{acc}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
            
            <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest mb-8">
              Custom Accessories (Comma separated)
              <input name="accessories" value={formData.accessories} onChange={handleChange} type="text" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal" placeholder="e.g. Custom Bag, Special Charger" />
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
            Description
            <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal"></textarea>
          </label>
        </div>

        <div className="flex justify-end pt-6 border-t border-white/10">
          <button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full text-sm font-bold transition-all shadow-lg shadow-blue-900/20 uppercase tracking-wider flex items-center gap-2">
            <Save className="h-4 w-4" />
            {isSubmitting ? "Saving..." : "Save Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
