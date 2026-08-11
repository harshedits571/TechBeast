import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Cpu, 
  MessageCircle, 
  ShoppingCart, 
  Sparkles, 
  ArrowLeft,
  Gift,
  Building2,
  Check
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { useCart } from '../../contexts/CartContext';
import { useSettings } from '../../contexts/SettingsContext';
import SEO from '../../components/ui/SEO';

interface UpgradeOption {
  id: string;
  name: string;
  price: number;
}

export default function PrebuiltPCDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { settings } = useSettings();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState<string>('');

  // Sourced Inventory for Upgrades
  const [ramUpgrades, setRamUpgrades] = useState<UpgradeOption[]>([]);
  const [coolerUpgrades, setCoolerUpgrades] = useState<UpgradeOption[]>([]);
  const [primarySsdUpgrades, setPrimarySsdUpgrades] = useState<UpgradeOption[]>([]);
  const [secStorageUpgrades, setSecStorageUpgrades] = useState<UpgradeOption[]>([]);
  const [osOptions, setOsOptions] = useState<UpgradeOption[]>([]);

  // Selected Upgrade States
  const [selectedRam, setSelectedRam] = useState<UpgradeOption>({ id: 'base-ram', name: 'Keep Base RAM (Included)', price: 0 });
  const [selectedCooler, setSelectedCooler] = useState<UpgradeOption>({ id: 'base-cooler', name: 'Keep Base Cooler (Included)', price: 0 });
  const [selectedPrimarySsd, setSelectedPrimarySsd] = useState<UpgradeOption>({ id: 'base-ssd', name: 'Keep Base Storage (Included)', price: 0 });
  const [selectedSecStorage, setSelectedSecStorage] = useState<UpgradeOption>({ id: 'none-sec', name: 'No Secondary Storage (Included)', price: 0 });
  const [selectedOS, setSelectedOS] = useState<UpgradeOption>({ id: 'base-os', name: 'Windows 11 Professional 64 Bit (Activated)', price: 0 });

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchPrebuilt = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        let data: any = null;

        // 1. Check settings prebuilts
        const settingsSnap = await getDoc(doc(db, 'settings', 'prebuilts'));
        if (settingsSnap.exists() && settingsSnap.data().items && settingsSnap.data().items[id]) {
          data = settingsSnap.data().items[id];
        }

        // 2. Check prebuilts collection
        if (!data) {
          const prebuiltSnap = await getDoc(doc(db, "prebuilts", id));
          if (prebuiltSnap.exists()) {
            data = prebuiltSnap.data();
          }
        }

        // 3. Check products collection
        if (!data) {
          const docSnap = await getDoc(doc(db, "products", id));
          if (docSnap.exists()) {
            data = docSnap.data();
          }
        }

        if (data) {
          const loadedProduct = {
            id: id,
            title: data.title || data.name || 'Prebuilt Gaming Desktop',
            price: Number(data.price || 0),
            oldPrice: Number(data.oldPrice || 0),
            imageUrl: data.imageUrl || (data.imageUrls && data.imageUrls[0]) || 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80',
            cabinet: data.cabinet || data.cabinetFormFactor || 'Ant Esports ARGB Gaming Cabinet',
            processor: data.processor || data.processorModel || 'High Performance Gaming CPU',
            motherboard: data.motherboard || 'Gaming WiFi Motherboard',
            gpu: data.gpu || data.graphics || 'Dedicated Gaming GPU',
            psu: data.psu || '80+ Gold Power Supply',
            ram: data.ram || 'High Speed DDR5 Memory',
            cooler: data.cooler || 'Liquid CPU Cooler',
            primarySsd: data.primarySsd || data.storage || 'Gen4 NVMe M.2 SSD',
            secStorage: data.secStorage || 'No Secondary Storage',
            os: data.os || 'Windows 11 Professional 64 Bit',
            freeGiftTitle: data.freeGiftTitle || 'Premium Warranty Package (Worth ₹9,999) - FREE',
            freeGiftSubtext: data.freeGiftSubtext || 'Includes expert troubleshooting and free pick-up & drop.',
            ramUpgrades: data.ramUpgrades || [],
            coolerUpgrades: data.coolerUpgrades || [],
            ssdUpgrades: data.ssdUpgrades || [],
            secStorageUpgrades: data.secStorageUpgrades || []
          };
          setProduct(loadedProduct);
          setMainImage(loadedProduct.imageUrl);
          setRamUpgrades(data.ramUpgrades || []);
          setCoolerUpgrades(data.coolerUpgrades || []);
          setPrimarySsdUpgrades(data.ssdUpgrades || []);
          setSecStorageUpgrades(data.secStorageUpgrades || []);
        } else {
          setProduct(null);
        }
      } catch (err) {
        console.error("Error fetching prebuilt product:", err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPrebuilt();
  }, [id]);

  // Pricing
  const basePrice = product?.price || 98500;
  const upgradeTotal = selectedRam.price + selectedCooler.price + selectedPrimarySsd.price + selectedSecStorage.price + selectedOS.price;
  const finalTotalPrice = basePrice + upgradeTotal;

  // Add Upgraded Prebuilt to Cart
  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      id: `prebuilt-${product.id}-${Date.now()}`,
      title: `${product.title} (Custom Upgraded)`,
      price: finalTotalPrice,
      image: mainImage,
      quantity: 1
    });
  };

  // Get WhatsApp Quotation
  const handleWhatsAppQuote = () => {
    const storePhone = settings?.contactPhone || '+919535225266';
    const cleanPhone = storePhone.replace(/[^0-9]/g, '');

    const quoteMsg = [
      `*PREBUILT PC QUOTATION - TECH BEAST HUBLI*`,
      `*Desktop Model:* ${product?.title}`,
      ``,
      `*BASE CONFIGURATION:*`,
      `• *Cabinet:* ${product?.cabinet}`,
      `• *Processor:* ${product?.processor}`,
      `• *Motherboard:* ${product?.motherboard}`,
      `• *GPU:* ${product?.gpu}`,
      `• *PSU:* ${product?.psu}`,
      `• *RAM:* ${product?.ram}`,
      `• *Cooler:* ${product?.cooler}`,
      `• *Primary SSD:* ${product?.primarySsd}`,
      `• *OS:* ${product?.os}`,
      ``,
      `*CHOSEN UPGRADES:*`,
      selectedRam.price > 0 ? `• *RAM Upgrade:* ${selectedRam.name} (+₹${selectedRam.price.toLocaleString('en-IN')})` : '• *RAM:* Base Specification',
      selectedCooler.price > 0 ? `• *Cooler Upgrade:* ${selectedCooler.name} (+₹${selectedCooler.price.toLocaleString('en-IN')})` : '• *Cooler:* Base Specification',
      selectedPrimarySsd.price > 0 ? `• *Primary SSD Upgrade:* ${selectedPrimarySsd.name} (+₹${selectedPrimarySsd.price.toLocaleString('en-IN')})` : '• *Primary Storage:* Base Specification',
      selectedSecStorage.price > 0 ? `• *Secondary Storage:* ${selectedSecStorage.name} (+₹${selectedSecStorage.price.toLocaleString('en-IN')})` : '• *Secondary Storage:* None',
      selectedOS.price > 0 ? `• *OS:* ${selectedOS.name} (+₹${selectedOS.price.toLocaleString('en-IN')})` : '• *OS:* Windows 11 Professional Activated',
      ``,
      `*Base Price:* ₹${basePrice.toLocaleString('en-IN')}`,
      `*Upgrade Cost:* ₹${upgradeTotal.toLocaleString('en-IN')}`,
      `*Final Total Price:* ₹${finalTotalPrice.toLocaleString('en-IN')}`,
      ``,
      `Hi Tech Beast Hubli team! Please confirm availability for this Prebuilt Desktop and chosen upgrades.`
    ].join('\n');

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(quoteMsg)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="bg-slate-50 min-h-screen py-12 px-4 flex items-center justify-center text-slate-600">
        Loading Prebuilt PC specifications...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-slate-50 min-h-screen py-16 px-4 flex flex-col items-center justify-center text-center space-y-4">
        <Cpu className="w-16 h-16 text-purple-600" />
        <h2 className="text-2xl font-bold text-slate-900">Prebuilt Desktop Not Found</h2>
        <p className="text-sm text-slate-500 max-w-md">This prebuilt gaming desktop was not found or has been removed. Please browse our active prebuilt desktop list.</p>
        <Link 
          to="/prebuilt-pc"
          className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-6 py-3 rounded-xl uppercase tracking-wider shadow-md transition-all flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> View All Prebuilt PCs
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <SEO 
        title={`${product?.title || 'Prebuilt PC'} - Tech Beast Hubli`}
        description="Review base specs and customize component upgrades for prebuilt gaming desktops."
      />

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 bg-white p-4 rounded-2xl shadow-sm">
          <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
            <Link to="/" className="hover:text-red-600">Home</Link> &gt; 
            <Link to="/products?category=Desktops" className="hover:text-red-600">Prebuilt PC</Link> &gt; 
            <span className="text-slate-900 font-bold">{product?.title}</span>
          </div>

          <button 
            onClick={() => navigate('/products?category=Desktops')}
            className="text-slate-600 hover:text-slate-900 flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Desktops
          </button>
        </div>


        {/* --- SECTION 1: TOP REVIEW YOUR PREBUILT (MATCHING SCREENSHOT 1) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Box: Rig Photo */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center min-h-[460px]">
            <div className="relative w-full aspect-square max-w-md flex items-center justify-center">
              <img 
                src={mainImage} 
                alt={product?.title}
                className="w-full h-full object-contain rounded-2xl"
              />
            </div>
          </div>

          {/* Right Box: Specs Breakdown */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Model Name Box */}
            <div className="bg-slate-200/70 border border-slate-300 rounded-2xl p-4 text-center">
              <h1 className="text-2xl font-black tracking-wider text-slate-900 uppercase">{product?.title}</h1>
            </div>

            {/* Review Your PreBuilt Heading & Specs List */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <h2 className="text-xl font-bold text-center text-slate-900">Review Your PreBuilt</h2>

              <ul className="space-y-2 text-xs text-slate-700 font-medium divide-y divide-slate-100">
                <li className="pt-2 flex items-start gap-2">
                  <span className="text-slate-400 font-bold">•</span>
                  <span>{product?.cabinet}</span>
                </li>
                <li className="pt-2 flex items-start gap-2">
                  <span className="text-slate-400 font-bold">•</span>
                  <span className="font-bold text-slate-900">{product?.processor}</span>
                </li>
                <li className="pt-2 flex items-start gap-2">
                  <span className="text-slate-400 font-bold">•</span>
                  <span>{product?.motherboard}</span>
                </li>
                <li className="pt-2 flex items-start gap-2">
                  <span className="text-slate-400 font-bold">•</span>
                  <span className="font-bold text-blue-700">{product?.gpu}</span>
                </li>
                <li className="pt-2 flex items-start gap-2">
                  <span className="text-slate-400 font-bold">•</span>
                  <span>{product?.psu}</span>
                </li>
                <li className="pt-2 flex items-start gap-2">
                  <span className="text-slate-400 font-bold">•</span>
                  <span>{product?.ram}</span>
                </li>
                <li className="pt-2 flex items-start gap-2">
                  <span className="text-slate-400 font-bold">•</span>
                  <span>{product?.cooler}</span>
                </li>
                <li className="pt-2 flex items-start gap-2">
                  <span className="text-slate-400 font-bold">•</span>
                  <span>{product?.primarySsd}</span>
                </li>
                <li className="pt-2 flex items-start gap-2">
                  <span className="text-slate-400 font-bold">•</span>
                  <span>{product?.secStorage}</span>
                </li>
                <li className="pt-2 flex items-start gap-2">
                  <span className="text-slate-400 font-bold">•</span>
                  <span>{product?.os}</span>
                </li>
              </ul>
            </div>

            {/* Included Free Warranty Card (Matching Screenshot 1) */}
            <div className="bg-slate-100 border border-slate-200 rounded-3xl p-5 shadow-sm flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-purple-900 text-white p-3 rounded-2xl flex flex-col items-center justify-center shrink-0 border border-purple-700 shadow-sm">
                  <ShieldCheck className="w-6 h-6 text-purple-300" />
                  <span className="text-[9px] font-bold uppercase tracking-widest mt-1">3 YEAR</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {product?.freeGiftTitle || 'Premium Warranty Package (Worth ₹9,999) - FREE'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {product?.freeGiftSubtext || 'Includes expert troubleshooting and free pick-up & drop. (Exclusively from Tech Beast Hubli)'}
                  </p>
                </div>
              </div>

              <span className="bg-purple-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shrink-0 shadow-md">
                Included
              </span>
            </div>

          </div>

        </div>


        {/* --- SECTION 2: UPGRADE YOUR PREBUILT (MATCHING SCREENSHOT 2) --- */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-8">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Upgrade your prebuilt</h2>
            <p className="text-sm text-slate-500">
              Want to level up your Prebuilt? Upgrade your components as you like to get that extra Performance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* 1. Upgrade RAM */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-900 block">Upgrade RAM</label>
              <select 
                value={selectedRam.id}
                onChange={(e) => {
                  if (e.target.value === 'base-ram') {
                    setSelectedRam({ id: 'base-ram', name: 'Keep Base RAM (Included)', price: 0 });
                  } else {
                    const opt = ramUpgrades.find(r => r.id === e.target.value);
                    if (opt) setSelectedRam(opt);
                    else setSelectedRam({ id: e.target.value, name: 'Upgrade to 32GB DDR5 RAM', price: 4500 });
                  }
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-purple-600 transition-colors shadow-sm"
              >
                <option value="base-ram">Keep Base RAM (Included)</option>
                {ramUpgrades.map(r => (
                  <option key={r.id} value={r.id}>{r.name} (+₹{r.price.toLocaleString('en-IN')})</option>
                ))}
              </select>
              <span className="text-[11px] text-slate-400 block">Need more Memory? Find your preferred RAM here.</span>
            </div>

            {/* 2. Upgrade Cooler */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-900 block">Upgrade Cooler</label>
              <select 
                value={selectedCooler.id}
                onChange={(e) => {
                  if (e.target.value === 'base-cooler') {
                    setSelectedCooler({ id: 'base-cooler', name: 'Keep Base Cooler (Included)', price: 0 });
                  } else {
                    const opt = coolerUpgrades.find(c => c.id === e.target.value);
                    if (opt) setSelectedCooler(opt);
                  }
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-purple-600 transition-colors shadow-sm"
              >
                <option value="base-cooler">Keep Base Cooler (Included)</option>
                {coolerUpgrades.map(c => (
                  <option key={c.id} value={c.id}>{c.name} (+₹{c.price.toLocaleString('en-IN')})</option>
                ))}
              </select>
              <span className="text-[11px] text-slate-400 block">Need better Cooling? Upgrade your Cooler here.</span>
            </div>

            {/* 3. Upgrade Primary Storage */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-900 block">Upgrade Primary Storage</label>
              <select 
                value={selectedPrimarySsd.id}
                onChange={(e) => {
                  if (e.target.value === 'base-ssd') {
                    setSelectedPrimarySsd({ id: 'base-ssd', name: 'Keep Base Storage (Included)', price: 0 });
                  } else {
                    const opt = primarySsdUpgrades.find(s => s.id === e.target.value);
                    if (opt) setSelectedPrimarySsd(opt);
                  }
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-purple-600 transition-colors shadow-sm"
              >
                <option value="base-ssd">Keep Base Storage (Included)</option>
                {primarySsdUpgrades.map(s => (
                  <option key={s.id} value={s.id}>{s.name} (+₹{s.price.toLocaleString('en-IN')})</option>
                ))}
              </select>
              <span className="text-[11px] text-slate-400 block">Increase your primary storage.</span>
            </div>

            {/* 4. Secondary Storage */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-900 block">Secondary Storage</label>
              <select 
                value={selectedSecStorage.id}
                onChange={(e) => {
                  if (e.target.value === 'none-sec') {
                    setSelectedSecStorage({ id: 'none-sec', name: 'No Secondary Storage (Included)', price: 0 });
                  } else {
                    const opt = secStorageUpgrades.find(s => s.id === e.target.value);
                    if (opt) setSelectedSecStorage(opt);
                  }
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-purple-600 transition-colors shadow-sm"
              >
                <option value="none-sec">No Secondary Storage (Included)</option>
                {secStorageUpgrades.map(s => (
                  <option key={s.id} value={s.id}>{s.name} (+₹{s.price.toLocaleString('en-IN')})</option>
                ))}
              </select>
              <span className="text-[11px] text-slate-400 block">Need more Storage? Upgrade to a second one here.</span>
            </div>

            {/* 5. Operating System */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-slate-900 block">Operating System</label>
              <select 
                value={selectedOS.id}
                onChange={(e) => setSelectedOS({ id: e.target.value, name: e.target.options[e.target.selectedIndex].text, price: 0 })}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-purple-600 transition-colors shadow-sm"
              >
                <option value="win-11-pro">Windows 11 Professional 64 Bit Genuine (Activated) - FREE</option>
                <option value="win-11-home">Windows 11 Home Genuine (Activated) - FREE</option>
              </select>
              <span className="text-[11px] text-slate-400 block">Need a licenced operating system? Choose it here.</span>
            </div>

          </div>

          {/* Pricing & Actions Bar */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-widest font-bold block">Total Upgraded Price</span>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-slate-900">₹{finalTotalPrice.toLocaleString('en-IN')}</span>
                {upgradeTotal > 0 && (
                  <span className="text-xs text-purple-700 font-bold bg-purple-100 px-2 py-1 rounded-md">
                    Includes +₹{upgradeTotal.toLocaleString('en-IN')} in Upgrades
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <button 
                onClick={handleWhatsAppQuote}
                className="w-full sm:w-auto bg-[#25D366] hover:bg-[#128C7E] text-white py-3.5 px-6 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20"
              >
                <MessageCircle className="w-4 h-4" /> Get WhatsApp Quotation
              </button>

              <button 
                onClick={handleAddToCart}
                className="w-full sm:w-auto bg-purple-700 hover:bg-purple-800 text-white py-3.5 px-6 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-600/20"
              >
                <ShoppingCart className="w-4 h-4" /> Add Upgraded Prebuilt To Cart
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
