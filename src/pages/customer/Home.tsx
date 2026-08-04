import { Link } from 'react-router-dom';
import { ArrowRight, Laptop, Monitor, Cpu, ShieldCheck, Wrench, Clock } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0b] text-slate-300">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-transparent"></div>
        {/* Abstract background pattern */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 z-10">
            <span className="inline-block py-1.5 px-4 rounded-full bg-blue-500/10 text-blue-400 text-[10px] uppercase tracking-widest font-bold mb-6 border border-blue-500/20">
              Premium Tech Retail & Service
            </span>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight text-white">
              Upgrade Your Tech <br/>
              <span className="text-blue-500">Elevate Your Work</span>
            </h1>
            <p className="text-sm text-slate-400 mb-8 max-w-lg leading-relaxed font-medium">
              Discover our curated selection of high-performance laptops, custom desktop builds, and professional repair services. 
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/products" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-blue-900/20 flex items-center">
                Shop Now <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link to="/services" className="bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 px-8 py-4 rounded-full text-xs font-bold uppercase tracking-wider transition-all backdrop-blur-sm">
                Book a Repair
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 mt-12 md:mt-0 z-10 flex justify-center">
            {/* Placeholder for Hero Image */}
            <div className="relative w-full max-w-md aspect-square rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/10 border border-white/10 bg-[#0d0d0e] flex items-center justify-center">
              <Monitor className="h-32 w-32 text-slate-700" />
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 to-transparent"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Shop by Category</h2>
            <p className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-500">Find exactly what you're looking for</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: 'Laptops', icon: Laptop, count: '124 Products', link: '/products?category=Laptops' },
              { title: 'Desktops', icon: Monitor, count: '56 Products', link: '/products?category=Desktops' },
              { title: 'Components', icon: Cpu, count: '312 Products', link: '/products?category=Components' },
              { title: 'Repairs', icon: Wrench, count: 'Expert Service', link: '/services' },
            ].map((category) => (
              <Link key={category.title} to={category.link} className="group flex flex-col items-center p-8 bg-[#0d0d0e] rounded-3xl border border-white/5 hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-900/10 transition-all">
                <div className="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 text-blue-500 mb-6 group-hover:scale-110 transition-transform">
                  <category.icon className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-white">{category.title}</h3>
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mt-3">{category.count}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-[#0d0d0e] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Verified Quality</h3>
              <p className="text-sm font-medium text-slate-400 leading-relaxed">Every second-hand laptop undergoes a rigorous 50-point inspection before hitting our shelves.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-2xl flex items-center justify-center mb-6">
                <Wrench className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Expert Repairs</h3>
              <p className="text-sm font-medium text-slate-400 leading-relaxed">Certified engineers handling everything from screen replacements to chip-level motherboard repairs.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-2xl flex items-center justify-center mb-6">
                <Clock className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Fast Turnaround</h3>
              <p className="text-sm font-medium text-slate-400 leading-relaxed">Most common repairs are completed within 24-48 hours. Real-time status tracking available.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
