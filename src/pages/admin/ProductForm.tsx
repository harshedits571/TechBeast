import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, addDoc, doc, getDoc, updateDoc, getDocs, query, where } from 'firebase/firestore';
import ImageUpload from '../../components/admin/ImageUpload';
import { FormSkeleton } from '../../components/ui/Skeleton';
import { useSettings } from '../../contexts/SettingsContext';

export default function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const { settings } = useSettings();
  const combos = settings.accessoryCombos || [];
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
    comboId: '',
    modelNumber: '',
    processorGen: '',
    processorModel: '',
    ramType: '',
    ramFreq: '',
    storageType: '',
    displayType: '',
    os: '',
    color: '',
    brandWarranty: '',
    imageUrls: [] as string[],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch available accessories from inventory
        let inventoryAccessories: string[] = [];
        try {
          const accQuery = query(collection(db, 'inventory'), where('isFreeAccessory', '==', true));
          const accSnap = await getDocs(accQuery);
          inventoryAccessories = accSnap.docs.map(d => d.data().name).filter(Boolean);
        } catch (err) {
          console.error("Inventory fetch blocked by Firebase Rules or failed", err);
        }

        // Only use inventory ones, removing duplicates just in case
        const combinedAccessories = [...new Set([...inventoryAccessories])];
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
    return <FormSkeleton />;
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
            <select name="brand" value={formData.brand} onChange={handleChange} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal">
              <option value="" className="bg-[#0d0d0e]">Select Brand</option>
              <option value="Asus" className="bg-[#0d0d0e]">Asus</option>
              <option value="Dell" className="bg-[#0d0d0e]">Dell</option>
              <option value="HP" className="bg-[#0d0d0e]">HP</option>
              <option value="Lenovo" className="bg-[#0d0d0e]">Lenovo</option>
              <option value="MSI" className="bg-[#0d0d0e]">MSI</option>
              <option value="Acer" className="bg-[#0d0d0e]">Acer</option>
            </select>
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
            <select required name="condition" value={formData.condition} onChange={handleChange} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal">
              <option value="" className="bg-[#0d0d0e]">Select Condition</option>
              <option value="New" className="bg-[#0d0d0e]">New</option>
              <option value="Used" className="bg-[#0d0d0e]">Used / Second Hand</option>
              <option value="Refurbished" className="bg-[#0d0d0e]">Refurbished</option>
            </select>
          </label>
          
          {formData.condition === 'New' && (
            <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest animate-in fade-in zoom-in duration-200">
              Brand Warranty Terms *
              <input required name="brandWarranty" value={formData.brandWarranty} onChange={handleChange} type="text" className="bg-white/5 border border-blue-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal shadow-[0_0_15px_rgba(59,130,246,0.1)]" placeholder="e.g. 1 Year, 3 Years + ADP" />
            </label>
          )}
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
          
          {/* Processor Group */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 border-b border-white/10 pb-8">
            <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
              Processor Line
              <select name="processor" value={formData.processor} onChange={handleChange} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal">
                <option value="" className="bg-[#0d0d0e]">Select Line</option>
                <option value="Core i3" className="bg-[#0d0d0e]">Core i3</option>
                <option value="Core i5" className="bg-[#0d0d0e]">Core i5</option>
                <option value="Core i7" className="bg-[#0d0d0e]">Core i7</option>
                <option value="Core i9" className="bg-[#0d0d0e]">Core i9</option>
                <option value="Ryzen 3" className="bg-[#0d0d0e]">Ryzen 3</option>
                <option value="Ryzen 5" className="bg-[#0d0d0e]">Ryzen 5</option>
                <option value="Ryzen 7" className="bg-[#0d0d0e]">Ryzen 7</option>
                <option value="Ryzen 9" className="bg-[#0d0d0e]">Ryzen 9</option>
                <option value="Apple M1" className="bg-[#0d0d0e]">Apple M1</option>
                <option value="Apple M2" className="bg-[#0d0d0e]">Apple M2</option>
                <option value="Apple M3" className="bg-[#0d0d0e]">Apple M3</option>
                {formData.processor && !['Core i3', 'Core i5', 'Core i7', 'Core i9', 'Ryzen 3', 'Ryzen 5', 'Ryzen 7', 'Ryzen 9', 'Apple M1', 'Apple M2', 'Apple M3'].includes(formData.processor) && (
                  <option value={formData.processor} className="bg-[#0d0d0e]">{formData.processor}</option>
                )}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
              Processor Gen
              <select name="processorGen" value={formData.processorGen} onChange={handleChange} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal">
                <option value="" className="bg-[#0d0d0e]">Select Gen</option>
                {[...Array(14)].map((_, i) => <option key={i} value={`${i+1}th Gen`} className="bg-[#0d0d0e]">{i+1}th Gen</option>)}
                <option value="N/A" className="bg-[#0d0d0e]">N/A</option>
                {formData.processorGen && formData.processorGen !== 'N/A' && !formData.processorGen.includes('th Gen') && !formData.processorGen.includes('st Gen') && !formData.processorGen.includes('nd Gen') && !formData.processorGen.includes('rd Gen') && (
                  <option value={formData.processorGen} className="bg-[#0d0d0e]">{formData.processorGen}</option>
                )}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
              Processor Model
              <input name="processorModel" value={formData.processorModel || ''} onChange={handleChange} type="text" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal" placeholder="e.g. 12500H" />
            </label>
          </div>

          {/* RAM Group */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 border-b border-white/10 pb-8">
            <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
              Memory (RAM)
              <select name="ram" value={formData.ram} onChange={handleChange} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal">
                <option value="" className="bg-[#0d0d0e]">Select RAM</option>
                <option value="4GB" className="bg-[#0d0d0e]">4GB</option>
                <option value="8GB" className="bg-[#0d0d0e]">8GB</option>
                <option value="16GB" className="bg-[#0d0d0e]">16GB</option>
                <option value="32GB" className="bg-[#0d0d0e]">32GB</option>
                <option value="64GB" className="bg-[#0d0d0e]">64GB</option>
                {formData.ram && !['4GB', '8GB', '16GB', '32GB', '64GB'].includes(formData.ram) && (
                  <option value={formData.ram} className="bg-[#0d0d0e]">{formData.ram}</option>
                )}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
              RAM Type
              <select name="ramType" value={formData.ramType} onChange={handleChange} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal">
                <option value="" className="bg-[#0d0d0e]">Select Type</option>
                <option value="DDR3" className="bg-[#0d0d0e]">DDR3</option>
                <option value="DDR4" className="bg-[#0d0d0e]">DDR4</option>
                <option value="DDR5" className="bg-[#0d0d0e]">DDR5</option>
                {formData.ramType && !['DDR3', 'DDR4', 'DDR5'].includes(formData.ramType) && (
                  <option value={formData.ramType} className="bg-[#0d0d0e]">{formData.ramType}</option>
                )}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
              RAM Frequency
              <input name="ramFreq" value={formData.ramFreq || ''} onChange={handleChange} type="text" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal" placeholder="e.g. 4800MHz" />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
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
            
            <div className="grid grid-cols-1 gap-8 mb-6">
              <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
                Accessory Combo (Recommended)
                <select name="comboId" value={formData.comboId} onChange={handleChange} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal">
                  <option value="" className="bg-[#0d0d0e]">None / Custom only</option>
                  {combos.map(combo => (
                    <option key={combo.id} value={combo.id} className="bg-[#0d0d0e]">{combo.name} ({combo.items?.length || 0} items)</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest mb-8">
              Additional Custom Accessories (Comma separated)
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
