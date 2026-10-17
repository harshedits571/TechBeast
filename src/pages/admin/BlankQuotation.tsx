import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Printer, 
  ArrowLeft, 
  Sliders, 
  Copy, 
  Check, 
  Sparkles, 
  FileText, 
  Calendar, 
  ShieldCheck, 
  Info,
  Layers,
  Palette,
  Store,
  Edit2
} from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

interface BlankComponentRow {
  sr: number;
  category: string;
  subtext?: string;
  defaultQty?: string;
  defaultWarranty?: string;
}

const DEFAULT_BLANK_ROWS: BlankComponentRow[] = [
  { sr: 1, category: "Processor (CPU)", subtext: "Intel / AMD Ryzen Series", defaultQty: "1", defaultWarranty: "3 Yrs" },
  { sr: 2, category: "Motherboard", subtext: "Chipset & Socket Model", defaultQty: "1", defaultWarranty: "3 Yrs" },
  { sr: 3, category: "RAM (Memory)", subtext: "DDR4 / DDR5 Speed & GB", defaultQty: "1", defaultWarranty: "3 Yrs" },
  { sr: 4, category: "Primary SSD Storage", subtext: "M.2 NVMe Gen3/Gen4/Gen5", defaultQty: "1", defaultWarranty: "3 Yrs" },
  { sr: 5, category: "Graphics Card (GPU)", subtext: "Nvidia RTX / AMD Radeon", defaultQty: "1", defaultWarranty: "3 Yrs" },
  { sr: 6, category: "SMPS (Power Supply)", subtext: "Wattage & Bronze/Gold Rating", defaultQty: "1", defaultWarranty: "2 Yrs" },
  { sr: 7, category: "Cabinet / Case", subtext: "Model, RGB / Fans / Glass", defaultQty: "1", defaultWarranty: "1 Yr" },
  { sr: 8, category: "CPU Cooler", subtext: "Air Cooler / 240/360mm AIO", defaultQty: "1", defaultWarranty: "1 Yr" },
  { sr: 9, category: "Secondary Storage", subtext: "Extra HDD / SATA SSD", defaultQty: "1", defaultWarranty: "2 Yrs" },
  { sr: 10, category: "Monitor / Display", subtext: "Screen Size, Refresh Rate & Panel", defaultQty: "1", defaultWarranty: "3 Yrs" },
  { sr: 11, category: "Keyboard & Mouse", subtext: "Mechanical / Gaming RGB Combo", defaultQty: "1", defaultWarranty: "1 Yr" },
  { sr: 12, category: "Accessories / Extras", subtext: "WiFi / Bluetooth / Extension", defaultQty: "1", defaultWarranty: "1 Yr" },
];

const EXTRA_BLANK_ROWS: BlankComponentRow[] = [
  { sr: 13, category: "Custom Upgrade 1", subtext: "Custom Component / Service", defaultQty: "1", defaultWarranty: "1 Yr" },
  { sr: 14, category: "Custom Upgrade 2", subtext: "Custom Component / Service", defaultQty: "1", defaultWarranty: "1 Yr" },
];

export default function BlankQuotation() {
  const { settings } = useSettings();
  const [printMode, setPrintMode] = useState<'color' | 'mono'>('color');
  const [storeName, setStoreName] = useState('Shri Omkar Traders');
  const [coBrand, setCoBrand] = useState('Tech Beast');
  const [quotePrefix, setQuotePrefix] = useState('TB-SOT');
  const [showLogo, setShowLogo] = useState(true);
  const [tagline, setTagline] = useState('Gaming PCs • Workstations • Laptops • Custom Rigs • Upgrades • Repairs');
  const [address, setAddress] = useState('Ground Floor, Shinde Complex, No.183 C Block, Neeligin Road, Hubballi, Karnataka 580029');
  const [contactInfo, setContactInfo] = useState('Ph: +91 95352 25266 | Email: techbeasthubli@gmail.com | website: www.techbeasthubli.in');
  const [showEditHeader, setShowEditHeader] = useState(false);
  const [includeExtraRows, setIncludeExtraRows] = useState(false);
  const [prefillDate, setPrefillDate] = useState(false);
  const [prefillQtyWarranty, setPrefillQtyWarranty] = useState(false);
  const [includeGstRow, setIncludeGstRow] = useState(true);
  const [includeBonusCombo, setIncludeBonusCombo] = useState(false);
  const [validityDays, setValidityDays] = useState('2');
  const [copiedTip, setCopiedTip] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        window.print();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const rowsToDisplay = includeExtraRows 
    ? [...DEFAULT_BLANK_ROWS, ...EXTRA_BLANK_ROWS]
    : DEFAULT_BLANK_ROWS;

  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen print:min-h-0 print:h-auto bg-slate-950 print:bg-white text-slate-100 print:text-black">
      
      {/* =========================================================================
          TOP TOOLBAR & CONTROLS (STRICTLY HIDDEN ON PRINT)
         ========================================================================= */}
      <div className="print:hidden border-b border-slate-800 bg-slate-900/95 sticky top-0 z-40 backdrop-blur-md px-4 py-3.5 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <Link
              to="/admin/custom-pc-requests"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Custom PCs
            </Link>
            <div>
              <h1 className="text-base font-extrabold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                Printable Blank Quotation Sheet
              </h1>
              <p className="text-[11px] text-slate-400">
                Pre-printed hardware catalog with blank model & price lines for rapid pen handwriting at store counter
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Print Mode Switcher */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setPrintMode('color')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  printMode === 'color' 
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30' 
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Print with official Red & Dark styling"
              >
                <Palette className="w-3.5 h-3.5" /> Color Accent
              </button>
              <button
                type="button"
                onClick={() => setPrintMode('mono')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  printMode === 'mono' 
                    ? 'bg-slate-700 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Pure black & white ink saver mode"
              >
                Ink Saver (B&W)
              </button>
            </div>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 transition shadow-lg shadow-red-600/30 cursor-pointer uppercase tracking-wider"
              title="Open browser print dialog (Ctrl + P)"
            >
              <Printer className="w-4 h-4" /> 🖨️ Print Sheets Now
            </button>
          </div>

        </div>

        {/* Store & Header Controls */}
        <div className="max-w-7xl mx-auto mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1">
              <Store className="w-3.5 h-3.5 text-red-500" />
              <span className="text-[11px] text-slate-400 font-medium">Business:</span>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Business Name"
                className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-white font-bold focus:outline-none focus:border-red-500 w-36"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1">
              <span className="text-[11px] text-slate-400 font-medium">Brand:</span>
              <input
                type="text"
                value={coBrand}
                onChange={(e) => setCoBrand(e.target.value)}
                placeholder="Brand / Co-brand"
                className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-white font-bold focus:outline-none focus:border-red-500 w-28"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1">
              <span className="text-[11px] text-slate-400 font-medium">Prefix:</span>
              <input
                type="text"
                value={quotePrefix}
                onChange={(e) => setQuotePrefix(e.target.value)}
                placeholder="Prefix"
                className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-red-500 w-20 uppercase"
              />
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer select-none bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
              <input
                type="checkbox"
                checked={showLogo}
                onChange={(e) => setShowLogo(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-red-600 focus:ring-red-500 w-3.5 h-3.5"
              />
              <span className="text-slate-300">Show Logo</span>
            </label>

            <button
              type="button"
              onClick={() => setShowEditHeader(!showEditHeader)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-xs font-semibold cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              {showEditHeader ? 'Hide Details' : 'Edit Address / Tagline'}
            </button>
          </div>

          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-300 px-3 py-1 rounded-lg text-[11px] font-semibold">
            <Info className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span>Set <strong>Copies: 10 or 15</strong> in your printer dialog for instant counter stock.</span>
          </div>
        </div>

        {/* Collapsible Header Edit Inputs */}
        {showEditHeader && (
          <div className="max-w-7xl mx-auto mt-2.5 p-3 bg-slate-950/80 border border-slate-800 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Tagline / Services</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Store Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Contact & Website</label>
              <input
                type="text"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
        )}

        {/* Quick Options Bar */}
        <div className="max-w-7xl mx-auto mt-2.5 pt-2.5 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={prefillDate}
                onChange={(e) => setPrefillDate(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-red-600 focus:ring-red-500 w-3.5 h-3.5"
              />
              <span>Pre-print Today's Date (<span className="text-amber-400 font-bold">{todayFormatted}</span>)</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={prefillQtyWarranty}
                onChange={(e) => setPrefillQtyWarranty(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-red-600 focus:ring-red-500 w-3.5 h-3.5"
              />
              <span>Pre-fill standard Qty & Warranty (Default: <strong className="text-amber-400">Blank for Pen</strong>)</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeExtraRows}
                onChange={(e) => setIncludeExtraRows(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-red-600 focus:ring-red-500 w-3.5 h-3.5"
              />
              <span>Show 2 Extra Custom Upgrade Rows (14 items total)</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeGstRow}
                onChange={(e) => setIncludeGstRow(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-red-600 focus:ring-red-500 w-3.5 h-3.5"
              />
              <span>Include GST Amount Line</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeBonusCombo}
                onChange={(e) => setIncludeBonusCombo(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-red-600 focus:ring-red-500 w-3.5 h-3.5"
              />
              <span>Include Free Gifts & Accessories Banner</span>
            </label>
          </div>
        </div>
      </div>


      {/* =========================================================================
          A4 SHEET CONTAINER (PIXEL-PERFECT COMPACT PRINT SPECIFICATION)
         ========================================================================= */}
      <div className="p-4 sm:p-8 flex justify-center print:block print:p-0 print:m-0 print:overflow-visible">
        
        <div 
          id="printable-blank-quotation"
          className={`bg-white text-slate-900 w-full max-w-[210mm] shadow-2xl rounded-2xl print:rounded-none print:shadow-none p-5 sm:p-6 print:p-0 print:m-0 border border-slate-300 print:border-none transition-all print:overflow-visible ${
            printMode === 'mono' ? 'print-mono' : 'print-color'
          }`}
          style={{
            fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
            color: '#0f172a'
          }}
        >

          {/* 1. DOCUMENT HEADER */}
          <header className={`border-b-2 pb-2 mb-2 flex items-start justify-between gap-3 ${
            printMode === 'color' ? 'border-red-600' : 'border-slate-900'
          }`}>
            
            <div className="flex items-center gap-2.5">
              {showLogo && (
                <img 
                  src="/logo2.jpeg" 
                  alt={`${storeName} ${coBrand} Logo`} 
                  className="h-11 w-11 object-contain rounded-lg border border-slate-300 p-0.5 shrink-0 shadow-sm"
                />
              )}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-heading text-xl font-black text-slate-900 tracking-tight leading-none uppercase">
                    {storeName}
                  </h1>
                  {coBrand && (
                    <span className="text-base font-black text-red-600 tracking-tight leading-none uppercase flex items-center gap-1.5">
                      <span className="text-slate-300 font-normal">|</span>
                      {coBrand}
                    </span>
                  )}
                  <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded tracking-wider ${
                    printMode === 'color' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'
                  }`}>
                    OFFICIAL QUOTATION
                  </span>
                </div>
                <p className="text-[9.5px] font-extrabold text-red-600 uppercase tracking-wider mt-0.5 leading-none">
                  {tagline}
                </p>
                <p className="text-[9px] text-slate-600 font-medium leading-tight mt-0.5">
                  {address}
                </p>
                <p className="text-[9px] text-slate-800 font-bold leading-none mt-0.5">
                  {contactInfo}
                </p>
              </div>
            </div>

            {/* Document Reference / Serial Stamp */}
            <div className="text-right shrink-0">
              <div className={`border-2 py-1.5 px-3 rounded-lg text-center min-w-[130px] ${
                printMode === 'color' ? 'border-red-600 bg-red-50/50' : 'border-slate-800 bg-slate-50'
              }`}>
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block leading-none mb-0.5">
                  Estimate / Quote No.
                </span>
                <span className="text-xs font-mono font-black text-slate-900 block border-b border-dashed border-slate-400 pb-0.5">
                  {quotePrefix}-2026-______
                </span>
                <div className="mt-1 flex items-center justify-between text-[8px] font-bold text-slate-600 leading-none">
                  <span>VALIDITY:</span>
                  <span className="font-black text-slate-900">{validityDays} DAYS</span>
                </div>
              </div>
            </div>

          </header>


          {/* 2. CUSTOMER & ESTIMATE INFO BAR (PEN WRITE-IN BOX) */}
          <div className="bg-slate-50 border border-slate-300 rounded-lg p-2.5 mb-2 text-xs text-slate-900">
            <div className="grid grid-cols-12 gap-2 items-center">
              
              {/* Customer Name */}
              <div className="col-span-7 flex items-center gap-1.5">
                <span className="font-extrabold uppercase text-[9.5px] text-slate-700 shrink-0">
                  Customer Name:
                </span>
                <span className="flex-1 border-b border-dotted border-slate-400 h-5 inline-block"></span>
              </div>

              {/* Date */}
              <div className="col-span-5 flex items-center gap-1.5 justify-end">
                <span className="font-extrabold uppercase text-[9.5px] text-slate-700 shrink-0">
                  Date:
                </span>
                <span className="w-32 border-b border-dotted border-slate-400 h-5 inline-block text-center font-mono font-bold text-xs pt-0.5">
                  {prefillDate ? todayFormatted : '____ / ____ / 2026'}
                </span>
              </div>

              {/* Mobile Phone */}
              <div className="col-span-7 flex items-center gap-1.5">
                <span className="font-extrabold uppercase text-[9.5px] text-slate-700 shrink-0">
                  Mobile / WhatsApp:
                </span>
                <span className="flex-1 border-b border-dotted border-slate-400 h-5 inline-block"></span>
              </div>

              {/* Rig Purpose / Platform Checklist */}
              <div className="col-span-5 flex items-center gap-2.5 justify-end text-[9.5px] font-bold text-slate-700">
                <span className="uppercase text-[8.5px] text-slate-500">Platform:</span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 border border-slate-500 rounded-sm inline-block"></span> Gaming
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 border border-slate-500 rounded-sm inline-block"></span> Editing
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 border border-slate-500 rounded-sm inline-block"></span> Office
                </span>
              </div>

              {/* Email / Delivery Timeline */}
              <div className="col-span-7 flex items-center gap-1.5 pt-0.5 border-t border-slate-200">
                <span className="font-extrabold uppercase text-[9px] text-slate-600 shrink-0">
                  Email ID:
                </span>
                <span className="flex-1 border-b border-dotted border-slate-400 h-4.5 inline-block"></span>
              </div>

              <div className="col-span-5 flex items-center gap-1.5 justify-end pt-0.5 border-t border-slate-200">
                <span className="font-extrabold uppercase text-[9px] text-slate-600 shrink-0">
                  Delivery / Build Date:
                </span>
                <span className="w-24 border-b border-dotted border-slate-400 h-4.5 inline-block text-center font-mono text-[10px]">
                  ____ / ____
                </span>
              </div>

              {/* Customer Address / Location (Adds useful compact line) */}
              <div className="col-span-12 flex items-center gap-1.5 pt-0.5 border-t border-slate-200">
                <span className="font-extrabold uppercase text-[9px] text-slate-600 shrink-0">
                  Address / City:
                </span>
                <span className="flex-1 border-b border-dotted border-slate-400 h-4.5 inline-block"></span>
              </div>

            </div>
          </div>


          {/* 3. HARDWARE SPECIFICATIONS TABLE (PRE-PRINTED CATEGORIES WITH BLANK WRITE-IN LINES) */}
          <div className="border border-slate-300 rounded-lg overflow-hidden mb-2">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`${
                  printMode === 'color' ? 'bg-slate-900 text-white' : 'bg-slate-900 text-white'
                } font-black uppercase text-[9.5px] border-b border-slate-900`}>
                  <th className="py-1.5 px-2 w-8 text-center border-r border-slate-700">#</th>
                  <th className="py-1.5 px-2.5 w-44 border-r border-slate-700">Component Category</th>
                  <th className="py-1.5 px-3 border-r border-slate-700">Exact Model / Specification (Write Below)</th>
                  <th className="py-1.5 px-2 w-12 text-center border-r border-slate-700">Qty</th>
                  <th className="py-1.5 px-2 w-18 text-center border-r border-slate-700">Warranty</th>
                  <th className="py-1.5 px-3 w-28 text-right">Price (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-900">
                {rowsToDisplay.map((item) => (
                  <tr key={item.sr} className="hover:bg-slate-50/50">
                    
                    {/* Index */}
                    <td className="py-1.5 px-2 text-center font-bold text-slate-500 border-r border-slate-200 text-[10px] align-middle">
                      {item.sr}
                    </td>

                    {/* Pre-printed Category */}
                    <td className="py-1.5 px-2.5 border-r border-slate-200 align-middle">
                      <span className={`font-black text-[11px] block leading-tight ${
                        printMode === 'color' ? 'text-slate-900' : 'text-black'
                      }`}>
                        {item.category}
                      </span>
                    </td>

                    {/* Blank Model / Specification Writing Line */}
                    <td className="py-1.5 px-3 border-r border-slate-200 align-middle">
                      <div className="w-full h-6 border-b border-dotted border-slate-400"></div>
                    </td>

                    {/* Quantity (Blank for pen by default) */}
                    <td className="py-1.5 px-2 text-center border-r border-slate-200 align-middle">
                      {prefillQtyWarranty ? (
                        <span className="font-bold text-slate-800 text-[10.5px]">{item.defaultQty || '1'}</span>
                      ) : (
                        <div className="w-8 mx-auto h-6 border-b border-dotted border-slate-400"></div>
                      )}
                    </td>

                    {/* Warranty (Blank for pen by default) */}
                    <td className="py-1.5 px-2 text-center border-r border-slate-200 align-middle">
                      {prefillQtyWarranty ? (
                        <span className="inline-block border border-slate-300 rounded px-1.5 py-0.5 bg-slate-50 text-[9px] font-bold text-slate-700">
                          {item.defaultWarranty || '_____'}
                        </span>
                      ) : (
                        <div className="w-14 mx-auto h-6 border-b border-dotted border-slate-400"></div>
                      )}
                    </td>

                    {/* Blank Price Writing Box */}
                    <td className="py-1.5 px-3 text-right align-middle font-mono font-bold text-xs">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-slate-400 font-sans text-xs">₹</span>
                        <span className="w-20 border-b border-dotted border-slate-400 h-6 inline-block"></span>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>


          {/* 4. COMPLIMENTARY STORE GIFTS & BENEFITS BANNER */}
          {includeBonusCombo && (
            <div className={`border rounded-lg py-1.5 px-2.5 mb-2 flex items-center justify-between gap-2 text-xs ${
              printMode === 'color' 
                ? 'border-emerald-500/60 bg-emerald-50/70 text-emerald-950' 
                : 'border-slate-400 bg-slate-50 text-slate-900'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-sm">🎁</span>
                <div>
                  <span className="font-extrabold uppercase text-[9.5px] tracking-wider text-emerald-800 block leading-none">
                    {storeName} {coBrand ? `& ${coBrand}` : ''} Complimentary Included Pack:
                  </span>
                  <p className="text-[9.5px] font-semibold text-slate-700 leading-tight mt-0.5">
                    • Genuine Windows 11 Pro Activated &nbsp;|&nbsp; 
                    • Professional Thermal Paste & Cable Management &nbsp;|&nbsp; 
                    • 24-Hour Stress Testing &nbsp;|&nbsp; 
                    • Gaming Mouse & Accessories Combo
                  </p>
                </div>
              </div>
              <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded shrink-0 tracking-wider ${
                printMode === 'color' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'
              }`}>
                FREE INCLUDED
              </span>
            </div>
          )}


          {/* 5. SUMMARY, GST, TOTALS & TERMS */}
          <div className="grid grid-cols-12 gap-2.5 mb-2 items-stretch">
            
            {/* Left Column: Terms, Payment Modes & Special Customer Notes */}
            <div className="col-span-7 bg-slate-50 border border-slate-300 rounded-lg p-2.5 flex flex-col justify-between text-[9.5px] leading-relaxed">
              <div>
                <span className="font-extrabold uppercase tracking-wider text-slate-700 block border-b border-slate-200 pb-0.5 mb-1 text-[9px]">
                  Terms & Conditions:
                </span>
                <ul className="text-slate-600 list-disc pl-3.5 space-y-0.5 text-[8.5px] leading-normal">
                  <li>
                    Quotation valid for <strong>{validityDays} days</strong> from date of issue, subject to component market availability.
                  </li>
                  <li>
                    Manufacturer brand warranty applicable on all individual hardware parts as per brand policy.
                  </li>
                  <li>
                    All components are 100% genuine, brand new sealed pack with official serial numbers.
                  </li>
                  <li>
                    Goods once ordered or assembled cannot be cancelled or exchanged.
                  </li>
                </ul>
              </div>

              {/* Special Customer Requests / Notes (2 clean lines to absorb extra bottom space) */}
              <div className="pt-1.5 border-t border-slate-200 space-y-1.5 text-[8.5px]">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-600 uppercase shrink-0">Special Notes:</span>
                  <span className="flex-1 border-b border-dotted border-slate-400 h-4 inline-block"></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-full border-b border-dotted border-slate-400 h-4 inline-block"></span>
                </div>
              </div>

              {/* Payment Mode Checklist */}
              <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[8.5px] font-bold text-slate-700 leading-none">
                <span className="uppercase text-slate-500">Payment:</span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 border border-slate-500 rounded-sm inline-block"></span> Cash
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 border border-slate-500 rounded-sm inline-block"></span> UPI / GPay
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 border border-slate-500 rounded-sm inline-block"></span> Card
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 border border-slate-500 rounded-sm inline-block"></span> Bank Transfer
                </span>
              </div>
            </div>

            {/* Right Column: Handwritten Price Calculation Table */}
            <div className="col-span-5 bg-slate-50 border border-slate-400 rounded-lg p-2.5 flex flex-col justify-between">
              
              <div className="space-y-1.5 text-xs">
                
                {/* Subtotal */}
                <div className="flex justify-between items-center text-slate-700 text-[10.5px]">
                  <span className="font-bold">Subtotal (Parts):</span>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400 font-sans text-xs">₹</span>
                    <span className="w-24 border-b border-dotted border-slate-500 h-4 inline-block"></span>
                  </div>
                </div>

                {/* GST (Optional) */}
                {includeGstRow && (
                  <div className="flex justify-between items-center text-slate-700 text-[10.5px]">
                    <span className="font-bold">GST (18% If Req.):</span>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400 font-sans text-xs">₹</span>
                      <span className="w-24 border-b border-dotted border-slate-500 h-4 inline-block"></span>
                    </div>
                  </div>
                )}

                {/* Special Store Discount */}
                <div className="flex justify-between items-center text-red-600 text-[10.5px]">
                  <span className="font-bold">Special Discount:</span>
                  <div className="flex items-center gap-1">
                    <span>-₹</span>
                    <span className="w-24 border-b border-dotted border-red-400 h-4 inline-block"></span>
                  </div>
                </div>

                {/* Grand Total */}
                <div className={`border-t-2 pt-1.5 pb-0.5 flex justify-between items-baseline ${
                  printMode === 'color' ? 'border-red-600' : 'border-slate-900'
                }`}>
                  <span className="text-xs font-black uppercase text-slate-900">
                    Grand Net Total:
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-black text-slate-900 font-sans">₹</span>
                    <span className="w-28 border-b-2 border-solid border-slate-900 h-5 inline-block font-mono font-black text-base text-right pr-0.5"></span>
                    <span className="text-xs font-black font-sans">/-</span>
                  </div>
                </div>

                {/* Advance Paid & Balance */}
                <div className="border-t border-dashed border-slate-300 pt-1.5 space-y-1 text-[9.5px]">
                  <div className="flex justify-between items-center text-slate-600 font-semibold">
                    <span>Advance Booking:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-sans">₹</span>
                      <span className="w-20 border-b border-dotted border-slate-400 h-3.5 inline-block"></span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-slate-800 font-bold">
                    <span>Balance Due:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-sans">₹</span>
                      <span className="w-20 border-b border-dotted border-slate-400 h-3.5 inline-block"></span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>


          {/* 6. SIGNATURES & STAMP AREA */}
          <div className="border-t border-slate-300 pt-2 grid grid-cols-2 gap-8 items-end">
            
            {/* Customer Signature */}
            <div className="text-left">
              <div className="h-10 border-b-2 border-dotted border-slate-400 mb-1 w-48"></div>
              <p className="text-[9.5px] font-bold text-slate-700 uppercase leading-none">Customer Acknowledgment Signature</p>
              <p className="text-[8.5px] text-slate-500 leading-tight mt-0.5">Confirmed & agreed with hardware configuration & pricing.</p>
            </div>

            {/* Store Authorized Signature & Physical Stamp Box */}
            <div className="text-right flex flex-col items-end">
              <div className="h-10 border border-dashed border-slate-300 rounded mb-1 w-48 flex items-center justify-center bg-slate-50/50">
                <span className="text-[8.5px] text-slate-400 uppercase tracking-widest font-mono">[ OFFICIAL STORE STAMP ]</span>
              </div>
              <p className="text-[9.5px] font-black text-slate-900 uppercase leading-none">Authorized Signatory</p>
              <p className="text-[8.5px] font-bold text-red-600 uppercase leading-none mt-0.5">
                {storeName} {coBrand ? `(${coBrand} Hubballi)` : ''}
              </p>
            </div>

          </div>


          {/* 7. MICRO FOOTER */}
          <div className="mt-2 text-center border-t border-slate-200 pt-1.5 text-[8.5px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center justify-between leading-none">
            <span className="uppercase">{storeName} • {coBrand || 'TECH BEAST'} • HUBLI</span>
            <span>BUILDING YOUR ULTIMATE BATTLESTATIONS</span>
            <span>THANK YOU FOR SHOPPING WITH US!</span>
          </div>

        </div>

      </div>

    </div>
  );
}
