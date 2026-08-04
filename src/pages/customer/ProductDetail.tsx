import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Heart, Share2, Check, ShieldCheck, Truck, RotateCcw, Cpu, HardDrive, Monitor, Battery } from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function ProductDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('specs');
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.error("No such product!");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return <div className="bg-[#0a0a0b] min-h-screen flex items-center justify-center text-white">Loading product details...</div>;
  }

  if (!product) {
    return <div className="bg-[#0a0a0b] min-h-screen flex flex-col items-center justify-center text-white">
      <h2 className="text-2xl font-bold mb-4">Product not found</h2>
      <Link to="/products" className="text-blue-500 hover:underline">Back to products</Link>
    </div>;
  }

  const specs = {
    processor: product.processor || 'Not Specified',
    ram: product.ram || 'Not Specified',
    storage: product.storage || 'Not Specified',
    graphics: product.graphics || 'Not Specified',
  };

  return (
    <div className="bg-[#0a0a0b] min-h-screen text-slate-300 font-sans">
      {/* Breadcrumbs */}
      <div className="border-b border-white/5 bg-[#0d0d0e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex text-[10px] font-bold uppercase tracking-widest text-slate-500">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <span className="mx-3">/</span>
            <Link to="/products" className="hover:text-white transition-colors">Products</Link>
            <span className="mx-3">/</span>
            <Link to={`/products?category=${product.category || 'All'}`} className="hover:text-white transition-colors">{product.category || 'Product'}</Link>
            <span className="mx-3">/</span>
            <span className="text-white truncate">{product.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16">
          {/* Image Gallery */}
          <div className="flex flex-col-reverse lg:flex-row gap-4 lg:gap-6">
            <div className="flex lg:flex-col gap-4 overflow-x-auto lg:overflow-visible">
              {[1, 2, 3, 4].map((i) => (
                <button key={i} className={`flex-shrink-0 w-20 h-20 rounded-2xl bg-white/5 border-2 flex items-center justify-center transition-colors ${i === 1 ? 'border-blue-500' : 'border-transparent hover:border-white/20'}`}>
                   <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">IMG {i}</span>
                </button>
              ))}
            </div>
            <div className="flex-1 aspect-square bg-[#0d0d0e] rounded-3xl flex items-center justify-center border border-white/5 relative overflow-hidden shadow-2xl">
               <span className="text-slate-600 font-bold tracking-[0.2em] uppercase text-xl">Main Product Image</span>
               {product.condition !== 'New' && (
                  <div className="absolute top-6 left-6">
                    <span className="bg-amber-500/20 text-amber-500 border border-amber-500/30 text-[10px] font-bold px-4 py-2 rounded-full uppercase tracking-widest backdrop-blur-md">
                      {product.condition}
                    </span>
                  </div>
                )}
            </div>
          </div>

          {/* Product Info */}
          <div className="mt-10 px-4 sm:px-0 lg:mt-0">
            <h1 className="text-3xl font-bold tracking-tight text-white">{product.title}</h1>
            
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  {product.oldPrice && (
                    <span className="text-sm font-bold text-slate-500 line-through">₹{Number(product.oldPrice).toLocaleString('en-IN')}</span>
                  )}
                  <span className="text-4xl font-bold text-white">₹{Number(product.price).toLocaleString('en-IN')}</span>
                </div>
                {product.oldPrice && (
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
                    Save ₹{(product.oldPrice - product.price).toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-8 border-t border-white/5 pt-8">
              <p className="text-sm font-medium text-slate-400 leading-relaxed">{product.description || product.shortDescription || 'Verified in perfect working condition.'}</p>
            </div>

            {/* Quick Specs Overview */}
            <div className="mt-8 grid grid-cols-2 gap-4">
               <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                 <Cpu className="h-6 w-6 text-blue-500 mt-0.5" />
                 <div>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Processor</p>
                   <p className="text-sm font-bold text-slate-300 mt-1 line-clamp-2">{specs.processor}</p>
                 </div>
               </div>
               <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                 <HardDrive className="h-6 w-6 text-blue-500 mt-0.5" />
                 <div>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Memory & Storage</p>
                   <p className="text-sm font-bold text-slate-300 mt-1">{specs.ram} • {specs.storage}</p>
                 </div>
               </div>
            </div>

            <div className="mt-8 border-t border-white/5 pt-8">
              <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-500 mb-8">
                 {product.stock > 0 ? (
                    <span className="flex items-center text-emerald-400">
                      <Check className="h-4 w-4 mr-2" /> In Stock ({product.stock} available)
                    </span>
                 ) : (
                    <span className="text-red-500">Out of Stock</span>
                 )}
                 <span className="text-white/10">|</span>
                 <span>SKU: {product.sku}</span>
              </div>

              <div className="flex gap-4">
                <button 
                  disabled={product.stock === 0}
                  className="flex-1 bg-blue-600 border border-transparent rounded-full py-4 px-8 flex items-center justify-center text-xs font-bold uppercase tracking-wider text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-600/20"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </button>
                <button className="rounded-full py-4 px-4 flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors border border-white/10 bg-[#0d0d0e]">
                  <Heart className="h-5 w-5" />
                </button>
                <button className="rounded-full py-4 px-4 flex items-center justify-center text-slate-400 hover:text-blue-400 hover:bg-white/5 transition-colors border border-white/10 bg-[#0d0d0e]">
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Guarantees */}
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 border-t border-white/5 pt-8">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{product.warranty || '6 Months TechBest Certified Warranty'}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500">
                  <Truck className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Free Store Pickup</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500">
                  <RotateCcw className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">7-Day Return</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs section */}
        <div className="mt-24">
          <div className="border-b border-white/5">
            <nav className="-mb-px flex space-x-8">
              {['specs', 'condition', 'shipping'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-white/20'
                  }`}
                >
                  {tab === 'specs' && 'Technical Specifications'}
                  {tab === 'condition' && 'Condition Report'}
                  {tab === 'shipping' && 'Shipping & Returns'}
                </button>
              ))}
            </nav>
          </div>
          
          <div className="py-12">
            {activeTab === 'specs' && (
              <div className="grid md:grid-cols-2 gap-x-12 gap-y-6">
                {Object.entries(specs).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-4 border-b border-white/5">
                    <dt className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{key}</dt>
                    <dd className="text-sm font-medium text-slate-300 text-right max-w-[60%]">{value}</dd>
                  </div>
                ))}
              </div>
            )}
            
            {activeTab === 'condition' && (
              <div className="space-y-8 max-w-3xl">
                <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-3xl flex items-start gap-4">
                  <ShieldCheck className="h-8 w-8 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-amber-400">TechBest Certified Pre-Owned</h4>
                    <p className="text-sm font-medium text-amber-500/80 mt-2 leading-relaxed">This device has passed our rigorous 50-point diagnostic test ensuring it meets our high standards for performance and reliability.</p>
                  </div>
                </div>
                
                <div className="grid gap-8 mt-8">
                  <div className="flex items-start gap-4">
                    <Monitor className="h-6 w-6 text-slate-500 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-widest">Cosmetic Condition</h4>
                      <p className="text-sm font-medium text-slate-400 mt-2">{product.conditionReport?.cosmetic || 'Pristine condition. No visible scratches on screen or chassis.'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Battery className="h-6 w-6 text-slate-500 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-widest">Battery Health</h4>
                      <p className="text-sm font-medium text-slate-400 mt-2">{product.conditionReport?.batteryHealth || 'Excellent condition.'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Cpu className="h-6 w-6 text-slate-500 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-widest">Functionality Check</h4>
                      <p className="text-sm font-medium text-slate-400 mt-2">{product.conditionReport?.functionality || 'All ports, keyboard, touchpad, and webcam tested 100% functional.'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'shipping' && (
               <div className="prose prose-sm prose-invert max-w-none text-slate-400">
                 <h4 className="font-bold text-white text-xs uppercase tracking-widest mb-4">In-Store Pickup</h4>
                 <p className="mb-8">Available immediately during store hours for items in stock. Reserve online and pay at the store.</p>
                 
                 <h4 className="font-bold text-white text-xs uppercase tracking-widest mb-4">Return Policy</h4>
                 <p>Used items come with a 7-day return window if the device is defective. The item must be returned in the exact condition it was purchased with all included accessories.</p>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
