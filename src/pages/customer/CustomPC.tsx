import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Cpu, Zap, ShieldCheck, ArrowRight, Heart } from 'lucide-react';
import SEO from '../../components/ui/SEO';

export default function CustomPC() {
  const [sortBy, setSortBy] = useState('lowToHigh');

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <SEO 
        title="Custom PC Builder - Tech Beast Hubli"
        description="Build your custom PC with store inventory items, live price estimates, and official PC quotations."
      />

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6 bg-white p-6 rounded-2xl shadow-sm">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Custom PC Builder</h1>
            <p className="text-sm text-slate-500 mt-1">Select your platform and configure a custom PC using store inventory items.</p>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4">
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-100 text-sm text-slate-800 border border-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:border-red-600 transition-colors font-medium"
            >
              <option value="lowToHigh">Sort by price: Low To High</option>
              <option value="highToLow">Sort by price: High To Low</option>
            </select>
            <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">2 Platforms</span>
          </div>
        </div>

        {/* Platform Selection Cards - Clean Light Theme */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto pt-2">
          
          {/* Intel Custom PC Build */}
          <div className="group bg-white border border-slate-200 hover:border-blue-500 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
            <div className="p-6 relative bg-slate-50 flex items-center justify-center min-h-[260px] border-b border-slate-100">
              <button className="absolute top-4 left-4 p-2 text-slate-400 hover:text-red-600 transition-colors">
                <Heart className="w-5 h-5 text-slate-400 hover:fill-red-500" />
              </button>
              
              <div className="relative w-full max-w-[240px] aspect-square flex items-center justify-center">
                <img 
                  src="https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80" 
                  alt="Intel Custom PC" 
                  className="w-full h-full object-contain rounded-2xl group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute -bottom-3 -left-3 bg-blue-600 text-white px-3 py-1.5 rounded-xl shadow-md flex items-center gap-2 border border-blue-400/30">
                  <span className="font-bold text-xs tracking-wider uppercase">Intel Platform</span>
                </div>
              </div>
            </div>

            <div className="p-6 flex flex-col justify-between flex-1 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Intel Custom PC Build
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Configure Intel Core & Core Ultra processors with supported motherboards, DDR4/DDR5 memory, and GPUs from our store inventory.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Estimated Starting Price</span>
                  <span className="text-lg font-bold text-slate-900">From ₹50,000</span>
                </div>

                <Link 
                  to="/custom-pc/builder?platform=intel" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-blue-500/20"
                >
                  Configure Build <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* AMD Custom PC Build */}
          <div className="group bg-white border border-slate-200 hover:border-red-500 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
            <div className="p-6 relative bg-slate-50 flex items-center justify-center min-h-[260px] border-b border-slate-100">
              <button className="absolute top-4 left-4 p-2 text-slate-400 hover:text-red-600 transition-colors">
                <Heart className="w-5 h-5 text-slate-400 hover:fill-red-500" />
              </button>
              
              <div className="relative w-full max-w-[240px] aspect-square flex items-center justify-center">
                <img 
                  src="https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=600&q=80" 
                  alt="AMD Custom PC" 
                  className="w-full h-full object-contain rounded-2xl group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute -bottom-3 -left-3 bg-red-600 text-white px-3 py-1.5 rounded-xl shadow-md flex items-center gap-2 border border-red-400/30">
                  <span className="font-bold text-xs tracking-wider uppercase">AMD Ryzen Platform</span>
                </div>
              </div>
            </div>

            <div className="p-6 flex flex-col justify-between flex-1 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                  AMD Custom PC Build
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Configure AMD Ryzen 5000/7000 series processors with AM4/AM5 socket motherboards and high-speed memory.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Estimated Starting Price</span>
                  <span className="text-lg font-bold text-slate-900">From ₹50,000</span>
                </div>

                <Link 
                  to="/custom-pc/builder?platform=amd" 
                  className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-red-500/20"
                >
                  Configure Build <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

        </div>

        {/* Feature Highlights - Clean White */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl flex items-start gap-4 shadow-sm">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shrink-0">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Store Inventory Sourced</h4>
              <p className="text-xs text-slate-500 mt-1">Components are fetched directly from our store's active inventory and catalog.</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-2xl flex items-start gap-4 shadow-sm">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Live Itemized Pricing</h4>
              <p className="text-xs text-slate-500 mt-1">Clear price for each component shown in real-time as you customize your PC.</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-2xl flex items-start gap-4 shadow-sm">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl border border-purple-100 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Store Quotation & Assembly</h4>
              <p className="text-xs text-slate-500 mt-1">Get an instant official PC quotation to bring to our store for assembly and testing.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
