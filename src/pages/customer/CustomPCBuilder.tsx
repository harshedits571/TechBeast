import React, { useState, useEffect, useMemo } from 'react';
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
  HardDrive,
  ExternalLink,
  Share2,
  Check,
  FileText
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, getDocs, addDoc, query, limit, setDoc, doc } from 'firebase/firestore';
import { createSlug, generateShortId } from '../../utils/slugify';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import SEO from '../../components/ui/SEO';

interface ComponentOption {
  id: string;
  name: string;
  price: number;
  category?: string;
  brand?: string;
  socket?: string; // 'LGA1700' | 'LGA1851' | 'AM5' | 'AM4'
  socketName?: string;
  cpuPlatform?: 'Intel' | 'AMD';
  ramType?: 'DDR3' | 'DDR4' | 'DDR5';
  inStock?: boolean;
  modelNumber?: string;
  specsSummary?: string;
}

// Comprehensive default fallback catalog for Intel & AMD platforms if Firestore store inventory is empty or unauthenticated
const DEFAULT_FALLBACK_COMPONENTS: ComponentOption[] = [
  // Intel Processors
  { id: 'intel-i3-12100f', name: 'Intel Core i3-12100F (4 Cores / 8 Threads)', price: 7490, category: 'Processor', brand: 'Intel', socket: 'LGA1700', cpuPlatform: 'Intel', ramType: 'DDR4', inStock: true },
  { id: 'intel-i5-12400f', name: 'Intel Core i5-12400F (6 Cores / 12 Threads)', price: 10990, category: 'Processor', brand: 'Intel', socket: 'LGA1700', cpuPlatform: 'Intel', ramType: 'DDR4', inStock: true },
  { id: 'intel-i5-13400f', name: 'Intel Core i5-13400F (10 Cores / 16 Threads)', price: 17990, category: 'Processor', brand: 'Intel', socket: 'LGA1700', cpuPlatform: 'Intel', ramType: 'DDR4', inStock: true },
  { id: 'intel-i5-14600k', name: 'Intel Core i5-14600K (14 Cores / 20 Threads)', price: 27490, category: 'Processor', brand: 'Intel', socket: 'LGA1700', cpuPlatform: 'Intel', ramType: 'DDR5', inStock: true },
  { id: 'intel-i7-14700k', name: 'Intel Core i7-14700K (20 Cores / 28 Threads)', price: 36990, category: 'Processor', brand: 'Intel', socket: 'LGA1700', cpuPlatform: 'Intel', ramType: 'DDR5', inStock: true },
  { id: 'intel-i9-14900k', name: 'Intel Core i9-14900K (24 Cores / 32 Threads)', price: 52990, category: 'Processor', brand: 'Intel', socket: 'LGA1700', cpuPlatform: 'Intel', ramType: 'DDR5', inStock: true },

  // AMD Processors
  { id: 'amd-r5-5600', name: 'AMD Ryzen 5 5600 (6 Cores / 12 Threads)', price: 11490, category: 'Processor', brand: 'AMD', socket: 'AM4', cpuPlatform: 'AMD', ramType: 'DDR4', inStock: true },
  { id: 'amd-r7-5700x', name: 'AMD Ryzen 7 5700X (8 Cores / 16 Threads)', price: 17490, category: 'Processor', brand: 'AMD', socket: 'AM4', cpuPlatform: 'AMD', ramType: 'DDR4', inStock: true },
  { id: 'amd-r5-7600', name: 'AMD Ryzen 5 7600 (6 Cores / 12 Threads)', price: 18990, category: 'Processor', brand: 'AMD', socket: 'AM5', cpuPlatform: 'AMD', ramType: 'DDR5', inStock: true },
  { id: 'amd-r7-7700x', name: 'AMD Ryzen 7 7700X (8 Cores / 16 Threads)', price: 28490, category: 'Processor', brand: 'AMD', socket: 'AM5', cpuPlatform: 'AMD', ramType: 'DDR5', inStock: true },
  { id: 'amd-r7-7800x3d', name: 'AMD Ryzen 7 7800X3D 3D V-Cache (8 Cores)', price: 36990, category: 'Processor', brand: 'AMD', socket: 'AM5', cpuPlatform: 'AMD', ramType: 'DDR5', inStock: true },
  { id: 'amd-r9-7900x', name: 'AMD Ryzen 9 7900X (12 Cores / 24 Threads)', price: 39990, category: 'Processor', brand: 'AMD', socket: 'AM5', cpuPlatform: 'AMD', ramType: 'DDR5', inStock: true },

  // Motherboards - Intel
  { id: 'mb-h610m', name: 'Gigabyte H610M H DDR4 Motherboard', price: 6490, category: 'Motherboard', brand: 'Gigabyte', socket: 'LGA1700', ramType: 'DDR4', inStock: true },
  { id: 'mb-b760m-d4', name: 'MSI PRO B760M-E DDR4 Motherboard', price: 9290, category: 'Motherboard', brand: 'MSI', socket: 'LGA1700', ramType: 'DDR4', inStock: true },
  { id: 'mb-b760m-d5', name: 'MSI PRO B760M-A WIFI DDR5 Motherboard', price: 14990, category: 'Motherboard', brand: 'MSI', socket: 'LGA1700', ramType: 'DDR5', inStock: true },
  { id: 'mb-z790-d5', name: 'ASUS Prime Z790-P WIFI DDR5 Motherboard', price: 21990, category: 'Motherboard', brand: 'ASUS', socket: 'LGA1700', ramType: 'DDR5', inStock: true },

  // Motherboards - AMD
  { id: 'mb-a520m', name: 'Gigabyte A520M K V2 DDR4 Motherboard', price: 4990, category: 'Motherboard', brand: 'Gigabyte', socket: 'AM4', ramType: 'DDR4', inStock: true },
  { id: 'mb-b550m', name: 'MSI B550M PRO-VDH WIFI DDR4 Motherboard', price: 9490, category: 'Motherboard', brand: 'MSI', socket: 'AM4', ramType: 'DDR4', inStock: true },
  { id: 'mb-b650m', name: 'MSI B650M GAMING WIFI DDR5 Motherboard', price: 11990, category: 'Motherboard', brand: 'MSI', socket: 'AM5', ramType: 'DDR5', inStock: true },
  { id: 'mb-b650-aorus', name: 'Gigabyte B650 AORUS ELITE AX DDR5 Motherboard', price: 21490, category: 'Motherboard', brand: 'Gigabyte', socket: 'AM5', ramType: 'DDR5', inStock: true },

  // CPU Coolers
  { id: 'cooler-stock', name: 'Stock Included Air Cooler', price: 0, category: 'Cooler', brand: 'Stock', inStock: true },
  { id: 'cooler-ag400', name: 'DeepCool AG400 ARGB Single Tower Cooler', price: 1890, category: 'Cooler', brand: 'DeepCool', inStock: true },
  { id: 'cooler-ak620', name: 'DeepCool AK620 Digital Dual Tower Cooler', price: 5990, category: 'Cooler', brand: 'DeepCool', inStock: true },
  { id: 'cooler-le520', name: 'DeepCool LE520 240mm ARGB AIO Liquid Cooler', price: 5490, category: 'Cooler', brand: 'DeepCool', inStock: true },
  { id: 'cooler-lt720', name: 'DeepCool LT720 360mm Premium ARGB Liquid Cooler', price: 9990, category: 'Cooler', brand: 'DeepCool', inStock: true },

  // RAM Options
  { id: 'ram-8gb-d4', name: 'Crucial 8GB 3200MHz DDR4 Desktop RAM', price: 1690, category: 'RAM', brand: 'Crucial', ramType: 'DDR4', inStock: true },
  { id: 'ram-16gb-d4', name: 'Corsair Vengeance LPX 16GB (8x2) 3200MHz DDR4', price: 3490, category: 'RAM', brand: 'Corsair', ramType: 'DDR4', inStock: true },
  { id: 'ram-32gb-d4', name: 'Corsair Vengeance RGB PRO 32GB (16x2) 3600MHz DDR4', price: 7490, category: 'RAM', brand: 'Corsair', ramType: 'DDR4', inStock: true },
  { id: 'ram-16gb-d5', name: 'Crucial 16GB (16x1) 5600MHz DDR5 RAM', price: 4490, category: 'RAM', brand: 'Crucial', ramType: 'DDR5', inStock: true },
  { id: 'ram-32gb-d5', name: 'Corsair Vengeance RGB 32GB (16x2) 6000MHz CL30 DDR5', price: 10490, category: 'RAM', brand: 'Corsair', ramType: 'DDR5', inStock: true },

  // GPUs
  { id: 'gpu-none', name: '-- Integrated Graphics / No Discrete GPU --', price: 0, category: 'Graphics Card', brand: 'Integrated', inStock: true },
  { id: 'gpu-gtx1650', name: 'Gigabyte GeForce GTX 1650 OC 4GB', price: 11990, category: 'Graphics Card', brand: 'Gigabyte', inStock: true },
  { id: 'gpu-rtx3050', name: 'MSI RTX 3050 Ventus 2X 6GB GDDR6', price: 16990, category: 'Graphics Card', brand: 'MSI', inStock: true },
  { id: 'gpu-rtx4060', name: 'ZOTAC Gaming GeForce RTX 4060 Twin Edge 8GB', price: 27490, category: 'Graphics Card', brand: 'ZOTAC', inStock: true },
  { id: 'gpu-rtx4060ti', name: 'Gigabyte GeForce RTX 4060 Ti Eagle OC 8GB', price: 37990, category: 'Graphics Card', brand: 'Gigabyte', inStock: true },
  { id: 'gpu-rtx4070s', name: 'ASUS Dual GeForce RTX 4070 SUPER 12GB GDDR6X', price: 58990, category: 'Graphics Card', brand: 'ASUS', inStock: true },
  { id: 'gpu-rx7600', name: 'Sapphire PULSE AMD Radeon RX 7600 8GB', price: 24990, category: 'Graphics Card', brand: 'Sapphire', inStock: true },
  { id: 'gpu-rx7700xt', name: 'Sapphire PULSE AMD Radeon RX 7700 XT 12GB', price: 41990, category: 'Graphics Card', brand: 'Sapphire', inStock: true },

  // SSD Primary Storage
  { id: 'ssd-512gb', name: 'Kingston NV2 512GB M.2 NVMe PCIe 4.0 SSD', price: 2990, category: 'SSD', brand: 'Kingston', inStock: true },
  { id: 'ssd-1tb', name: 'Crucial P3 Plus 1TB M.2 NVMe PCIe 4.0 SSD (up to 5000MB/s)', price: 5490, category: 'SSD', brand: 'Crucial', inStock: true },
  { id: 'ssd-1tb-pro', name: 'Samsung 980 PRO 1TB M.2 NVMe Gen4 SSD with Heatsink', price: 8990, category: 'SSD', brand: 'Samsung', inStock: true },
  { id: 'ssd-2tb', name: 'Crucial P3 Plus 2TB M.2 NVMe PCIe 4.0 SSD', price: 10990, category: 'SSD', brand: 'Crucial', inStock: true },

  // Secondary Storage
  { id: 'sec-none', name: '-- None (SSD Only) --', price: 0, category: 'Secondary Storage', brand: 'None', inStock: true },
  { id: 'sec-1tb-hdd', name: 'Seagate Barracuda 1TB 7200RPM 3.5" HDD', price: 3490, category: 'Secondary Storage', brand: 'Seagate', inStock: true },
  { id: 'sec-2tb-hdd', name: 'Seagate Barracuda 2TB 7200RPM 3.5" HDD', price: 5290, category: 'Secondary Storage', brand: 'Seagate', inStock: true },

  // Power Supplies
  { id: 'psu-500w', name: 'Ant Esports VS500L 500W Power Supply', price: 1890, category: 'Power Supply', brand: 'Ant Esports', inStock: true },
  { id: 'psu-650w', name: 'DeepCool PK650D 650W 80+ Bronze Certified Power Supply', price: 4490, category: 'Power Supply', brand: 'DeepCool', inStock: true },
  { id: 'psu-750w', name: 'Corsair CV750 750W 80+ Bronze Power Supply', price: 5990, category: 'Power Supply', brand: 'Corsair', inStock: true },
  { id: 'psu-750w-gold', name: 'Corsair RM750e 750W 80+ Gold Fully Modular ATX 3.0', price: 9490, category: 'Power Supply', brand: 'Corsair', inStock: true },

  // Cabinets
  { id: 'case-ice100', name: 'Ant Esports ICE-100 TG Gaming Cabinet (Black)', price: 2790, category: 'Cabinet', brand: 'Ant Esports', inStock: true },
  { id: 'case-cc560', name: 'DeepCool CC560 ARGB Mesh Mid-Tower Cabinet', price: 4290, category: 'Cabinet', brand: 'DeepCool', inStock: true },
  { id: 'case-forge120', name: 'MSI MAG FORGE 120R Airflow ARGB Cabinet', price: 5490, category: 'Cabinet', brand: 'MSI', inStock: true },
  { id: 'case-4000d', name: 'Corsair 4000D Airflow Tempered Glass Mid-Tower', price: 7490, category: 'Cabinet', brand: 'Corsair', inStock: true },
];

export default function CustomPCBuilder() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const platform = searchParams.get('platform') === 'amd' ? 'amd' : 'intel';

  const { settings } = useSettings();
  const { user } = useAuth();

  const [dbProducts, setDbProducts] = useState<ComponentOption[]>([]);
  const [dbInventory, setDbInventory] = useState<ComponentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedQuoteId, setSavedQuoteId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedGiftComboId, setSelectedGiftComboId] = useState<string>('auto');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  useEffect(() => {
    if (user) {
      if (user.displayName && !customerName) setCustomerName(user.displayName);
      if (user.phoneNumber && !customerPhone) setCustomerPhone(user.phoneNumber);
    }
  }, [user]);

  const resolveGiftCombo = () => {
    if (selectedGiftComboId === '8-item') {
      return {
        id: '8-item',
        name: '8-Item Mega Tech Beast Accessories Pack',
        items: ['Gaming Mouse', 'Keyboard', 'RGB Mousepad', 'Headset', 'WiFi Dongle', 'HDMI/Power Cable', 'Cleaner Kit', 'Gaming Stickers']
      };
    }
    if (selectedGiftComboId === '4-item') {
      return {
        id: '4-item',
        name: '4-Item Essential Tech Beast Accessories Pack',
        items: ['Mousepad', 'WiFi USB Adapter', 'Power Cable', 'Cleaning Kit']
      };
    }
    if (selectedGiftComboId === 'auto') {
      if (finalPrice >= 20000) {
        return {
          id: '8-item',
          name: '8-Item Mega Tech Beast Accessories Pack',
          items: ['Gaming Mouse', 'Keyboard', 'RGB Mousepad', 'Headset', 'WiFi Dongle', 'HDMI/Power Cable', 'Cleaner Kit', 'Gaming Stickers']
        };
      }
      return {
        id: '4-item',
        name: '4-Item Essential Tech Beast Accessories Pack',
        items: ['Mousepad', 'WiFi USB Adapter', 'Power Cable', 'Cleaning Kit']
      };
    }
    const found = settings.accessoryCombos?.find(c => c.id === selectedGiftComboId);
    if (found) {
      return {
        id: found.id,
        name: found.name,
        items: found.items || []
      };
    }
    return {
      id: 'auto',
      name: finalPrice >= 20000 ? '8-Item Mega Tech Beast Accessories Pack' : '4-Item Essential Tech Beast Accessories Pack',
      items: []
    };
  };

  // Fetch real products & inventory from Firestore Admin database
  useEffect(() => {
    const fetchData = async () => {
      try {
        const prodSnap = await getDocs(query(collection(db, "products"), limit(100)));
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

        const invSnap = await getDocs(query(collection(db, "inventory"), limit(100)));
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
    if (upper.includes('14TH') || upper.includes('13TH') || upper.includes('12TH') || upper.includes('LGA1700') || upper.includes('B760') || upper.includes('Z790') || upper.includes('H610') || upper.includes('14600') || upper.includes('13400') || upper.includes('14700') || upper.includes('14900') || upper.includes('12400')) return 'LGA1700';
    if (upper.includes('10TH') || upper.includes('11TH') || upper.includes('LGA1200') || upper.includes('H410') || upper.includes('H510') || upper.includes('B460') || upper.includes('B560') || upper.includes('Z490') || upper.includes('Z590') || upper.includes('10400') || upper.includes('11400')) return 'LGA1200';
    if (upper.includes('6TH') || upper.includes('7TH') || upper.includes('8TH') || upper.includes('9TH') || upper.includes('LGA1151') || upper.includes('H110') || upper.includes('B250') || upper.includes('H310') || upper.includes('B365') || upper.includes('6500') || upper.includes('7400') || upper.includes('8400') || upper.includes('9400')) return 'LGA1151';
    if (upper.includes('4TH') || upper.includes('LGA1150') || upper.includes('H81') || upper.includes('B85') || upper.includes('Z97') || upper.includes('4460') || upper.includes('4770') || upper.includes('4790')) return 'LGA1150';
    if (upper.includes('2ND') || upper.includes('3RD') || upper.includes('LGA1155') || upper.includes('H61') || upper.includes('X61') || upper.includes('B75') || upper.includes('Z77') || upper.includes('3470') || upper.includes('3770') || upper.includes('2100') || upper.includes('3220')) return 'LGA1155';
    if (upper.includes('AM5') || upper.includes('7000') || upper.includes('8000') || upper.includes('9000') || upper.includes('7800X3D') || upper.includes('7600') || upper.includes('7700') || upper.includes('7900') || upper.includes('B650') || upper.includes('X670') || upper.includes('B850')) return 'AM5';
    if (upper.includes('AM4') || upper.includes('5000') || upper.includes('3000') || upper.includes('5600') || upper.includes('B550') || upper.includes('A520') || upper.includes('X570')) return 'AM4';
    if (upper.includes('AM3') || upper.includes('FX-')) return 'AM3/AM3+';
    return platform === 'intel' ? 'LGA1700' : 'AM5';
  }

  function inferRamType(name: string): 'DDR3' | 'DDR4' | 'DDR5' {
    const upper = name.toUpperCase();
    if (upper.includes('DDR3')) return 'DDR3';
    if (upper.includes('DDR4')) return 'DDR4';
    if (upper.includes('DDR5')) return 'DDR5';

    if (upper.includes('H61') || upper.includes('X61') || upper.includes('B75') || upper.includes('H81') || upper.includes('B85') || upper.includes('LGA1155') || upper.includes('LGA1150')) return 'DDR3';
    if (upper.includes('H110') || upper.includes('B250') || upper.includes('H310') || upper.includes('B365') || upper.includes('H410') || upper.includes('H510') || upper.includes('B460') || upper.includes('B560') || upper.includes('B450') || upper.includes('B550') || upper.includes('LGA1151') || upper.includes('LGA1200') || upper.includes('AM4')) return 'DDR4';
    if (upper.includes('B650') || upper.includes('X670') || upper.includes('Z890') || upper.includes('LGA1851') || upper.includes('AM5')) return 'DDR5';

    return 'DDR4';
  }

  // Combine store products & inventory with automatic fallback catalog if store is empty/unauthenticated
  const allStoreItems = useMemo(() => {
    const combined = [...dbProducts, ...dbInventory];
    if (combined.length > 0) return combined;
    return DEFAULT_FALLBACK_COMPONENTS;
  }, [dbProducts, dbInventory]);

  // Category retrieval helper - ALWAYS prepends explicit '-- Select --' (price: 0) option
  const getCategoryItems = (categoryKeywords: string[], defaultName: string): ComponentOption[] => {
    const matched = allStoreItems.filter(item => {
      const cat = (item.category || '').toLowerCase();
      const name = (item.name || '').toLowerCase();
      return categoryKeywords.some(kw => cat.includes(kw.toLowerCase()) || name.includes(kw.toLowerCase()));
    });

    const noneOption: ComponentOption = {
      id: `none-${categoryKeywords[0].toLowerCase().replace(/\s+/g, '-')}`,
      name: `-- Select ${defaultName} --`,
      price: 0
    };

    return [noneOption, ...matched];
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

  // Sync CPU selection (pick first real CPU if available), keep all other components at '-- Select --' (price 0) unless chosen by user
  useEffect(() => {
    if (cpus.length > 0) {
      const realCpu = cpus.find(c => !c.id.startsWith('none-')) || cpus[0];
      setSelectedCPU(realCpu);
    }
  }, [cpus]);

  useEffect(() => { if (motherboards.length > 0 && (!selectedMB || !motherboards.some(m => m.id === selectedMB.id))) setSelectedMB(motherboards[0]); }, [motherboards]);
  useEffect(() => { if (coolers.length > 0 && (!selectedCooler || !coolers.some(c => c.id === selectedCooler.id))) setSelectedCooler(coolers[0]); }, [coolers]);
  useEffect(() => { if (rams.length > 0 && (!selectedRAM || !rams.some(r => r.id === selectedRAM.id))) setSelectedRAM(rams[0]); }, [rams]);
  useEffect(() => { if (gpus.length > 0 && (!selectedGPU || !gpus.some(g => g.id === selectedGPU.id))) setSelectedGPU(gpus[0]); }, [gpus]);
  useEffect(() => { if (ssds.length > 0 && (!selectedSSD || !ssds.some(s => s.id === selectedSSD.id))) setSelectedSSD(ssds[0]); }, [ssds]);
  useEffect(() => { if (secStorages.length > 0 && (!selectedSecStorage || !secStorages.some(s => s.id === selectedSecStorage.id))) setSelectedSecStorage(secStorages[0]); }, [secStorages]);
  useEffect(() => { if (psus.length > 0 && (!selectedPSU || !psus.some(p => p.id === selectedPSU.id))) setSelectedPSU(psus[0]); }, [psus]);
  useEffect(() => { if (cases.length > 0 && (!selectedCase || !cases.some(c => c.id === selectedCase.id))) setSelectedCase(cases[0]); }, [cases]);

  // --- SMART SOCKET & RAM RESET (Only reset if user selected an incompatible component) ---
  useEffect(() => {
    if (selectedCPU && selectedCPU.socket && !selectedCPU.id.startsWith('none-')) {
      if (selectedMB && !selectedMB.id.startsWith('none-') && selectedMB.socket && selectedMB.socket !== selectedCPU.socket) {
        if (motherboards.length > 0) {
          setSelectedMB(motherboards[0]); // Reset to '-- Select Motherboard --'
        }
      }
    }
  }, [selectedCPU, motherboards]);

  useEffect(() => {
    if (selectedMB && selectedMB.ramType && !selectedMB.id.startsWith('none-')) {
      if (selectedRAM && !selectedRAM.id.startsWith('none-') && selectedRAM.ramType && selectedRAM.ramType !== selectedMB.ramType) {
        if (rams.length > 0) {
          setSelectedRAM(rams[0]); // Reset to '-- Select RAM --'
        }
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

  // Total Calculation - strictly sums selected items only
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

  // Open modal to capture Customer Name & Phone Number
  const triggerWhatsAppQuote = () => {
    setShowModal(true);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowModal(false);

    const cName = customerName || user?.displayName || user?.email?.split('@')[0] || 'Store Customer';
    const cPhone = customerPhone || 'N/A';
    const docId = `${createSlug(cName)}-${generateShortId()}`;
    const quoteUrl = `${window.location.origin}/quote/${docId}`;

    const resolvedGift = resolveGiftCombo();

    // 1. Save to Firestore
    try {
      await setDoc(doc(db, 'custom_pc_requests', docId), {
        quoteNo: `TB-PC-${generateShortId().toUpperCase()}`,
        customerName: cName,
        customerPhone: cPhone,
        platform: platform.toUpperCase(),
        subTotal,
        discountAmount,
        finalPrice,
        status: 'Pending',
        createdAt: new Date().toISOString(),
        comboId: selectedGiftComboId,
        comboName: resolvedGift.name,
        comboItems: resolvedGift.items,
        components: {
          ...(selectedCPU && !selectedCPU.id.startsWith('none-') && { cpu: { name: selectedCPU.name, price: selectedCPU.price } }),
          ...(selectedMB && !selectedMB.id.startsWith('none-') && { motherboard: { name: selectedMB.name, price: selectedMB.price } }),
          ...(selectedCooler && !selectedCooler.id.startsWith('none-') && { cooler: { name: selectedCooler.name, price: selectedCooler.price } }),
          ...(selectedRAM && !selectedRAM.id.startsWith('none-') && { ram: { name: selectedRAM.name, price: selectedRAM.price, qty: ramQty } }),
          ...(selectedGPU && !selectedGPU.id.startsWith('none-') && { gpu: { name: selectedGPU.name, price: selectedGPU.price } }),
          ...(selectedSSD && !selectedSSD.id.startsWith('none-') && { ssd: { name: selectedSSD.name, price: selectedSSD.price } }),
          ...(selectedSecStorage && !selectedSecStorage.id.startsWith('none-') && { secStorage: { name: selectedSecStorage.name, price: selectedSecStorage.price } }),
          ...(selectedPSU && !selectedPSU.id.startsWith('none-') && { psu: { name: selectedPSU.name, price: selectedPSU.price } }),
          ...(selectedCase && !selectedCase.id.startsWith('none-') && { cabinet: { name: selectedCase.name, price: selectedCase.price } }),
        }
      });
      setSavedQuoteId(docId);
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Error saving custom pc request:", err);
    }

    // 2. Open WhatsApp with clickable online quotation link
    const storePhone = settings?.supportPhone || '+919535225266';
    const cleanPhone = storePhone.replace(/[^0-9]/g, '');

    const quoteMsg = [
      `*CUSTOM PC BUILD QUOTATION - TECH BEAST HUBLI*`,
      `*Customer Name:* ${cName}`,
      `*Phone Number:* ${cPhone}`,
      `*Platform:* ${platform.toUpperCase()} Custom Rig`,
      ``,
      `📄 *View Official Online Quotation & Specs:*`,
      `${quoteUrl}`,
      ``,
      `*Subtotal:* ₹${subTotal.toLocaleString('en-IN')}`,
      `*Store Offer Price:* ₹${finalPrice.toLocaleString('en-IN')} (Saved ₹${discountAmount.toLocaleString('en-IN')})`,
      ``,
      `Hi Tech Beast Hubli team! Please confirm availability for this custom PC quotation so I can visit the store for build assembly.`
    ].filter(Boolean).join('\n');

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(quoteMsg)}`, '_blank');
  };

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen py-8 pb-24 lg:pb-8 px-4 sm:px-6 lg:px-8">
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

          {/* --- COMPONENT SELECTION GRID (FIRST ON MOBILE) --- */}
          <div className="lg:col-span-8 space-y-5 order-1 lg:order-2">

            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">

              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-blue-600" />
                  {platform === 'intel' ? 'Intel Custom PC Configurator' : 'AMD Custom PC Configurator'}
                </h2>
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">Sourced from Admin Store Inventory</span>
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

                {/* 2. Free Gift Bundle (Tiered based on ₹20,000 purchase or Custom Combos) */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5">
                      <span>{finalPrice >= 20000 ? '🎉 Free 8-Item Mega Accessories Pack' : '🎁 Free 4-Item Essential Accessories Pack'}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${finalPrice >= 20000 ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                        {finalPrice >= 20000 ? '₹20K+ UNLOCKED' : 'UNDER ₹20K'}
                      </span>
                    </span>
                    <span className="text-emerald-600 font-bold">FREE INCLUDED</span>
                  </div>
                  <select
                    value={selectedGiftComboId}
                    onChange={(e) => setSelectedGiftComboId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="auto">
                      ⚡ Auto Tier ({finalPrice >= 20000 ? '8-Item Mega Pack for ₹20K+' : '4-Item Essential Pack'})
                    </option>
                    <option value="8-item">🎉 8-Item Mega Tech Beast Pack</option>
                    <option value="4-item">🎁 4-Item Essential Tech Beast Pack</option>
                    {settings?.accessoryCombos?.map((combo) => (
                      <option key={combo.id} value={combo.id}>
                        ✨ {combo.name} ({combo.items?.length || 0} items)
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {finalPrice >= 20000
                      ? '✨ Builds of ₹20,000 and above qualify for the full 8-item accessories gift pack!'
                      : '✨ Builds under ₹20,000 receive 4 essential free accessories. Add more components to unlock the 8-item pack!'}
                  </p>
                </div>

                {/* 3. PROCESSOR (CPU) - STRICT AMD / INTEL ISOLATION */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <span className="flex items-center gap-2">
                      Processor (CPU) *
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${platform === 'intel' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
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
                    <span>RAM ({selectedMB?.ramType || 'DDR4'}) *</span>
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

                {/* 8. PRIMARY SSD STORAGE */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <span>Primary SSD Storage *</span>
                    <span className="text-slate-400 text-[11px]">NVMe M.2</span>
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
                    <span>Secondary Storage</span>
                    <span className="text-slate-400 text-[11px]">Optional HDD / SSD</span>
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

          {/* --- LIVE BUILD SUMMARY & PREVIEW CARD (DESKTOP STICKY, SECOND ON MOBILE) --- */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 space-y-6 relative lg:sticky lg:top-24 shadow-md order-2 lg:order-1">

            {/* PC Rig Image */}
            <div className="relative bg-slate-100 border border-slate-200 rounded-2xl p-4 flex items-center justify-center overflow-hidden">
              <img
                src={platform === 'intel'
                  ? "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80"
                  : "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=600&q=80"}
                alt="Custom PC Build Preview"
                className="w-full max-h-56 object-contain rounded-xl"
              />

              <div className={`absolute top-3 left-3 px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-widest border shadow-sm ${platform === 'intel' ? 'bg-blue-600 text-white border-blue-400/30' : 'bg-red-600 text-white border-red-400/30'
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
                onClick={triggerWhatsAppQuote}
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


          {/* Mobile Floating Sticky Bottom Quote Bar */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3.5 shadow-2xl flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Est. Total</span>
              <span className="text-xl font-black text-slate-900">₹{finalPrice.toLocaleString('en-IN')}</span>
            </div>
            <button
              onClick={triggerWhatsAppQuote}
              className="bg-[#25D366] hover:bg-[#128C7E] active:scale-95 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
            >
              <MessageCircle className="w-4 h-4" /> Get Quote
            </button>
          </div>

          {showModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative">
                <button
                  onClick={() => setShowModal(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-900"
                >
                  <ArrowLeft className="w-5 h-5 rotate-180" />
                </button>

                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-2xl">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">Get Store Quotation</h3>
                    <p className="text-xs text-slate-500">Enter your details so we can save your configuration and open WhatsApp.</p>
                  </div>
                </div>

                <form onSubmit={handleFinalSubmit} className="space-y-4 mt-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Your Name *</label>
                    <input
                      required
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-blue-500 text-sm font-medium"
                      placeholder="e.g. Rahul Sharma"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Mobile / WhatsApp Number *</label>
                    <input
                      required
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-blue-500 text-sm font-medium"
                      placeholder="e.g. 9876543210"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-3.5 px-4 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all mt-6 shadow-lg shadow-emerald-600/20"
                  >
                    <MessageCircle className="w-5 h-5" /> Generate & Open WhatsApp
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Success Dialog with 1-Click Online Quotation Link */}
          {showSuccessModal && savedQuoteId && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative text-center">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                  🎉
                </div>

                <h3 className="text-xl font-extrabold text-slate-900 mb-1">Quotation Created Successfully!</h3>
                <p className="text-xs text-slate-500 mb-6">
                  Your custom PC configuration has been saved with an official online link.
                </p>

                {/* Direct Link Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 mb-6 flex items-center justify-between gap-3 text-left">
                  <div className="overflow-hidden">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Direct Quotation URL</span>
                    <span className="text-xs font-mono font-medium text-blue-600 truncate block">
                      {`${window.location.origin}/quote/${savedQuoteId}`}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/quote/${savedQuoteId}`);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2500);
                    }}
                    className="shrink-0 bg-white hover:bg-slate-100 text-slate-700 font-bold px-3 py-2 rounded-xl text-xs border border-slate-200 shadow-sm flex items-center gap-1 transition-all"
                  >
                    {copiedLink ? <><Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!</> : <><Share2 className="w-3.5 h-3.5 text-slate-500" /> Copy</>}
                  </button>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => navigate(`/quote/${savedQuoteId}`)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" /> View Online Quotation & Specs
                  </button>

                  <button
                    onClick={() => setShowSuccessModal(false)}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold text-xs transition-all"
                  >
                    Close / Build Another PC
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
