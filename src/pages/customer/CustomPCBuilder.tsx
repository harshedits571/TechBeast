import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  MessageCircle, 
  ShieldCheck, 
  Cpu, 
  Sparkles, 
  ArrowLeft,
  Building2,
  AlertCircle,
  CheckCircle2,
  Layers,
  Zap,
  HardDrive
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useSettings } from '../../contexts/SettingsContext';
import SEO from '../../components/ui/SEO';

interface ComponentOption {
  id: string;
  name: string;
  price: number;
  category?: string;
  brand?: string;
  socket?: string; // 'LGA1700' | 'LGA1851' | 'AM5' | 'AM4'
  cpuPlatform?: 'Intel' | 'AMD';
  ramType?: 'DDR4' | 'DDR5';
  inStock?: boolean;
  modelNumber?: string;
  specsSummary?: string;
}

export default function CustomPCBuilder() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const platform = searchParams.get('platform') === 'amd' ? 'amd' : 'intel';

  const { settings } = useSettings();

  const [dbProducts, setDbProducts] = useState<ComponentOption[]>([]);
  const [dbInventory, setDbInventory] = useState<ComponentOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real products & inventory from Firestore Admin database
  useEffect(() => {
    const fetchData = async () => {
      try {
        const prodSnap = await getDocs(collection(db, "products"));
        const prodList: ComponentOption[] = prodSnap.docs.map(doc => {
          const data = doc.data();
          const name = data.title || data.name || 'Unnamed Product';
          return {
            id: doc.id,
            name: name,
            price: Number(data.price || 0),
            category: data.category || 'Other',
            brand: data.brand || inferBrand(name),
            inStock: Number(data.stock || 0) > 0,
            cpuPlatform: data.cpuPlatform || inferPlatform(name, data.brand),
            socket: data.cpuSocket || data.motherboardSocket || inferSocket(name),
            ramType: (data.ramType as any) || inferRamType(name),
            specsSummary: data.description || ''
          };
        });

        const invSnap = await getDocs(collection(db, "inventory"));
        const invList: ComponentOption[] = invSnap.docs.map(doc => {
          const data = doc.data();
          const name = data.name || 'Unnamed Item';
          return {
            id: doc.id,
            name: name,
            price: Number(data.sellingPrice || data.price || 0),
            category: data.category || 'Other',
            brand: data.brand || inferBrand(name),
            inStock: Number(data.quantity || 0) > 0,
            cpuPlatform: inferPlatform(name, data.brand),
            socket: inferSocket(name),
            ramType: inferRamType(name)
          };
        });

        setDbProducts(prodList);
        setDbInventory(invList);
      } catch (err) {
        console.error("Error fetching db components:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Helper infer functions
  function inferBrand(name: string): string {
    const upper = name.toUpperCase();
    if (upper.includes('GIGABYTE')) return 'Gigabyte';
    if (upper.includes('ASUS')) return 'ASUS';
    if (upper.includes('MSI')) return 'MSI';
    if (upper.includes('CORSAIR')) return 'Corsair';
    if (upper.includes('DEEPCOOL')) return 'DeepCool';
    if (upper.includes('CRUCIAL')) return 'Crucial';
    if (upper.includes('SAMSUNG')) return 'Samsung';
    if (upper.includes('KINGSTON')) return 'Kingston';
    if (upper.includes('ZOTAC')) return 'ZOTAC';
    if (upper.includes('SAPPHIRE')) return 'Sapphire';
    if (upper.includes('INTEL')) return 'Intel';
    if (upper.includes('AMD')) return 'AMD';
    return 'Brand';
  }

  function inferPlatform(name: string, brand?: string): 'Intel' | 'AMD' | undefined {
    const upper = (name + ' ' + (brand || '')).toUpperCase();
    if (upper.includes('RYZEN') || upper.includes('AMD') || upper.includes('AM4') || upper.includes('AM5') || upper.includes('7800X3D') || upper.includes('7600') || upper.includes('5600') || upper.includes('7700') || upper.includes('7900') || upper.includes('9900')) {
      return 'AMD';
    }
    if (upper.includes('INTEL') || upper.includes('CORE') || upper.includes('I3') || upper.includes('I5') || upper.includes('I7') || upper.includes('I9') || upper.includes('ULTRA') || upper.includes('LGA1700') || upper.includes('LGA1851') || upper.includes('14600') || upper.includes('13400') || upper.includes('14700') || upper.includes('14900')) {
      return 'Intel';
    }
    return undefined;
  }

  function inferSocket(name: string): string {
    const upper = name.toUpperCase();
    if (upper.includes('ULTRA') || upper.includes('Z890') || upper.includes('B860') || upper.includes('LGA1851')) return 'LGA1851';
    if (upper.includes('14TH') || upper.includes('13TH') || upper.includes('12TH') || upper.includes('LGA1700') || upper.includes('B760') || upper.includes('Z790') || upper.includes('H610') || upper.includes('14600') || upper.includes('13400') || upper.includes('14700') || upper.includes('14900')) return 'LGA1700';
    if (upper.includes('AM5') || upper.includes('7000') || upper.includes('8000') || upper.includes('9000') || upper.includes('7800X3D') || upper.includes('7600') || upper.includes('7700') || upper.includes('7900') || upper.includes('B650') || upper.includes('X670') || upper.includes('B850')) return 'AM5';
    if (upper.includes('AM4') || upper.includes('5000') || upper.includes('3000') || upper.includes('5600') || upper.includes('B550') || upper.includes('A520') || upper.includes('X570')) return 'AM4';
    return platform === 'intel' ? 'LGA1700' : 'AM5';
  }

  function inferRamType(name: string): 'DDR4' | 'DDR5' {
    const upper = name.toUpperCase();
    if (upper.includes('DDR4')) return 'DDR4';
    return 'DDR5';
  }

  // Combine store products & inventory
  const allStoreItems = useMemo(() => [...dbProducts, ...dbInventory], [dbProducts, dbInventory]);

  // Category retrieval helper
  const getCategoryItems = (categoryKeywords: string[], defaultName: string): ComponentOption[] => {
    const matched = allStoreItems.filter(item => {
      const cat = (item.category || '').toLowerCase();
      const name = (item.name || '').toLowerCase();
      return categoryKeywords.some(kw => cat.includes(kw.toLowerCase()) || name.includes(kw.toLowerCase()));
    });

    if (matched.length > 0) return matched;

    return [
      { id: `none-${categoryKeywords[0]}`, name: `-- Select ${defaultName} (Add in Admin Panel) --`, price: 0 }
    ];
  };

  // --- STRICT PROCESSOR FILTERING (AMD vs INTEL ISOLATION) ---
  const cpus = useMemo(() => {
    const rawCPUs = getCategoryItems(['Processor', 'CPU'], 'Processor');

    return rawCPUs.filter(item => {
      if (item.id.startsWith('none-')) return true;

      const name = item.name.toUpperCase();
      const brand = (item.brand || '').toUpperCase();

      if (platform === 'amd') {
        // STRICT AMD FILTER: Must NOT contain Intel keywords
        const isIntel = name.includes('INTEL') || name.includes('CORE') || name.includes('I3') || name.includes('I5') || name.includes('I7') || name.includes('I9') || name.includes('ULTRA') || brand.includes('INTEL') || item.cpuPlatform === 'Intel';
        return !isIntel;
      } else {
        // STRICT INTEL FILTER: Must NOT contain AMD keywords
        const isAMD = name.includes('AMD') || name.includes('RYZEN') || name.includes('AM4') || name.includes('AM5') || brand.includes('AMD') || item.cpuPlatform === 'AMD';
        return !isAMD;
      }
    });
  }, [allStoreItems, platform]);

  const motherboards = useMemo(() => getCategoryItems(['Motherboard'], 'Motherboard'), [allStoreItems]);
  const coolers = useMemo(() => getCategoryItems(['Cooler', 'Fan'], 'CPU Cooler'), [allStoreItems]);
  const rams = useMemo(() => getCategoryItems(['RAM', 'Memory'], 'RAM'), [allStoreItems]);
  const gpus = useMemo(() => getCategoryItems(['Graphics Card', 'GPU', 'Graphic'], 'Graphics Card'), [allStoreItems]);
  const ssds = useMemo(() => getCategoryItems(['SSD', 'Storage', 'NVMe'], 'Primary SSD'), [allStoreItems]);
  const secStorages = useMemo(() => getCategoryItems(['HDD', 'Hard Drive', 'Secondary'], 'Secondary Storage'), [allStoreItems]);
  const psus = useMemo(() => getCategoryItems(['Power Supply', 'PSU'], 'Power Supply'), [allStoreItems]);
  const cases = useMemo(() => getCategoryItems(['Cabinet', 'Case'], 'PC Cabinet'), [allStoreItems]);

  // Selected State
  const [selectedCPU, setSelectedCPU] = useState<ComponentOption>(cpus[0]);
  const [selectedMB, setSelectedMB] = useState<ComponentOption>(motherboards[0]);
  const [selectedCooler, setSelectedCooler] = useState<ComponentOption>(coolers[0]);
  const [selectedRAM, setSelectedRAM] = useState<ComponentOption>(rams[0]);
  const [ramQty, setRamQty] = useState(1);
  const [selectedGPU, setSelectedGPU] = useState<ComponentOption>(gpus[0]);
  const [selectedSSD, setSelectedSSD] = useState<ComponentOption>(ssds[0]);
  const [selectedSecStorage, setSelectedSecStorage] = useState<ComponentOption>(secStorages[0]);
  const [selectedPSU, setSelectedPSU] = useState<ComponentOption>(psus[0]);
  const [selectedCase, setSelectedCase] = useState<ComponentOption>(cases[0]);

  // Sync state when lists reload
  useEffect(() => { if (cpus.length > 0) setSelectedCPU(cpus[0]); }, [cpus]);
  useEffect(() => { if (motherboards.length > 0) setSelectedMB(motherboards[0]); }, [motherboards]);
  useEffect(() => { if (coolers.length > 0) setSelectedCooler(coolers[0]); }, [coolers]);
  useEffect(() => { if (rams.length > 0) setSelectedRAM(rams[0]); }, [rams]);
  useEffect(() => { if (gpus.length > 0) setSelectedGPU(gpus[0]); }, [gpus]);
  useEffect(() => { if (ssds.length > 0) setSelectedSSD(ssds[0]); }, [ssds]);
  useEffect(() => { if (secStorages.length > 0) setSelectedSecStorage(secStorages[0]); }, [secStorages]);
  useEffect(() => { if (psus.length > 0) setSelectedPSU(psus[0]); }, [psus]);
  useEffect(() => { if (cases.length > 0) setSelectedCase(cases[0]); }, [cases]);

  // --- SMART SOCKET MATCHING ---
  useEffect(() => {
    if (selectedCPU && selectedCPU.socket && !selectedCPU.id.startsWith('none-')) {
      const compatibleMBs = motherboards.filter(m => m.id.startsWith('none-') || !m.socket || m.socket === selectedCPU.socket);
      if (compatibleMBs.length > 0 && selectedMB.socket !== selectedCPU.socket) {
        const firstValid = compatibleMBs.find(m => !m.id.startsWith('none-')) || compatibleMBs[0];
        setSelectedMB(firstValid);
      }
    }
  }, [selectedCPU, motherboards]);

  useEffect(() => {
    if (selectedMB && selectedMB.ramType && !selectedMB.id.startsWith('none-')) {
      const compatibleRAMs = rams.filter(r => r.id.startsWith('none-') || !r.ramType || r.ramType === selectedMB.ramType);
      if (compatibleRAMs.length > 0 && selectedRAM.ramType !== selectedMB.ramType) {
        const firstValid = compatibleRAMs.find(r => !r.id.startsWith('none-')) || compatibleRAMs[0];
        setSelectedRAM(firstValid);
      }
    }
  }, [selectedMB, rams]);

  const availableMotherboards = useMemo(() => {
    if (!selectedCPU || !selectedCPU.socket || selectedCPU.id.startsWith('none-')) return motherboards;
    return motherboards.filter(m => m.id.startsWith('none-') || !m.socket || m.socket === selectedCPU.socket);
  }, [motherboards, selectedCPU]);

  const availableRAMs = useMemo(() => {
    if (!selectedMB || !selectedMB.ramType || selectedMB.id.startsWith('none-')) return rams;
    return rams.filter(r => r.id.startsWith('none-') || !r.ramType || r.ramType === selectedMB.ramType);
  }, [rams, selectedMB]);

  // Total Calculation
  const subTotal = useMemo(() => {
    return (
      (selectedCPU?.price || 0) +
      (selectedMB?.price || 0) +
      (selectedCooler?.price || 0) +
      (selectedRAM?.price || 0) * ramQty +
      (selectedGPU?.price || 0) +
      (selectedSSD?.price || 0) +
      (selectedSecStorage?.price || 0) +
      (selectedPSU?.price || 0) +
      (selectedCase?.price || 0)
    );
  }, [selectedCPU, selectedMB, selectedCooler, selectedRAM, ramQty, selectedGPU, selectedSSD, selectedSecStorage, selectedPSU, selectedCase]);

  const discountAmount = Math.round(subTotal * 0.02);
  const finalPrice = Math.max(0, subTotal - discountAmount);
  const emiPerMonth = Math.round(finalPrice / 24);

  // Send WhatsApp Quote
  const handleWhatsAppQuote = () => {
    const storePhone = settings?.contactPhone || '+919535225266';
    const cleanPhone = storePhone.replace(/[^0-9]/g, '');

    const quoteMsg = [
      `*CUSTOM PC BUILD QUOTATION - TECH BEAST HUBLI*`,
      `*Platform:* ${platform.toUpperCase()} Custom Rig`,
      ``,
      selectedCPU?.price ? `• *Processor:* ${selectedCPU.name} (Socket ${selectedCPU.socket || 'Verified'}) — ₹${selectedCPU.price.toLocaleString('en-IN')}` : '',
      selectedMB?.price ? `• *Motherboard:* ${selectedMB.name} (${selectedMB.ramType || 'DDR5'}) — ₹${selectedMB.price.toLocaleString('en-IN')}` : '',
      selectedCooler?.price ? `• *Cooler:* ${selectedCooler.name} — ₹${selectedCooler.price.toLocaleString('en-IN')}` : '',
      selectedRAM?.price ? `• *RAM:* ${selectedRAM.name} x${ramQty} — ₹${(selectedRAM.price * ramQty).toLocaleString('en-IN')}` : '',
      selectedGPU?.price ? `• *Graphics Card:* ${selectedGPU.name} — ₹${selectedGPU.price.toLocaleString('en-IN')}` : '',
      selectedSSD?.price ? `• *Primary SSD:* ${selectedSSD.name} — ₹${selectedSSD.price.toLocaleString('en-IN')}` : '',
      selectedSecStorage?.price ? `• *Secondary Storage:* ${selectedSecStorage.name} — ₹${selectedSecStorage.price.toLocaleString('en-IN')}` : '',
      selectedPSU?.price ? `• *Power Supply:* ${selectedPSU.name} — ₹${selectedPSU.price.toLocaleString('en-IN')}` : '',
      selectedCase?.price ? `• *Cabinet:* ${selectedCase.name} — ₹${selectedCase.price.toLocaleString('en-IN')}` : '',
      ``,
      `*Subtotal:* ₹${subTotal.toLocaleString('en-IN')}`,
      `*Store Offer Price:* ₹${finalPrice.toLocaleString('en-IN')} (Saved ₹${discountAmount.toLocaleString('en-IN')})`,
      ``,
      `Hi Tech Beast Hubli team! Please confirm availability for this custom PC quotation so I can visit the store for build assembly.`
    ].filter(Boolean).join('\n');

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(quoteMsg)}`, '_blank');
  };

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <SEO 
        title={`${platform.toUpperCase()} Custom PC Builder - Tech Beast Hubli`}
        description="Configure your custom PC with store inventory items, live itemized prices, and store quotations."
      />

      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 bg-white p-4 rounded-2xl shadow-sm">
          <button 
            onClick={() => navigate('/custom-pc')}
            className="text-slate-600 hover:text-slate-900 flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Platform Choice
          </button>
          
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 uppercase tracking-widest font-bold hidden sm:inline">Selected Platform:</span>
            <button 
              onClick={() => navigate('/custom-pc/builder?platform=intel')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${platform === 'intel' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Intel Build
            </button>
            <button 
              onClick={() => navigate('/custom-pc/builder?platform=amd')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${platform === 'amd' ? 'bg-red-600 text-white shadow-md shadow-red-500/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              AMD Build
            </button>
          </div>
        </div>

        {/* Notice info if Admin database has no products yet */}
        {allStoreItems.length === 0 && !loading && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
            <div>
              <strong>Admin Panel Integration Ready:</strong> Add products under <em>Processor, Motherboard, RAM, GPU, Cabinet, Power Supply, SSD</em> in your <strong>Admin Panel</strong> to populate your store's live PC builder!
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* --- LEFT COLUMN: LIVE BUILD SUMMARY & PREVIEW --- */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 space-y-6 sticky top-24 shadow-md">
            
            {/* PC Rig Image */}
            <div className="relative bg-slate-100 border border-slate-200 rounded-2xl p-4 flex items-center justify-center overflow-hidden">
              <img 
                src={platform === 'intel' 
                  ? "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80"
                  : "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=600&q=80"} 
                alt="Custom PC Build Preview"
                className="w-full max-h-56 object-contain rounded-xl"
              />
              
              <div className={`absolute top-3 left-3 px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-widest border shadow-sm ${
                platform === 'intel' ? 'bg-blue-600 text-white border-blue-400/30' : 'bg-red-600 text-white border-red-400/30'
              }`}>
                {platform === 'intel' ? 'Intel Rig' : 'AMD Ryzen Rig'}
              </div>
            </div>

            {/* Price Calculation Box */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 block">Inclusive Of All Taxes</span>
              
              <div className="flex items-baseline gap-3">
                <span className="text-sm text-slate-400 line-through">₹{subTotal.toLocaleString('en-IN')}</span>
                <span className="text-3xl font-extrabold text-slate-900">₹{finalPrice.toLocaleString('en-IN')}</span>
              </div>

              {/* Summer Sale Discount Highlight */}
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-xs text-red-700">
                <span className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-red-600" /> Store Discount Offer
                </span>
                <span className="font-bold text-white bg-red-600 px-2 py-0.5 rounded text-[11px]">Save ₹{discountAmount.toLocaleString('en-IN')}</span>
              </div>

              {/* EMI info box */}
              {finalPrice > 0 && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-700">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Easy Store EMI</span>
                    <span className="font-bold text-emerald-600">From ₹{emiPerMonth.toLocaleString('en-IN')}/month</span>
                  </div>
                  <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-1 rounded font-bold">In-Store Available</span>
                </div>
              )}
            </div>

            {/* Compatibility Badge */}
            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
              <div className="font-bold flex items-center gap-2 text-blue-700">
                <ShieldCheck className="w-4 h-4 text-blue-600" /> Socket & RAM Verified
              </div>
              <p className="text-[11px] text-blue-700 leading-normal">
                {selectedCPU?.socket ? `CPU Socket: ${selectedCPU.socket}` : 'Socket Matching Active'} | {selectedMB?.ramType ? `Memory: ${selectedMB.ramType}` : 'RAM Matched'}
              </p>
            </div>

            {/* Actions: Primary Store Quotation */}
            <div className="space-y-3 pt-2">
              <button 
                onClick={handleWhatsAppQuote}
                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-3.5 px-4 rounded-2xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
              >
                <MessageCircle className="w-5 h-5" /> Get WhatsApp PC Quotation
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500 space-y-1">
              <div className="font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                <Building2 className="w-4 h-4 text-slate-600" /> Visit Tech Beast Store
              </div>
              <p>Ground Floor, Shinde Complex, Hubli, Karnataka 580029</p>
              <p>Ph: +91 95352 25266 | Testing & Cable Management included.</p>
            </div>

          </div>


          {/* --- RIGHT COLUMN: COMPONENT SELECTION GRID --- */}
          <div className="lg:col-span-8 space-y-5">
            
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">
              
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-blue-600" /> 
                  {platform === 'intel' ? 'Intel Custom PC Configurator' : 'AMD Custom PC Configurator'}
                </h2>
                <span className="text-xs text-slate-500 font-medium">Sourced from Admin Store Inventory</span>
              </div>

              <div className="space-y-5">

                {/* 1. Free OS */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <span>Free OS License Key</span>
                    <span className="text-emerald-600 font-bold">FREE INCLUDED</span>
                  </div>
                  <select disabled className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm text-slate-700 cursor-not-allowed">
                    <option>Windows 11 Pro Genuine License Key (Activated)</option>
                  </select>
                </div>

                {/* 2. Free Gift */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <span>Free Gift</span>
                    <span className="text-emerald-600 font-bold">FREE INCLUDED</span>
                  </div>
                  <select disabled className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm text-slate-700 cursor-not-allowed">
                    <option>Cosmic Byte Spectrum RGB Gaming Mousepad (Black)</option>
                  </select>
                </div>

                {/* 3. PROCESSOR (CPU) - STRICT AMD / INTEL ISOLATION */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <span className="flex items-center gap-2">
                      Processor (CPU) *
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        platform === 'intel' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {platform.toUpperCase()} ONLY
                      </span>
                    </span>
                    {selectedCPU?.socket && <span className="text-blue-600 font-mono text-[11px]">Socket: {selectedCPU.socket}</span>}
                  </div>
                  <select 
                    value={selectedCPU?.id || ''}
                    onChange={(e) => {
                      const item = cpus.find(c => c.id === e.target.value);
                      if (item) setSelectedCPU(item);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-medium focus:outline-none focus:border-blue-600 transition-colors"
                  >
                    {cpus.map(cpu => (
                      <option key={cpu.id} value={cpu.id} className="text-slate-900">
                        {cpu.name} {cpu.price > 0 ? `— ₹${cpu.price.toLocaleString('en-IN')}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. MOTHERBOARD (Auto Compatible) */}
                <div className="bg-slate-50 border border-blue-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <span className="flex items-center gap-2">
                      Motherboard * 
                      {selectedCPU?.socket && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px]">Auto-Matched ({selectedCPU.socket})</span>}
                    </span>
                    {selectedMB?.ramType && <span className="text-emerald-600 font-mono text-[11px]">{selectedMB.ramType}</span>}
                  </div>
                  <select 
                    value={selectedMB?.id || ''}
                    onChange={(e) => {
                      const item = motherboards.find(m => m.id === e.target.value);
                      if (item) setSelectedMB(item);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-medium focus:outline-none focus:border-blue-600 transition-colors"
                  >
                    {availableMotherboards.map(mb => (
                      <option key={mb.id} value={mb.id} className="text-slate-900">
                        {mb.name} {mb.price > 0 ? `— ₹${mb.price.toLocaleString('en-IN')}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5. CPU COOLER */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <span>CPU Cooler</span>
                    <span className="text-slate-400 text-[11px]">Air / Liquid ARGB</span>
                  </div>
                  <select 
                    value={selectedCooler?.id || ''}
                    onChange={(e) => {
                      const item = coolers.find(c => c.id === e.target.value);
                      if (item) setSelectedCooler(item);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-medium focus:outline-none focus:border-blue-600 transition-colors"
                  >
                    {coolers.map(cooler => (
                      <option key={cooler.id} value={cooler.id} className="text-slate-900">
                        {cooler.name} {cooler.price > 0 ? `— ₹${cooler.price.toLocaleString('en-IN')}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 6. RAM & QUANTITY */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <span>RAM ({selectedMB?.ramType || 'DDR5'}) *</span>
                    <span className="text-slate-400 text-[11px]">Quantity</span>
                  </div>
                  <div className="flex gap-3">
                    <select 
                      value={selectedRAM?.id || ''}
                      onChange={(e) => {
                        const item = rams.find(r => r.id === e.target.value);
                        if (item) setSelectedRAM(item);
                      }}
                      className="flex-1 bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-medium focus:outline-none focus:border-blue-600 transition-colors"
                    >
                      {availableRAMs.map(ram => (
                        <option key={ram.id} value={ram.id} className="text-slate-900">
                          {ram.name} {ram.price > 0 ? `— ₹${ram.price.toLocaleString('en-IN')}` : ''}
                        </option>
                      ))}
                    </select>

                    <select 
                      value={ramQty}
                      onChange={(e) => setRamQty(Number(e.target.value))}
                      className="w-24 bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-bold focus:outline-none focus:border-blue-600 transition-colors text-center"
                    >
                      <option value={1}>Qty: 1</option>
                      <option value={2}>Qty: 2</option>
                      <option value={4}>Qty: 4</option>
                    </select>
                  </div>
                </div>

                {/* 7. GRAPHICS CARD (GPU) */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <span>Graphics Card (GPU)</span>
                    <span className="text-slate-400 text-[11px]">NVIDIA / AMD</span>
                  </div>
                  <select 
                    value={selectedGPU?.id || ''}
                    onChange={(e) => {
                      const item = gpus.find(g => g.id === e.target.value);
                      if (item) setSelectedGPU(item);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-medium focus:outline-none focus:border-blue-600 transition-colors"
                  >
                    {gpus.map(gpu => (
                      <option key={gpu.id} value={gpu.id} className="text-slate-900">
                        {gpu.name} {gpu.price > 0 ? `— ₹${gpu.price.toLocaleString('en-IN')}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 8. PRIMARY STORAGE (SSD) */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <span>Primary Storage for OS (SSD) *</span>
                    <span className="text-slate-400 text-[11px]">M.2 NVMe</span>
                  </div>
                  <select 
                    value={selectedSSD?.id || ''}
                    onChange={(e) => {
                      const item = ssds.find(s => s.id === e.target.value);
                      if (item) setSelectedSSD(item);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-medium focus:outline-none focus:border-blue-600 transition-colors"
                  >
                    {ssds.map(ssd => (
                      <option key={ssd.id} value={ssd.id} className="text-slate-900">
                        {ssd.name} {ssd.price > 0 ? `— ₹${ssd.price.toLocaleString('en-IN')}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 9. SECONDARY STORAGE */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <span>Secondary Storage (HDD / SSD)</span>
                    <span className="text-slate-400 text-[11px]">Optional</span>
                  </div>
                  <select 
                    value={selectedSecStorage?.id || ''}
                    onChange={(e) => {
                      const item = secStorages.find(s => s.id === e.target.value);
                      if (item) setSelectedSecStorage(item);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-medium focus:outline-none focus:border-blue-600 transition-colors"
                  >
                    {secStorages.map(sec => (
                      <option key={sec.id} value={sec.id} className="text-slate-900">
                        {sec.name} {sec.price > 0 ? `— ₹${sec.price.toLocaleString('en-IN')}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 10. POWER SUPPLY (PSU) */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <span>Power Supply (PSU) *</span>
                    <span className="text-amber-600 text-[11px] font-mono font-bold">Recommended: 650W+</span>
                  </div>
                  <select 
                    value={selectedPSU?.id || ''}
                    onChange={(e) => {
                      const item = psus.find(p => p.id === e.target.value);
                      if (item) setSelectedPSU(item);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-medium focus:outline-none focus:border-blue-600 transition-colors"
                  >
                    {psus.map(psu => (
                      <option key={psu.id} value={psu.id} className="text-slate-900">
                        {psu.name} {psu.price > 0 ? `— ₹${psu.price.toLocaleString('en-IN')}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 11. CABINET (CASE) */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <span>PC Cabinet / Case *</span>
                    <span className="text-slate-400 text-[11px]">Tempered Glass</span>
                  </div>
                  <select 
                    value={selectedCase?.id || ''}
                    onChange={(e) => {
                      const item = cases.find(c => c.id === e.target.value);
                      if (item) setSelectedCase(item);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-medium focus:outline-none focus:border-blue-600 transition-colors"
                  >
                    {cases.map(cs => (
                      <option key={cs.id} value={cs.id} className="text-slate-900">
                        {cs.name} {cs.price > 0 ? `— ₹${cs.price.toLocaleString('en-IN')}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
