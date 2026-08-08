import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Monitor, ChevronRight, Smartphone, Tv, Headphones, Watch, Camera, Gamepad, Keyboard, Zap } from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useSettings } from '../../contexts/SettingsContext';

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

      {/* 1. HERO BANNERS (GRID LAYOUT) */}
      {settings.heroBanners && settings.heroBanners.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-8 w-full">
          {settings.heroBanners.length >= 3 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[350px] sm:h-[450px] lg:h-[550px] xl:h-[650px]">
              {/* Main Banner (Left) */}
              <Link to={settings.heroBanners[0].link || '#'} className="md:col-span-2 relative rounded-2xl overflow-hidden group h-full shadow-md">
                <img src={settings.heroBanners[0].imageUrl} alt="Hero Banner 1" className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700" />
              </Link>
              {/* Side Banners (Right) */}
              <div className="flex flex-col gap-4 h-full">
                <Link to={settings.heroBanners[1].link || '#'} className="flex-1 relative rounded-2xl overflow-hidden group shadow-md">
                  <img src={settings.heroBanners[1].imageUrl} alt="Hero Banner 2" className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700" />
                </Link>
                <Link to={settings.heroBanners[2].link || '#'} className="flex-1 relative rounded-2xl overflow-hidden group shadow-md">
                  <img src={settings.heroBanners[2].imageUrl} alt="Hero Banner 3" className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700" />
                </Link>
              </div>
            </div>
          ) : settings.heroBanners.length === 2 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[300px] sm:h-[400px] lg:h-[450px]">
              <Link to={settings.heroBanners[0].link || '#'} className="relative rounded-2xl overflow-hidden group h-full shadow-md">
                <img src={settings.heroBanners[0].imageUrl} alt="Hero Banner 1" className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700" />
              </Link>
              <Link to={settings.heroBanners[1].link || '#'} className="relative rounded-2xl overflow-hidden group h-full shadow-md">
                <img src={settings.heroBanners[1].imageUrl} alt="Hero Banner 2" className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700" />
              </Link>
            </div>
          ) : (
            <div className="relative w-full h-[250px] sm:h-[350px] md:h-[400px] lg:h-[500px] rounded-2xl overflow-hidden group shadow-md">
              <Link to={settings.heroBanners[0].link || '#'}>
                <img src={settings.heroBanners[0].imageUrl} alt="Hero Banner" className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700" />
              </Link>
            </div>
          )}
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

    </div>
  );
}
