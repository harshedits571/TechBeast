import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, ChevronDown } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, addDoc, doc, getDoc, updateDoc, getDocs, query, where } from 'firebase/firestore';
import ImageUpload from '../../components/admin/ImageUpload';
import { FormSkeleton } from '../../components/ui/Skeleton';
import { useSettings } from '../../contexts/SettingsContext';

const PREDEFINED_BRANDS = ["Asus", "Dell", "HP", "Lenovo", "MSI", "Acer", "Antec", "Corsair", "Gigabyte"];

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
    componentType: '',
    condition: 'New',
    stock: 1,
    price: 0,
    oldPrice: 0,
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
    cpuPlatform: '',
    cpuSocket: '',
    ramType: '',
    ramFreq: '',
    storageType: '',
    displayType: '',
    os: '',
    color: '',
    brandWarranty: '',
    cabinetFormFactor: '',
    cabinetFans: '',
    motherboardSocket: '',
    motherboardFormFactor: '',
    powerSupplyWattage: '',
    powerSupplyRating: '',
    imageUrls: [] as string[],
  });

  const [brandOpen, setBrandOpen] = useState(false);
  const brandRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (brandRef.current && !brandRef.current.contains(event.target as Node)) {
        setBrandOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        oldPrice: Number(formData.oldPrice) || 0,
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

  const isDesktop = formData.category === 'Desktops';
  const isFullSystem = formData.category === 'Laptops' || (isDesktop && formData.componentType === 'Assembled PC');
  const isRAM = isDesktop && formData.componentType === 'RAM';
  const isProcessor = isDesktop && formData.componentType === 'Processor';
  const isStorage = isDesktop && formData.componentType === 'Storage (SSD/HDD)';
  const isGraphics = isDesktop && formData.componentType === 'Graphics Card';
  const isCabinet = isDesktop && formData.componentType === 'Cabinet';
  const isMotherboard = isDesktop && formData.componentType === 'Motherboard';
  const isPowerSupply = isDesktop && formData.componentType === 'Power Supply';
  
  const showSpecsSection = isFullSystem || isRAM || isProcessor || isStorage || isGraphics || isCabinet || isMotherboard || isPowerSupply;

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
          <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest relative" ref={brandRef}>
            Brand (Optional)
            <div className="relative">
              <input 
                name="brand" 
                value={formData.brand} 
                onChange={handleChange} 
                onFocus={() => setBrandOpen(true)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal" 
                placeholder="Select or type brand" 
                autoComplete="off"
              />
              <button 
                type="button"
                onClick={() => setBrandOpen(!brandOpen)}
                className="absolute right-0 top-0 h-full px-3 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <ChevronDown className={`h-5 w-5 transition-transform ${brandOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
            
            {brandOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1c] border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl max-h-48 overflow-y-auto">
                {PREDEFINED_BRANDS.filter(b => b.toLowerCase().includes(formData.brand.toLowerCase())).map(b => (
                  <button
                    key={b}
                    type="button"
                    className="w-full text-left px-4 py-3 text-white hover:bg-blue-600 transition-colors normal-case tracking-normal font-normal"
                    onClick={() => {
                      setFormData({ ...formData, brand: b });
                      setBrandOpen(false);
                    }}
                  >
                    {b}
                  </button>
                ))}
              </div>
            )}
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
          
          {formData.category === 'Desktops' && (
            <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest animate-in fade-in zoom-in duration-200">
              Component Type
              <select name="componentType" value={formData.componentType} onChange={handleChange} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal">
                <option value="" className="bg-[#0d0d0e]">Select Component Type</option>
                <option value="Assembled PC" className="bg-[#0d0d0e]">Assembled PC</option>
                <option value="RAM" className="bg-[#0d0d0e]">RAM</option>
                <option value="Storage (SSD/HDD)" className="bg-[#0d0d0e]">Storage (SSD/HDD)</option>
                <option value="Graphics Card" className="bg-[#0d0d0e]">Graphics Card</option>
                <option value="Processor" className="bg-[#0d0d0e]">Processor</option>
                <option value="Motherboard" className="bg-[#0d0d0e]">Motherboard</option>
                <option value="Power Supply" className="bg-[#0d0d0e]">Power Supply</option>
                <option value="Cabinet" className="bg-[#0d0d0e]">Cabinet</option>
              </select>
            </label>
          )}

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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
            Original Price (₹)
            <input name="oldPrice" value={formData.oldPrice} onChange={handleChange} type="number" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal" placeholder="0" />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
            Selling Price (₹) *
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

        {showSpecsSection && (
          <div className="pt-6 border-t border-white/10">
            <h3 className="text-lg font-bold text-white mb-6">Detailed Specifications (Optional)</h3>
            
            {/* Processor Group */}
            {(isFullSystem || isProcessor) && (
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
              <input name="processorModel" value={formData.processorModel || ''} onChange={handleChange} type="text" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal" placeholder="e.g. 14600K / 7800X3D" />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
              CPU Platform
              <select name="cpuPlatform" value={formData.cpuPlatform || ''} onChange={handleChange} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal">
                <option value="" className="bg-[#0d0d0e]">Auto-Detect / Any</option>
                <option value="Intel" className="bg-[#0d0d0e]">Intel</option>
                <option value="AMD" className="bg-[#0d0d0e]">AMD</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
              CPU Socket
              <select name="cpuSocket" value={formData.cpuSocket || ''} onChange={handleChange} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal">
                <option value="" className="bg-[#0d0d0e]">Auto-Detect Socket</option>
                <option value="LGA1700" className="bg-[#0d0d0e]">LGA1700 (Intel 12/13/14th Gen)</option>
                <option value="LGA1851" className="bg-[#0d0d0e]">LGA1851 (Intel Core Ultra)</option>
                <option value="AM5" className="bg-[#0d0d0e]">AM5 (AMD Ryzen 7000/8000/9000)</option>
                <option value="AM4" className="bg-[#0d0d0e]">AM4 (AMD Ryzen 3000/5000)</option>
              </select>
            </label>
              </div>
            )}

            {/* RAM Group */}
            {(isFullSystem || isRAM) && (
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
            )}

            {/* Storage, GPU & System Specifics */}
            {isFullSystem && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 border-b border-white/10 pb-8">
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
            )}

            {/* Storage ONLY */}
            {isStorage && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 border-b border-white/10 pb-8">
                <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
                  Storage Capacity
                  <input name="storage" value={formData.storage} onChange={handleChange} type="text" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal" placeholder="e.g. 1TB" />
                </label>
                <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
                  Storage Type
                  <input name="storageType" value={formData.storageType} onChange={handleChange} type="text" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal" placeholder="e.g. NVMe PCIe 4.0" />
                </label>
              </div>
            )}

            {/* Graphics ONLY */}
            {isGraphics && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 border-b border-white/10 pb-8">
                <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
                  Graphics (GPU)
                  <input name="graphics" value={formData.graphics} onChange={handleChange} type="text" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal" placeholder="e.g. RTX 4070 12GB" />
                </label>
              </div>
            )}

            {/* Cabinet ONLY */}
            {isCabinet && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 border-b border-white/10 pb-8">
                <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
                  Form Factor
                  <input name="cabinetFormFactor" value={formData.cabinetFormFactor || ''} onChange={handleChange} type="text" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal" placeholder="e.g. ATX Mid Tower" />
                </label>
                <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
                  Included Fans
                  <input name="cabinetFans" value={formData.cabinetFans || ''} onChange={handleChange} type="text" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal" placeholder="e.g. 3x 120mm ARGB" />
                </label>
              </div>
            )}

            {/* Motherboard ONLY */}
            {isMotherboard && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 border-b border-white/10 pb-8">
                <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
                  CPU Socket
                  <input name="motherboardSocket" value={formData.motherboardSocket || ''} onChange={handleChange} type="text" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal" placeholder="e.g. LGA 1700, AM5" />
                </label>
                <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
                  Form Factor
                  <input name="motherboardFormFactor" value={formData.motherboardFormFactor || ''} onChange={handleChange} type="text" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal" placeholder="e.g. ATX, Micro-ATX" />
                </label>
              </div>
            )}

            {/* Power Supply ONLY */}
            {isPowerSupply && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 border-b border-white/10 pb-8">
                <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
                  Wattage
                  <input name="powerSupplyWattage" value={formData.powerSupplyWattage || ''} onChange={handleChange} type="text" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal" placeholder="e.g. 750W" />
                </label>
                <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
                  Efficiency Rating
                  <input name="powerSupplyRating" value={formData.powerSupplyRating || ''} onChange={handleChange} type="text" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal" placeholder="e.g. 80+ Gold" />
                </label>
              </div>
            )}

            {/* Raw Specifications (Optional, good for Desktops/Components) */}
            <div className="mt-8">
              <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest mb-2">
                Raw Specifications (For easy copy-paste)
                <span className="text-xs text-slate-500 normal-case tracking-normal font-normal">Paste text from manufacturer websites. Each line will be formatted as a neat bullet point. Ideal for Desktops and Components.</span>
                <textarea 
                  name="rawSpecifications" 
                  value={formData.rawSpecifications || ''} 
                  onChange={handleChange} 
                  rows={8}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal mt-2" 
                  placeholder="Model: V240&#10;Form Factor: Mid Tower&#10;Motherboard: ATX | mATX" 
                />
              </label>
            </div>

          </div>
        )}

        <div className="pt-6 border-t border-white/10">
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
