import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function ProductForm() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
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
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const dataToSave = {
        ...formData,
        stock: Number(formData.stock),
        price: Number(formData.price),
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, "products"), dataToSave);
      navigate('/admin/products');
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Error adding item. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/products')} className="text-slate-500 hover:text-white transition-colors">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Add New Product</h1>
          <p className="text-sm text-slate-500 mt-1">Enter the details for your new inventory item.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#0d0d0e] rounded-3xl border border-white/10 shadow-2xl p-8 space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
            Product Title *
            <input required name="title" value={formData.title} onChange={handleChange} type="text" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal" placeholder="e.g. MacBook Pro 16" />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
            SKU / Serial Number *
            <input required name="sku" value={formData.sku} onChange={handleChange} type="text" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal" placeholder="e.g. LAP-APP-001" />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
            Category *
            <select name="category" value={formData.category} onChange={handleChange} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal">
              <option value="Laptops">Laptops</option>
              <option value="Desktops">Desktops</option>
              <option value="Components">Components</option>
              <option value="Accessories">Accessories</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
            Condition *
            <select name="condition" value={formData.condition} onChange={handleChange} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal">
              <option value="New">New</option>
              <option value="Used - Like New">Used - Like New</option>
              <option value="Used - Good">Used - Good</option>
              <option value="Used - Fair">Used - Fair</option>
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
              <option value="In Stock">In Stock</option>
              <option value="Out of Stock">Out of Stock</option>
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
