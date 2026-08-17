import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { 
  Printer, 
  MessageCircle, 
  Share2, 
  Check, 
  Cpu, 
  ShieldCheck, 
  Building2, 
  ArrowLeft, 
  Calendar, 
  Phone, 
  Sparkles,
  Wrench,
  Layers,
  HelpCircle
} from 'lucide-react';
import SEO from '../../components/ui/SEO';
import { useSettings } from '../../contexts/SettingsContext';

interface QuotationData {
  id?: string;
  quoteNo?: string;
  customerName?: string;
  customerPhone?: string;
  platform?: string;
  subTotal?: number;
  discountAmount?: number;
  finalPrice?: number;
  status?: string;
  createdAt?: string;
  components?: {
    cpu?: { name: string; price: number };
    motherboard?: { name: string; price: number };
    cooler?: { name: string; price: number };
    ram?: { name: string; price: number; qty?: number };
    gpu?: { name: string; price: number };
    ssd?: { name: string; price: number };
    secStorage?: { name: string; price: number };
    psu?: { name: string; price: number };
    cabinet?: { name: string; price: number };
    [key: string]: any;
  };
}

export default function QuotationView() {
  const { id } = useParams<{ id: string }>();
  const { settings } = useSettings();
  const [quote, setQuote] = useState<QuotationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchQuote() {
      if (!id) return;
      try {
        setLoading(true);
        const docRef = doc(db, 'custom_pc_requests', id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setQuote({ id: snap.id, ...snap.data() } as QuotationData);
        } else {
          setError('Quotation not found. The link may be expired or incorrect.');
        }
      } catch (err: any) {
        console.error('Error fetching quotation:', err);
        setError('Failed to load quotation.');
      } finally {
        setLoading(false);
      }
    }
    fetchQuote();
  }, [id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const storePhone = settings?.supportPhone || '+919535225266';
  const cleanPhone = storePhone.replace(/[^0-9]/g, '');

  const getWhatsAppUrl = () => {
    if (!quote) return '#';
    const quoteTitle = quote.platform ? `${quote.platform.toUpperCase()} Custom PC Quotation` : 'Custom PC Quotation';
    const msg = [
      `Hi Tech Beast Hubli Team!`,
      `I am reviewing Quotation #${quote.quoteNo || id?.toUpperCase()}:`,
      `• Platform: ${quoteTitle}`,
      `• Total Amount: ₹${Number(quote.finalPrice || 0).toLocaleString('en-IN')}`,
      `• View Specs Online: ${window.location.href}`,
      ``,
      `Please let me know part availability & delivery timeline.`
    ].join('\n');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-slate-600 font-medium text-sm">Loading Official Quotation...</p>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
          ⚠️
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Quotation Not Found</h2>
        <p className="text-slate-500 max-w-md mb-6">{error || 'This custom PC quotation does not exist.'}</p>
        <Link
          to="/custom-pc/builder"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md"
        >
          Build a New Custom PC
        </Link>
      </div>
    );
  }

  // Support both component map and component list array (from admin generator)
  let compList: Array<{ label: string; name: string; qty: number; warranty?: string; price: number; icon: string }> = [];

  if (Array.isArray((quote as any).componentsList) && (quote as any).componentsList.length > 0) {
    compList = (quote as any).componentsList
      .filter((c: any) => c.desc && c.desc.trim() !== '')
      .map((c: any) => ({
        label: c.category || 'Component',
        name: c.desc,
        qty: Number(c.qty) || 1,
        warranty: c.warranty ? `${c.warranty} Yrs` : undefined,
        price: Number(c.price) || 0,
        icon: c.category?.includes('Processor') ? '⚡' :
              c.category?.includes('Motherboard') ? '🎛️' :
              c.category?.includes('Cooler') ? '❄️' :
              c.category?.includes('RAM') ? '💾' :
              c.category?.includes('Graphics') ? '🎮' :
              c.category?.includes('SSD') ? '🚀' :
              c.category?.includes('SMPS') || c.category?.includes('Power') ? '🔌' :
              c.category?.includes('Cabinet') ? '🖥️' : '📦'
      }));
  } else {
    const rawList = [
      { label: 'Processor (CPU)', item: quote.components?.cpu, icon: '⚡' },
      { label: 'Motherboard', item: quote.components?.motherboard, icon: '🎛️' },
      { label: 'CPU Cooler', item: quote.components?.cooler, icon: '❄️' },
      { label: 'RAM Memory', item: quote.components?.ram, icon: '💾', isRam: true },
      { label: 'Graphics Card (GPU)', item: quote.components?.gpu, icon: '🎮' },
      { label: 'Primary SSD Storage', item: quote.components?.ssd, icon: '🚀' },
      { label: 'Secondary Storage', item: quote.components?.secStorage, icon: '📦' },
      { label: 'Power Supply (PSU)', item: quote.components?.psu, icon: '🔌' },
      { label: 'PC Cabinet / Case', item: quote.components?.cabinet, icon: '🖥️' },
    ].filter(c => c.item && c.item.name && !c.item.name.toLowerCase().includes('-- none'));

    compList = rawList.map(c => ({
      label: c.label,
      name: c.item.name,
      qty: c.isRam ? ((c.item as any).qty || 1) : 1,
      price: c.item.price,
      icon: c.icon
    }));
  }

  const createdDate = quote.createdAt ? new Date(quote.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }) : new Date().toLocaleDateString('en-IN');

  return (
    <div className="min-h-screen bg-slate-100 py-4 sm:py-8 px-3 sm:px-6 lg:px-8 print:p-0 print:bg-white text-slate-800 pb-20 sm:pb-8">
      <SEO
        title={`Quotation #${quote.quoteNo || id?.toUpperCase()} - Tech Beast Hubli`}
        description={`Custom PC Quotation for ${quote.customerName || 'Store Customer'} - ₹${Number(quote.finalPrice || 0).toLocaleString('en-IN')}`}
      />

      {/* Top Action Bar (Hidden when printing) */}
      <div className="max-w-4xl mx-auto mb-4 sm:mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 print:hidden">
        <Link
          to="/custom-pc/builder"
          className="inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-blue-600 transition-colors bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> PC Configurator
        </Link>

        <div className="grid grid-cols-3 sm:flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold px-3 py-2.5 rounded-xl border border-slate-200 text-xs shadow-sm transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" /> Copied!
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-slate-500" /> Share
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-black text-white font-bold px-3 py-2.5 rounded-xl text-xs shadow-md transition-all"
          >
            <Printer className="w-4 h-4" /> PDF / Print
          </button>

          <a
            href={getWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold px-3 py-2.5 rounded-xl text-xs shadow-md shadow-emerald-600/20 transition-all"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </a>
        </div>
      </div>

      {/* Main Quotation Sheet (Pristine Printable Proforma Document) */}
      <div className="max-w-4xl mx-auto bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl overflow-hidden print:shadow-none print:border-none print:rounded-none">
        
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <img src="/logo2.jpeg" alt="Tech Beast Logo" className="h-11 sm:h-14 w-auto rounded-xl object-contain bg-black/40 p-1 border border-white/20 shrink-0" />
              <div>
                <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white uppercase">TECH BEAST HUBLI</h1>
                <p className="text-[11px] sm:text-xs text-blue-200 font-medium tracking-wide">Gaming PCs • Workstations • Laptop Repairs • Hardware</p>
              </div>
            </div>

            <div className="flex sm:flex-col justify-between items-center sm:items-end bg-white/10 backdrop-blur-md p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-white/15">
              <div>
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-blue-300 block">Proforma Estimate</span>
                <span className="text-sm sm:text-lg font-mono font-black text-white">#{quote.quoteNo || id?.toUpperCase()}</span>
              </div>
              <div className="text-xs text-slate-300 flex items-center sm:justify-end gap-1 sm:mt-1">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>{createdDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer & Store Details Bar */}
        <div className="p-4 sm:p-8 border-b border-slate-100 bg-slate-50/70 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-xs sm:text-sm">
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Quotation Prepared For</span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">{quote.customerName || 'Valued Customer'}</h3>
            {quote.customerPhone && quote.customerPhone !== 'N/A' && (
              <p className="text-slate-600 flex items-center gap-1.5 text-xs mt-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> {quote.customerPhone}
              </p>
            )}
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-blue-100 text-blue-800 text-[11px] font-bold uppercase">
              <Cpu className="w-3.5 h-3.5" />
              <span>{quote.platform || 'CUSTOM'} RIG</span>
            </div>
          </div>

          <div className="sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Store Location & Inquiries</span>
            <p className="font-bold text-slate-900">Tech Beast Experience Center</p>
            <p className="text-slate-600 text-xs mt-0.5">Ground Floor, Shinde Complex, Neeligin Road,</p>
            <p className="text-slate-600 text-xs">Hubli, Karnataka 580029</p>
            <p className="text-blue-600 font-bold text-xs mt-1">Ph: +91 95352 25266 | techbeasthubli@gmail.com</p>
          </div>
        </div>

        {/* Components Section */}
        <div className="p-4 sm:p-8">
          <h2 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 sm:mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" /> Selected Hardware Specifications
          </h2>

          {/* 1. Mobile Card List View (Visible on Mobile, Hidden on Desktop & Print) */}
          <div className="sm:hidden space-y-2.5 print:hidden">
            {compList.map((comp, idx) => {
              const qty = comp.qty || 1;
              const totalCompPrice = comp.price * qty;

              return (
                <div key={idx} className="bg-slate-50/90 border border-slate-200/90 rounded-xl p-3 space-y-1.5 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <span>{comp.icon}</span>
                      <span>{comp.label}</span>
                    </span>
                    <span className="text-sm font-black text-slate-900 font-mono">
                      ₹{Number(totalCompPrice || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="text-sm font-bold text-slate-900 leading-snug">
                    {comp.name}
                  </div>

                  <div className="flex items-center gap-2 pt-0.5">
                    {qty > 1 && (
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-bold">
                        Qty: {qty}
                      </span>
                    )}
                    {comp.warranty && (
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-bold">
                        🛡️ {comp.warranty} Warranty
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Free Software Card */}
            <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-3 space-y-1 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🎁</span>
                  <span>Free Software</span>
                </span>
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded uppercase font-mono">
                  FREE
                </span>
              </div>
              <div className="text-xs font-semibold text-emerald-950">
                Windows 11 Pro Genuine License Key (Activated)
              </div>
            </div>

            {/* Free Store Gifts Card */}
            <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-3 space-y-1 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🎁</span>
                  <span>Free Store Gifts</span>
                </span>
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded uppercase font-mono">
                  FREE
                </span>
              </div>
              {(() => {
                if ((quote as any).comboName) {
                  const itemsStr = Array.isArray((quote as any).comboItems) && (quote as any).comboItems.length > 0
                    ? (quote as any).comboItems.join(', ')
                    : '';
                  return (
                    <div>
                      <strong className="text-xs text-emerald-950 block font-bold">🎉 {(quote as any).comboName}</strong>
                      {itemsStr && <p className="text-[11px] text-emerald-800 font-medium mt-0.5">{itemsStr}</p>}
                    </div>
                  );
                }
                return Number(quote.finalPrice || quote.subTotal || 0) >= 20000 ? (
                  <div>
                    <strong className="text-xs text-emerald-950 block font-bold">🎉 Special Bonus: 8 Free Accessories Pack</strong>
                    <p className="text-[11px] text-emerald-800 font-medium mt-0.5">Gaming Mouse, Keyboard, Mousepad, Headset, WiFi Dongle, Cables & Kit</p>
                  </div>
                ) : (
                  <div>
                    <strong className="text-xs text-emerald-950 block font-bold">🎁 Special Bonus: 4 Free Accessories Pack</strong>
                    <p className="text-[11px] text-emerald-800 font-medium mt-0.5">Mousepad, WiFi USB Adapter, Power Cable & Cleaning Kit</p>
                  </div>
                );
              })()}
            </div>

            {/* Free Service & Assembly Card */}
            <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl p-3 space-y-1 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🛠️</span>
                  <span>Service & Assembly</span>
                </span>
                <span className="text-[10px] font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded uppercase font-mono">
                  FREE
                </span>
              </div>
              <div className="text-xs font-semibold text-blue-950">
                Professional Cable Management, Thermal Paste & 24hr Stress Testing
              </div>
            </div>
          </div>

          {/* 2. Desktop & Print Table View (Clean A4 Document) */}
          <div className="hidden sm:block print:block border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-600 text-xs uppercase font-bold tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Component</th>
                  <th className="py-3 px-4">Hardware Specification</th>
                  <th className="py-3 px-4 text-right">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {compList.map((comp, idx) => {
                  const qty = comp.qty || 1;
                  const totalCompPrice = comp.price * qty;

                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-800 flex items-center gap-2 whitespace-nowrap">
                        <span>{comp.icon}</span>
                        <span>{comp.label}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        <div className="flex items-center gap-2">
                          <span>{comp.name}</span>
                          {qty > 1 && (
                            <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">
                              Qty: {qty}
                            </span>
                          )}
                          {comp.warranty && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">
                              {comp.warranty}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono">
                        ₹{Number(totalCompPrice || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })}

                {/* Free Included Bundles */}
                <tr className="bg-emerald-50/50">
                  <td className="py-3 px-4 font-bold text-emerald-800 flex items-center gap-2">
                    <span>🎁</span>
                    <span>Free Software</span>
                  </td>
                  <td className="py-3 px-4 text-emerald-700 text-xs font-semibold">
                    Windows 11 Pro Genuine License Key (Activated)
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-700 font-mono text-xs">
                    FREE INCLUDED
                  </td>
                </tr>

                <tr className="bg-emerald-50/50">
                  <td className="py-3 px-4 font-bold text-emerald-800 flex items-center gap-2">
                    <span>🎁</span>
                    <span>Free Store Gifts</span>
                  </td>
                  <td className="py-3 px-4 text-emerald-700 text-xs font-semibold">
                    {(() => {
                      if ((quote as any).comboName) {
                        const itemsStr = Array.isArray((quote as any).comboItems) && (quote as any).comboItems.length > 0
                          ? (quote as any).comboItems.join(', ')
                          : '';
                        return (
                          <div>
                            <strong className="text-emerald-900 block font-bold">🎉 Special Bonus: {(quote as any).comboName}</strong>
                            {itemsStr && <span className="text-[11px] text-emerald-700 font-medium">{itemsStr}</span>}
                          </div>
                        );
                      }
                      return Number(quote.finalPrice || quote.subTotal || 0) >= 20000 ? (
                        <div>
                          <strong className="text-emerald-900 block font-bold">🎉 Special Bonus: 8 Free Tech Beast Accessories Pack (Build ₹20,000+)</strong>
                          <span className="text-[11px] text-emerald-700 font-medium">Gaming Mouse, Keyboard, Mousepad, Headset, WiFi Dongle, Cables & Care Kit</span>
                        </div>
                      ) : (
                        <div>
                          <strong className="text-emerald-900 block font-bold">🎁 Special Bonus: 4 Free Tech Beast Accessories Pack (Build Under ₹20,000)</strong>
                          <span className="text-[11px] text-emerald-700 font-medium">Mousepad, WiFi USB Adapter, Power Cable & Cleaning Kit</span>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-700 font-mono text-xs">
                    FREE INCLUDED
                  </td>
                </tr>

                <tr className="bg-blue-50/50">
                  <td className="py-3 px-4 font-bold text-blue-800 flex items-center gap-2">
                    <span>🛠️</span>
                    <span>Service & Assembly</span>
                  </td>
                  <td className="py-3 px-4 text-blue-700 text-xs font-semibold">
                    Professional Cable Management, Thermal Paste Application & 24hr Stress Testing
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-blue-700 font-mono text-xs">
                    FREE COMPLIMENTARY
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pricing Calculation Summary Box */}
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5 sm:gap-6 pt-5 sm:pt-6 border-t border-slate-200">
            <div className="space-y-1.5 sm:space-y-2 max-w-sm text-xs text-slate-500">
              <div className="flex items-center gap-2 text-slate-700 font-bold">
                <ShieldCheck className="w-4 h-4 text-blue-600" /> Official Store Quotation Guarantee
              </div>
              <p>
                • Quotation valid for 7 days from the date of generation based on stock availability.
              </p>
              <p>
                • All components carry official manufacturer warranties (1 to 3+ Years).
              </p>
            </div>

            <div className="w-full sm:w-80 bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-2.5 sm:space-y-3">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Subtotal (M.R.P Total):</span>
                <span className="font-semibold text-slate-800 font-mono">
                  ₹{Number(quote.subTotal || quote.finalPrice || 0).toLocaleString('en-IN')}
                </span>
              </div>

              {(quote.discountAmount || 0) > 0 && (
                <div className="flex justify-between text-xs text-red-600 font-bold">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-red-500" /> Store Discount Offer:
                  </span>
                  <span className="font-mono">-₹{Number(quote.discountAmount).toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="pt-2.5 sm:pt-3 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-xs sm:text-sm font-black text-slate-900 uppercase">Net Total:</span>
                <span className="text-xl sm:text-2xl font-black text-blue-600 font-mono">
                  ₹{Number(quote.finalPrice || quote.subTotal || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest block text-right font-medium">
                (Inclusive of all taxes & GST)
              </span>
            </div>
          </div>

        </div>

        {/* Store Footer Banner */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <div className="p-3 bg-blue-600/20 text-blue-400 rounded-2xl border border-blue-500/30">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Ready to build or order this PC?</h4>
              <p className="text-xs text-slate-400">Visit our Hubli showroom or WhatsApp us to reserve these parts.</p>
            </div>
          </div>

          <a
            href={getWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto bg-[#25D366] hover:bg-[#128C7E] text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all print:hidden"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp Order Inquiry
          </a>
        </div>

      </div>
    </div>
  );
}
