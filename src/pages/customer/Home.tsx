import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Monitor, ChevronRight, Smartphone, Tv, Headphones, Watch, Camera, Gamepad, Keyboard } from 'lucide-react';
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[500px] md:h-[450px] lg:h-[500px]">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[300px] md:h-[400px]">
              <Link to={settings.heroBanners[0].link || '#'} className="relative rounded-2xl overflow-hidden group h-full shadow-md">
                <img src={settings.heroBanners[0].imageUrl} alt="Hero Banner 1" className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700" />
              </Link>
              <Link to={settings.heroBanners[1].link || '#'} className="relative rounded-2xl overflow-hidden group h-full shadow-md">
                <img src={settings.heroBanners[1].imageUrl} alt="Hero Banner 2" className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700" />
              </Link>
            </div>
          ) : (
            <div className="relative w-full h-[300px] md:h-[400px] rounded-2xl overflow-hidden group shadow-md">
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
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight text-slate-900">
            Upgrade your tech element <br />
          </h1>
          <p className="text-sm text-slate-600 mb-8 max-w-lg leading-relaxed font-medium">
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
          <h3 className="text-center text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">Top Brands We Trust</h3>
          <div className="flex justify-between md:justify-center items-center gap-8 md:gap-12 overflow-x-auto pb-4 hide-scrollbar">
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
              <div className="flex items-center gap-4">
                <div className="bg-red-600 text-white px-4 py-2 rounded-lg text-xl font-black italic tracking-widest uppercase transform -skew-x-12">
                  Flash Sale
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-white">Today's Special Deals</h2>
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

      {/* 6. BANNER PLACEHOLDERS */}
      <section className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-2xl p-8 flex flex-col justify-center min-h-[250px] relative overflow-hidden group cursor-pointer shadow-xl">
              <div className="relative z-10 text-white max-w-xs">
                <span className="text-blue-300 text-[10px] uppercase font-bold tracking-widest mb-2 block">Weekend Deals</span>
                <h3 className="text-3xl font-bold mb-4 leading-tight">Next-gen gaming console</h3>
                <span className="inline-block bg-white text-blue-900 font-bold px-4 py-2 rounded-full text-xs uppercase tracking-wider">Shop Now</span>
              </div>
            </div>
            <div className="bg-gradient-to-r from-red-600 to-red-500 rounded-2xl p-8 flex flex-col justify-center min-h-[250px] relative overflow-hidden group cursor-pointer shadow-xl">
              <div className="relative z-10 text-white max-w-xs">
                <span className="text-red-200 text-[10px] uppercase font-bold tracking-widest mb-2 block">Back to school</span>
                <h3 className="text-3xl font-bold mb-4 leading-tight">Special discount for students</h3>
                <span className="inline-block bg-white text-red-600 font-bold px-4 py-2 rounded-full text-xs uppercase tracking-wider">Shop Now</span>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
