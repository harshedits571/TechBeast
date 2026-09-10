import { useState, useEffect, useRef } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, query, orderBy, limit, setDoc, onSnapshot } from 'firebase/firestore';
import { Trash2, ExternalLink, Calendar, Phone, User, Cpu, RotateCw, FileText, Send, Printer, Plus, Sparkles, X, Save, CheckCircle, ChevronLeft, ChevronRight, Layers, Zap, Eye, Edit3, Columns, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { useSettings, CustomBuildPreset } from '../../contexts/SettingsContext';
import {
  PROCESSOR_LINEUPS,
  INTEL_GENS,
  AMD_GENS,
  PROCESSOR_CATALOG,
  MOTHERBOARD_PLATFORMS,
  MOTHERBOARD_CATALOG,
  RAM_SIZES,
  RAM_TYPES,
  RAM_CATALOG,
  STORAGE_TYPES,
  STORAGE_SIZES,
  STORAGE_CATALOG,
  GPU_SERIES,
  GPU_CATALOG,
  SMPS_CATALOG,
  CABINET_CATALOG,
  COOLER_CATALOG,
  MONITOR_CATALOG,
  PERIPHERAL_CATALOG,
  PresetItem,
  formatWarrantyText
} from '../../data/componentPresets';

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
  qty: number | string;
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

function ComponentRowCard({
  item,
  idx,
  updateComp,
  updateCompMultiple,
  removeComponentRow
}: {
  item: ComponentRow;
  idx: number;
  updateComp: (index: number, field: keyof ComponentRow, value: any) => void;
  updateCompMultiple: (index: number, updates: Partial<ComponentRow>) => void;
  removeComponentRow: (index: number) => void;
}) {
  // Processor states
  const [cpuLineup, setCpuLineup] = useState<string>('Core i5');
  const [cpuGen, setCpuGen] = useState<string>('12th Gen');

  // Motherboard state
  const [moboPlatform, setMoboPlatform] = useState<string>('LGA1700 (12/13/14th Gen)');

  // RAM state
  const [ramType, setRamType] = useState<string>('DDR4 (3200MHz)');
  const [ramSize, setRamSize] = useState<string>('16GB (8x2)');

  // Storage state
  const [storageType, setStorageType] = useState<string>('M.2 NVMe Gen4');
  const [storageSize, setStorageSize] = useState<string>('1TB');

  // GPU state
  const [gpuSeries, setGpuSeries] = useState<string>('RTX 40-Series');

  // Synchronize dropdown selectors when item.desc changes (e.g. build presets or loaded quotes)
  useEffect(() => {
    if (!item.desc) return;

    // Detect CPU
    for (const l of PROCESSOR_LINEUPS) {
      if (item.desc.includes(l)) {
        setCpuLineup(l);
        const isAmd = l.startsWith('Ryzen');
        const gens = isAmd ? AMD_GENS : INTEL_GENS;
        for (const g of gens) {
          const key = g.split(' ')[0];
          if (item.desc.includes(g) || item.desc.includes(key)) {
            setCpuGen(g);
            break;
          }
        }
        break;
      }
    }

    // Detect Motherboard
    for (const p of MOTHERBOARD_PLATFORMS) {
      const code = p.split(' ')[0];
      if (item.desc.includes(code)) {
        setMoboPlatform(p);
        break;
      }
    }

    // Detect RAM
    if (item.desc.includes('DDR5')) setRamType('DDR5 (5600/6000MHz)');
    else if (item.desc.includes('DDR3')) setRamType('DDR3 (1600MHz)');
    else if (item.desc.includes('DDR4')) setRamType('DDR4 (3200MHz)');

    if (item.desc.includes('64GB')) setRamSize('64GB (32x2)');
    else if (item.desc.includes('32GB') || item.desc.includes('16x2')) setRamSize('32GB (16x2)');
    else if (item.desc.includes('8x2')) setRamSize('16GB (8x2)');
    else if (item.desc.includes('16GB Single')) setRamSize('16GB Single');
    else if (item.desc.includes('8GB')) setRamSize('8GB');
    else if (item.desc.includes('4GB')) setRamSize('4GB');

    // Detect Storage
    if (item.category === 'Secondary Storage' || item.desc.toLowerCase().includes('hard drive') || item.desc.toLowerCase().includes('hdd')) {
      setStorageType('Hard Disk (HDD)');
    } else if (item.desc.includes('Gen4') || item.desc.includes('PCIe 4.0') || item.desc.includes('980 PRO') || item.desc.includes('990 PRO') || item.desc.includes('NV2') || item.desc.includes('P3 Plus')) {
      setStorageType('M.2 NVMe Gen4');
    } else if (item.desc.includes('SATA') || item.desc.includes('BX500') || item.desc.includes('2.5"')) {
      setStorageType('2.5" SATA SSD');
    } else if (item.desc.includes('NVMe')) {
      setStorageType('M.2 NVMe Gen3');
    }

    if (item.desc.includes('4TB')) setStorageSize('4TB');
    else if (item.desc.includes('2TB')) setStorageSize('2TB');
    else if (item.desc.includes('1TB')) setStorageSize('1TB');
    else if (item.desc.includes('512GB') || item.desc.includes('500GB')) setStorageSize('512GB');
    else if (item.desc.includes('256GB') || item.desc.includes('320GB')) setStorageSize('256GB');
    else if (item.desc.includes('128GB') || item.desc.includes('160GB')) setStorageSize('128GB');

    // Detect GPU
    if (item.desc.includes('RTX 40') || item.desc.includes('4060') || item.desc.includes('4070') || item.desc.includes('4080') || item.desc.includes('4090')) {
      setGpuSeries('RTX 40-Series');
    } else if (item.desc.includes('RTX 30') || item.desc.includes('3050') || item.desc.includes('3060') || item.desc.includes('GTX') || item.desc.includes('GT 7') || item.desc.includes('GT 10')) {
      setGpuSeries('RTX 30-Series / GTX');
    } else if (item.desc.includes('Radeon') || item.desc.includes('RX ')) {
      setGpuSeries('AMD Radeon RX');
    } else if (item.desc.toLowerCase().includes('integrated') || item.desc.toLowerCase().includes('uhd')) {
      setGpuSeries('Integrated Graphics');
    }
  }, [item.desc, item.category]);

  const handleApplyPreset = (preset: PresetItem) => {
    updateCompMultiple(idx, {
      desc: preset.name,
      price: preset.price,
      warranty: preset.warranty
    });
  };

  const isCpu = item.category === 'Processor (CPU)';
  const isMobo = item.category === 'Motherboard';
  const isRam = item.category === 'RAM Memory';
  const isStorage = item.category === 'SSD Storage' || item.category === 'Secondary Storage';
  const isGpu = item.category === 'Graphics Card';
  const isPsu = item.category === 'SMPS (Power Supply)';
  const isCabinet = item.category === 'Cabinet / Case';
  const isCooler = item.category === 'CPU Cooler';
  const isMonitor = item.category === 'Monitor';
  const isPeripheral = item.category === 'Peripherals & Accessories';

  // Handler for CPU Lineup
  const handleCpuLineupChange = (newLineup: string) => {
    setCpuLineup(newLineup);
    const isAmd = newLineup.startsWith('Ryzen');
    const availableGens = isAmd ? AMD_GENS : INTEL_GENS;
    
    let nextGen = availableGens.includes(cpuGen) ? cpuGen : (isAmd ? '5000 Series' : '12th Gen');
    const catalogForLine = PROCESSOR_CATALOG[newLineup] || {};
    if (!catalogForLine[nextGen] || catalogForLine[nextGen].length === 0) {
      const availableKeys = Object.keys(catalogForLine);
      if (availableKeys.length > 0) {
        nextGen = availableKeys[0];
      }
    }
    setCpuGen(nextGen);

    const models = catalogForLine[nextGen] || [];
    if (models.length > 0) {
      handleApplyPreset(models[0]);
    }
  };

  // Handler for CPU Gen
  const handleCpuGenChange = (newGen: string) => {
    setCpuGen(newGen);
    const models = PROCESSOR_CATALOG[cpuLineup]?.[newGen] || [];
    if (models.length > 0) {
      handleApplyPreset(models[0]);
    }
  };

  // Handler for CPU Model Select
  const handleCpuModelChange = (modelName: string) => {
    if (!modelName) return;
    const models = PROCESSOR_CATALOG[cpuLineup]?.[cpuGen] || [];
    const selected = models.find(m => m.name === modelName);
    if (selected) {
      handleApplyPreset(selected);
    }
  };

  // Handler for Motherboard
  const handleMoboPlatformChange = (newPlatform: string) => {
    setMoboPlatform(newPlatform);
    const models = MOTHERBOARD_CATALOG[newPlatform] || [];
    if (models.length > 0) {
      handleApplyPreset(models[0]);
    }
  };

  const handleMoboModelChange = (modelName: string) => {
    if (!modelName) return;
    const models = MOTHERBOARD_CATALOG[moboPlatform] || [];
    const selected = models.find(m => m.name === modelName);
    if (selected) {
      handleApplyPreset(selected);
    }
  };

  // Handler for RAM
  const handleRamTypeChange = (newType: string) => {
    setRamType(newType);
    const models = RAM_CATALOG[newType]?.[ramSize] || [];
    if (models.length > 0) {
      handleApplyPreset(models[0]);
    }
  };

  const handleRamSizeChange = (newSize: string) => {
    setRamSize(newSize);
    const models = RAM_CATALOG[ramType]?.[newSize] || [];
    if (models.length > 0) {
      handleApplyPreset(models[0]);
    }
  };

  const handleRamModelChange = (modelName: string) => {
    if (!modelName) return;
    const models = RAM_CATALOG[ramType]?.[ramSize] || [];
    const selected = models.find(m => m.name === modelName);
    if (selected) {
      handleApplyPreset(selected);
    }
  };

  // Handler for Storage
  const handleStorageTypeChange = (newType: string) => {
    setStorageType(newType);
    const models = STORAGE_CATALOG[newType]?.[storageSize] || [];
    if (models.length > 0) {
      handleApplyPreset(models[0]);
    }
  };

  const handleStorageSizeChange = (newSize: string) => {
    setStorageSize(newSize);
    const models = STORAGE_CATALOG[storageType]?.[newSize] || [];
    if (models.length > 0) {
      handleApplyPreset(models[0]);
    }
  };

  const handleStorageModelChange = (modelName: string) => {
    if (!modelName) return;
    const models = STORAGE_CATALOG[storageType]?.[storageSize] || [];
    const selected = models.find(m => m.name === modelName);
    if (selected) {
      handleApplyPreset(selected);
    }
  };

  // Handler for GPU
  const handleGpuSeriesChange = (newSeries: string) => {
    setGpuSeries(newSeries);
    const models = GPU_CATALOG[newSeries] || [];
    if (models.length > 0) {
      handleApplyPreset(models[0]);
    }
  };

  const handleGpuModelChange = (modelName: string) => {
    if (!modelName) return;
    const models = GPU_CATALOG[gpuSeries] || [];
    const selected = models.find(m => m.name === modelName);
    if (selected) {
      handleApplyPreset(selected);
    }
  };

  // Generic Catalog Handler (SMPS, Cabinet, Cooler, Monitor, Peripherals)
  const handleGenericCatalogSelect = (catalog: PresetItem[], modelName: string) => {
    if (!modelName) return;
    const selected = catalog.find(m => m.name === modelName);
    if (selected) {
      handleApplyPreset(selected);
    }
  };

  return (
    <div className="bg-slate-900/95 p-3 sm:p-4 rounded-2xl border border-slate-700/80 space-y-3 shadow-md hover:border-slate-600 transition-colors w-full min-w-0 overflow-hidden">
      {/* Top Bar: Category Selector + Qty + Warranty + Delete */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        {/* Row 1 on mobile: Number + Category Selector + Delete Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto sm:flex-1 min-w-0">
          <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 shrink-0">
            #{idx + 1}
          </span>
          <select
            value={item.category}
            onChange={(e) => updateComp(idx, 'category', e.target.value)}
            className="bg-slate-800 border border-slate-700 text-amber-300 font-extrabold rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-400 flex-1 min-w-0 truncate cursor-pointer"
          >
            <option value="Processor (CPU)">⚡ Processor (CPU)</option>
            <option value="Motherboard">🔌 Motherboard</option>
            <option value="RAM Memory">🧠 RAM Memory</option>
            <option value="SSD Storage">💾 SSD Storage</option>
            <option value="Secondary Storage">💽 Secondary Storage (HDD)</option>
            <option value="Graphics Card">🎮 Graphics Card (GPU)</option>
            <option value="SMPS (Power Supply)">🔋 SMPS (Power Supply)</option>
            <option value="Cabinet / Case">🖥️ Cabinet / Case</option>
            <option value="CPU Cooler">❄️ CPU Cooler</option>
            <option value="Monitor">📺 Monitor Display</option>
            <option value="Peripherals & Accessories">⌨️ Peripherals / Accessories</option>
            <option value="Custom Part">✨ Custom Part</option>
          </select>
          {/* Mobile-only delete button */}
          <button
            type="button"
            onClick={() => removeComponentRow(idx)}
            className="sm:hidden text-red-400 hover:text-white hover:bg-red-600/40 p-1.5 rounded-lg transition cursor-pointer shrink-0"
            title="Delete Row"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Row 2 on mobile / Right side on desktop: Qty + Warranty + Delete (desktop) */}
        <div className="flex items-center justify-between sm:justify-end gap-2 text-xs w-full sm:w-auto shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              <span className="text-slate-400 font-bold text-[10px] uppercase">Qty</span>
              <input
                type="number"
                min="1"
                value={item.qty}
                onChange={(e) => updateComp(idx, 'qty', e.target.value)}
                className="w-9 bg-transparent text-center text-white font-bold text-xs focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              <span className="text-slate-400 font-bold text-[10px] uppercase">War</span>
              <input
                type="text"
                value={item.warranty}
                onChange={(e) => updateComp(idx, 'warranty', e.target.value)}
                className="w-12 bg-transparent text-center text-amber-300 font-bold text-xs focus:outline-none"
                placeholder="3 Yrs"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => removeComponentRow(idx)}
            className="hidden sm:block text-red-400 hover:text-white hover:bg-red-600/40 p-1.5 rounded-lg transition cursor-pointer shrink-0"
            title="Delete Row"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modular Presets Selector Sections */}
      {/* 1. Processor (CPU) Section */}
      {isCpu && (
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 space-y-2 min-w-0">
          {/* Row 1: Lineup & Gen in 2 columns */}
          <div className="grid grid-cols-2 gap-2">
            <div className="min-w-0">
              <label className="block text-[9px] font-extrabold text-amber-400 uppercase tracking-wider mb-1 truncate">
                Processor Line
              </label>
              <select
                value={cpuLineup}
                onChange={(e) => handleCpuLineupChange(e.target.value)}
                className="w-full max-w-full truncate bg-slate-800 border border-slate-700 hover:border-slate-600 text-amber-300 font-bold text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {PROCESSOR_LINEUPS.map((lineup) => (
                  <option key={lineup} value={lineup}>{lineup}</option>
                ))}
              </select>
            </div>

            <div className="min-w-0">
              <label className="block text-[9px] font-extrabold text-amber-400 uppercase tracking-wider mb-1 truncate">
                Processor Gen
              </label>
              <select
                value={cpuGen}
                onChange={(e) => handleCpuGenChange(e.target.value)}
                className="w-full max-w-full truncate bg-slate-800 border border-slate-700 hover:border-slate-600 text-amber-300 font-bold text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {(cpuLineup.startsWith('Ryzen') ? AMD_GENS : INTEL_GENS).map((gen) => (
                  <option key={gen} value={gen}>{gen}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Full Width Model / Variant Selector */}
          <div className="min-w-0">
            <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Model / Variant Preset</span>
              <span className="text-amber-400 font-normal text-[9px]">• Auto-fills specs & price</span>
            </label>
            <select
              value={(PROCESSOR_CATALOG[cpuLineup]?.[cpuGen] || []).find(m => m.name === item.desc)?.name || ""}
              onChange={(e) => handleCpuModelChange(e.target.value)}
              className="w-full max-w-full truncate bg-slate-800 border border-amber-500/50 hover:border-amber-400 text-amber-300 font-bold text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="">⚡ Select {cpuLineup} ({cpuGen}) Model...</option>
              {(PROCESSOR_CATALOG[cpuLineup]?.[cpuGen] || []).map((p, pIdx) => (
                <option key={pIdx} value={p.name}>
                  {p.name} — ₹{p.price.toLocaleString('en-IN')} ({formatWarrantyText(p.warranty)})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 2. Motherboard Section */}
      {isMobo && (
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 space-y-2 min-w-0">
          <div className="min-w-0">
            <label className="block text-[9px] font-extrabold text-amber-400 uppercase tracking-wider mb-1 truncate">
              CPU Socket / Platform
            </label>
            <select
              value={moboPlatform}
              onChange={(e) => handleMoboPlatformChange(e.target.value)}
              className="w-full max-w-full truncate bg-slate-800 border border-slate-700 hover:border-slate-600 text-amber-300 font-bold text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              {MOTHERBOARD_PLATFORMS.map((plat) => (
                <option key={plat} value={plat}>{plat}</option>
              ))}
            </select>
          </div>

          <div className="min-w-0">
            <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Motherboard Model Preset</span>
              <span className="text-amber-400 font-normal text-[9px]">• Auto-fills specs & price</span>
            </label>
            <select
              value={(MOTHERBOARD_CATALOG[moboPlatform] || []).find(m => m.name === item.desc)?.name || ""}
              onChange={(e) => handleMoboModelChange(e.target.value)}
              className="w-full max-w-full truncate bg-slate-800 border border-amber-500/50 hover:border-amber-400 text-amber-300 font-bold text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="">⚡ Select Motherboard Model...</option>
              {(MOTHERBOARD_CATALOG[moboPlatform] || []).map((p, pIdx) => (
                <option key={pIdx} value={p.name}>
                  {p.name} — ₹{p.price.toLocaleString('en-IN')} ({formatWarrantyText(p.warranty)})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 3. RAM Section */}
      {isRam && (
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 space-y-2 min-w-0">
          <div className="grid grid-cols-2 gap-2">
            <div className="min-w-0">
              <label className="block text-[9px] font-extrabold text-amber-400 uppercase tracking-wider mb-1 truncate">
                RAM Type
              </label>
              <select
                value={ramType}
                onChange={(e) => handleRamTypeChange(e.target.value)}
                className="w-full max-w-full truncate bg-slate-800 border border-slate-700 hover:border-slate-600 text-amber-300 font-bold text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {RAM_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="min-w-0">
              <label className="block text-[9px] font-extrabold text-amber-400 uppercase tracking-wider mb-1 truncate">
                Capacity / Kit
              </label>
              <select
                value={ramSize}
                onChange={(e) => handleRamSizeChange(e.target.value)}
                className="w-full max-w-full truncate bg-slate-800 border border-slate-700 hover:border-slate-600 text-amber-300 font-bold text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {RAM_SIZES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="min-w-0">
            <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Brand / Kit Preset</span>
              <span className="text-amber-400 font-normal text-[9px]">• Auto-fills specs & price</span>
            </label>
            <select
              value={(RAM_CATALOG[ramType]?.[ramSize] || []).find(m => m.name === item.desc)?.name || ""}
              onChange={(e) => handleRamModelChange(e.target.value)}
              className="w-full max-w-full truncate bg-slate-800 border border-amber-500/50 hover:border-amber-400 text-amber-300 font-bold text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="">⚡ Select {ramSize} ({ramType}) Model...</option>
              {(RAM_CATALOG[ramType]?.[ramSize] || []).map((p, pIdx) => (
                <option key={pIdx} value={p.name}>
                  {p.name} — ₹{p.price.toLocaleString('en-IN')} ({formatWarrantyText(p.warranty)})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 4. Storage Section */}
      {isStorage && (
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 space-y-2 min-w-0">
          <div className="grid grid-cols-2 gap-2">
            <div className="min-w-0">
              <label className="block text-[9px] font-extrabold text-amber-400 uppercase tracking-wider mb-1 truncate">
                Storage Type
              </label>
              <select
                value={storageType}
                onChange={(e) => handleStorageTypeChange(e.target.value)}
                className="w-full max-w-full truncate bg-slate-800 border border-slate-700 hover:border-slate-600 text-amber-300 font-bold text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {STORAGE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="min-w-0">
              <label className="block text-[9px] font-extrabold text-amber-400 uppercase tracking-wider mb-1 truncate">
                Capacity
              </label>
              <select
                value={storageSize}
                onChange={(e) => handleStorageSizeChange(e.target.value)}
                className="w-full max-w-full truncate bg-slate-800 border border-slate-700 hover:border-slate-600 text-amber-300 font-bold text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {STORAGE_SIZES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="min-w-0">
            <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Storage Model Preset</span>
              <span className="text-amber-400 font-normal text-[9px]">• Auto-fills specs & price</span>
            </label>
            <select
              value={(STORAGE_CATALOG[storageType]?.[storageSize] || []).find(m => m.name === item.desc)?.name || ""}
              onChange={(e) => handleStorageModelChange(e.target.value)}
              className="w-full max-w-full truncate bg-slate-800 border border-amber-500/50 hover:border-amber-400 text-amber-300 font-bold text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="">⚡ Select {storageSize} ({storageType}) Model...</option>
              {(STORAGE_CATALOG[storageType]?.[storageSize] || []).map((p, pIdx) => (
                <option key={pIdx} value={p.name}>
                  {p.name} — ₹{p.price.toLocaleString('en-IN')} ({formatWarrantyText(p.warranty)})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 5. GPU Section */}
      {isGpu && (
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 space-y-2 min-w-0">
          <div className="min-w-0">
            <label className="block text-[9px] font-extrabold text-amber-400 uppercase tracking-wider mb-1 truncate">
              GPU Series / Category
            </label>
            <select
              value={gpuSeries}
              onChange={(e) => handleGpuSeriesChange(e.target.value)}
              className="w-full max-w-full truncate bg-slate-800 border border-slate-700 hover:border-slate-600 text-amber-300 font-bold text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              {GPU_SERIES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="min-w-0">
            <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Graphics Card Model Preset</span>
              <span className="text-amber-400 font-normal text-[9px]">• Auto-fills specs & price</span>
            </label>
            <select
              value={(GPU_CATALOG[gpuSeries] || []).find(m => m.name === item.desc)?.name || ""}
              onChange={(e) => handleGpuModelChange(e.target.value)}
              className="w-full max-w-full truncate bg-slate-800 border border-amber-500/50 hover:border-amber-400 text-amber-300 font-bold text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="">⚡ Select {gpuSeries} GPU Model...</option>
              {(GPU_CATALOG[gpuSeries] || []).map((p, pIdx) => (
                <option key={pIdx} value={p.name}>
                  {p.name} — ₹{p.price.toLocaleString('en-IN')} ({formatWarrantyText(p.warranty)})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 6. SMPS Section */}
      {isPsu && (
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 min-w-0">
          <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Power Supply (SMPS) Preset</span>
            <span className="text-amber-400 font-normal text-[9px]">• Auto-fills specs & price</span>
          </label>
          <select
            value={SMPS_CATALOG.find(m => m.name === item.desc)?.name || ""}
            onChange={(e) => handleGenericCatalogSelect(SMPS_CATALOG, e.target.value)}
            className="w-full max-w-full truncate bg-slate-800 border border-amber-500/50 hover:border-amber-400 text-amber-300 font-bold text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="">⚡ Select SMPS Model & Wattage...</option>
            {SMPS_CATALOG.map((p, pIdx) => (
              <option key={pIdx} value={p.name}>
                {p.name} — ₹{p.price.toLocaleString('en-IN')} ({formatWarrantyText(p.warranty)})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 7. Cabinet Section */}
      {isCabinet && (
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 min-w-0">
          <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Cabinet / Case Style Preset</span>
            <span className="text-amber-400 font-normal text-[9px]">• Auto-fills specs & price</span>
          </label>
          <select
            value={CABINET_CATALOG.find(m => m.name === item.desc)?.name || ""}
            onChange={(e) => handleGenericCatalogSelect(CABINET_CATALOG, e.target.value)}
            className="w-full max-w-full truncate bg-slate-800 border border-amber-500/50 hover:border-amber-400 text-amber-300 font-bold text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="">⚡ Select Cabinet Style & Model...</option>
            {CABINET_CATALOG.map((p, pIdx) => (
              <option key={pIdx} value={p.name}>
                {p.name} — ₹{p.price.toLocaleString('en-IN')} ({formatWarrantyText(p.warranty)})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 8. Cooler Section */}
      {isCooler && (
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 min-w-0">
          <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>CPU Cooler / Liquid AIO Preset</span>
            <span className="text-amber-400 font-normal text-[9px]">• Auto-fills specs & price</span>
          </label>
          <select
            value={COOLER_CATALOG.find(m => m.name === item.desc)?.name || ""}
            onChange={(e) => handleGenericCatalogSelect(COOLER_CATALOG, e.target.value)}
            className="w-full max-w-full truncate bg-slate-800 border border-amber-500/50 hover:border-amber-400 text-amber-300 font-bold text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="">⚡ Select CPU Cooler / AIO...</option>
            {COOLER_CATALOG.map((p, pIdx) => (
              <option key={pIdx} value={p.name}>
                {p.name} — ₹{p.price.toLocaleString('en-IN')} ({formatWarrantyText(p.warranty)})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 9. Monitor Section */}
      {isMonitor && (
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 min-w-0">
          <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Monitor Display Preset</span>
            <span className="text-amber-400 font-normal text-[9px]">• Auto-fills specs & price</span>
          </label>
          <select
            value={MONITOR_CATALOG.find(m => m.name === item.desc)?.name || ""}
            onChange={(e) => handleGenericCatalogSelect(MONITOR_CATALOG, e.target.value)}
            className="w-full max-w-full truncate bg-slate-800 border border-amber-500/50 hover:border-amber-400 text-amber-300 font-bold text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="">⚡ Select Monitor Display...</option>
            {MONITOR_CATALOG.map((p, pIdx) => (
              <option key={pIdx} value={p.name}>
                {p.name} — ₹{p.price.toLocaleString('en-IN')} ({formatWarrantyText(p.warranty)})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 10. Peripherals Section */}
      {isPeripheral && (
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 min-w-0">
          <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Peripheral & Accessory Preset</span>
            <span className="text-amber-400 font-normal text-[9px]">• Auto-fills specs & price</span>
          </label>
          <select
            value={PERIPHERAL_CATALOG.find(m => m.name === item.desc)?.name || ""}
            onChange={(e) => handleGenericCatalogSelect(PERIPHERAL_CATALOG, e.target.value)}
            className="w-full max-w-full truncate bg-slate-800 border border-amber-500/50 hover:border-amber-400 text-amber-300 font-bold text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="">⚡ Select Peripheral / Keyboard / Mouse / WiFi...</option>
            {PERIPHERAL_CATALOG.map((p, pIdx) => (
              <option key={pIdx} value={p.name}>
                {p.name} — ₹{p.price.toLocaleString('en-IN')} ({formatWarrantyText(p.warranty)})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Editable Component Description & Price Fields */}
      <div className="space-y-1.5 pt-1 min-w-0">
        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-0.5">
          <label className="block text-[10px] font-extrabold text-slate-300 uppercase tracking-wider">
            Description & Specs (Editable)
          </label>
          <span className="text-[9px] text-slate-500">Auto-filled from presets or custom details</span>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            value={item.desc}
            onChange={(e) => updateComp(idx, 'desc', e.target.value)}
            className="flex-1 min-w-0 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-amber-400 placeholder-slate-500 shadow-inner"
            placeholder="Selected preset specs or type custom model / warranty..."
          />
          <div className="relative w-full sm:w-36 shrink-0">
            <span className="absolute left-3.5 top-2 text-xs text-amber-400 font-black">₹</span>
            <input
              type="number"
              value={item.price}
              onChange={(e) => updateComp(idx, 'price', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3.5 py-2 text-amber-400 font-black font-mono text-xs text-right focus:outline-none focus:border-amber-400 placeholder-slate-500 shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

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

  const { settings, updateSettings } = useSettings();

  // Generator Modal State
  const [showGenerator, setShowGenerator] = useState(false);
  const [generatorViewMode, setGeneratorViewMode] = useState<'editor' | 'preview' | 'split'>('editor');
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [quoteNo, setQuoteNo] = useState(`TB-${new Date().getFullYear()}-1001`);
  const [quoteDate, setQuoteDate] = useState(format(new Date(), 'dd/MM/yyyy'));
  const [discount, setDiscount] = useState<number>(0);
  const [warrantyNote, setWarrantyNote] = useState('Prices Valid For 2 Days');
  const [includeGst, setIncludeGst] = useState(true);
  const [componentsList, setComponentsList] = useState<ComponentRow[]>(DEFAULT_COMPONENTS);
  const [selectedComboId, setSelectedComboId] = useState<string>('auto');
  const [bonusTitle, setBonusTitle] = useState<string>('8-Item Mega Tech Beast Accessories Pack');
  const [bonusItems, setBonusItems] = useState<string>('Gaming Mouse, Keyboard, RGB Mousepad, Headset, WiFi Dongle, HDMI/Power Cable, Cleaner Kit, Gaming Stickers');
  const [isSavingPreset, setIsSavingPreset] = useState<boolean>(false);
  const [showSaveBuildPresetModal, setShowSaveBuildPresetModal] = useState<boolean>(false);
  const [newBuildPresetName, setNewBuildPresetName] = useState<string>('');
  const [newBuildPresetIcon, setNewBuildPresetIcon] = useState<string>('🖥️');
  const [isSavingBuildPreset, setIsSavingBuildPreset] = useState<boolean>(false);

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
    setLoading(true);
    const q = query(collection(db, 'custom_pc_requests'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
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
      setLoading(false);
    }, (error) => {
      console.error("Error subscribing to custom_pc_requests:", error);
      setLoading(false);
    });

    return () => unsubscribe();
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
    const q = Number(item.qty) || 1;
    return acc + q * p;
  }, 0);

  const gstAmount = includeGst ? Math.round(subtotal * 0.18) : 0;
  const netTotal = Math.max(0, subtotal + gstAmount - discount);

  // Helper to resolve the selected combo
  const resolveCombo = () => {
    if (selectedComboId === 'none' || !bonusTitle.trim()) {
      return { id: 'none', name: '', items: [] };
    }
    const itemsArr = bonusItems ? bonusItems.split(',').map(s => s.trim()).filter(Boolean) : [];
    return {
      id: selectedComboId,
      name: bonusTitle.trim(),
      items: itemsArr
    };
  };

  // Combo Selection Handler
  const handleComboSelect = (id: string) => {
    setSelectedComboId(id);
    if (id === 'none') {
      setBonusTitle('');
      setBonusItems('');
    } else if (id === '8-item') {
      setBonusTitle('8-Item Mega Tech Beast Accessories Pack');
      setBonusItems('Gaming Mouse, Keyboard, RGB Mousepad, Headset, WiFi Dongle, HDMI/Power Cable, Cleaner Kit, Gaming Stickers');
    } else if (id === '4-item') {
      setBonusTitle('4-Item Essential Tech Beast Accessories Pack');
      setBonusItems('Mousepad, WiFi USB Adapter, Power Cable, Cleaning Kit');
    } else if (id === 'auto') {
      if (netTotal >= 20000) {
        setBonusTitle('8-Item Mega Tech Beast Accessories Pack');
        setBonusItems('Gaming Mouse, Keyboard, RGB Mousepad, Headset, WiFi Dongle, HDMI/Power Cable, Cleaner Kit, Gaming Stickers');
      } else {
        setBonusTitle('4-Item Essential Tech Beast Accessories Pack');
        setBonusItems('Mousepad, WiFi USB Adapter, Power Cable, Cleaning Kit');
      }
    } else if (id === 'custom') {
      // Keep existing custom values or allow immediate typing
    } else {
      const found = settings.accessoryCombos?.find(c => c.id === id);
      if (found) {
        setBonusTitle(found.name);
        setBonusItems(found.items?.join(', ') || '');
      }
    }
  };

  // Save current custom bonus as a reusable preset
  const handleSaveAsPreset = async () => {
    if (!bonusTitle.trim()) {
      showToast("Please enter a bonus title to save as preset");
      return;
    }
    setIsSavingPreset(true);
    try {
      const newId = 'combo_' + Date.now();
      const itemsArr = bonusItems.split(',').map(s => s.trim()).filter(Boolean);
      const newPreset = {
        id: newId,
        name: bonusTitle.trim(),
        items: itemsArr
      };
      const currentCombos = settings.accessoryCombos || [];
      const updatedCombos = [...currentCombos, newPreset];
      await updateSettings({ accessoryCombos: updatedCombos });
      setSelectedComboId(newId);
      showToast(`Preset "${bonusTitle.trim()}" saved successfully!`);
    } catch (err) {
      console.error("Error saving preset:", err);
      showToast("Failed to save preset");
    } finally {
      setIsSavingPreset(false);
    }
  };

  // Delete a saved custom preset
  const handleDeletePreset = async (presetId: string, presetName: string) => {
    if (!window.confirm(`Delete preset "${presetName}"?`)) return;
    try {
      const currentCombos = settings.accessoryCombos || [];
      const updatedCombos = currentCombos.filter(c => c.id !== presetId);
      await updateSettings({ accessoryCombos: updatedCombos });
      setSelectedComboId('auto');
      if (netTotal >= 20000) {
        setBonusTitle('8-Item Mega Tech Beast Accessories Pack');
        setBonusItems('Gaming Mouse, Keyboard, RGB Mousepad, Headset, WiFi Dongle, HDMI/Power Cable, Cleaner Kit, Gaming Stickers');
      } else {
        setBonusTitle('4-Item Essential Tech Beast Accessories Pack');
        setBonusItems('Mousepad, WiFi USB Adapter, Power Cable, Cleaning Kit');
      }
      showToast(`Preset "${presetName}" deleted`);
    } catch (err) {
      console.error("Error deleting preset:", err);
      showToast("Failed to delete preset");
    }
  };

  // Pagination computations
  const totalPages = Math.ceil(requests.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRequests = requests.slice(startIndex, startIndex + itemsPerPage);

  // Component row handlers
  const updateComp = (idx: number, field: keyof ComponentRow, value: any) => {
    setComponentsList(prev => {
      const updated = [...prev];
      if (!updated[idx]) return prev;
      if (field === 'price' || field === 'qty') {
        updated[idx] = {
          ...updated[idx],
          [field]: value === '' ? '' : (parseFloat(value) || 0)
        };
      } else {
        updated[idx] = {
          ...updated[idx],
          [field]: value
        };
      }
      return updated;
    });
  };

  const updateCompMultiple = (idx: number, updates: Partial<ComponentRow>) => {
    setComponentsList(prev => {
      const updated = [...prev];
      if (!updated[idx]) return prev;
      updated[idx] = {
        ...updated[idx],
        ...updates
      };
      return updated;
    });
  };

  const addComponentRow = () => {
    setComponentsList([...componentsList, { category: "Custom Part", desc: "", qty: 1, warranty: "1", price: "" }]);
  };

  const addSpecificComponentRow = (category: string) => {
    let desc = "";
    let price: number | string = "";
    let warranty = "3";

    if (category === 'Processor (CPU)') {
      const first = PROCESSOR_CATALOG['Core i5']?.['12th Gen']?.[0];
      if (first) { desc = first.name; price = first.price; warranty = first.warranty; }
    } else if (category === 'Motherboard') {
      const first = MOTHERBOARD_CATALOG['LGA1700 (12/13/14th Gen)']?.[0];
      if (first) { desc = first.name; price = first.price; warranty = first.warranty; }
    } else if (category === 'RAM Memory') {
      const first = RAM_CATALOG['DDR4 (3200MHz)']?.['16GB (8x2)']?.[0];
      if (first) { desc = first.name; price = first.price; warranty = first.warranty; }
    } else if (category === 'SSD Storage') {
      const first = STORAGE_CATALOG['M.2 NVMe Gen4']?.['1TB']?.[0];
      if (first) { desc = first.name; price = first.price; warranty = first.warranty; }
    } else if (category === 'Graphics Card') {
      const first = GPU_CATALOG['RTX 40-Series']?.[0];
      if (first) { desc = first.name; price = first.price; warranty = first.warranty; }
    } else if (category === 'SMPS (Power Supply)') {
      const first = SMPS_CATALOG[3];
      if (first) { desc = first.name; price = first.price; warranty = first.warranty; }
    } else if (category === 'Cabinet / Case') {
      const first = CABINET_CATALOG[1];
      if (first) { desc = first.name; price = first.price; warranty = first.warranty; }
    } else if (category === 'CPU Cooler') {
      const first = COOLER_CATALOG[1];
      if (first) { desc = first.name; price = first.price; warranty = first.warranty; }
    } else if (category === 'Monitor') {
      const first = MONITOR_CATALOG[1];
      if (first) { desc = first.name; price = first.price; warranty = first.warranty; }
    }

    setComponentsList([
      ...componentsList,
      {
        category,
        desc,
        qty: 1,
        warranty,
        price
      }
    ]);
  };

  const removeComponentRow = (idx: number) => {
    setComponentsList(componentsList.filter((_, i) => i !== idx));
  };

  const clearAllSpecs = () => {
    setComponentsList(componentsList.map(item => ({ ...item, desc: "", price: "" })));
  };

  const handleOpenSaveBuildPresetModal = () => {
    const hasAnyData = componentsList.some(c => (c.desc && c.desc.trim()) || (c.price !== '' && c.price !== 0));
    if (!hasAnyData) {
      showToast("Please enter some component details before saving as preset");
      return;
    }
    setNewBuildPresetName('');
    setNewBuildPresetIcon('🖥️');
    setShowSaveBuildPresetModal(true);
  };

  const handleSaveCurrentBuildPreset = async () => {
    if (!newBuildPresetName.trim()) {
      showToast("Please enter a name for this build preset");
      return;
    }
    setIsSavingBuildPreset(true);
    try {
      const newPreset: CustomBuildPreset = {
        id: 'build_' + Date.now(),
        name: newBuildPresetName.trim(),
        icon: newBuildPresetIcon || '🖥️',
        components: JSON.parse(JSON.stringify(componentsList)),
        createdAt: new Date().toISOString()
      };
      const currentPresets = settings.customBuildPresets || [];
      const updatedPresets = [...currentPresets, newPreset];
      await updateSettings({ customBuildPresets: updatedPresets });
      setShowSaveBuildPresetModal(false);
      setNewBuildPresetName('');
      showToast(`Preset "${newPreset.name}" saved successfully!`);
    } catch (err) {
      console.error("Error saving build preset:", err);
      showToast("Failed to save build preset");
    } finally {
      setIsSavingBuildPreset(false);
    }
  };

  const handleDeleteBuildPreset = async (presetId: string, presetName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Delete preset "${presetName}"?`)) return;
    try {
      const currentPresets = settings.customBuildPresets || [];
      const updatedPresets = currentPresets.filter(p => p.id !== presetId);
      await updateSettings({ customBuildPresets: updatedPresets });
      showToast(`Preset "${presetName}" deleted`);
    } catch (err) {
      console.error("Error deleting preset:", err);
      showToast("Failed to delete preset");
    }
  };

  const handleLoadBuildPreset = (preset: CustomBuildPreset) => {
    if (!preset || !preset.components) return;
    setComponentsList(JSON.parse(JSON.stringify(preset.components)));
    showToast(`Loaded preset "${preset.name}"`);
  };

  // Populate generator from existing request
  const handleLoadRequestIntoGenerator = (req: CustomPCRequest) => {
    setEditingRequestId(req.id);
    setCustName(req.customerName || 'Customer');
    setCustPhone(req.customerPhone || '');
    setQuoteNo(req.quoteNo || getNextSerialQuoteNo(requests));
    setQuoteDate(req.createdAt ? format(new Date(req.createdAt), 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy'));
    setDiscount(req.discountAmount || 0);

    const reqComboId = (req as any).comboId;
    const reqComboName = (req as any).comboName;
    const reqComboItems = (req as any).comboItems;

    if (reqComboId === 'none' || (req as any).hasFreeGift === false) {
      setSelectedComboId('none');
      setBonusTitle('');
      setBonusItems('');
    } else if (reqComboName) {
      setSelectedComboId(reqComboId || 'custom');
      setBonusTitle(reqComboName);
      setBonusItems(Array.isArray(reqComboItems) ? reqComboItems.join(', ') : '');
    } else if (reqComboId === '8-item') {
      setSelectedComboId('8-item');
      setBonusTitle('8-Item Mega Tech Beast Accessories Pack');
      setBonusItems('Gaming Mouse, Keyboard, RGB Mousepad, Headset, WiFi Dongle, HDMI/Power Cable, Cleaner Kit, Gaming Stickers');
    } else if (reqComboId === '4-item') {
      setSelectedComboId('4-item');
      setBonusTitle('4-Item Essential Tech Beast Accessories Pack');
      setBonusItems('Mousepad, WiFi USB Adapter, Power Cable, Cleaning Kit');
    } else {
      setSelectedComboId('auto');
      if ((req.finalPrice || req.subTotal || 0) >= 20000) {
        setBonusTitle('8-Item Mega Tech Beast Accessories Pack');
        setBonusItems('Gaming Mouse, Keyboard, RGB Mousepad, Headset, WiFi Dongle, HDMI/Power Cable, Cleaner Kit, Gaming Stickers');
      } else {
        setBonusTitle('4-Item Essential Tech Beast Accessories Pack');
        setBonusItems('Mousepad, WiFi USB Adapter, Power Cable, Cleaning Kit');
      }
    }

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
        hasFreeGift: resolved.id !== 'none' && resolved.name !== '',
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

  // Render printable invoice card helper (used in Preview, Split View, and Offscreen)
  const renderPrintableInvoiceCard = (isOffscreen = false) => (
    <div
      ref={isOffscreen ? undefined : printableRef}
      id={isOffscreen ? "printableCardOffscreen" : "printableCard"}
      className="printable-card bg-white text-slate-900 rounded-3xl p-6 shadow-2xl border-2 border-slate-800 w-full max-w-2xl transition-all relative overflow-hidden text-slate-900"
    >
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
          <span className="text-[9px] font-extrabold text-slate-500 uppercase block leading-none mb-0.5">Customer Name:</span>
          <span className="text-slate-900 font-black text-sm">{custName || 'Valued Customer'}</span>
        </div>
        <div>
          <span className="text-[9px] font-extrabold text-slate-500 uppercase block leading-none mb-0.5">Mobile Number:</span>
          <span className="text-red-600 font-black text-sm">{custPhone || 'N/A'}</span>
        </div>
        <div>
          <span className="text-[9px] font-extrabold text-slate-500 uppercase block leading-none mb-0.5">Quotation No:</span>
          <span className="text-slate-900 font-black font-mono">{quoteNo}</span>
        </div>
        <div>
          <span className="text-[9px] font-extrabold text-slate-500 uppercase block leading-none mb-0.5">Date:</span>
          <span className="text-slate-900 font-black font-mono">{quoteDate}</span>
        </div>
      </div>

      {/* Parts Table */}
      <div className="mb-3 border-2 border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs border-collapse table-fixed">
          <thead className="bg-slate-900 text-white font-black uppercase text-[10px] border-b-2 border-slate-900">
            <tr>
              <th className="p-2 w-8 text-center">#</th>
              <th className="p-2">Component Category & Description</th>
              <th className="p-2 w-12 text-center">Qty</th>
              <th className="p-2 w-20 text-center">Warranty</th>
              <th className="p-2 w-24 text-right">Price (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-bold text-slate-900">
            {componentsList.map((item, idx) => {
              const priceNum = item.price === '' ? 0 : (parseFloat(String(item.price)) || 0);
              const qtyNum = Number(item.qty) || 1;
              const itemTotal = qtyNum * priceNum;
              return (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="p-2 text-center font-black text-slate-500 align-middle">{idx + 1}</td>
                  <td className="p-2 align-middle">
                    <span className="font-extrabold uppercase text-[9px] text-red-600 block leading-none mb-0.5">{item.category}</span>
                    <span className="font-black text-xs text-slate-900 block leading-tight">{item.desc || <span className="text-slate-400 italic font-normal">Specification Pending</span>}</span>
                  </td>
                  <td className="p-2 text-center font-bold text-slate-700 align-middle">{item.qty || 1}</td>
                  <td className="p-2 text-center align-middle">
                    <span className="inline-block bg-slate-100 text-slate-900 border border-slate-300 px-2 py-0.5 rounded text-[10px] font-black">
                      {formatWarrantyText(item.warranty)}
                    </span>
                  </td>
                  <td className="p-2 text-right font-black text-slate-900 align-middle font-mono">₹{itemTotal.toLocaleString('en-IN')}</td>
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
          <div className={`p-2.5 rounded-xl mb-3 text-center font-black text-[10px] uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 text-white ${
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
      <div className="flex items-stretch justify-between gap-3 bg-red-50/60 border-2 border-red-500/40 p-3.5 rounded-xl">
        <div className="text-xs space-y-1 self-center">
          <p className="font-black text-slate-900">Note: <span className="font-bold text-slate-700">{warrantyNote}</span></p>
          <p className="text-[10px] text-slate-600 font-bold">• Individual warranties mentioned per component above.</p>
          <p className="text-[10px] text-slate-600 font-bold">• All parts are 100% genuine & tested by Tech Beast.</p>
        </div>

        <div className="text-right space-y-1 min-w-[180px] border-l-2 border-red-200 pl-3.5">
          <p className="text-xs font-bold text-slate-600">Subtotal: <span className="text-slate-900 font-extrabold font-mono">₹{subtotal.toLocaleString('en-IN')}</span></p>
          {includeGst && (
            <p className="text-xs font-bold text-amber-700">GST (18%): <span className="font-extrabold font-mono">+₹{gstAmount.toLocaleString('en-IN')}</span></p>
          )}
          <p className="text-xs font-bold text-red-600">Discount: <span className="font-extrabold font-mono">-₹{discount.toLocaleString('en-IN')}</span></p>
          <div className="border-t-2 border-slate-900 pt-1 mt-1">
            <p className="text-[10px] font-black uppercase text-slate-600">Net Total Amount:</p>
            <p className="font-heading text-2xl font-black text-slate-900 leading-none font-mono">₹{netTotal.toLocaleString('en-IN')}/-</p>
          </div>
        </div>
      </div>

      <div className="mt-3 text-center border-t border-slate-200 pt-2 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
        TECH BEAST STORE • THANK YOU FOR SHOPPING WITH US!
      </div>
    </div>
  );

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
                setGeneratorViewMode('editor');
              }
              setShowGenerator(!showGenerator);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-red-600/20 cursor-pointer uppercase tracking-wider"
          >
            <FileText className="w-4 h-4" />
            {showGenerator ? 'Close Quotation Generator' : '+ Create Custom Quotation'}
          </button>
          <button
            onClick={() => fetchRequests()}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 text-xs font-bold transition-colors"
          >
            <RotateCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* --- QUOTATION & PDF GENERATOR TOOL (VIEW SWITCHER INTEGRATED) --- */}
      {showGenerator && (
        <div className="bg-slate-900 border-2 border-red-600/40 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-6">
          
          {/* Top Header & View Switcher Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            
            {/* Title & Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-red-600 to-amber-500 text-white rounded-xl flex items-center justify-center font-black text-xl shadow-md shadow-red-600/20 shrink-0">
                TB
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="font-heading font-black text-base sm:text-lg text-white tracking-wide">TECH BEAST QUOTATION GENERATOR</h2>
                  <span className="hidden sm:inline-block px-2.5 py-0.5 bg-red-600/20 border border-red-500/30 text-red-400 font-extrabold text-[10px] rounded-full uppercase tracking-wider">
                    Official Engine
                  </span>
                </div>
                <p className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">Full-Spec Custom PC Builder & Quotation Generator</p>
              </div>
            </div>

            {/* Middle: View Mode Tabs */}
            <div className="flex items-center self-start lg:self-center bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
              <button
                type="button"
                onClick={() => setGeneratorViewMode('editor')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  generatorViewMode === 'editor'
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editor Mode</span>
              </button>
              <button
                type="button"
                onClick={() => setGeneratorViewMode('preview')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  generatorViewMode === 'preview'
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Invoice Preview</span>
              </button>
              <button
                type="button"
                onClick={() => setGeneratorViewMode('split')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  generatorViewMode === 'split'
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Split View</span>
              </button>
            </div>

            {/* Right: Quick Action Buttons & Close */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="hidden xl:flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 mr-1">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">Net Total:</span>
                <span className="font-mono font-black text-amber-400 text-sm">₹{netTotal.toLocaleString('en-IN')}/-</span>
              </div>
              <button
                onClick={handleSavePdf}
                className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-md shadow-red-600/20 cursor-pointer"
                title="Download / Print PDF"
              >
                <FileText className="w-3.5 h-3.5" /> 📄 Save PDF
              </button>
              <button
                onClick={handleSendWhatsapp}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-md shadow-emerald-600/20 cursor-pointer"
                title="Send Quote Link to WhatsApp"
              >
                <Send className="w-3.5 h-3.5" /> 📲 WhatsApp
              </button>
              <button
                onClick={handleCopyQuoteLink}
                className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                title="Copy Direct Online Link"
              >
                <ExternalLink className="w-3.5 h-3.5" /> 🔗 Link
              </button>
              <button
                onClick={handlePrint}
                className="hidden sm:flex px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold rounded-xl text-xs items-center gap-1.5 transition cursor-pointer"
                title="Print Invoice"
              >
                <Printer className="w-3.5 h-3.5" /> 🖨️ Print
              </button>
              <button
                onClick={() => handleSaveQuoteToDb()}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-md shadow-blue-600/20 cursor-pointer"
                title="Save Quotation into Database"
              >
                <Save className="w-3.5 h-3.5" /> 💾 Save
              </button>
              <button
                onClick={() => setShowGenerator(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
                title="Close Generator"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

          </div>

          {/* MAIN GENERATOR CONTENT SWITCHER */}
          
          {/* 1. FULL EDITOR MODE */}
          {generatorViewMode === 'editor' && (
            <div className="space-y-6">
              
              {/* Customer & Quote Info Card */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                  <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4 text-amber-400" /> Customer & Quotation Information
                  </h3>
                  <span className="text-[11px] text-slate-400">All fields editable</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1.5">Customer Name:</label>
                    <input
                      type="text"
                      value={custName}
                      onChange={(e) => setCustName(e.target.value)}
                      placeholder="e.g. John Doe / Gaming Client"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold focus:border-amber-400 focus:outline-none transition placeholder-slate-500 shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-amber-400 uppercase tracking-wider mb-1.5">Mobile No (WhatsApp):</label>
                    <input
                      type="text"
                      value={custPhone}
                      onChange={(e) => setCustPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full bg-slate-900 border border-amber-500/60 rounded-xl px-3.5 py-2.5 text-amber-300 font-bold focus:border-amber-400 focus:outline-none transition placeholder-slate-500 shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1.5">Quotation No:</label>
                    <input
                      type="text"
                      value={quoteNo}
                      onChange={(e) => setQuoteNo(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold focus:border-amber-400 focus:outline-none transition shadow-inner font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1.5">Date:</label>
                    <input
                      type="text"
                      value={quoteDate}
                      onChange={(e) => setQuoteDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold focus:border-amber-400 focus:outline-none transition shadow-inner font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Free Gift & Accessory Combo Card */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                  <label className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" /> Free Gifts / Promotional Accessories Combo
                  </label>
                  {settings?.accessoryCombos?.some(c => c.id === selectedComboId) && (
                    <button
                      type="button"
                      onClick={() => {
                        const found = settings.accessoryCombos?.find(c => c.id === selectedComboId);
                        if (found) handleDeletePreset(found.id, found.name);
                      }}
                      className="text-[11px] text-red-400 hover:text-red-300 font-bold flex items-center gap-1 transition cursor-pointer"
                      title="Delete this custom preset"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Preset
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-1">
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">Select Preset Scheme:</label>
                      <select
                        value={selectedComboId}
                        onChange={(e) => handleComboSelect(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs font-bold focus:border-amber-400 focus:outline-none cursor-pointer"
                      >
                        <option value="auto">⚡ Auto (8-Item for ₹20K+, 4-Item for &lt;₹20K)</option>
                        <option value="8-item">🎉 8-Item Mega Tech Beast Pack</option>
                        <option value="4-item">🎁 4-Item Essential Tech Beast Pack</option>
                        <option value="custom">✏️ Custom / Manual Bonus</option>
                        {settings?.accessoryCombos && settings.accessoryCombos.length > 0 && (
                          <optgroup label="Saved Custom Presets">
                            {settings.accessoryCombos.map((combo) => (
                              <option key={combo.id} value={combo.id}>
                                ✨ {combo.name} ({combo.items?.length || 0} items)
                              </option>
                            ))}
                          </optgroup>
                        )}
                        <option value="none">❌ No Free Gift (Hide Bonus Banner)</option>
                      </select>
                    </div>

                    {selectedComboId !== 'none' && (
                      <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                            Bonus Title / Banner Text:
                          </label>
                          <input
                            type="text"
                            value={bonusTitle}
                            onChange={(e) => {
                              setBonusTitle(e.target.value);
                              if (selectedComboId !== 'custom' && !settings?.accessoryCombos?.some(c => c.id === selectedComboId)) {
                                setSelectedComboId('custom');
                              }
                            }}
                            placeholder="e.g. 8-Item Mega Tech Beast Accessories Pack"
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-amber-300 font-bold focus:border-amber-400 focus:outline-none placeholder-slate-500 shadow-inner"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                              Included Items (Comma Separated):
                            </label>
                            <button
                              type="button"
                              disabled={isSavingPreset || !bonusTitle.trim()}
                              onClick={handleSaveAsPreset}
                              className="px-2.5 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-bold transition flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                              title="Save as reusable preset"
                            >
                              <Save className="w-3 h-3" />
                              {isSavingPreset ? 'Saving...' : 'Save as Preset'}
                            </button>
                          </div>
                          <input
                            type="text"
                            value={bonusItems}
                            onChange={(e) => {
                              setBonusItems(e.target.value);
                              if (selectedComboId !== 'custom' && !settings?.accessoryCombos?.some(c => c.id === selectedComboId)) {
                                setSelectedComboId('custom');
                              }
                            }}
                            placeholder="e.g. Gaming Mouse, RGB Mousepad, Headset, WiFi Adapter"
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-medium focus:border-amber-400 focus:outline-none placeholder-slate-500 shadow-inner"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Custom 1-Click Full Build Presets */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-700/60 pb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider">
                      Custom 1-Click PC Build Presets
                    </h3>
                    <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-bold">
                      {(settings.customBuildPresets || []).length} Saved
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleOpenSaveBuildPresetModal}
                      className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs transition flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" /> Save Current Specs as Preset
                    </button>
                    <button
                      type="button"
                      onClick={clearAllSpecs}
                      className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                    >
                      🧹 Clear All Specs
                    </button>
                  </div>
                </div>

                {(!settings.customBuildPresets || settings.customBuildPresets.length === 0) ? (
                  <div className="p-5 border border-dashed border-slate-700 rounded-xl bg-slate-900/50 text-center space-y-2">
                    <p className="text-xs text-slate-300 font-semibold">
                      ✨ No custom PC build presets saved yet!
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-lg mx-auto">
                      Fill out your component specifications below, then click <strong className="text-amber-400">"Save Current Specs as Preset"</strong> above to store your own reusable 1-click build configurations.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5">
                    {settings.customBuildPresets.map((preset) => (
                      <div
                        key={preset.id}
                        onClick={() => handleLoadBuildPreset(preset)}
                        className="group relative flex flex-col justify-between p-3 bg-slate-900/90 hover:bg-slate-700/80 text-white rounded-xl font-bold border border-slate-700/80 hover:border-amber-400 transition cursor-pointer shadow-sm hover:shadow-md hover:shadow-amber-500/5"
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <span className="text-base select-none">{preset.icon || '🖥️'}</span>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteBuildPreset(preset.id, preset.name, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 bg-red-500/20 hover:bg-red-600 text-red-300 hover:text-white rounded-md transition text-[10px] cursor-pointer"
                            title={`Delete preset "${preset.name}"`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="mt-1.5">
                          <p className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition" title={preset.name}>
                            {preset.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-normal mt-0.5">
                            {preset.components?.filter(c => c.desc?.trim()).length || preset.components?.length || 0} Components
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Components & Hardware Specs Section (Full-Width Responsive 2-Col Grid) */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/60 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-red-400 uppercase tracking-wider flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-red-500" /> PC Components & Hardware Specs
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Pick presets from Intel (1st-14th Gen), AMD, RAM, Storage, GPUs, or type custom specs</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={addComponentRow} 
                    className="text-xs bg-red-600 hover:bg-red-500 text-white font-extrabold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-red-600/20 shrink-0 self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" /> Add Custom Component Row
                  </button>
                </div>

                {/* Quick Add Specific Category Chips */}
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/90 p-2.5 rounded-xl border border-slate-700/80">
                  <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider mr-1">⚡ + Quick Add:</span>
                  <button type="button" onClick={() => addSpecificComponentRow('Processor (CPU)')} className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold transition cursor-pointer">+ CPU</button>
                  <button type="button" onClick={() => addSpecificComponentRow('Motherboard')} className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold transition cursor-pointer">+ Motherboard</button>
                  <button type="button" onClick={() => addSpecificComponentRow('RAM Memory')} className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold transition cursor-pointer">+ RAM</button>
                  <button type="button" onClick={() => addSpecificComponentRow('SSD Storage')} className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold transition cursor-pointer">+ SSD</button>
                  <button type="button" onClick={() => addSpecificComponentRow('Graphics Card')} className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold transition cursor-pointer">+ GPU</button>
                  <button type="button" onClick={() => addSpecificComponentRow('SMPS (Power Supply)')} className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold transition cursor-pointer">+ SMPS</button>
                  <button type="button" onClick={() => addSpecificComponentRow('Cabinet / Case')} className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold transition cursor-pointer">+ Case</button>
                  <button type="button" onClick={() => addSpecificComponentRow('CPU Cooler')} className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold transition cursor-pointer">+ Cooler</button>
                  <button type="button" onClick={() => addSpecificComponentRow('Monitor')} className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold transition cursor-pointer">+ Monitor</button>
                  <button type="button" onClick={() => addSpecificComponentRow('Peripherals & Accessories')} className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold transition cursor-pointer">+ Peripherals</button>
                </div>

                {/* Component Rows in Spacious Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {componentsList.map((item, idx) => (
                    <ComponentRowCard
                      key={idx}
                      item={item}
                      idx={idx}
                      updateComp={updateComp}
                      updateCompMultiple={updateCompMultiple}
                      removeComponentRow={removeComponentRow}
                    />
                  ))}
                </div>
              </div>

              {/* Pricing, GST & Quotation Terms Card */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
                <div className="border-b border-slate-700/60 pb-2">
                  <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    💰 Pricing, Taxes & Terms Breakdown
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* GST Toggle */}
                  <div className="bg-slate-900 border border-slate-700 p-3.5 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        id="toggleGstFull"
                        checked={includeGst}
                        onChange={(e) => setIncludeGst(e.target.checked)}
                        className="w-4 h-4 accent-red-600 cursor-pointer"
                      />
                      <label htmlFor="toggleGstFull" className="text-xs font-extrabold text-amber-400 cursor-pointer uppercase tracking-wider">
                        Auto Add 18% GST Tax
                      </label>
                    </div>
                    <span className="text-xs font-black text-white font-mono">18%: +₹{gstAmount.toLocaleString('en-IN')}</span>
                  </div>

                  {/* Discount Input */}
                  <div>
                    <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1.5">Discount Amount (₹):</label>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold focus:border-red-500 focus:outline-none font-mono text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>

                  {/* Terms / Note Input */}
                  <div>
                    <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1.5">Quotation Terms / Note:</label>
                    <input
                      type="text"
                      value={warrantyNote}
                      onChange={(e) => setWarrantyNote(e.target.value)}
                      placeholder="e.g. Prices Valid For 2 Days"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold focus:border-red-500 focus:outline-none text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Sticky Live Totals & Quick Action Bar (Editor Mode) */}
              <div className="sticky bottom-4 z-20 bg-slate-950/95 backdrop-blur-md border-2 border-red-500/50 p-4 sm:p-5 rounded-2xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Subtotal</span>
                    <span className="text-white font-black font-mono text-sm">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  {includeGst && (
                    <div>
                      <span className="text-[10px] text-amber-400 font-extrabold uppercase block">GST (18%)</span>
                      <span className="text-amber-300 font-black font-mono text-sm">+₹{gstAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {discount > 0 && (
                    <div>
                      <span className="text-[10px] text-red-400 font-extrabold uppercase block">Discount</span>
                      <span className="text-red-400 font-black font-mono text-sm">-₹{discount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="border-l border-slate-700 pl-4">
                    <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wider block">Net Total Price</span>
                    <span className="font-heading text-xl sm:text-2xl font-black text-white font-mono leading-none">₹{netTotal.toLocaleString('en-IN')}/-</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setGeneratorViewMode('preview')}
                    className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 transition shadow-lg shadow-red-600/30 cursor-pointer"
                  >
                    <Eye className="w-4 h-4" /> 👁️ Preview Invoice
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePdf}
                    className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <FileText className="w-4 h-4" /> 📄 Save PDF
                  </button>
                  <button
                    type="button"
                    onClick={handleSendWhatsapp}
                    className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <Send className="w-4 h-4" /> 📲 WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveQuoteToDb()}
                    className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-md shadow-blue-600/20 cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> 💾 Save
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* 2. INVOICE PREVIEW MODE (FULL A4 CENTERED) */}
          {generatorViewMode === 'preview' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              
              {/* Preview Action Toolbar */}
              <div className="bg-slate-800/90 border border-slate-700 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
                <button
                  type="button"
                  onClick={() => setGeneratorViewMode('editor')}
                  className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer border border-slate-600"
                >
                  <ArrowLeft className="w-4 h-4" /> ✏️ Back to Editor
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleSavePdf}
                    className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-md shadow-red-600/20 cursor-pointer"
                  >
                    <FileText className="w-4 h-4" /> 📄 Save PDF
                  </button>
                  <button
                    onClick={handleSendWhatsapp}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <Send className="w-4 h-4" /> 📲 WhatsApp Quote
                  </button>
                  <button
                    onClick={handleCopyQuoteLink}
                    className="px-3.5 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                    title="Copy Direct Online Link"
                  >
                    <ExternalLink className="w-4 h-4" /> 🔗 Copy Link
                  </button>
                  <button
                    onClick={handlePrint}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Printer className="w-4 h-4" /> 🖨️ Print
                  </button>
                  <button
                    onClick={() => handleSaveQuoteToDb()}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-md shadow-blue-600/20 cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> 💾 Save to Database
                  </button>
                </div>
              </div>

              {/* Centered Printable Card */}
              <div className="flex justify-center p-2 sm:p-4 bg-slate-950/60 rounded-3xl border border-slate-800">
                {renderPrintableInvoiceCard(false)}
              </div>

            </div>
          )}

          {/* 3. SPLIT VIEW MODE (SIDE-BY-SIDE) */}
          {generatorViewMode === 'split' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Form Controls */}
              <div className="lg:col-span-6 bg-slate-800/90 border border-slate-700 rounded-2xl p-4 space-y-4 text-xs max-h-[850px] overflow-y-auto pr-1.5">
                
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
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:border-red-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">Date:</label>
                    <input
                      type="text"
                      value={quoteDate}
                      onChange={(e) => setQuoteDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:border-red-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Free Gift */}
                <div className="border-t border-slate-700 pt-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span>🎁 Free Gifts / Special Bonus:</span>
                    </label>
                    {settings?.accessoryCombos?.some(c => c.id === selectedComboId) && (
                      <button
                        type="button"
                        onClick={() => {
                          const found = settings.accessoryCombos?.find(c => c.id === selectedComboId);
                          if (found) handleDeletePreset(found.id, found.name);
                        }}
                        className="text-[10px] text-red-400 hover:text-red-300 font-bold flex items-center gap-1 transition"
                      >
                        <Trash2 className="w-3 h-3" /> Delete Preset
                      </button>
                    )}
                  </div>

                  <select
                    value={selectedComboId}
                    onChange={(e) => handleComboSelect(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-bold focus:border-amber-400 focus:outline-none"
                  >
                    <option value="auto">⚡ Auto (8-Item for ₹20K+, 4-Item for &lt;₹20K)</option>
                    <option value="8-item">🎉 8-Item Mega Tech Beast Pack</option>
                    <option value="4-item">🎁 4-Item Essential Tech Beast Pack</option>
                    <option value="custom">✏️ Custom / Manual Bonus</option>
                    {settings?.accessoryCombos && settings.accessoryCombos.length > 0 && (
                      <optgroup label="Saved Custom Presets">
                        {settings.accessoryCombos.map((combo) => (
                          <option key={combo.id} value={combo.id}>
                            ✨ {combo.name} ({combo.items?.length || 0} items)
                          </option>
                        ))}
                      </optgroup>
                    )}
                    <option value="none">❌ No Free Gift (Hide Bonus Banner)</option>
                  </select>

                  {selectedComboId !== 'none' && (
                    <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-2.5 space-y-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                          Bonus Title / Banner Text:
                        </label>
                        <input
                          type="text"
                          value={bonusTitle}
                          onChange={(e) => {
                            setBonusTitle(e.target.value);
                            if (selectedComboId !== 'custom' && !settings?.accessoryCombos?.some(c => c.id === selectedComboId)) {
                              setSelectedComboId('custom');
                            }
                          }}
                          placeholder="e.g. 8-Item Mega Tech Beast Accessories Pack"
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-bold focus:border-amber-400 focus:outline-none placeholder-slate-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                          Included Items (comma separated):
                        </label>
                        <input
                          type="text"
                          value={bonusItems}
                          onChange={(e) => {
                            setBonusItems(e.target.value);
                            if (selectedComboId !== 'custom' && !settings?.accessoryCombos?.some(c => c.id === selectedComboId)) {
                              setSelectedComboId('custom');
                            }
                          }}
                          placeholder="e.g. Gaming Mouse, RGB Mousepad, Headset, WiFi Adapter"
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-medium focus:border-amber-400 focus:outline-none placeholder-slate-500"
                        />
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-slate-400">Edit freely or save:</span>
                        <button
                          type="button"
                          disabled={isSavingPreset || !bonusTitle.trim()}
                          onClick={handleSaveAsPreset}
                          className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-bold transition flex items-center gap-1 disabled:opacity-50"
                        >
                          <Save className="w-3 h-3" />
                          {isSavingPreset ? 'Saving...' : 'Save as Preset'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Custom Presets in Split View */}
                <div className="border-t border-slate-700 pt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                        Custom Presets ({(settings.customBuildPresets || []).length})
                      </label>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleOpenSaveBuildPresetModal}
                        className="text-[10px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-md font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Save Preset
                      </button>
                      <button type="button" onClick={clearAllSpecs} className="text-[10px] text-red-400 hover:underline font-bold cursor-pointer">
                        🧹 Clear
                      </button>
                    </div>
                  </div>

                  {(!settings.customBuildPresets || settings.customBuildPresets.length === 0) ? (
                    <div className="p-2.5 border border-dashed border-slate-700 rounded-lg bg-slate-900/40 text-center">
                      <p className="text-[10px] text-slate-400">
                        No custom presets yet. Click <span className="text-amber-300 font-bold">+ Save Preset</span> to create one!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {settings.customBuildPresets.map((preset) => (
                        <div
                          key={preset.id}
                          onClick={() => handleLoadBuildPreset(preset)}
                          className="group relative flex items-center justify-between px-2.5 py-1.5 bg-slate-900 hover:bg-slate-700 text-white rounded-lg border border-slate-700 hover:border-amber-400 transition text-[11px] cursor-pointer"
                        >
                          <span className="truncate mr-1 font-semibold flex items-center gap-1" title={preset.name}>
                            <span>{preset.icon || '🖥️'}</span>
                            <span className="truncate">{preset.name}</span>
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteBuildPreset(preset.id, preset.name, e)}
                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-0.5 rounded cursor-pointer shrink-0"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Components Rows */}
                <div className="border-t border-slate-700 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" /> Hardware Specs:
                    </label>
                    <button 
                      type="button" 
                      onClick={addComponentRow} 
                      className="text-[11px] bg-red-600 hover:bg-red-500 text-white font-extrabold px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer shadow-sm"
                    >
                      <Plus className="w-3 h-3" /> Custom Row
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {componentsList.map((item, idx) => (
                      <ComponentRowCard
                        key={idx}
                        item={item}
                        idx={idx}
                        updateComp={updateComp}
                        updateCompMultiple={updateCompMultiple}
                        removeComponentRow={removeComponentRow}
                      />
                    ))}
                  </div>
                </div>

                {/* GST & Discount */}
                <div className="border-t border-slate-700 pt-3 space-y-3">
                  <div className="flex items-center justify-between bg-slate-900 border border-slate-700 p-2.5 rounded-xl">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="toggleGstSplit"
                        checked={includeGst}
                        onChange={(e) => setIncludeGst(e.target.checked)}
                        className="w-4 h-4 accent-red-600 cursor-pointer"
                      />
                      <label htmlFor="toggleGstSplit" className="text-xs font-extrabold text-amber-400 cursor-pointer uppercase tracking-wider">
                        Auto Add 18% GST Tax
                      </label>
                    </div>
                    <span className="text-xs font-black text-white">18%: +₹{gstAmount.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">Discount (₹):</label>
                      <input
                        type="number"
                        value={discount}
                        onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-bold focus:border-red-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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

              {/* Right Column: Live Printable Sheet */}
              <div className="lg:col-span-6 flex flex-col items-center sticky top-4">
                {renderPrintableInvoiceCard(false)}
              </div>

            </div>
          )}

          {/* Offscreen / Hidden Printable Invoice Card (Ensures printableRef is ALWAYS mounted even in editor mode) */}
          {generatorViewMode === 'editor' && (
            <div className="hidden" aria-hidden="true">
              {renderPrintableInvoiceCard(false)}
            </div>
          )}

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

      {/* --- SAVE BUILD PRESET MODAL --- */}
      {showSaveBuildPresetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border-2 border-amber-500/60 rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowSaveBuildPresetModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/40">
                <Save className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Save Custom Build Preset</h3>
                <p className="text-xs text-slate-400">Save current specs for instant 1-click loading</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Preset Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={newBuildPresetName}
                  onChange={(e) => setNewBuildPresetName(e.target.value)}
                  placeholder="e.g. RTX 4060 Gaming Beast, Budget Office Rig, Video Editing AM5"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:border-amber-400 focus:outline-none placeholder-slate-500 shadow-inner"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newBuildPresetName.trim() && !isSavingBuildPreset) {
                      e.preventDefault();
                      handleSaveCurrentBuildPreset();
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Choose Icon
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {['🖥️', '🎮', '⚡', '🔥', '🚀', '👑', '💼', '💻', '🎨', '⚙️', '🧊', '💎'].map((ico) => (
                    <button
                      key={ico}
                      type="button"
                      onClick={() => setNewBuildPresetIcon(ico)}
                      className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition cursor-pointer border ${
                        newBuildPresetIcon === ico
                          ? 'bg-amber-500/30 border-amber-400 scale-110 shadow-md shadow-amber-500/20'
                          : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {ico}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview of components to be saved */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 max-h-40 overflow-y-auto space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Components included ({componentsList.filter(c => (c.desc && c.desc.trim()) || (c.price !== '' && c.price !== 0)).length}):
                </p>
                {componentsList.filter(c => (c.desc && c.desc.trim()) || (c.price !== '' && c.price !== 0)).length === 0 ? (
                  <p className="text-xs text-amber-400/80 italic">Empty component list (template structure will be saved)</p>
                ) : (
                  componentsList.filter(c => (c.desc && c.desc.trim()) || (c.price !== '' && c.price !== 0)).map((c, idx) => (
                    <div key={idx} className="text-xs text-slate-300 flex items-center justify-between gap-2">
                      <span className="text-slate-400 font-semibold shrink-0">{c.category}:</span>
                      <span className="truncate text-right font-medium text-white">{c.desc || `Qty: ${c.qty} (₹${c.price || 0})`}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowSaveBuildPresetModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingBuildPreset || !newBuildPresetName.trim()}
                onClick={handleSaveCurrentBuildPreset}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs transition flex items-center gap-1.5 shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {isSavingBuildPreset ? 'Saving Preset...' : 'Save Preset'}
              </button>
            </div>
          </div>
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
