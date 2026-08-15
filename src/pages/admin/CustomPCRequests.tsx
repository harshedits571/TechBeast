import { useState, useEffect, useRef } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, query, orderBy, limit, setDoc } from 'firebase/firestore';
import { Trash2, ExternalLink, Calendar, Phone, User, Cpu, RotateCw, FileText, Send, Printer, Plus, Sparkles, X, Save, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { useSettings } from '../../contexts/SettingsContext';

interface CustomPCRequest {
  id: string;
  quoteNo?: string;
  customerName: string;
  customerPhone: string;
  platform: string;
  subTotal: number;
  discountAmount: number;
  finalPrice: number;
  status: 'Pending' | 'Contacted' | 'Completed';
  createdAt: string;
  components: {
    cpu?: { name: string; price: number };
    motherboard?: { name: string; price: number };
    cooler?: { name: string; price: number };
    ram?: { name: string; price: number; qty: number };
    gpu?: { name: string; price: number };
    ssd?: { name: string; price: number };
    secStorage?: { name: string; price: number };
    psu?: { name: string; price: number };
    cabinet?: { name: string; price: number };
  };
}

interface ComponentRow {
  category: string;
  desc: string;
  qty: number;
  warranty: string;
  price: number | string;
}

const DEFAULT_COMPONENTS: ComponentRow[] = [
  { category: "Processor (CPU)", desc: "", qty: 1, warranty: "3", price: "" },
  { category: "Motherboard", desc: "", qty: 1, warranty: "3", price: "" },
  { category: "RAM Memory", desc: "", qty: 1, warranty: "3", price: "" },
  { category: "SSD Storage", desc: "", qty: 1, warranty: "3", price: "" },
  { category: "Graphics Card", desc: "", qty: 1, warranty: "3", price: "" },
  { category: "SMPS (Power Supply)", desc: "", qty: 1, warranty: "2", price: "" },
  { category: "Cabinet / Case", desc: "", qty: 1, warranty: "1", price: "" },
  { category: "CPU Cooler", desc: "", qty: 1, warranty: "1", price: "" }
];

const PRESETS: Record<string, ComponentRow[]> = {
  office: [
    { category: "Processor (CPU)", desc: "Intel Core i3 12100 12th Gen", qty: 1, warranty: "3", price: 7800 },
    { category: "Motherboard", desc: "H610M Motherboard", qty: 1, warranty: "3", price: 5800 },
    { category: "RAM Memory", desc: "8GB DDR4 3200MHz RAM", qty: 1, warranty: "3", price: 1600 },
    { category: "SSD Storage", desc: "512GB NVMe M.2 SSD", qty: 1, warranty: "3", price: 2900 },
    { category: "Graphics Card", desc: "Intel UHD 730 Integrated", qty: 1, warranty: "N/A", price: 0 },
    { category: "SMPS (Power Supply)", desc: "450W Heavy Duty SMPS", qty: 1, warranty: "2", price: 1200 },
    { category: "Cabinet / Case", desc: "Standard ATX Cabinet", qty: 1, warranty: "1", price: 1200 },
    { category: "Monitor", desc: "20-inch HD LED Display Monitor", qty: 1, warranty: "1", price: 4200 }
  ],
  gaming: [
    { category: "Processor (CPU)", desc: "Intel Core i5 12400F 12th Gen", qty: 1, warranty: "3", price: 9800 },
    { category: "Motherboard", desc: "Gigabyte B760M WiFi Motherboard", qty: 1, warranty: "3", price: 11200 },
    { category: "RAM Memory", desc: "16GB (8x2) DDR4 3200MHz", qty: 1, warranty: "3", price: 3400 },
    { category: "SSD Storage", desc: "512GB NVMe M.2 SSD", qty: 1, warranty: "3", price: 3100 },
    { category: "Graphics Card", desc: "NVIDIA RTX 3050 6GB GPU", qty: 1, warranty: "3", price: 16500 },
    { category: "SMPS (Power Supply)", desc: "Ant Esports 550W 80+ Bronze SMPS", qty: 1, warranty: "2", price: 2600 },
    { category: "Cabinet / Case", desc: "RGB Gaming Glass Cabinet", qty: 1, warranty: "1", price: 2800 },
    { category: "CPU Cooler", desc: "Stock Air Cooler", qty: 1, warranty: "1", price: 0 }
  ],
  pro: [
    { category: "Processor (CPU)", desc: "Intel Core i7 13700F 16-Core", qty: 1, warranty: "3", price: 29500 },
    { category: "Motherboard", desc: "MSI MAG B760 Tomahawk WiFi", qty: 1, warranty: "3", price: 18500 },
    { category: "RAM Memory", desc: "32GB (16x2) DDR5 6000MHz", qty: 1, warranty: "3", price: 9200 },
    { category: "SSD Storage", desc: "1TB Gen4 NVMe M.2 SSD", qty: 1, warranty: "5", price: 6800 },
    { category: "Graphics Card", desc: "NVIDIA RTX 4060 8GB GDDR6", qty: 1, warranty: "3", price: 28500 },
    { category: "SMPS (Power Supply)", desc: "DeepCool 750W 80+ Gold SMPS", qty: 1, warranty: "5", price: 6200 },
    { category: "Liquid Cooler", desc: "240mm ARGB Liquid CPU Cooler", qty: 1, warranty: "2", price: 5400 },
    { category: "Cabinet / Case", desc: "Premium Mesh Airflow Case", qty: 1, warranty: "1", price: 4500 }
  ]
};

export default function CustomPCRequests() {
  const [requests, setRequests] = useState<CustomPCRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Pagination State (10, 20, 30, 50 per page)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const { settings } = useSettings();

  // Generator Modal State
  const [showGenerator, setShowGenerator] = useState(false);
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [quoteNo, setQuoteNo] = useState(`TB-${new Date().getFullYear()}-1001`);
  const [quoteDate, setQuoteDate] = useState(format(new Date(), 'dd/MM/yyyy'));
  const [discount, setDiscount] = useState<number>(0);
  const [warrantyNote, setWarrantyNote] = useState('Prices Valid For 7 Days');
  const [includeGst, setIncludeGst] = useState(true);
  const [componentsList, setComponentsList] = useState<ComponentRow[]>(DEFAULT_COMPONENTS);
  const [selectedComboId, setSelectedComboId] = useState<string>('auto');

  const printableRef = useRef<HTMLDivElement>(null);

  // Helper for sequential quotation numbers (TB-2026-1001, TB-2026-1002...)
  const getNextSerialQuoteNo = (existingRequests: CustomPCRequest[]) => {
    const currentYear = new Date().getFullYear();
    const count = existingRequests.length;
    return `TB-${currentYear}-${1001 + count}`;
  };

  const fetchRequests = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const q = query(collection(db, 'custom_pc_requests'), orderBy('createdAt', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CustomPCRequest[];

      data.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });

      setRequests(data);
      setQuoteNo(getNextSerialQuoteNo(data));
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'custom_pc_requests', id), { status: newStatus });
      showToast(`Status updated to "${newStatus}"`);
      fetchRequests();
    } catch (error) {
      console.error("Error updating status:", error);
      showToast("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this custom PC request?")) return;
    try {
      await deleteDoc(doc(db, 'custom_pc_requests', id));
      showToast("Request deleted successfully");
      fetchRequests();
    } catch (error) {
      console.error("Error deleting request:", error);
      showToast("Failed to delete request");
    }
  };

  const formatPrice = (price?: number) => {
    if (!price && price !== 0) return '—';
    return `₹${price.toLocaleString('en-IN')}`;
  };

  // Format Warranty helper
  const formatWarrantyText = (val: string) => {
    if (!val && val !== '0') return 'Testing';
    const str = String(val).trim();
    if (!str) return 'Testing';
    if (/^\d+$/.test(str)) {
      const num = parseInt(str, 10);
      if (num === 0) return 'Testing';
      if (num === 1) return '1 Yr';
      return `${num} Yrs`;
    }
    return str;
  };

  // Computations for generator
  const subtotal = componentsList.reduce((acc, item) => {
    const p = item.price === '' ? 0 : Number(item.price) || 0;
    return acc + (item.qty || 1) * p;
  }, 0);

  const gstAmount = includeGst ? Math.round(subtotal * 0.18) : 0;
  const netTotal = Math.max(0, subtotal + gstAmount - discount);

  // Helper to resolve the selected combo
  const resolveCombo = () => {
    if (selectedComboId === 'none') {
      return { id: 'none', name: '', items: [] };
    }
    if (selectedComboId === '8-item') {
      return {
        id: '8-item',
        name: '8-Item Mega Tech Beast Accessories Pack',
        items: ['Gaming Mouse', 'Keyboard', 'RGB Mousepad', 'Headset', 'WiFi Dongle', 'HDMI/Power Cable', 'Cleaner Kit', 'Gaming Stickers']
      };
    }
    if (selectedComboId === '4-item') {
      return {
        id: '4-item',
        name: '4-Item Essential Tech Beast Accessories Pack',
        items: ['Mousepad', 'WiFi USB Adapter', 'Power Cable', 'Cleaning Kit']
      };
    }
    if (selectedComboId === 'auto') {
      if (netTotal >= 20000) {
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
    const found = settings.accessoryCombos?.find(c => c.id === selectedComboId);
    if (found) {
      return {
        id: found.id,
        name: found.name,
        items: found.items || []
      };
    }
    return { id: 'none', name: '', items: [] };
  };

  // Pagination computations
  const totalPages = Math.ceil(requests.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRequests = requests.slice(startIndex, startIndex + itemsPerPage);

  // Component row handlers
  const updateComp = (idx: number, field: keyof ComponentRow, value: any) => {
    const updated = [...componentsList];
    if (field === 'price' || field === 'qty') {
      updated[idx][field] = value === '' ? '' : (parseFloat(value) || 0);
    } else {
      updated[idx][field] = value;
    }
    setComponentsList(updated);
  };

  const addComponentRow = () => {
    setComponentsList([...componentsList, { category: "Custom Part", desc: "", qty: 1, warranty: "1", price: "" }]);
  };

  const removeComponentRow = (idx: number) => {
    setComponentsList(componentsList.filter((_, i) => i !== idx));
  };

  const clearAllSpecs = () => {
    setComponentsList(componentsList.map(item => ({ ...item, desc: "", price: "" })));
  };

  const loadBuildPreset = (key: string) => {
    if (PRESETS[key]) {
      setComponentsList(JSON.parse(JSON.stringify(PRESETS[key])));
    }
  };

  // Populate generator from existing request
  const handleLoadRequestIntoGenerator = (req: CustomPCRequest) => {
    setEditingRequestId(req.id);
    setCustName(req.customerName || 'Customer');
    setCustPhone(req.customerPhone || '');
    setQuoteNo(req.quoteNo || getNextSerialQuoteNo(requests));
    setQuoteDate(req.createdAt ? format(new Date(req.createdAt), 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy'));
    setDiscount(req.discountAmount || 0);
    setSelectedComboId((req as any).comboId || 'auto');

    const loadedRows: ComponentRow[] = [];
    if (req.components?.cpu) loadedRows.push({ category: "Processor (CPU)", desc: req.components.cpu.name, qty: 1, warranty: "3", price: req.components.cpu.price });
    if (req.components?.motherboard) loadedRows.push({ category: "Motherboard", desc: req.components.motherboard.name, qty: 1, warranty: "3", price: req.components.motherboard.price });
    if (req.components?.ram) loadedRows.push({ category: "RAM Memory", desc: req.components.ram.name, qty: req.components.ram.qty || 1, warranty: "3", price: req.components.ram.price });
    if (req.components?.ssd) loadedRows.push({ category: "SSD Storage", desc: req.components.ssd.name, qty: 1, warranty: "3", price: req.components.ssd.price });
    if (req.components?.secStorage) loadedRows.push({ category: "Secondary Storage", desc: req.components.secStorage.name, qty: 1, warranty: "3", price: req.components.secStorage.price });
    if (req.components?.gpu) loadedRows.push({ category: "Graphics Card", desc: req.components.gpu.name, qty: 1, warranty: "3", price: req.components.gpu.price });
    if (req.components?.psu) loadedRows.push({ category: "SMPS (Power Supply)", desc: req.components.psu.name, qty: 1, warranty: "2", price: req.components.psu.price });
    if (req.components?.cabinet) loadedRows.push({ category: "Cabinet / Case", desc: req.components.cabinet.name, qty: 1, warranty: "1", price: req.components.cabinet.price });
    if (req.components?.cooler) loadedRows.push({ category: "CPU Cooler", desc: req.components.cooler.name, qty: 1, warranty: "1", price: req.components.cooler.price });

    if (loadedRows.length > 0) {
      setComponentsList(loadedRows);
    }
    setShowGenerator(true);
  };

  // Save generator quote directly to Firestore (Updates existing or creates new)
  const handleSaveQuoteToDb = async (showNotification = true) => {
    try {
      const currentQuoteNo = quoteNo || getNextSerialQuoteNo(requests);
      const targetDocId = editingRequestId || currentQuoteNo;
      const resolved = resolveCombo();

      const payload = {
        quoteNo: currentQuoteNo,
        customerName: custName,
        customerPhone: custPhone,
        platform: 'CUSTOM RIG',
        subTotal: subtotal,
        discountAmount: discount,
        finalPrice: netTotal,
        componentsList: componentsList,
        comboId: selectedComboId,
        comboName: resolved.name,
        comboItems: resolved.items,
        components: {
          cpu: { name: componentsList.find(c => c.category.includes('Processor'))?.desc || 'Processor', price: Number(componentsList.find(c => c.category.includes('Processor'))?.price) || 0 },
          motherboard: { name: componentsList.find(c => c.category.includes('Motherboard'))?.desc || 'Motherboard', price: Number(componentsList.find(c => c.category.includes('Motherboard'))?.price) || 0 },
          ram: { name: componentsList.find(c => c.category.includes('RAM'))?.desc || 'RAM', price: Number(componentsList.find(c => c.category.includes('RAM'))?.price) || 0, qty: 1 },
          gpu: { name: componentsList.find(c => c.category.includes('Graphics'))?.desc || '', price: Number(componentsList.find(c => c.category.includes('Graphics'))?.price) || 0 },
          ssd: { name: componentsList.find(c => c.category.includes('SSD'))?.desc || '', price: Number(componentsList.find(c => c.category.includes('SSD'))?.price) || 0 },
          psu: { name: componentsList.find(c => c.category.includes('SMPS'))?.desc || '', price: Number(componentsList.find(c => c.category.includes('SMPS'))?.price) || 0 },
          cabinet: { name: componentsList.find(c => c.category.includes('Cabinet'))?.desc || '', price: Number(componentsList.find(c => c.category.includes('Cabinet'))?.price) || 0 }
        }
      };

      if (editingRequestId) {
        await updateDoc(doc(db, 'custom_pc_requests', editingRequestId), payload);
        if (showNotification) {
          showToast(`Quotation ${currentQuoteNo} updated successfully!`);
        }
      } else {
        await setDoc(doc(db, 'custom_pc_requests', targetDocId), {
          ...payload,
          status: 'Pending',
          createdAt: new Date().toISOString()
        });
        if (showNotification) {
          showToast(`Quotation ${currentQuoteNo} saved to database!`);
        }
      }
      fetchRequests(false);
      return targetDocId;
    } catch (err) {
      console.error("Error saving quote:", err);
      if (showNotification) {
        showToast("Failed to save quote: " + (err as Error).message);
      }
      return null;
    }
  };

  // Save / Print PDF Window
  const handlePrint = () => {
    const cardHTML = printableRef.current?.outerHTML;
    if (!cardHTML) return;
    const printWin = window.open('', '_blank', 'width=900,height=1000');
    if (!printWin) return;

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tech Beast PC Quotation - ${quoteNo}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@500;600;700;800;900&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: #ffffff !important;
            color: #0f172a !important;
            padding: 10px;
            margin: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .printable-card {
            border: 2px solid #dc2626 !important;
            box-shadow: none !important;
            max-width: 100% !important;
            width: 100% !important;
          }
          @page {
            size: A4 portrait;
            margin: 0.4cm;
          }
        </style>
      </head>
      <body onload="setTimeout(function(){ window.print(); window.close(); }, 400);">
        <div style="max-width: 720px; margin: 0 auto;">
          ${cardHTML}
        </div>
      </body>
      </html>
    `);
    printWin.document.close();
  };

  const handleSavePdf = () => {
    handlePrint();
  };

  // WhatsApp Quote Sender with Clickable Online Quotation Link
  const handleSendWhatsapp = () => {
    const rawPhone = custPhone.replace(/\D/g, '');
    let formattedPhone = rawPhone;
    if (formattedPhone.length === 10) {
      formattedPhone = '91' + formattedPhone;
    }

    const currentQuoteNo = quoteNo || getNextSerialQuoteNo(requests);
    const targetDocId = editingRequestId || currentQuoteNo;
    const quoteUrl = `${window.location.origin}/quote/${targetDocId}`;

    // Auto-save quote to DB in background quietly so link works instantly
    handleSaveQuoteToDb(false);

    const fullMsg = [
      `Hello ${custName || 'Customer'}! 👋`,
      ``,
      `Thank you for choosing *Tech Beast Hubli*! 🚀`,
      ``,
      `Here is your Official Custom PC Quotation:`,
      `📌 *Quote No:* ${currentQuoteNo}`,
      `🗓️ *Date:* ${quoteDate}`,
      `💰 *Total Price:* ₹${netTotal.toLocaleString('en-IN')}/-`,
      ``,
      `📄 *View Online Quotation & Full Specifications:*`,
      `${quoteUrl}`,
      ``,
      `Please let us know if you have any questions or when you would like to visit our store for build assembly!`
    ].join('\n');

    showToast("Opening WhatsApp with Quotation Link...");
    const waUrl = formattedPhone 
      ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(fullMsg)}`
      : `https://wa.me/?text=${encodeURIComponent(fullMsg)}`;

    window.open(waUrl, '_blank');
  };

  const handleCopyQuoteLink = async () => {
    const currentQuoteNo = quoteNo || getNextSerialQuoteNo(requests);
    const targetDocId = editingRequestId || currentQuoteNo;
    const quoteUrl = `${window.location.origin}/quote/${targetDocId}`;
    await handleSaveQuoteToDb(false);
    navigator.clipboard.writeText(quoteUrl);
    showToast("Quotation Link copied to clipboard!");
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2 font-heading">
            <Cpu className="w-7 h-7 text-red-500" />
            Custom PC Quotation Requests
          </h1>
          <p className="text-xs text-slate-400 mt-1">Manage customer builds & generate printable PDF store quotations</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (!showGenerator) {
                setEditingRequestId(null);
                setCustName('');
                setCustPhone('');
                setQuoteNo(getNextSerialQuoteNo(requests));
                setComponentsList(DEFAULT_COMPONENTS);
              }
              setShowGenerator(!showGenerator);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-red-600/20 cursor-pointer uppercase tracking-wider"
          >
            <FileText className="w-4 h-4" />
            {showGenerator ? 'Close Quotation Generator' : '+ Create Custom Quotation'}
          </button>
          <button
            onClick={fetchRequests}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 text-xs font-bold transition-colors"
          >
            <RotateCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* --- QUOTATION & PDF GENERATOR TOOL (GEMINI FORMAT INTEGRATED) --- */}
      {showGenerator && (
        <div className="bg-slate-900 border-2 border-red-600/40 rounded-3xl p-5 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-tr from-red-600 to-amber-500 text-white rounded-xl flex items-center justify-center font-black text-lg">
                TB
              </div>
              <div>
                <h2 className="font-heading font-extrabold text-base text-white tracking-wide">TECH BEAST QUOTATION GENERATOR</h2>
                <p className="text-[11px] text-amber-400 font-bold uppercase">1-Page A4 PDF & WhatsApp Ready</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSavePdf}
                className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-md shadow-red-600/20"
              >
                <FileText className="w-4 h-4" /> 📄 Save PDF
              </button>
              <button
                onClick={handleSendWhatsapp}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-md shadow-emerald-600/20"
              >
                <Send className="w-4 h-4" /> 📲 WhatsApp Quote
              </button>
              <button
                onClick={handleCopyQuoteLink}
                className="px-3.5 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
                title="Copy Direct Online Link"
              >
                <ExternalLink className="w-4 h-4" /> 🔗 Copy Link
              </button>
              <button
                onClick={handlePrint}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
              >
                <Printer className="w-4 h-4" /> 🖨️ Print
              </button>
              <button
                onClick={handleSaveQuoteToDb}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-md shadow-blue-600/20"
              >
                <Save className="w-4 h-4" /> 💾 Save to Database
              </button>
              <button
                onClick={() => setShowGenerator(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Sidebar Controls */}
            <div className="lg:col-span-5 bg-slate-800/90 border border-slate-700 rounded-2xl p-4 space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">Customer Name:</label>
                  <input
                    type="text"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-amber-400 uppercase tracking-wider mb-1">Mobile No (WhatsApp):</label>
                  <input
                    type="text"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-amber-500/60 rounded-xl px-3 py-2 text-amber-300 font-bold focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">Quotation No:</label>
                  <input
                    type="text"
                    value={quoteNo}
                    onChange={(e) => setQuoteNo(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">Date:</label>
                  <input
                    type="text"
                    value={quoteDate}
                    onChange={(e) => setQuoteDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Free Gift / Accessory Combo Selector */}
              <div className="border-t border-slate-700 pt-3">
                <label className="block text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>🎁 Free Gift / Combo Bonus:</span>
                  <span className="text-[10px] text-slate-400 lowercase font-normal">customizable</span>
                </label>
                <select
                  value={selectedComboId}
                  onChange={(e) => setSelectedComboId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-bold focus:border-amber-400 focus:outline-none"
                >
                  <option value="auto">⚡ Auto (8-Item for ₹20K+, 4-Item for &lt;₹20K)</option>
                  <option value="8-item">🎉 8-Item Mega Tech Beast Pack</option>
                  <option value="4-item">🎁 4-Item Essential Tech Beast Pack</option>
                  {settings?.accessoryCombos?.map((combo) => (
                    <option key={combo.id} value={combo.id}>
                      ✨ {combo.name} ({combo.items?.length || 0} items)
                    </option>
                  ))}
                  <option value="none">❌ No Free Gift</option>
                </select>
              </div>

              {/* Quick Fill Presets */}
              <div className="border-t border-slate-700 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quick Presets:</label>
                  <button type="button" onClick={clearAllSpecs} className="text-[10px] text-red-400 hover:underline font-bold">🧹 Clear All Specs</button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button type="button" onClick={() => loadBuildPreset('office')} className="px-2 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold border border-slate-600 text-center transition text-[11px]">💻 Office Build</button>
                  <button type="button" onClick={() => loadBuildPreset('gaming')} className="px-2 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold border border-slate-600 text-center transition text-[11px]">🎮 Gaming Build</button>
                  <button type="button" onClick={() => loadBuildPreset('pro')} className="px-2 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold border border-slate-600 text-center transition text-[11px]">🚀 Workstation</button>
                </div>
              </div>

              {/* Dynamic Components List Inputs */}
              <div className="border-t border-slate-700 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-red-400 uppercase tracking-wider">PC Components & Parts:</label>
                  <button type="button" onClick={addComponentRow} className="text-[11px] bg-red-600 hover:bg-red-500 text-white font-extrabold px-2.5 py-1 rounded-lg transition flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add Part
                  </button>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {componentsList.map((item, idx) => (
                    <div key={idx} className="flex flex-col sm:grid sm:grid-cols-12 gap-1.5 items-center bg-slate-900/90 p-2 rounded-xl border border-slate-700">
                      <input
                        type="text"
                        value={item.category}
                        onChange={(e) => updateComp(idx, 'category', e.target.value)}
                        className="sm:col-span-3 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-[11px] font-bold focus:outline-none"
                        placeholder="Category"
                      />
                      <input
                        type="text"
                        value={item.desc}
                        onChange={(e) => updateComp(idx, 'desc', e.target.value)}
                        className="sm:col-span-5 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-[11px] font-bold focus:outline-none focus:border-red-500"
                        placeholder="Model / Specs..."
                      />
                      <input
                        type="text"
                        value={item.warranty}
                        onChange={(e) => updateComp(idx, 'warranty', e.target.value)}
                        className="sm:col-span-2 bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-amber-300 font-bold text-[11px] text-center focus:outline-none"
                        placeholder="Warranty"
                      />
                      <div className="flex items-center gap-1 sm:col-span-2">
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => updateComp(idx, 'price', e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-amber-400 font-extrabold text-[11px] text-right focus:outline-none"
                          placeholder="₹ Price"
                        />
                        <button type="button" onClick={() => removeComponentRow(idx)} className="text-red-400 hover:bg-red-500/20 p-1 rounded">
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* GST & Discount Controls */}
              <div className="border-t border-slate-700 pt-3 space-y-3">
                <div className="flex items-center justify-between bg-slate-900 border border-slate-700 p-2.5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="toggleGst"
                      checked={includeGst}
                      onChange={(e) => setIncludeGst(e.target.checked)}
                      className="w-4 h-4 accent-red-600 cursor-pointer"
                    />
                    <label htmlFor="toggleGst" className="text-xs font-extrabold text-amber-400 cursor-pointer uppercase tracking-wider">
                      Auto Add 18% GST Tax
                    </label>
                  </div>
                  <span className="text-xs font-black text-white">18% GST: +₹{gstAmount.toLocaleString('en-IN')}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">Discount Amount (₹):</label>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-bold focus:border-red-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">Terms / Note:</label>
                    <input
                      type="text"
                      value={warrantyNote}
                      onChange={(e) => setWarrantyNote(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-bold focus:border-red-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Printable A4 Preview Sheet (Exact Gemini Template) */}
            <div className="lg:col-span-7 flex flex-col items-center">
              <div ref={printableRef} id="printableCard" className="printable-card bg-white text-slate-900 rounded-3xl p-6 shadow-2xl border-2 border-slate-800 w-full max-w-2xl transition-all relative overflow-hidden text-slate-900">
                
                {/* Header */}
                <header className="flex items-center justify-between border-b-2 border-red-600 pb-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-tr from-red-600 to-red-500 text-white rounded-2xl flex items-center justify-center font-black text-2xl font-heading shadow-md shadow-red-600/30">
                      TB
                    </div>
                    <div>
                      <h2 className="font-heading text-2xl font-black text-slate-900 leading-none uppercase tracking-tight">TECH BEAST</h2>
                      <p className="text-red-600 font-black text-[10px] tracking-widest uppercase mt-0.5">LAPTOPS • DESKTOPS • CUSTOM PCS • ACCESSORIES</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="bg-gradient-to-r from-red-600 to-amber-500 text-white font-black text-[11px] uppercase px-3 py-1 rounded-md shadow-sm">
                      PC QUOTATION
                    </span>
                  </div>
                </header>

                {/* Customer Info Box */}
                <div className="grid grid-cols-2 gap-2 bg-slate-50 border-2 border-slate-200 p-3 rounded-xl mb-3 text-xs font-black">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase block leading-none">Customer Name:</span>
                    <span className="text-slate-900 font-black text-sm">{custName}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase block leading-none">Mobile Number:</span>
                    <span className="text-red-600 font-black text-sm">{custPhone}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase block leading-none">Quotation No:</span>
                    <span className="text-slate-900 font-black">{quoteNo}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase block leading-none">Date:</span>
                    <span className="text-slate-900 font-black">{quoteDate}</span>
                  </div>
                </div>

                {/* Parts Table */}
                <div className="mb-3 border-2 border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-white font-black uppercase text-[10px] border-b-2 border-slate-900">
                      <tr>
                        <th className="p-2 w-7 text-center">#</th>
                        <th className="p-2">Component Category & Description</th>
                        <th className="p-2 w-10 text-center">Qty</th>
                        <th className="p-2 w-20 text-center">Warranty</th>
                        <th className="p-2 w-24 text-right">Price (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-bold text-slate-900">
                      {componentsList.map((item, idx) => {
                        const priceNum = item.price === '' ? 0 : (parseFloat(String(item.price)) || 0);
                        const itemTotal = (item.qty || 1) * priceNum;
                        return (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-1.5 text-center font-black text-slate-500">{idx + 1}</td>
                            <td className="p-1.5">
                              <span className="font-extrabold uppercase text-[9px] text-red-600 block leading-none">{item.category}</span>
                              <span className="font-black text-xs text-slate-900">{item.desc || <span className="text-slate-400 italic">Specification Pending</span>}</span>
                            </td>
                            <td className="p-1.5 text-center font-bold text-slate-700">{item.qty || 1}</td>
                            <td className="p-1.5 text-center">
                              <span className="inline-block bg-slate-100 text-slate-900 border border-slate-300 px-2 py-0.5 rounded text-[10px] font-black">
                                {formatWarrantyText(item.warranty)}
                              </span>
                            </td>
                            <td className="p-1.5 text-right font-black text-slate-900">₹{itemTotal.toLocaleString('en-IN')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Free Gift Notification */}
                {(() => {
                  const resolved = resolveCombo();
                  if (!resolved.name) return null;
                  return (
                    <div className={`p-2 rounded-xl mb-3 text-center font-black text-[10px] uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 text-white ${
                      resolved.id === '8-item' || (resolved.id === 'auto' && netTotal >= 20000)
                        ? 'bg-gradient-to-r from-red-600 via-amber-500 to-red-600'
                        : 'bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600'
                    }`}>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>🎉 SPECIAL BONUS: INCLUDES FREE {resolved.name.toUpperCase()}</span>
                    </div>
                  );
                })()}

                {/* Summary & Totals */}
                <div className="flex items-stretch justify-between gap-3 bg-red-50/60 border-2 border-red-500/40 p-3 rounded-xl">
                  <div className="text-xs space-y-1 self-center">
                    <p className="font-black text-slate-900">Note: <span className="font-bold text-slate-700">{warrantyNote}</span></p>
                    <p className="text-[10px] text-slate-600 font-bold">• Individual warranties mentioned per component above.</p>
                    <p className="text-[10px] text-slate-600 font-bold">• All parts are 100% genuine & tested by Tech Beast.</p>
                  </div>

                  <div className="text-right space-y-1 min-w-[170px] border-l-2 border-red-200 pl-3">
                    <p className="text-xs font-bold text-slate-600">Subtotal: <span className="text-slate-900 font-extrabold">₹{subtotal.toLocaleString('en-IN')}</span></p>
                    {includeGst && (
                      <p className="text-xs font-bold text-amber-700">GST (18%): <span className="font-extrabold">+₹{gstAmount.toLocaleString('en-IN')}</span></p>
                    )}
                    <p className="text-xs font-bold text-red-600">Discount: <span className="font-extrabold">-₹{discount.toLocaleString('en-IN')}</span></p>
                    <div className="border-t-2 border-slate-900 pt-1 mt-1">
                      <p className="text-[10px] font-black uppercase text-slate-600">Net Total Amount:</p>
                      <p className="font-heading text-2xl font-black text-slate-900 leading-none">₹{netTotal.toLocaleString('en-IN')}/-</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-center border-t border-slate-200 pt-2 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
                  TECH BEAST STORE • THANK YOU FOR SHOPPING WITH US!
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- SAVED CUSTOMER QUOTATIONS LIST --- */}
      {requests.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-slate-400 space-y-4">
          <p className="text-lg font-medium text-slate-300">No custom PC requests in the database yet.</p>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Quotations are saved here automatically when a customer builds a PC on the storefront or when you generate one above.
          </p>
          <button
            onClick={() => {
              if (!showGenerator) {
                setEditingRequestId(null);
                setCustName('');
                setCustPhone('');
                setQuoteNo(getNextSerialQuoteNo(requests));
                setComponentsList(DEFAULT_COMPONENTS);
              }
              setShowGenerator(!showGenerator);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-red-600/20"
          >
            + Create First Custom Quotation
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Top Pagination Bar & Per-Page Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="text-xs text-slate-400 font-medium">
              Showing <span className="text-white font-bold">{startIndex + 1}</span> to <span className="text-white font-bold">{Math.min(startIndex + itemsPerPage, requests.length)}</span> of <span className="text-white font-bold">{requests.length}</span> quotation requests
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-300 font-bold">
              <span>Items per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 focus:outline-none focus:border-red-500 font-bold cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="grid gap-6">
            {paginatedRequests.map(request => (
            <div key={request.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col lg:flex-row gap-6">
              {/* Customer Info */}
              <div className="lg:w-1/3 space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    request.status === 'Pending' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    request.status === 'Contacted' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                    'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {request.status || 'Pending'}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {request.createdAt ? format(new Date(request.createdAt), 'PP p') : 'Unknown Date'}
                  </span>
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    {request.customerName}
                  </h3>
                  <a 
                    href={`https://wa.me/91${request.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent([
                      `Hello ${request.customerName || 'Customer'}! 👋`,
                      ``,
                      `Thank you for reaching out to *Tech Beast Hubli*! 🚀`,
                      ``,
                      `Here is your Custom PC Quotation (#${request.quoteNo || request.id}):`,
                      `💰 *Total Amount:* ₹${Number(request.finalPrice || 0).toLocaleString('en-IN')}/-`,
                      ``,
                      `📄 *View Official Online Quotation & Full Specs:*`,
                      `${window.location.origin}/quote/${request.id}`,
                      ``,
                      `Please let us know if you have any questions or when you would like to proceed with your build!`
                    ].join('\n'))}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-emerald-400 hover:text-emerald-300 text-sm flex items-center gap-2 mt-1 font-semibold"
                    title="Send WhatsApp Quotation with Online Link"
                  >
                    <Phone className="w-4 h-4 text-emerald-500" />
                    <span>{request.customerPhone}</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">📲 WhatsApp Quote</span>
                  </a>
                </div>

                <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Platform:</span>
                    <span className="font-bold text-white uppercase">{request.platform}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Subtotal:</span>
                    <span className="text-white">{formatPrice(request.subTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Discount:</span>
                    <span className="text-emerald-400">-{formatPrice(request.discountAmount)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/10">
                    <span className="text-slate-300">Total:</span>
                    <span className="text-white">{formatPrice(request.finalPrice)}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <a
                    href={`/quote/${request.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open Online Quotation
                  </a>

                  <button
                    onClick={() => handleLoadRequestIntoGenerator(request)}
                    className="w-full py-2 bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-red-600/20 flex items-center justify-center gap-1.5 uppercase tracking-wider"
                  >
                    <FileText className="w-4 h-4" /> Load into Printable PDF Generator
                  </button>

                  <div className="flex gap-2">
                    <select 
                      value={request.status || 'Pending'}
                      onChange={(e) => handleUpdateStatus(request.id, e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="Pending" className="bg-[#0d0d0e]">Pending</option>
                      <option value="Contacted" className="bg-[#0d0d0e]">Contacted</option>
                      <option value="Completed" className="bg-[#0d0d0e]">Completed</option>
                    </select>
                    <button 
                      onClick={() => handleDelete(request.id)}
                      className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/20"
                      title="Delete Request"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Components List */}
              <div className="lg:w-2/3 bg-black/20 rounded-xl border border-white/5 p-4">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Requested Build Configuration</h4>
                <div className="space-y-3">
                  {request.components?.cpu && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">CPU: <span className="text-white font-medium">{request.components.cpu.name}</span></span>
                      <span className="text-slate-400">{formatPrice(request.components.cpu.price)}</span>
                    </div>
                  )}
                  {request.components?.motherboard && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">Motherboard: <span className="text-white font-medium">{request.components.motherboard.name}</span></span>
                      <span className="text-slate-400">{formatPrice(request.components.motherboard.price)}</span>
                    </div>
                  )}
                  {request.components?.cooler && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">Cooler: <span className="text-white font-medium">{request.components.cooler.name}</span></span>
                      <span className="text-slate-400">{formatPrice(request.components.cooler.price)}</span>
                    </div>
                  )}
                  {request.components?.ram && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">RAM: <span className="text-white font-medium">{request.components.ram.name} (x{request.components.ram.qty})</span></span>
                      <span className="text-slate-400">{formatPrice(request.components.ram.price * request.components.ram.qty)}</span>
                    </div>
                  )}
                  {request.components?.gpu && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">GPU: <span className="text-white font-medium">{request.components.gpu.name}</span></span>
                      <span className="text-slate-400">{formatPrice(request.components.gpu.price)}</span>
                    </div>
                  )}
                  {request.components?.ssd && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">SSD: <span className="text-white font-medium">{request.components.ssd.name}</span></span>
                      <span className="text-slate-400">{formatPrice(request.components.ssd.price)}</span>
                    </div>
                  )}
                  {request.components?.secStorage && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">HDD/SSD 2: <span className="text-white font-medium">{request.components.secStorage.name}</span></span>
                      <span className="text-slate-400">{formatPrice(request.components.secStorage.price)}</span>
                    </div>
                  )}
                  {request.components?.psu && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">PSU: <span className="text-white font-medium">{request.components.psu.name}</span></span>
                      <span className="text-slate-400">{formatPrice(request.components.psu.price)}</span>
                    </div>
                  )}
                  {request.components?.cabinet && (
                    <div className="flex justify-between text-sm border-b border-white/5 pb-3">
                      <span className="text-slate-300">Cabinet: <span className="text-white font-medium">{request.components.cabinet.name}</span></span>
                      <span className="text-slate-400">{formatPrice(request.components.cabinet.price)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          </div>

          {/* Bottom Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 mt-6 text-xs font-bold text-slate-300">
              <div>
                Page <span className="text-white font-extrabold">{currentPage}</span> of <span className="text-white font-extrabold">{totalPages}</span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="px-3.5 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 rounded-xl transition text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-xl border transition cursor-pointer font-bold ${
                      currentPage === pageNum
                        ? 'bg-red-600 border-red-500 text-white font-extrabold shadow-lg shadow-red-600/30'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="px-3.5 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 rounded-xl transition text-white flex items-center gap-1.5 cursor-pointer"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- BOTTOM-RIGHT TOAST NOTIFICATION --- */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border-2 border-emerald-500/80 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce-short backdrop-blur-lg">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold font-sans tracking-wide">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-3 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
