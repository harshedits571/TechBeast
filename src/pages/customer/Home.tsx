import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Laptop, Monitor, Cpu, ShieldCheck, Wrench, Clock, ChevronRight } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';

export default function Home() {
  const [desktops, setDesktops] = useState<any[]>([]);

  useEffect(() => {
    const fetchDesktops = async () => {
      try {
        const q = query(collection(db, 'products'), where('category', '==', 'Desktops'), limit(3));
        const snap = await getDocs(q);
        setDesktops(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error fetching desktops", err);
      }
    };
    fetchDesktops();
  }, []);
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-700">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent"></div>
        {/* Abstract background pattern */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 z-10">
            <span className="inline-block py-1.5 px-4 rounded-full bg-blue-100 text-blue-700 text-[10px] uppercase tracking-widest font-bold mb-6 border border-blue-200">
              Premium Tech Retail & Service
            </span>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight text-slate-900">
              Upgrade Your Tech <br/>
              <span className="text-blue-600">Elevate Your Work</span>
            </h1>
            <p className="text-sm text-slate-600 mb-8 max-w-lg leading-relaxed font-medium">
              Discover our curated selection of high-performance laptops, custom desktop builds, and professional repair services. 
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/products" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-blue-600/20 flex items-center">
                Shop Now <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link to="/services" className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-8 py-4 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-sm">
                Book a Repair
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 mt-12 md:mt-0 z-10 flex justify-center">
            {/* Placeholder for Hero Image */}
            <div className="relative w-full max-w-md aspect-square rounded-3xl overflow-hidden shadow-2xl shadow-slate-200 border border-slate-200 bg-white flex items-center justify-center">
              <Monitor className="h-32 w-32 text-slate-200" />
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-50 to-transparent"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Shop by Category</h2>
            <p className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-500">Find exactly what you're looking for</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: 'Laptops', icon: Laptop, count: '124 Products', link: '/products?category=Laptops' },
              { title: 'Desktops', icon: Monitor, count: '56 Products', link: '/products?category=Desktops' },
              { title: 'Components', icon: Cpu, count: '312 Products', link: '/products?category=Components' },
              { title: 'Repairs', icon: Wrench, count: 'Expert Service', link: '/services' },
            ].map((category) => (
              <Link key={category.title} to={category.link} className="group flex flex-col items-center p-8 bg-white rounded-3xl border border-slate-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-900/5 transition-all">
                <div className="h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100 text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                  <category.icon className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">{category.title}</h3>
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mt-3">{category.count}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Desktops Section */}
      {desktops.length > 0 && (
        <section className="py-24 bg-white border-y border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-slate-50 to-transparent pointer-events-none"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12">
              <div>
                <span className="text-blue-600 text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 mb-3">
                  <Monitor className="h-4 w-4" /> Ready to Play
                </span>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Prebuilt Desktops</h2>
                <p className="mt-4 text-sm font-medium text-slate-500 max-w-xl">Professionally assembled custom rigs, perfectly balanced for gaming, streaming, and heavy workloads.</p>
              </div>
              <Link to="/products?category=Desktops" className="hidden md:flex items-center text-xs font-bold uppercase tracking-widest text-slate-600 hover:text-blue-600 transition-colors mt-6 md:mt-0">
                View All Desktops <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {desktops.map(desktop => (
                <Link key={desktop.id} to={`/products/${desktop.id}`} className="group bg-white rounded-3xl border border-slate-200 hover:border-blue-300 overflow-hidden hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 flex flex-col">
                  {/* Image Placeholder */}
                  <div className="aspect-[16/10] bg-slate-50 w-full flex items-center justify-center group-hover:bg-slate-100 transition-colors border-b border-slate-100 relative">
                    <span className="text-slate-400 text-[10px] font-bold tracking-[0.2em] uppercase">Desktop Rig</span>
                    {desktop.condition !== 'New' && (
                      <div className="absolute top-4 left-4">
                        <span className="bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                          {desktop.condition}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 line-clamp-2">{desktop.title}</h3>
                    
                    {/* Key Specs */}
                    <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex items-start gap-3">
                        <Cpu className="h-4 w-4 text-blue-500 mt-0.5" />
                        <div>
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Processor</p>
                          <p className="text-xs font-bold text-slate-700">{desktop.processor || 'Intel Core / AMD Ryzen'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Monitor className="h-4 w-4 text-purple-500 mt-0.5" />
                        <div>
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Graphics</p>
                          <p className="text-xs font-bold text-slate-700">{desktop.graphics || 'Dedicated GPU'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Price</span>
                        <span className="text-2xl font-bold text-slate-900">₹{Number(desktop.price).toLocaleString('en-IN')}</span>
                      </div>
                      <button className="bg-slate-100 group-hover:bg-blue-600 text-slate-500 group-hover:text-white p-3 rounded-full transition-colors border border-slate-200 group-hover:border-transparent">
                        <ArrowRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            <div className="mt-8 text-center md:hidden">
              <Link to="/products?category=Desktops" className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-slate-600 hover:text-blue-600 transition-colors">
                View All Desktops <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 bg-blue-100 text-blue-600 border border-blue-200 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">Verified Quality</h3>
              <p className="text-sm font-medium text-slate-600 leading-relaxed">Every second-hand laptop undergoes a rigorous 50-point inspection before hitting our shelves.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 bg-blue-100 text-blue-600 border border-blue-200 rounded-2xl flex items-center justify-center mb-6">
                <Wrench className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">Expert Repairs</h3>
              <p className="text-sm font-medium text-slate-600 leading-relaxed">Certified engineers handling everything from screen replacements to chip-level motherboard repairs.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 bg-blue-100 text-blue-600 border border-blue-200 rounded-2xl flex items-center justify-center mb-6">
                <Clock className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">Fast Turnaround</h3>
              <p className="text-sm font-medium text-slate-600 leading-relaxed">Most common repairs are completed within 24-48 hours. Real-time status tracking available.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
