import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Monitor, ChevronRight, Smartphone, Tv, Headphones, Watch, Camera, Gamepad, Keyboard, Zap, Play, Star, Calendar, Users, Award, ShieldCheck, Cpu } from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useSettings } from '../../contexts/SettingsContext';
import SEO from '../../components/ui/SEO';

// Simple product card component for the homepage grids
function HomeProductCard({ product }: { product: any; key?: string | number }) {
  const isDiscounted = product.oldPrice && product.oldPrice > product.price;
  const discountPercent = isDiscounted
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : Math.floor(Math.random() * 20) + 5;

  return (
    <Link to={`/products/${product.id}`} className="group bg-white border border-slate-200 rounded-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col relative p-4">
      <div className="absolute top-4 left-4 z-10">
        <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider">
          -{discountPercent}% OFF
        </span>
      </div>
      <div className="aspect-[4/3] w-full flex items-center justify-center mb-4 pt-8">
        {product.imageUrls && product.imageUrls.length > 0 ? (
          <img src={product.imageUrls[0]} alt={product.title} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <Monitor className="h-20 w-20 text-slate-200" />
        )}
      </div>
      <div className="flex flex-col flex-grow">
        <div className="text-xs text-slate-400 font-medium mb-1">{product.brand || product.category}</div>
        <h3 className="font-bold text-slate-800 text-sm leading-tight mb-2 line-clamp-2">{product.title}</h3>
        <div className="mt-auto pt-4 flex items-center gap-2">
          <span className="font-bold text-lg text-slate-900">₹{product.price?.toLocaleString('en-IN')}</span>
          {isDiscounted && (
            <span className="text-sm text-slate-400 line-through">₹{product.oldPrice?.toLocaleString('en-IN')}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const { settings } = useSettings();
  const [flashSaleProducts, setFlashSaleProducts] = useState<any[]>([]);
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [newArrivals, setNewArrivals] = useState<any[]>([]);

  // Flash sale timer state
  const [timeLeft, setTimeLeft] = useState({ hours: '00', minutes: '00', seconds: '00' });

  useEffect(() => {
    if (settings.flashSaleEnabled && settings.flashSaleEndTime) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const end = new Date(settings.flashSaleEndTime).getTime();
        const distance = end - now;

        if (distance < 0) {
          clearInterval(interval);
          setTimeLeft({ hours: '00', minutes: '00', seconds: '00' });
        } else {
          const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const s = Math.floor((distance % (1000 * 60)) / 1000);
          setTimeLeft({
            hours: h.toString().padStart(2, '0'),
            minutes: m.toString().padStart(2, '0'),
            seconds: s.toString().padStart(2, '0')
          });
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [settings.flashSaleEnabled, settings.flashSaleEndTime]);

  useEffect(() => {
    const fetchSelectedProducts = async () => {
      // Helper to fetch multiple products by ID
      const fetchByIds = async (ids: string[]) => {
        if (!ids || ids.length === 0) return [];
        const promises = ids.map(id => getDoc(doc(db, 'products', id)));
        const docs = await Promise.all(promises);
        return docs.filter(d => d.exists()).map(d => ({ id: d.id, ...d.data() }));
      };

      try {
        const flash = await fetchByIds(settings.flashSaleProductIds || []);
        setFlashSaleProducts(flash);

        const best = await fetchByIds(settings.bestSellerIds || []);
        setBestSellers(best);

        const arrivals = await fetchByIds(settings.newArrivalIds || []);
        setNewArrivals(arrivals);
      } catch (err) {
        console.error("Error fetching curated products", err);
      }
    };
    fetchSelectedProducts();
  }, [settings]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-700">
      <SEO />

      {/* 1. HERO BANNERS (GRID LAYOUT) */}
      {settings.heroBanners && settings.heroBanners.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-8 w-full">
          <div className={`columns-1 gap-4 space-y-4 ${
            settings.heroBanners.length === 1 ? '' :
            settings.heroBanners.length === 2 ? 'md:columns-2' :
            settings.heroBanners.length === 4 ? 'md:columns-2' :
            'md:columns-3'
          }`}>
            {settings.heroBanners.map((banner: any, idx: number) => (
              <Link key={idx} to={banner.link || '#'} className="block relative rounded-2xl overflow-hidden group shadow-md w-full break-inside-avoid">
                <img src={banner.imageUrl} alt={`Hero Banner ${idx + 1}`} className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-700" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 2. INTRO TEXT SECTION */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 flex flex-col items-center text-center">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight mb-4 sm:mb-6 leading-tight text-slate-900">
            Upgrade Your Tech Element <br />
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-slate-600 mb-8 max-w-md sm:max-w-lg lg:max-w-2xl leading-relaxed font-medium">
            Discover our curated selection of high-performance laptops, custom desktop builds, and professional repair services.
          </p>
          <div className="flex gap-4">
            <Link to="/products" className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-lg flex items-center">
              Shop Now <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. BRANDS SECTION (Logos) */}
      <section className="py-10 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-center text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 sm:mb-8">Top Brands We Trust</h3>
          <div className="flex justify-start md:justify-center items-center gap-6 sm:gap-8 md:gap-12 overflow-x-auto pb-4 hide-scrollbar px-2 touch-pan-y">
            {[
              { name: 'Asus', logo: 'https://logos-world.net/wp-content/uploads/2020/07/Asus-Logo-700x394.png', link: '/products?brand=Asus' },
              { name: 'Dell', logo: 'https://logos-world.net/wp-content/uploads/2020/08/Dell-Logo-700x394.png', link: '/products?brand=Dell' },
              { name: 'HP', logo: 'https://logos-world.net/wp-content/uploads/2020/11/HP-Logo-700x394.png', link: '/products?brand=HP' },
              { name: 'Lenovo', logo: 'https://logos-world.net/wp-content/uploads/2022/07/Lenovo-Logo-700x394.png', link: '/products?brand=Lenovo' },
              { name: 'MSI', logo: 'https://logos-world.net/wp-content/uploads/2020/11/MSI-Emblem-700x394.png', link: '/products?brand=MSI' },
              { name: 'Acer', logo: 'https://logos-world.net/wp-content/uploads/2022/11/Acer-Logo-500x281.png', link: '/products?brand=Acer' },
            ].map((brand, idx) => (
              <Link key={idx} to={brand.link} className="flex flex-col items-center gap-3 min-w-[80px] group grayscale hover:grayscale-0 transition-all duration-300">
                <div className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                  <img src={brand.logo} alt={brand.name} className="max-w-full max-h-full object-contain opacity-70 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-slate-700 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">{brand.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. FLASH SALE */}
      {settings.flashSaleEnabled && flashSaleProducts.length > 0 && (
        <section className="py-16 bg-slate-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6 border-b border-white/10 pb-6">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="h-5 w-5 text-amber-400" fill="currentColor" />
                  <span className="text-amber-400 font-bold tracking-widest uppercase text-sm">{settings.flashSaleTitle || 'Flash Sale'}</span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-white">{settings.flashSaleSubtitle || "Today's Special Deals"}</h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Ends in:</span>
                <div className="flex gap-2 text-xl font-bold font-mono">
                  <div className="bg-white/10 px-3 py-2 rounded-lg">{timeLeft.hours}</div>:
                  <div className="bg-white/10 px-3 py-2 rounded-lg">{timeLeft.minutes}</div>:
                  <div className="bg-white/10 px-3 py-2 rounded-lg text-red-400">{timeLeft.seconds}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {flashSaleProducts.map((product) => (
                <HomeProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CUSTOM PC BUILDER SHOWCASE BANNER */}
      <section className="py-16 bg-slate-50 text-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-lg flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-xl space-y-4 text-center lg:text-left z-10">
              <span className="bg-red-50 text-red-700 border border-red-200 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-widest inline-flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-red-600" /> Live PC Configurator
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Build Your Own Custom Gaming PC
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Choose Intel or AMD, select your processor, and our system automatically filters compatible motherboards, RAM, and power supplies in real-time!
              </p>

              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <Link 
                  to="/custom-pc/builder?platform=intel" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-blue-500/20"
                >
                  Configure Intel PC <ArrowRight className="w-4 h-4" />
                </Link>
                <Link 
                  to="/custom-pc/builder?platform=amd" 
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-red-500/20"
                >
                  Configure AMD PC <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="relative w-full max-w-sm aspect-[4/3] flex items-center justify-center">
              <img 
                src="https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80" 
                alt="Custom PC Build"
                className="w-full h-full object-contain rounded-2xl drop-shadow-md hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. BEST SELLERS */}
      {bestSellers.length > 0 && (
        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-10 border-b border-slate-200 pb-4">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">Best Seller</h2>
              <Link to="/products" className="text-sm font-bold text-red-600 hover:text-red-700 flex items-center gap-1 uppercase tracking-wider">
                All Products <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {bestSellers.map((product) => (
                <HomeProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. NEW ARRIVALS */}
      {newArrivals.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-10 border-b border-slate-200 pb-4">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">New Arrival</h2>
              <Link to="/products" className="text-sm font-bold text-red-600 hover:text-red-700 flex items-center gap-1 uppercase tracking-wider">
                All Products <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {newArrivals.map((product) => (
                <HomeProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. PROMOTIONAL CARDS (SLEEK TECH STYLE) */}
      {settings.promoCards && (
        <section className="py-16 bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

              {/* CARD 1 */}
              <Link to={settings.promoCards.card1.link || '#'} className={`group relative overflow-hidden rounded-3xl bg-[#0a0a0b] border ${settings.promoCards.card1.bgColor === 'red' ? 'border-red-500/20 hover:border-red-500/40 hover:shadow-[0_0_40px_-10px_rgba(239,68,68,0.3)]' : settings.promoCards.card1.bgColor === 'blue' ? 'border-blue-500/20 hover:border-blue-500/40 hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)]' : settings.promoCards.card1.bgColor === 'green' ? 'border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)]' : 'border-white/10 hover:border-white/20 hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.1)]'} p-10 flex flex-col justify-center min-h-[280px] transition-all duration-500 cursor-pointer`}>

                {/* Background Glow */}
                <div className={`absolute -right-20 -top-20 w-64 h-64 rounded-full blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity duration-700 ${settings.promoCards.card1.bgColor === 'red' ? 'bg-red-500' : settings.promoCards.card1.bgColor === 'blue' ? 'bg-blue-500' : settings.promoCards.card1.bgColor === 'green' ? 'bg-emerald-500' : 'bg-slate-500'}`}></div>

                <div className="relative z-10 flex flex-col items-start max-w-md">
                  <span className={`${settings.promoCards.card1.bgColor === 'red' ? 'text-red-400' : settings.promoCards.card1.bgColor === 'blue' ? 'text-blue-400' : settings.promoCards.card1.bgColor === 'green' ? 'text-emerald-400' : 'text-slate-400'} text-[10px] uppercase font-bold tracking-[0.2em] mb-4 flex items-center gap-2`}>
                    <span className={`w-2 h-2 rounded-full ${settings.promoCards.card1.bgColor === 'red' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : settings.promoCards.card1.bgColor === 'blue' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]' : settings.promoCards.card1.bgColor === 'green' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-slate-400 shadow-[0_0_10px_rgba(148,163,184,0.8)]'}`}></span>
                    {settings.promoCards.card1.subtitle}
                  </span>

                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8 leading-tight text-white group-hover:-translate-y-1 transition-transform duration-500">{settings.promoCards.card1.title}</h3>

                  <span className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 border ${settings.promoCards.card1.bgColor === 'red' ? 'border-red-500/30 text-red-400 bg-red-500/10 group-hover:bg-red-500 group-hover:text-white' : settings.promoCards.card1.bgColor === 'blue' ? 'border-blue-500/30 text-blue-400 bg-blue-500/10 group-hover:bg-blue-500 group-hover:text-white' : settings.promoCards.card1.bgColor === 'green' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10 group-hover:bg-emerald-500 group-hover:text-white' : 'border-white/20 text-white bg-white/5 group-hover:bg-white group-hover:text-slate-900'} flex items-center gap-2`}>
                    Shop Now <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>

              {/* CARD 2 */}
              <Link to={settings.promoCards.card2.link || '#'} className={`group relative overflow-hidden rounded-3xl bg-[#0a0a0b] border ${settings.promoCards.card2.bgColor === 'red' ? 'border-red-500/20 hover:border-red-500/40 hover:shadow-[0_0_40px_-10px_rgba(239,68,68,0.3)]' : settings.promoCards.card2.bgColor === 'blue' ? 'border-blue-500/20 hover:border-blue-500/40 hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)]' : settings.promoCards.card2.bgColor === 'green' ? 'border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)]' : 'border-white/10 hover:border-white/20 hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.1)]'} p-10 flex flex-col justify-center min-h-[280px] transition-all duration-500 cursor-pointer`}>

                {/* Background Glow */}
                <div className={`absolute -right-20 -top-20 w-64 h-64 rounded-full blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity duration-700 ${settings.promoCards.card2.bgColor === 'red' ? 'bg-red-500' : settings.promoCards.card2.bgColor === 'blue' ? 'bg-blue-500' : settings.promoCards.card2.bgColor === 'green' ? 'bg-emerald-500' : 'bg-slate-500'}`}></div>

                <div className="relative z-10 flex flex-col items-start max-w-md">
                  <span className={`${settings.promoCards.card2.bgColor === 'red' ? 'text-red-400' : settings.promoCards.card2.bgColor === 'blue' ? 'text-blue-400' : settings.promoCards.card2.bgColor === 'green' ? 'text-emerald-400' : 'text-slate-400'} text-[10px] uppercase font-bold tracking-[0.2em] mb-4 flex items-center gap-2`}>
                    <span className={`w-2 h-2 rounded-full ${settings.promoCards.card2.bgColor === 'red' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : settings.promoCards.card2.bgColor === 'blue' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]' : settings.promoCards.card2.bgColor === 'green' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-slate-400 shadow-[0_0_10px_rgba(148,163,184,0.8)]'}`}></span>
                    {settings.promoCards.card2.subtitle}
                  </span>

                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8 leading-tight text-white group-hover:-translate-y-1 transition-transform duration-500">{settings.promoCards.card2.title}</h3>

                  <span className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 border ${settings.promoCards.card2.bgColor === 'red' ? 'border-red-500/30 text-red-400 bg-red-500/10 group-hover:bg-red-500 group-hover:text-white' : settings.promoCards.card2.bgColor === 'blue' ? 'border-blue-500/30 text-blue-400 bg-blue-500/10 group-hover:bg-blue-500 group-hover:text-white' : settings.promoCards.card2.bgColor === 'green' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10 group-hover:bg-emerald-500 group-hover:text-white' : 'border-white/20 text-white bg-white/5 group-hover:bg-white group-hover:text-slate-900'} flex items-center gap-2`}>
                    Shop Now <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>

            </div>
          </div>
        </section>
      )}

      {/* 7. ABOUT US / STORE HISTORY */}
      <section className="py-20 bg-white border-t border-slate-200 text-slate-800 relative overflow-hidden">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
          
          {/* Top Banner Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column - Main Heading & Intro */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs uppercase tracking-widest">
                <span>ABOUT TECH BEAST</span>
              </div>
              
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-tight">
                Powering Hubli's <br />
                <span className="text-blue-600">
                  Next Generation of Technology
                </span>
              </h2>

              <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-normal">
                At <strong className="text-slate-900 font-bold">TECH BEAST</strong>, we don’t just sell computers—we build performance, reliability, and digital confidence. Since 2018, we’ve been helping students, gamers, creators, professionals, and businesses unlock the full potential of technology through carefully selected laptops, desktops, gaming PCs, accessories, and expert technical support.
              </p>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  What began as a passion for high-performance computing has grown into one of Hubli’s most trusted tech destinations. From budget-friendly systems to powerful gaming rigs and workstation builds, every product is chosen with performance, value, and long-term support in mind.
                </p>
              </div>

              {/* Target Audience Badges */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-center">
                  <span className="font-bold text-xs sm:text-sm text-purple-700 uppercase tracking-wider block">GAMERS</span>
                </div>
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-center">
                  <span className="font-bold text-xs sm:text-sm text-blue-700 uppercase tracking-wider block">STUDENTS</span>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <span className="font-bold text-xs sm:text-sm text-emerald-700 uppercase tracking-wider block">CREATORS & PROS</span>
                </div>
              </div>
            </div>

            {/* Right Column - Store Logo Display */}
            <div className="lg:col-span-5 relative flex justify-center items-center">
              <div className="relative w-full max-w-md aspect-square rounded-3xl bg-slate-50 p-8 border border-slate-200 flex flex-col justify-center items-center shadow-lg overflow-hidden group">
                <img 
                  src="/logo.png" 
                  alt="Tech Beast Hubli Logo" 
                  className="w-4/5 max-h-64 object-contain group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="mt-6 text-center">
                  <span className="text-xl font-black tracking-widest text-slate-900 block uppercase">TECH BEAST HUBLI</span>
                  <span className="text-xs font-semibold text-blue-600 tracking-wider">Built for Performance. Trusted by Hubli.</span>
                </div>
              </div>
            </div>

          </div>

          {/* WHY TECH BEAST Grid (6 Cards) */}
          <div className="space-y-8 pt-6 border-t border-slate-200">
            <div className="text-center max-w-2xl mx-auto">
              <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-slate-900">
                WHY <span className="text-blue-600">TECH BEAST?</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Card 1 */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-500/50 hover:shadow-md transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                  <Monitor className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">Premium Laptops & Desktops</h4>
                <p className="text-slate-600 text-sm leading-relaxed">Top brands and latest models for every need.</p>
              </div>

              {/* Card 2 */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-purple-500/50 hover:shadow-md transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition-transform">
                  <Cpu className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">Custom Gaming PC Builds</h4>
                <p className="text-slate-600 text-sm leading-relaxed">Built your way. Engineered to perform.</p>
              </div>

              {/* Card 3 */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-500/50 hover:shadow-md transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">Refurbished Systems with Warranty</h4>
                <p className="text-slate-600 text-sm leading-relaxed">Tested. Trusted. Value that lasts.</p>
              </div>

              {/* Card 4 */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-amber-500/50 hover:shadow-md transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600 mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">Expert Repair & Upgrade Services</h4>
                <p className="text-slate-600 text-sm leading-relaxed">From quick fixes to performance upgrades.</p>
              </div>

              {/* Card 5 */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-cyan-500/50 hover:shadow-md transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-cyan-100 border border-cyan-200 flex items-center justify-center text-cyan-700 mb-4 group-hover:scale-110 transition-transform">
                  <Keyboard className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">Genuine Accessories & Components</h4>
                <p className="text-slate-600 text-sm leading-relaxed">Quality you can trust for full performance.</p>
              </div>

              {/* Card 6 */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-pink-500/50 hover:shadow-md transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-pink-100 border border-pink-200 flex items-center justify-center text-pink-600 mb-4 group-hover:scale-110 transition-transform">
                  <Headphones className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">Friendly Local Support in Hubli</h4>
                <p className="text-slate-600 text-sm leading-relaxed">We're nearby, we care.</p>
              </div>

            </div>
          </div>

          {/* Philosophy Statement Banner */}
          <div className="p-8 sm:p-10 rounded-3xl bg-blue-50 border border-blue-100 text-center space-y-4 shadow-sm">
            <p className="text-slate-700 text-base sm:text-lg max-w-4xl mx-auto leading-relaxed">
              We believe technology should be powerful, affordable, and dependable. Whether you're attending online classes, editing videos, running a business, or chasing higher FPS in your favorite games, <strong className="text-slate-900">TECH BEAST</strong> is here to help you choose the right machine and support it for years to come.
            </p>
            <h4 className="text-xl sm:text-2xl font-black text-blue-600 uppercase tracking-widest pt-2">
              TECH BEAST — Built for Performance. Trusted by Hubli.
            </h4>
          </div>

          {/* Bottom Trust Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-6 border-t border-slate-200">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">TRUSTED SINCE</span>
              <span className="text-lg font-black text-slate-900">2018</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">HAPPY CUSTOMERS</span>
              <span className="text-lg font-black text-emerald-600">1000+</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">QUALITY</span>
              <span className="text-lg font-black text-blue-600">ASSURED</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">AFTER SALES</span>
              <span className="text-lg font-black text-purple-600">SUPPORT</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center col-span-2 md:col-span-1">
              <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">LOCATION</span>
              <span className="text-lg font-black text-amber-600">HUBLI</span>
            </div>
          </div>

        </div>
      </section>

      {/* 8. VIDEO SHOWCASE (INSTAGRAM STYLE) */}
      <section className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-end mb-12 gap-4">
            <div>
              <h2 className="text-3xl font-black text-slate-900 mb-2">Behind The Scenes</h2>
              <p className="text-slate-500">Watch our expert technicians in action on social media.</p>
            </div>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-sm font-bold text-red-600 hover:text-red-700 flex items-center gap-1 uppercase tracking-wider bg-red-50 hover:bg-red-100 px-5 py-2.5 rounded-full transition-colors">
              Follow @TechBeast <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {[
              {
                id: 1,
                link: "https://www.instagram.com/reel/Dbk_Y3bTVj7/",
                thumbnail: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&q=80&w=400&h=711",
                caption: "Inside look at a custom water-cooled gaming rig build! 💧🔧"
              },
              {
                id: 2,
                link: "https://www.instagram.com/p/Da7xYwxhWYA/",
                thumbnail: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&q=80&w=400&h=711",
                caption: "Upgrading a 10-year-old laptop with a new SSD and RAM! ⚡"
              },
              {
                id: 3,
                link: "https://www.instagram.com/p/DamNpeORcUY/",
                thumbnail: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=400&h=711",
                caption: "MacBook motherboard repair - fixing a short circuit! 🔬🍏"
              },
              {
                id: 4,
                link: "https://www.instagram.com/p/DYFIAfopI1e/",
                thumbnail: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&q=80&w=400&h=711",
                caption: "Ultimate gaming setup showcase! Rate this build 1-10! 🎮🔥"
              }
            ].map((video) => {
              // Ensure URL ends with a slash before adding 'embed'
              let embedUrl = video.link;
              if (embedUrl.includes('?')) embedUrl = embedUrl.split('?')[0];
              if (!embedUrl.endsWith('/')) embedUrl += '/';
              // hidecaption=true hides the bottom caption text
              embedUrl += 'embed/?hidecaption=true';

              // If it's a generic placeholder link, we show the placeholder design
              const isRealLink = video.link.includes('/reel/') || video.link.includes('/p/');

              return (
                <div key={video.id} className="relative aspect-[4/5] bg-slate-900 rounded-2xl overflow-hidden shadow-lg block group">
                  {isRealLink ? (
                    // We increase the height significantly to push the bottom engagement buttons out of the hidden overflow
                    <iframe
                      src={embedUrl}
                      className="absolute left-0 w-full h-[calc(100%+220px)] -top-[58px]"
                      frameBorder="0"
                      scrolling="no"
                      allowTransparency={true}
                      allow="encrypted-media"
                    ></iframe>
                  ) : (
                    <>
                      <img
                        src={video.thumbnail}
                        alt="Video Thumbnail"
                        className="w-full h-full object-cover opacity-60"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"></div>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-white bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/20 text-xs text-center">
                          Add Instagram URL
                        </div>
                      </div>
                      <div className="absolute bottom-5 left-5 right-5 pointer-events-none">
                        <p className="text-white text-xs font-medium line-clamp-2">{video.caption}</p>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 9. CUSTOMER REVIEWS */}
      <section className="py-24 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-slate-900 mb-4">What Our Customers Say</h2>
            <div className="flex items-center justify-center gap-2">
              <div className="flex text-amber-400">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-5 w-5" fill="currentColor" />)}
              </div>
              <span className="font-bold text-slate-700">4.9/5 Average Rating</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Akshatha H.",
                role: "Student",
                review: "I had a wonderful experience buying my new laptop here. From the moment I walked in, the team stood out with their warm and pleasant behavior. They took the time to understand what I needed, answered all my questions patiently, and guided me to the perfect choice without any sales pressure. It's rare to find such genuine and helpful hospitality these days. Thank you for making this purchase so memorable and happy!If you are looking to buy electronics with a hassle-free, happy experience, this is the place to go!.",
                avatar: "A"
              },
              {
                name: "Ramjan Hulakoti.",
                role: "Student",
                review: "Best shop to purchase laptop or desktop or any other accessories related to systems I also purchased laptop with best price and very neat condition they give more than 6 accessories width laptop 10q to techbeast for.!..And best person i met in the shop very well knowledgeable person thank u...Pls do visit once",
                avatar: "R"
              },
              {
                name: "Esther Dandagi.",
                role: "Student",
                review: "I bough laptop from them, and I'm very happy with both the product and the service. Excellent service! My laptop was updated successfully, and all my data was transferred safely without any issues. The work was completed professionally and on time. Highly recommended.",
                avatar: "E"
              }
            ].map((review, idx) => (
              <div key={idx} className="bg-white border border-slate-100 p-8 rounded-3xl hover:shadow-2xl transition-all duration-300 relative group flex flex-col h-full">
                <div className="absolute top-8 right-8 text-slate-100 group-hover:text-blue-50 transition-colors">
                  <svg className="w-16 h-16 transform -rotate-6" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg>
                </div>
                <div className="flex text-amber-400 mb-6 relative z-10">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-5 w-5" fill="currentColor" />)}
                </div>
                <p className="text-slate-600 mb-8 leading-relaxed relative z-10 text-sm md:text-base flex-1 italic font-medium">"{review.review}"</p>
                <div className="flex items-center gap-4 relative z-10 pt-6 border-t border-slate-100 mt-auto">
                  <div className="w-14 h-14 bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-md">
                    {review.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{review.name}</h4>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">{review.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
