import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Gift, 
  Sparkles, 
  Trophy, 
  CheckCircle, 
  Share2, 
  Calendar, 
  Phone, 
  User, 
  MapPin, 
  FileText, 
  ShoppingBag, 
  Flame, 
  Clock, 
  ShieldCheck, 
  Instagram,
  ArrowRight,
  Lock,
  KeyRound,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import SEO from '../../components/ui/SEO';
import { useSettings } from '../../contexts/SettingsContext';
import { getNextLuckyDrawTicketNumber } from '../../utils/luckyDrawSequence';

interface GiveawayPrize {
  id: string;
  rank: number;
  title: string;
  subtitle: string;
  icon?: string;
}

interface GiveawayConfig {
  activeCampaignId: string;
  campaignName: string;
  subtitle: string;
  status: 'active' | 'paused' | 'completed';
  drawDate: string;
  drawTime: string;
  roundNumber: number;
  storePin?: string;
  prizes: GiveawayPrize[];
  rules?: string[];
  bannerImageUrl?: string;
}

const DEFAULT_CONFIG: GiveawayConfig = {
  activeCampaignId: 'round_1',
  campaignName: 'Tech Beast In-Store Mega Lucky Draw',
  subtitle: 'Exclusive In-Store Customer Contest. Purchase any Laptop, Desktop, or PC & Win Exciting Gifts!',
  status: 'active',
  drawDate: 'End of Month',
  drawTime: '7:00 PM',
  roundNumber: 1,
  storePin: '7890',
  prizes: [
    { id: '1', rank: 1, title: 'RGB Mechanical Gaming Keyboard & Mouse Kit', subtitle: '1st Mega Winner', icon: '🥇' },
    { id: '2', rank: 2, title: '500GB High-Speed NVMe M.2 SSD', subtitle: '2nd Winner', icon: '🥈' },
    { id: '3', rank: 3, title: 'Tech Beast Heavy Duty Gaming Headset', subtitle: '3rd Winner', icon: '🥉' },
    { id: '4', rank: 4, title: 'Mega 8-Item Tech Beast Accessories Pack', subtitle: 'Special Winner', icon: '🎁' }
  ],
  rules: [
    'Valid exclusively for customers who purchased from Tech Beast store.',
    'A valid invoice / bill number is required for entry verification.',
    'Winners must present their original physical purchase bill at Tech Beast Hubli to collect prizes.',
    'Winners will be selected live via our automated lucky wheel draw.'
  ]
};

export default function LuckyDraw() {
  const { settings } = useSettings();
  const [config, setConfig] = useState<GiveawayConfig>(DEFAULT_CONFIG);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Store PIN Authorization Gate (Strict single-use: requires PIN on every refresh or new entry)
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [place, setPlace] = useState('');
  const [billNo, setBillNo] = useState('');
  const [itemPurchased, setItemPurchased] = useState('Used Laptop');
  const [customItem, setCustomItem] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [email, setEmail] = useState('');
  
  // Submission & Ticket State
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<{
    ticketNumber: string;
    name: string;
    phone: string;
    place: string;
    billNo: string;
    itemPurchased: string;
    campaignName: string;
    drawDate: string;
    createdAt: string;
  } | null>(null);

  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Clear any legacy session locks to ensure fresh PIN prompt on page load
    try {
      sessionStorage.removeItem('tb_store_unlocked');
      localStorage.removeItem('tb_store_unlocked');
    } catch (e) {}

    async function fetchConfig() {
      try {
        const docRef = doc(db, 'giveaway_config', 'activeCampaign');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setConfig({ ...DEFAULT_CONFIG, ...snap.data() } as GiveawayConfig);
        }
      } catch (err) {
        console.warn("Error fetching giveaway config:", err);
      } finally {
        setLoadingConfig(false);
      }
    }
    fetchConfig();
  }, []);

  const handleUnlockPin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPin = config.storePin || '7890';
    if (enteredPin.trim() === correctPin.trim()) {
      setIsUnlocked(true);
      setPinError('');
      setEnteredPin('');
    } else {
      setPinError('Invalid Store Counter PIN. Please ask store staff to unlock.');
    }
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 300);
    } catch (e) {
      // confetti fallback
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      alert("Please enter a valid 10-digit mobile number for WhatsApp verification.");
      return;
    }

    if (!name.trim() || !place.trim() || !billNo.trim()) {
      alert("Please fill in all required fields.");
      return;
    }

    const finalItem = itemPurchased === 'Other' ? (customItem.trim() || 'Store Purchase') : itemPurchased;

    setSubmitting(true);
    try {
      const ticketNumber = await getNextLuckyDrawTicketNumber();

      const entryData = {
        ticketNumber,
        campaignId: config.activeCampaignId || 'round_1',
        campaignName: config.campaignName || 'Tech Beast In-Store Mega Lucky Draw',
        roundNumber: config.roundNumber || 1,
        customerName: name.trim(),
        customerPhone: cleanPhone,
        customerEmail: email.trim() || null,
        place: place.trim(),
        billNumber: billNo.trim().toUpperCase(),
        itemPurchased: finalItem,
        purchaseDate,
        createdAt: new Date().toISOString(),
        serverTimestamp: serverTimestamp(),
        isWinner: false,
        prizeWon: null,
        verified: false
      };

      await addDoc(collection(db, 'giveaway_entries'), entryData);

      setSubmittedTicket({
        ticketNumber,
        name: name.trim(),
        phone: cleanPhone,
        place: place.trim(),
        billNo: billNo.trim().toUpperCase(),
        itemPurchased: finalItem,
        campaignName: config.campaignName || 'Tech Beast In-Store Mega Lucky Draw',
        drawDate: config.drawDate || 'End of Month',
        createdAt: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      });

      // Immediately clear inputs and lock form for next use
      setName('');
      setPhone('');
      setPlace('');
      setBillNo('');
      setCustomItem('');
      setEmail('');
      setIsUnlocked(false);
      setEnteredPin('');

      triggerConfetti();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error("Error submitting lucky draw entry:", err);
      alert("Failed to submit entry. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (!submittedTicket) return;
    const msg = [
      `🎉 *I just entered the ${submittedTicket.campaignName}!*`,
      `🎟️ *My Ticket Number:* ${submittedTicket.ticketNumber}`,
      `📌 *Bill No:* ${submittedTicket.billNo}`,
      `🎁 *Item Purchased:* ${submittedTicket.itemPurchased}`,
      `📅 *Draw Date:* ${submittedTicket.drawDate}`,
      ``,
      `Shop laptops, desktops & gaming PCs at Tech Beast Hubli and enter the lucky draw to win free gifts!`
    ].join('\n');

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-8 px-4 sm:px-6 lg:px-8">
      <SEO
        title={`${config.campaignName || 'Store Lucky Draw & Giveaway'} - Tech Beast Hubli`}
        description="Official In-Store Lucky Draw & Giveaway for Tech Beast buyers. Enter your bill details to win gaming laptops, accessories & prizes!"
      />

      <div className="max-w-4xl mx-auto space-y-8">

        {/* 1. TOP HEADER HERO BANNER */}
        <div className="text-center space-y-3 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-black uppercase tracking-wider">
            <Flame className="w-4 h-4 text-red-500 animate-pulse" />
            <span>Official In-Store Customer Contest</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900 uppercase tracking-tight">
            {config.campaignName}
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto font-medium leading-relaxed">
            {config.subtitle}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-bold text-amber-800">
              <Calendar className="w-3.5 h-3.5 text-amber-600" /> Draw: {config.drawDate} {config.drawTime ? `(${config.drawTime})` : ''}
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 100% Genuine Store Draw
            </div>
            <Link
              to="/lucky-draw/winners"
              className="flex items-center gap-1.5 px-3.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-full text-xs font-bold text-amber-900 transition"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-600" /> View Past Winners
            </Link>
          </div>
        </div>

        {/* 2. PIN AUTHORIZATION GATE (STORE STAFF UNLOCKS FOR WALK-IN CUSTOMER) */}
        {!isUnlocked && !submittedTicket && (
          <div className="max-w-md mx-auto space-y-4 animate-fade-in">
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm text-center space-y-5">
              <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto border border-red-200">
                <Lock className="w-7 h-7" />
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-slate-900 font-heading uppercase">
                  Store Staff Authorization
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Please hand this screen to the Tech Beast billing counter staff to enter the store authorization PIN.
                </p>
              </div>

              <form onSubmit={handleUnlockPin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-red-600" /> Counter Staff PIN:
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={enteredPin}
                    onChange={(e) => {
                      setEnteredPin(e.target.value);
                      setPinError('');
                    }}
                    placeholder="Enter Store PIN"
                    className="w-full text-center tracking-widest text-lg font-mono font-black bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:border-red-500 focus:bg-white focus:outline-none transition"
                    autoFocus
                  />
                </div>

                {pinError && (
                  <div className="text-xs font-bold text-red-600 flex items-center justify-center gap-1 bg-red-50 p-2.5 rounded-xl border border-red-200">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{pinError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition cursor-pointer"
                >
                  Unlock Customer Form
                </button>
              </form>

              <p className="text-[11px] text-slate-400">
                🔒 In-store security verification to ensure only genuine buyers enter the lucky draw.
              </p>

              {/* Prominent Past Winners Option Inside Card */}
              <div className="pt-3 border-t border-slate-100">
                <Link
                  to="/lucky-draw/winners"
                  className="w-full py-3 px-4 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300/80 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition group shadow-xs"
                >
                  <Trophy className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform shrink-0" />
                  <span>View Past Lucky Draw Winners</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </Link>
              </div>
            </div>

            {/* Direct Winners Banner Card Below Authorization Card */}
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 border border-amber-200 rounded-2xl p-4 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-slate-900 font-extrabold text-xs sm:text-sm">
                <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Looking for Past Lucky Draw Results?</span>
              </div>
              <p className="text-[11px] text-slate-600">
                See all announced customer winners, prizes won, and prize handover photo archives.
              </p>
              <Link
                to="/lucky-draw/winners"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 hover:text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition shadow-xs mt-1"
              >
                <span>Open Winners Gallery & Hall of Fame</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* 3. SUCCESS STATE: ISSUED DIGITAL TICKET PASS */}
        {submittedTicket ? (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white border-2 border-amber-400 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-6">
              
              <div className="w-16 h-16 bg-gradient-to-tr from-red-600 to-amber-500 rounded-2xl flex items-center justify-center mx-auto shadow-md shadow-red-500/20">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>

              <div>
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                  Entry Confirmed & Verified
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading uppercase mt-3">
                  You are officially in the draw!
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                  Take a screenshot or save this ticket. Winners will be announced live on the draw date!
                </p>
              </div>

              {/* TICKET PASS CARD */}
              <div 
                ref={ticketRef} 
                className="max-w-md mx-auto bg-slate-900 text-white border-2 border-amber-400 rounded-2xl p-6 shadow-xl relative overflow-hidden text-left"
              >
                {/* Cutout notches */}
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full" />
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full" />

                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-red-600 text-white rounded-lg flex items-center justify-center font-black text-xs font-heading">
                      TB
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase text-white tracking-wider leading-none">TECH BEAST HUBLI</h4>
                      <span className="text-[9px] text-amber-400 font-bold uppercase tracking-widest">OFFICIAL LUCKY PASS</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">{submittedTicket.createdAt}</span>
                </div>

                <div className="text-center py-2.5 bg-gradient-to-r from-red-600/30 via-amber-500/30 to-red-600/30 border border-amber-500/40 rounded-xl mb-4">
                  <span className="text-[9px] font-extrabold uppercase text-amber-300 tracking-widest block">LUCKY TICKET NUMBER</span>
                  <span className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-white">
                    {submittedTicket.ticketNumber}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Customer:</span>
                    <strong className="text-white block font-bold truncate">{submittedTicket.name}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">WhatsApp:</span>
                    <strong className="text-slate-300 font-mono block truncate">
                      {submittedTicket.phone.slice(0, 3)}••••{submittedTicket.phone.slice(-3)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Invoice / Bill:</span>
                    <strong className="text-amber-400 font-mono font-bold block">{submittedTicket.billNo}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Item Purchased:</span>
                    <strong className="text-white font-bold block truncate">{submittedTicket.itemPurchased}</strong>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">Draw Announcement:</span>
                      <span className="text-amber-400 font-black">{submittedTicket.drawDate}</span>
                    </div>
                    <p className="text-[10px] text-amber-300/80 font-medium leading-tight">
                      ⚠️ Note: Please preserve your original physical store invoice. It is required to claim the prize at Tech Beast Hubli.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleShareWhatsApp}
                  className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" /> Share Ticket on WhatsApp
                </button>
                <button
                  onClick={() => {
                    setSubmittedTicket(null);
                    setIsUnlocked(false);
                    setEnteredPin('');
                    setPinError('');
                    setName('');
                    setPhone('');
                    setPlace('');
                    setBillNo('');
                    setCustomItem('');
                    setEmail('');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  Submit Another Bill
                </button>
              </div>

            </div>
          </div>
        ) : isUnlocked && (config.status === 'paused' || config.status === 'completed') ? (
          /* 4. PAUSED BANNER */
          <div className="bg-white border border-slate-200/80 rounded-3xl p-8 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
              <Clock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 uppercase font-heading">
              Next Lucky Draw Round Starting Soon!
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Our current giveaway round is being finalized. Keep your store purchase receipts ready for the next round announcement!
            </p>
            <a
              href="/lucky-draw/winners"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition shadow-sm"
            >
              <Trophy className="w-4 h-4" /> View Past Lucky Draw Winners
            </a>
          </div>
        ) : isUnlocked ? (
          /* 5. MAIN REGISTRATION FORM & PRIZES SHOWCASE (CLEAN LIGHT DESIGN) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Form (7 Cols) */}
            <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-extrabold text-slate-900 uppercase font-heading flex items-center gap-2">
                  <Gift className="w-5 h-5 text-red-600" />
                  Fill Your Store Bill Details
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your genuine Tech Beast purchase invoice to get your official lucky ticket.
                </p>
              </div>

              {/* Mandatory Physical Bill Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
                <FileText className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-extrabold block">Mandatory Store Bill Requirement:</strong>
                  <span>Please preserve your original physical purchase bill. Winners must present their physical store bill at Tech Beast Hubli to claim their prize.</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-red-600" /> Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm font-bold focus:border-red-500 focus:bg-white focus:outline-none transition"
                  />
                </div>

                {/* WhatsApp Mobile Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-red-600" /> WhatsApp Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile number for winner alert"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm font-bold focus:border-red-500 focus:bg-white focus:outline-none transition"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    * Lucky draw winners will be contacted directly on this WhatsApp number.
                  </span>
                </div>

                {/* Place / City & Invoice Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-red-600" /> City / Town / Area *
                    </label>
                    <input
                      type="text"
                      required
                      value={place}
                      onChange={(e) => setPlace(e.target.value)}
                      placeholder="e.g. Hubli, Dharwad, Belgaum"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm font-bold focus:border-red-500 focus:bg-white focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-red-600" /> Invoice / Bill Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={billNo}
                      onChange={(e) => setBillNo(e.target.value)}
                      placeholder="e.g. TB-1048 or 4589"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm font-mono font-bold focus:border-red-500 focus:bg-white focus:outline-none transition"
                    />
                  </div>
                </div>

                {/* Item Purchased & Purchase Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-red-600" /> Item Purchased *
                    </label>
                    <select
                      value={itemPurchased}
                      onChange={(e) => setItemPurchased(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm font-bold focus:border-red-500 focus:bg-white focus:outline-none transition cursor-pointer"
                    >
                      <option value="Used Laptop">💻 Used / Refurbished Laptop</option>
                      <option value="New Laptop">✨ New Brand-New Laptop</option>
                      <option value="Custom Gaming PC">🎮 Custom Built Gaming PC</option>
                      <option value="Prebuilt Desktop PC">🖥️ Prebuilt Desktop PC</option>
                      <option value="Monitor / Display">🖥️ Monitor / Display</option>
                      <option value="Accessories / Peripherals">⌨️ Accessories / Peripherals</option>
                      <option value="Spare Parts / Upgrade">🔧 Hardware Upgrade / Spare Parts</option>
                      <option value="Other">📦 Other Store Item</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-red-600" /> Purchase Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm font-medium focus:border-red-500 focus:bg-white focus:outline-none transition"
                    />
                  </div>
                </div>

                {itemPurchased === 'Other' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Specify Item Description:
                    </label>
                    <input
                      type="text"
                      value={customItem}
                      onChange={(e) => setCustomItem(e.target.value)}
                      placeholder="e.g. Graphic Card, RAM, Power Supply"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm font-medium focus:border-red-500 focus:bg-white focus:outline-none transition"
                    />
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-extrabold text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 transition-all transform active:scale-98 disabled:opacity-50 cursor-pointer mt-2"
                >
                  <Sparkles className="w-5 h-5" />
                  {submitting ? 'Generating Lucky Ticket...' : 'Enter Lucky Draw & Get Ticket'}
                </button>

                <p className="text-[11px] text-slate-400 text-center pt-1">
                  🔒 Your mobile number is confidential and only used for lucky draw prize notifications.
                </p>

              </form>
            </div>

            {/* Right Column: Prizes & Rules Showcase (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Prize Tiers Card */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase font-heading flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    Giveaway Prizes
                  </h3>
                  <span className="text-[10px] font-black text-amber-800 uppercase bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full truncate max-w-[200px]">
                    {config.campaignName || `Contest Event`}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {config.prizes && config.prizes.length > 0 ? (
                    config.prizes.map((prize, idx) => (
                      <div 
                        key={prize.id || idx}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center gap-3.5 ${
                          prize.rank === 1 
                            ? 'bg-gradient-to-r from-amber-50 via-red-50/50 to-white border-amber-300'
                            : prize.rank === 2
                            ? 'bg-slate-50 border-slate-200'
                            : 'bg-white border-slate-200/80'
                        }`}
                      >
                        <span className="text-2xl">{prize.icon || (prize.rank === 1 ? '🥇' : prize.rank === 2 ? '🥈' : prize.rank === 3 ? '🥉' : '🎁')}</span>
                        <div className="flex-1">
                          <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider block">
                            {prize.subtitle || `Prize #${prize.rank}`}
                          </span>
                          <span className="text-xs font-extrabold text-slate-900 block">
                            {prize.title}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 py-4 text-center">Prizes will be announced shortly!</div>
                  )}
                </div>
              </div>

              {/* How It Works & Contest Rules */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-3 text-xs shadow-xs">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Contest Rules & Guidelines:
                </h4>
                <ul className="space-y-2 text-slate-600 font-medium">
                  {config.rules?.map((rule, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">•</span>
                      <span>{rule}</span>
                    </li>
                  )) || (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-red-600 font-bold">•</span>
                        <span>Open to all customers who purchased from Tech Beast store.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-600 font-bold">•</span>
                        <span>Winners must present their physical store bill to claim prizes.</span>
                      </li>
                    </>
                  )}
                </ul>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-bold">
                  <span>Tech Beast Hubli</span>
                  <a 
                    href="https://instagram.com" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-red-600 hover:underline flex items-center gap-1"
                  >
                    <Instagram className="w-3.5 h-3.5" /> Watch Live Draw
                  </a>
                </div>
              </div>

            </div>

          </div>
        ) : null}

      </div>
    </div>
  );
}
