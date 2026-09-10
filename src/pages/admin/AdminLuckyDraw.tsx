import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../lib/firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  query, 
  orderBy,
  onSnapshot 
} from 'firebase/firestore';
import { 
  Gift, 
  Trophy, 
  Sparkles, 
  RotateCw, 
  Plus, 
  Trash2, 
  Save, 
  Printer, 
  Download, 
  Search, 
  Phone, 
  CheckCircle, 
  X, 
  Volume2, 
  VolumeX, 
  Send, 
  QrCode, 
  Calendar, 
  Check, 
  Clock, 
  FileText,
  ExternalLink,
  ChevronRight,
  Maximize2,
  Minimize2,
  Tv,
  ArrowRight,
  ShieldCheck,
  Hash,
  PartyPopper,
  Crown,
  Star,
  Copy,
  MessageCircle,
  Camera,
  Image as ImageIcon,
  Eye
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { getNextLuckyDrawTicketNumber, getCurrentTicketSequence, updateTicketSequence } from '../../utils/luckyDrawSequence';
import ImageUpload from '../../components/admin/ImageUpload';
import { deleteCloudinaryImage } from '../../utils/cloudinary';

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
  rules: string[];
}

interface GiveawayEntry {
  id: string;
  ticketNumber: string;
  campaignId: string;
  campaignName?: string;
  roundNumber: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  place: string;
  billNumber: string;
  itemPurchased: string;
  purchaseDate: string;
  createdAt: string;
  isWinner?: boolean;
  prizeWon?: string | null;
  verified?: boolean;
}

interface WinnerRecord {
  id?: string;
  ticketNumber: string;
  customerName: string;
  customerPhone: string;
  place: string;
  billNumber?: string;
  itemPurchased: string;
  prizeWon: string;
  rank: number;
  roundNumber: number;
  campaignName: string;
  drawnAt: string;
  photos?: string[];
  photoUrl?: string;
}

const DEFAULT_CONFIG: GiveawayConfig = {
  activeCampaignId: 'round_1',
  campaignName: 'Tech Beast In-Store Mega Lucky Draw',
  subtitle: 'Exclusive Giveaway for our Valued Store Customers! Buy & Win Exciting Gifts.',
  status: 'active',
  drawDate: 'End of Month',
  drawTime: '7:00 PM',
  roundNumber: 1,
  storePin: '7890',
  prizes: [
    { id: '1', rank: 1, title: 'RGB Mechanical Gaming Keyboard & Mouse Kit', subtitle: '1st Grand Prize', icon: '🥇' },
    { id: '2', rank: 2, title: '500GB High-Speed NVMe M.2 SSD', subtitle: '2nd Prize', icon: '🥈' },
    { id: '3', rank: 3, title: 'Tech Beast Heavy Duty Gaming Headset', subtitle: '3rd Prize', icon: '🥉' },
    { id: '4', rank: 4, title: 'Mega 8-Item Tech Beast Accessories Pack', subtitle: '4th Prize', icon: '🎁' }
  ],
  rules: [
    'Valid exclusively for customers who purchased from Tech Beast store.',
    'A valid invoice / bill number is required for entry verification.',
    'Winners must present their physical store bill to claim prizes.',
    'Winners will be selected live via our automated lucky wheel draw.'
  ]
};

// Web Audio API Synthesizer for live tick and fanfare sound effects
const playSoundEffect = (type: 'tick' | 'win' | 'start' | 'slow_tick') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'tick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(850, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.025);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.025);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    } else if (type === 'slow_tick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.045);
    } else if (type === 'start') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(280, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(950, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'win') {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.35, ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.1 + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.5);
      });
    }
  } catch (e) {
    // Audio fallback
  }
};

// Luxury Professional 2-Tone Alternating Palette (Obsidian Black & Graphite Steel)
const LUXURY_SLICES = [
  '#131823', // Midnight Obsidian
  '#1e2538', // Dark Titanium Slate
  '#131823', // Midnight Obsidian
  '#252d42', // Deep Graphite
  '#131823', // Midnight Obsidian
  '#1f283c'  // Steel Slate
];

export default function AdminLuckyDraw() {
  const [activeTab, setActiveTab] = useState<'wheel' | 'entries' | 'standee' | 'winners' | 'campaign'>('wheel');
  const [config, setConfig] = useState<GiveawayConfig>(DEFAULT_CONFIG);
  const [entries, setEntries] = useState<GiveawayEntry[]>([]);
  const [pastWinners, setPastWinners] = useState<WinnerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Full Screen / Full Stage View
  const [isBigScreenMode, setIsBigScreenMode] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterContest, setFilterContest] = useState<string>('current');

  // Winners Archive WhatsApp Dispatcher State
  const [showWinnersWhatsAppModal, setShowWinnersWhatsAppModal] = useState(false);
  const [sentWinnerIds, setSentWinnerIds] = useState<string[]>([]);
  const [winnersRoundFilter, setWinnersRoundFilter] = useState<string>('all');

  // Winner Photos Management State
  const [editingWinnerPhoto, setEditingWinnerPhoto] = useState<WinnerRecord | null>(null);
  const [winnerPhotoList, setWinnerPhotoList] = useState<string[]>([]);
  const [isSavingWinnerPhotos, setIsSavingWinnerPhotos] = useState(false);

  // Launch New Contest Event Modal
  const [showNewContestModal, setShowNewContestModal] = useState(false);
  const [newContestName, setNewContestName] = useState('');
  const [newContestDrawDate, setNewContestDrawDate] = useState('End of Month');
  const [newContestDrawTime, setNewContestDrawTime] = useState('7:00 PM');

  // Manual Add Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [isCreatingContest, setIsCreatingContest] = useState(false);
  const [isUpdatingSeq, setIsUpdatingSeq] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustPlace, setNewCustPlace] = useState('');
  const [newBillNo, setNewBillNo] = useState('');
  const [newItemPurchased, setNewItemPurchased] = useState('Used Laptop');

  // Ticket Serial Sequence State
  const [currentSeq, setCurrentSeq] = useState<number>(1000);
  const [editingSeq, setEditingSeq] = useState<string>('1001');

  // Realistic Wheel Canvas State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bigScreenCanvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedPrizeRank, setSelectedPrizeRank] = useState<number>(1);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentWinner, setCurrentWinner] = useState<WinnerRecord | null>(null);
  const [winningEntry, setWinningEntry] = useState<GiveawayEntry | null>(null);
  const [revealFullPhone, setRevealFullPhone] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Animation angle & needle tracking
  const wheelAngleRef = useRef<number>(0);
  const needleAngleRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastTickSliceRef = useRef<number>(-1);

  const standeePrintRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Fetch initial config, entries, winners
  const fetchData = async (showLoad = true) => {
    if (showLoad) setLoading(true);

    // 1. Config
    try {
      const configDoc = await getDoc(doc(db, 'giveaway_config', 'activeCampaign'));
      if (configDoc.exists()) {
        const loadedConfig = { ...DEFAULT_CONFIG, ...configDoc.data() } as GiveawayConfig;
        setConfig(loadedConfig);
      } else {
        setConfig(DEFAULT_CONFIG);
      }
    } catch (err) {
      console.warn("Giveaway config fetch note:", err);
      setConfig(DEFAULT_CONFIG);
    }

    // 2. Entries
    try {
      let entriesList: GiveawayEntry[] = [];
      try {
        const q = query(collection(db, 'giveaway_entries'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        entriesList = snap.docs.map(d => ({ id: d.id, ...d.data() })) as GiveawayEntry[];
      } catch {
        const snap = await getDocs(collection(db, 'giveaway_entries'));
        entriesList = snap.docs.map(d => ({ id: d.id, ...d.data() })) as GiveawayEntry[];
        entriesList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      }
      setEntries(entriesList);
    } catch (err) {
      console.warn("Giveaway entries fetch note:", err);
      setEntries([]);
    }

    // 3. Winners
    try {
      let winnersList: WinnerRecord[] = [];
      try {
        const q = query(collection(db, 'giveaway_winners'), orderBy('drawnAt', 'desc'));
        const snap = await getDocs(q);
        winnersList = snap.docs.map(d => ({ id: d.id, ...d.data() })) as WinnerRecord[];
      } catch {
        const snap = await getDocs(collection(db, 'giveaway_winners'));
        winnersList = snap.docs.map(d => ({ id: d.id, ...d.data() })) as WinnerRecord[];
        winnersList.sort((a, b) => new Date(b.drawnAt || 0).getTime() - new Date(a.drawnAt || 0).getTime());
      }
      setPastWinners(winnersList);
    } catch (err) {
      console.warn("Giveaway winners fetch note:", err);
      setPastWinners([]);
    }

    // 4. Ticket Sequence
    try {
      const seq = await getCurrentTicketSequence();
      setCurrentSeq(seq);
      setEditingSeq(String(seq + 1));
    } catch (err) {
      console.warn("Giveaway ticket sequence fetch note:", err);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    // Set up real-time live sync for giveaway entries
    const qEntries = query(collection(db, 'giveaway_entries'), orderBy('createdAt', 'desc'));
    const unsubEntries = onSnapshot(qEntries, (snap) => {
      const entriesList = snap.docs.map(d => ({ id: d.id, ...d.data() })) as GiveawayEntry[];
      setEntries(entriesList);
    }, (err) => console.warn("Live giveaway entries sync:", err));

    // Set up real-time live sync for giveaway winners
    const qWinners = query(collection(db, 'giveaway_winners'), orderBy('drawnAt', 'desc'));
    const unsubWinners = onSnapshot(qWinners, (snap) => {
      const winnersList = snap.docs.map(d => ({ id: d.id, ...d.data() })) as WinnerRecord[];
      setPastWinners(winnersList);
    }, (err) => console.warn("Live giveaway winners sync:", err));

    return () => {
      unsubEntries();
      unsubWinners();
    };
  }, []);

  // Helper to match an entry with current active contest
  const matchesCurrentContest = (e: GiveawayEntry) => {
    if (e.campaignId && config.activeCampaignId && e.campaignId === config.activeCampaignId) return true;
    if (e.campaignName && config.campaignName && e.campaignName.trim().toLowerCase() === config.campaignName.trim().toLowerCase()) return true;
    if (!e.campaignId && !e.campaignName && (e.roundNumber || 1) === (config.roundNumber || 1)) return true;
    return false;
  };

  // Eligible pool for the current active contest (unwon entries in current contest)
  const eligiblePool = entries.filter(e => {
    const isCurrent = matchesCurrentContest(e);
    const notAlreadyWon = !e.isWinner;
    return isCurrent && notAlreadyWon;
  });

  // Current selected prize
  const selectedPrize = config.prizes?.find(p => p.rank === selectedPrizeRank) || config.prizes?.[0] || {
    id: '1',
    rank: 1,
    title: '1st Grand Prize',
    subtitle: '1st Prize'
  };

  // Winners in current contest
  const currentContestWinners = pastWinners.filter(w => {
    if (w.campaignName && config.campaignName && w.campaignName.trim().toLowerCase() === config.campaignName.trim().toLowerCase()) return true;
    if (!w.campaignName && (w.roundNumber || 1) === (config.roundNumber || 1)) return true;
    return false;
  });
  const currentRoundWinners = currentContestWinners;

  // Unique contest events for filter
  const uniqueContestEvents = Array.from(
    new Set(
      entries
        .map(e => e.campaignName || (e.roundNumber ? `Round #${e.roundNumber}` : null))
        .filter(Boolean)
    )
  ) as string[];

  // -------------------------------------------------------------------
  // HIGH-END LUXURY WHEEL CANVAS RENDERING
  // -------------------------------------------------------------------
  const drawWheelOnCanvas = (canvas: HTMLCanvasElement | null, angle: number, needleOffset = 0) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 32;

    ctx.clearRect(0, 0, size, size);

    // Items on the wheel
    const items = eligiblePool.length > 0 ? eligiblePool : [
      { ticketNumber: 'TB-1001', customerName: 'Waiting For' },
      { ticketNumber: 'TB-1002', customerName: 'Store Entries' },
      { ticketNumber: 'TB-1003', customerName: 'Counter Scan' },
      { ticketNumber: 'TB-1004', customerName: 'QR Code' },
      { ticketNumber: 'TB-1005', customerName: 'To Join' },
      { ticketNumber: 'TB-1006', customerName: 'Lucky Draw' }
    ];

    const numSlices = items.length;
    const sliceAngle = (2 * Math.PI) / numSlices;

    // 1. Outer Dark Bezel with Subtle Gold Rim
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, radius + 20, 0, 2 * Math.PI);
    ctx.fillStyle = '#0a0d14';
    ctx.shadowColor = '#000000cc';
    ctx.shadowBlur = 24;
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#ca8a04'; // Refined Metallic Gold
    ctx.stroke();
    ctx.restore();

    // 2. Outer Chrome Pegs
    const numPegs = Math.max(numSlices * 2, 20);
    for (let i = 0; i < numPegs; i++) {
      const pegAngle = angle + (i * (2 * Math.PI / numPegs));
      const px = center + (radius + 10) * Math.cos(pegAngle);
      const py = center + (radius + 10) * Math.sin(pegAngle);
      ctx.beginPath();
      ctx.arc(px, py, 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = i % 2 === 0 ? '#fef08a' : '#e2e8f0';
      ctx.fill();
    }

    // 3. Draw Slices (Refined 2-tone professional tones)
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(angle);

    for (let i = 0; i < numSlices; i++) {
      const startAngle = i * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();

      // Alternating luxury colors
      ctx.fillStyle = LUXURY_SLICES[i % LUXURY_SLICES.length];
      ctx.fill();

      // Subtle Gold Dividing Pinstripe
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#ca8a0440';
      ctx.stroke();

      // Slice Typography
      ctx.save();
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';

      const item = items[i];

      // Dynamic sizing based on number of slices
      const isCrowded = numSlices > 16;
      const isVeryCrowded = numSlices > 28;

      const maxChars = isVeryCrowded ? 10 : isCrowded ? 13 : 18;
      const rawName = item.customerName || 'Customer';
      const displayName = rawName.length > maxChars 
        ? rawName.slice(0, maxChars - 1) + '…' 
        : rawName;

      const nameFontSize = isVeryCrowded ? 10 : isCrowded ? 11 : 13;
      const ticketFontSize = isVeryCrowded ? 8 : isCrowded ? 9 : 10;

      // 1. Primary Line: Customer Name (Prominent, Bold & White)
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${nameFontSize}px "Plus Jakarta Sans", sans-serif`;
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(displayName, radius - 20, -2);
      
      // 2. Secondary Line: Ticket Number (Smaller below)
      ctx.font = `600 ${ticketFontSize}px "Plus Jakarta Sans", monospace, sans-serif`;
      ctx.fillStyle = '#fbbf24'; // Champagne Gold
      ctx.shadowBlur = 2;
      ctx.fillText(`${item.ticketNumber}`, radius - 20, isVeryCrowded ? 8 : 11);

      ctx.restore();
    }

    ctx.restore();

    // 4. Central Hub (Polished Dark Metal & Gold Ring)
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, 46, 0, 2 * Math.PI);
    ctx.fillStyle = '#090d16';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 14;
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#ca8a04';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(center, center, 36, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e293b';
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 18px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TB', center, center);
    ctx.restore();

    // 5. Precision Top Pointer Needle
    ctx.save();
    ctx.translate(center, 22);
    ctx.rotate(needleOffset);
    ctx.beginPath();
    ctx.moveTo(0, 32);
    ctx.lineTo(-13, -4);
    ctx.lineTo(13, -4);
    ctx.closePath();
    ctx.fillStyle = '#eab308';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Pivot
    ctx.beginPath();
    ctx.arc(0, -4, 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#854d0e';
    ctx.fill();
    ctx.restore();
  };

  const drawWheel = (angle: number, needleOffset = 0) => {
    drawWheelOnCanvas(canvasRef.current, angle, needleOffset);
    drawWheelOnCanvas(bigScreenCanvasRef.current, angle, needleOffset);
  };

  useEffect(() => {
    drawWheel(wheelAngleRef.current, needleAngleRef.current);
  }, [eligiblePool, isBigScreenMode]);

  // -------------------------------------------------------------------
  // MULTI-STAGE CELEBRATION CONFETTI & FIREWORKS CANNONS
  // -------------------------------------------------------------------
  const triggerWinnerCelebration = () => {
    try {
      // Stage 1: Big Center Golden & Emerald Explosion
      confetti({
        particleCount: 160,
        spread: 100,
        origin: { y: 0.55 },
        colors: ['#f59e0b', '#fbbf24', '#fde047', '#10b981', '#3b82f6', '#ec4899', '#ffffff']
      });

      // Stage 2: Dual Left & Right Side Cannons
      setTimeout(() => {
        confetti({
          particleCount: 90,
          angle: 60,
          spread: 80,
          origin: { x: 0.05, y: 0.7 },
          colors: ['#fbbf24', '#f59e0b', '#10b981', '#ffffff']
        });
        confetti({
          particleCount: 90,
          angle: 120,
          spread: 80,
          origin: { x: 0.95, y: 0.7 },
          colors: ['#fbbf24', '#f59e0b', '#3b82f6', '#ffffff']
        });
      }, 300);

      // Stage 3: High Fireworks Rain Burst
      setTimeout(() => {
        confetti({
          particleCount: 110,
          spread: 130,
          startVelocity: 45,
          origin: { y: 0.35 },
          colors: ['#fbbf24', '#fde047', '#e11d48', '#a855f7', '#ffffff']
        });
      }, 700);
    } catch (e) {
      // Confetti fallback
    }
  };

  // -------------------------------------------------------------------
   // REALISTIC WHEEL PHYSICS ENGINE
   // -------------------------------------------------------------------
   const startRealisticSpin = () => {
    if (eligiblePool.length === 0) {
      alert("No eligible participants in this round to spin!");
      return;
    }
    if (isSpinning) return;

    setIsSpinning(true);
    setCurrentWinner(null);
    setWinningEntry(null);
    if (soundEnabled) playSoundEffect('start');


    // 1. Pick a truly random winner from the eligible pool
    const winnerIndex = Math.floor(Math.random() * eligiblePool.length);
    const targetWinner = eligiblePool[winnerIndex];

    // Calculate target angle so the 12 o'clock needle (270° / 1.5π) lands precisely on winnerIndex slice center
    const numSlices = eligiblePool.length;
    const sliceAngle = (2 * Math.PI) / numSlices;
    const pointerAngle = 1.5 * Math.PI; // Top pointer is at 270 degrees
    const sliceCenter = winnerIndex * sliceAngle + sliceAngle / 2;
    
    // 10 Full 360° Rotations (20 * Math.PI) for realistic long spin
    const extraRotations = 10 * 2 * Math.PI;
    const currentAngle = wheelAngleRef.current;
    
    // Exact target final angle
    const targetAngle = currentAngle + extraRotations + (pointerAngle - sliceCenter - (currentAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

    const startTime = performance.now();
    const duration = 11200; // 11.2 seconds of realistic gradual deceleration

    // Quintic Ease-Out Curve: Starts fast, decelerates, and in the last 3-4s slowly crawls slice-by-slice!
    const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuint(progress);

      const newAngle = currentAngle + (targetAngle - currentAngle) * easedProgress;
      wheelAngleRef.current = newAngle;

      // Calculate slice under needle & needle mechanical deflection
      const currentSlice = Math.floor(((pointerAngle - (newAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) / sliceAngle);
      
      const sliceFraction = (((pointerAngle - (newAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) % sliceAngle) / sliceAngle;
      let needleDeflect = 0;
      if (sliceFraction < 0.25) {
        needleDeflect = -0.18 * Math.sin((sliceFraction / 0.25) * Math.PI);
      }
      needleAngleRef.current = needleDeflect;

      drawWheel(newAngle, needleDeflect);

      // Sound Tick Tracker on slice boundaries
      if (currentSlice !== lastTickSliceRef.current) {
        lastTickSliceRef.current = currentSlice;
        if (soundEnabled && progress < 0.99) {
          if (progress > 0.85) {
            playSoundEffect('slow_tick');
          } else {
            playSoundEffect('tick');
          }
        }
      }

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Spin finished! Winner selected!
        setIsSpinning(false);
        needleAngleRef.current = 0;
        drawWheel(newAngle, 0);
        setWinningEntry(targetWinner);

        const winnerRecord: WinnerRecord = {
          ticketNumber: targetWinner.ticketNumber,
          customerName: targetWinner.customerName,
          customerPhone: targetWinner.customerPhone,
          place: targetWinner.place,
          billNumber: targetWinner.billNumber,
          itemPurchased: targetWinner.itemPurchased,
          prizeWon: selectedPrize.title,
          rank: selectedPrize.rank,
          roundNumber: config.roundNumber || 1,
          campaignName: config.campaignName,
          drawnAt: new Date().toISOString()
        };

        setCurrentWinner(winnerRecord);
        if (soundEnabled) playSoundEffect('win');
        triggerWinnerCelebration();
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  // Confirm Winner & Advance to Next Prize (1st -> 2nd -> 3rd -> 4th...)
  const handleConfirmWinnerAndNext = async () => {
    if (!currentWinner || !winningEntry) return;

    try {
      // 1. Record winner to giveaway_winners
      await addDoc(collection(db, 'giveaway_winners'), currentWinner);

      // 2. Mark entry as won so they are excluded from subsequent spins
      await updateDoc(doc(db, 'giveaway_entries', winningEntry.id), {
        isWinner: true,
        prizeWon: currentWinner.prizeWon
      });

      showToast(`Recorded winner: ${currentWinner.customerName} for ${selectedPrize.subtitle}!`);

      // 3. Automatically advance to next prize rank (1st -> 2nd -> 3rd)
      const nextRank = selectedPrizeRank + 1;
      const nextPrizeExists = config.prizes?.some(p => p.rank === nextRank);
      if (nextPrizeExists) {
        setSelectedPrizeRank(nextRank);
      }

      setCurrentWinner(null);
      setWinningEntry(null);
      fetchData(false);
    } catch (err) {
      console.error(err);
      showToast("Failed to record winner");
    }
  };

  // Helper to format winner WhatsApp message
  const getWinnerWhatsAppMessage = (winner: WinnerRecord) => {
    const contestTitle = winner.campaignName || config.campaignName || `Round #${winner.roundNumber || 1}`;
    return [
      `🎉 *CONGRATULATIONS ${winner.customerName.toUpperCase()}!* 🏆`,
      ``,
      `You are the *OFFICIAL WINNER* in the *${contestTitle}*!`,
      ``,
      `🎁 *Prize Won:* ${winner.prizeWon}`,
      `🎟️ *Winning Ticket No:* ${winner.ticketNumber}`,
      `📌 *Invoice / Bill:* ${winner.billNumber || 'Store Invoice'}`,
      `🛍️ *Item Purchased:* ${winner.itemPurchased || 'Laptop / PC'}`,
      ``,
      `📍 *Prize Collection:*`,
      `Please visit the *Tech Beast Store, Hubli* with your original purchase bill to collect your prize!`,
      ``,
      `📞 *Store Helpline / WhatsApp:* +91 95352 25266`,
      `Thank you for being a valued customer of Tech Beast! 🚀`
    ].join('\n');
  };

  // Send WhatsApp Congratulations from Spin Modal
  const handleSendWinnerWhatsApp = () => {
    if (!currentWinner) return;
    handleSendIndividualWinnerWhatsApp(currentWinner);
  };

  // Send WhatsApp to individual winner from archive
  const handleSendIndividualWinnerWhatsApp = (winner: WinnerRecord) => {
    const cleanPhone = (winner.customerPhone || '').replace(/\D/g, '');
    if (!cleanPhone) {
      showToast("No valid phone number found for this winner");
      return;
    }
    const msg = getWinnerWhatsAppMessage(winner);
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    
    const wKey = winner.id || winner.ticketNumber;
    setSentWinnerIds(prev => prev.includes(wKey) ? prev : [...prev, wKey]);
    showToast(`Opening WhatsApp for ${winner.customerName}...`);
  };

  // Delete winner from database & auto-delete photos from Cloudinary
  const handleDeleteWinner = async (winner: WinnerRecord) => {
    if (!winner.id) {
      showToast("Cannot delete winner without ID");
      return;
    }
    if (!window.confirm(`Are you sure you want to remove ${winner.customerName || 'this winner'} from the winners archive? This will also delete any uploaded photos from Cloudinary.`)) return;

    try {
      // 1. Delete all Cloudinary photos associated with this winner
      const photosToDelete = [
        ...(winner.photos || []),
        ...(winner.photoUrl ? [winner.photoUrl] : [])
      ];

      const uniqueCloudinaryPhotos = Array.from(new Set(photosToDelete)).filter(url => url && url.includes('cloudinary.com'));
      
      if (uniqueCloudinaryPhotos.length > 0) {
        console.log(`Deleting ${uniqueCloudinaryPhotos.length} Cloudinary images for winner ${winner.customerName}...`);
        await Promise.allSettled(uniqueCloudinaryPhotos.map(url => deleteCloudinaryImage(url)));
      }

      // 2. Delete document from Firestore
      await deleteDoc(doc(db, 'giveaway_winners', winner.id));
      
      // 3. Instant local state update
      setPastWinners(prev => prev.filter(w => w.id !== winner.id));
      showToast(`Removed ${winner.customerName || 'winner'} & deleted photos from Cloudinary`);
      
      fetchData(false).catch(() => {});
    } catch (err) {
      console.error("Error deleting winner:", err);
      showToast("Failed to delete winner");
    }
  };

  // Copy full winners list announcement to clipboard
  const handleCopyFullWinnersAnnouncement = (winnersList: WinnerRecord[]) => {
    if (!winnersList || winnersList.length === 0) {
      showToast("No winners to copy");
      return;
    }
    const contestTitle = config.campaignName || 'Tech Beast Mega Lucky Draw';
    const lines = [
      `🏆 *TECH BEAST MEGA LUCKY DRAW — OFFICIAL WINNERS LIST* 🏆`,
      `🎉 *${contestTitle.toUpperCase()}*`,
      ``,
      `Congratulations to all our lucky winners! Here is the official list:`,
      ``,
      ...winnersList.map((w) => {
        const rankEmoji = w.rank === 1 ? '🥇 1st Prize' : w.rank === 2 ? '🥈 2nd Prize' : w.rank === 3 ? '🥉 3rd Prize' : `🎁 ${w.rank}th Prize`;
        return `${rankEmoji}: *${w.prizeWon}*\n👤 Winner: *${w.customerName}* (Ticket: ${w.ticketNumber})\n📍 Place: ${w.place || 'Hubli'}\n`;
      }),
      `📍 *Prize Collection:*`,
      `Winners are requested to visit the *Tech Beast Store, Hubli* with their original store bill to claim their prizes.`,
      ``,
      `📞 *Store Helpline / WhatsApp:* +91 95352 25266`,
      `🌐 *Tech Beast Hubli* — Laptops, Desktops, Custom PCs & Gaming`
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    showToast("📋 Full Winners Announcement copied to clipboard!");
  };

  // Open Photo Manager Modal for Winner
  const handleOpenPhotoManager = (winner: WinnerRecord) => {
    setEditingWinnerPhoto(winner);
    const existingPhotos = winner.photos?.length ? winner.photos : (winner.photoUrl ? [winner.photoUrl] : []);
    setWinnerPhotoList(existingPhotos);
  };

  // Save Winner Photos to Firestore & Local State
  const handleSaveWinnerPhotos = async () => {
    if (!editingWinnerPhoto || !editingWinnerPhoto.id) return;
    setIsSavingWinnerPhotos(true);

    try {
      // Find any images that were originally attached to this winner but removed in this session
      const originalPhotos = [
        ...(editingWinnerPhoto.photos || []),
        ...(editingWinnerPhoto.photoUrl ? [editingWinnerPhoto.photoUrl] : [])
      ];
      const removedCloudinaryPhotos = originalPhotos.filter(
        url => url && !winnerPhotoList.includes(url) && url.includes('cloudinary.com')
      );

      if (removedCloudinaryPhotos.length > 0) {
        console.log(`Deleting ${removedCloudinaryPhotos.length} removed Cloudinary photos...`);
        await Promise.allSettled(removedCloudinaryPhotos.map(url => deleteCloudinaryImage(url)));
      }

      const primaryPhoto = winnerPhotoList.length > 0 ? winnerPhotoList[0] : null;
      await updateDoc(doc(db, 'giveaway_winners', editingWinnerPhoto.id), {
        photos: winnerPhotoList,
        photoUrl: primaryPhoto
      });

      // Update local state immediately
      setPastWinners(prev => prev.map(w => {
        if (w.id === editingWinnerPhoto.id) {
          return {
            ...w,
            photos: winnerPhotoList,
            photoUrl: primaryPhoto || undefined
          };
        }
        return w;
      }));

      showToast(`📸 Photos saved for ${editingWinnerPhoto.customerName}!`);
      setEditingWinnerPhoto(null);
      setWinnerPhotoList([]);
    } catch (err) {
      console.error("Error saving winner photos:", err);
      showToast("Failed to save winner photos");
    } finally {
      setIsSavingWinnerPhotos(false);
    }
  };

  // Fullscreen Stage Toggle
  const toggleFullscreenStage = () => {
    if (!isBigScreenMode) {
      setIsBigScreenMode(true);
      try {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen?.().catch(() => {});
        }
      } catch (e) {}
    } else {
      setIsBigScreenMode(false);
      try {
        if (document.fullscreenElement) {
          document.exitFullscreen?.().catch(() => {});
        }
      } catch (e) {}
    }
  };

  // Launch New Contest Event
  const handleCreateNewContest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreatingContest) return;
    if (!newContestName.trim()) {
      showToast("Please enter a contest name");
      return;
    }

    setIsCreatingContest(true);
    try {
      const nextRound = (config.roundNumber || 1) + 1;
      const campaignSlug = newContestName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 30);
      const activeCampaignId = `${campaignSlug}_${Date.now()}`;

      const updatedConfig: GiveawayConfig = {
        ...config,
        campaignName: newContestName.trim(),
        activeCampaignId,
        roundNumber: nextRound,
        drawDate: newContestDrawDate.trim() || 'End of Month',
        drawTime: newContestDrawTime.trim() || '7:00 PM',
        status: 'active'
      };

      await setDoc(doc(db, 'giveaway_config', 'activeCampaign'), updatedConfig);
      setConfig(updatedConfig);
      setSelectedPrizeRank(1);
      setCurrentWinner(null);
      setWinningEntry(null);
      setShowNewContestModal(false);
      setNewContestName('');
      showToast(`🎉 Contest "${updatedConfig.campaignName}" is now LIVE!`);
      fetchData(false).catch(() => {});
    } catch (err) {
      console.error(err);
      showToast("Failed to launch new contest event");
    } finally {
      setIsCreatingContest(false);
    }
  };

  // Advance to Next Round / Reset
  const handleStartNextRound = () => {
    setNewContestName(`Tech Beast Mega Lucky Draw (Month ${ (config.roundNumber || 1) + 1 })`);
    setNewContestDrawDate(config.drawDate || 'End of Month');
    setNewContestDrawTime(config.drawTime || '7:00 PM');
    setShowNewContestModal(true);
  };

  // Save Settings
  const handleSaveConfig = async () => {
    if (isSavingConfig) return;
    setIsSavingConfig(true);
    try {
      await setDoc(doc(db, 'giveaway_config', 'activeCampaign'), config);
      showToast("Giveaway settings saved successfully!");
    } catch (err) {
      console.error(err);
      showToast("Failed to save settings");
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Add / Remove Prizes
  const handleAddPrize = () => {
    const nextRank = (config.prizes?.length || 0) + 1;
    const newPrize: GiveawayPrize = {
      id: Date.now().toString(),
      rank: nextRank,
      title: 'New Prize Item',
      subtitle: `${nextRank}th Prize`,
      icon: '🎁'
    };
    setConfig({
      ...config,
      prizes: [...(config.prizes || []), newPrize]
    });
  };

  const handleUpdatePrize = (idx: number, field: keyof GiveawayPrize, val: any) => {
    const updated = [...config.prizes];
    updated[idx] = { ...updated[idx], [field]: val };
    setConfig({ ...config, prizes: updated });
  };

  const handleRemovePrize = (idx: number) => {
    const updated = config.prizes.filter((_, i) => i !== idx);
    setConfig({ ...config, prizes: updated });
  };

  // Manual Add Entry
  const handleManualAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAddingEntry) return;

    if (!newCustName.trim() || !newCustPhone.trim() || !newBillNo.trim()) {
      showToast("Please fill all required fields");
      return;
    }
    const cleanPhone = newCustPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      showToast("Please enter a valid 10-digit mobile number");
      return;
    }

    setIsAddingEntry(true);

    try {
      const ticketNumber = await getNextLuckyDrawTicketNumber();

      const entryData = {
        ticketNumber,
        campaignId: config.activeCampaignId || 'round_1',
        campaignName: config.campaignName || 'Tech Beast In-Store Mega Lucky Draw',
        roundNumber: config.roundNumber || 1,
        customerName: newCustName.trim(),
        customerPhone: cleanPhone,
        place: newCustPlace.trim() || 'Hubli',
        billNumber: newBillNo.trim().toUpperCase(),
        itemPurchased: newItemPurchased,
        purchaseDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        isWinner: false,
        prizeWon: null,
        verified: true
      };

      const docRef = await addDoc(collection(db, 'giveaway_entries'), entryData);

      // Instant optimistic UI update
      const newSavedEntry: GiveawayEntry = {
        id: docRef.id,
        ...entryData
      };
      setEntries(prev => [newSavedEntry, ...prev]);

      // Update sequence display
      const match = ticketNumber.match(/(\d+)$/);
      if (match) {
        const seqNum = parseInt(match[1], 10);
        if (!isNaN(seqNum)) {
          setCurrentSeq(prev => Math.max(prev, seqNum));
          setEditingSeq(String(Math.max(currentSeq, seqNum) + 1));
        }
      }

      showToast(`✅ Ticket ${ticketNumber} added for ${newCustName}!`);
      setShowAddModal(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustPlace('');
      setNewBillNo('');
      
      // Non-blocking background sync
      fetchData(false).catch(() => {});
    } catch (err) {
      console.error(err);
      showToast("Failed to add entry. Please check connection.");
    } finally {
      setIsAddingEntry(false);
    }
  };

  // Update Ticket Sequence
  const handleUpdateTicketSequence = async () => {
    if (isUpdatingSeq) return;
    const num = parseInt(editingSeq, 10);
    if (isNaN(num) || num < 1) {
      showToast("Please enter a valid positive number");
      return;
    }
    setIsUpdatingSeq(true);
    try {
      await updateTicketSequence(num - 1);
      setCurrentSeq(num - 1);
      showToast(`Next ticket serial number set to TB-LUCKY-${String(num).padStart(4, '0')}!`);
    } catch (err) {
      console.error(err);
      showToast("Failed to update ticket sequence");
    } finally {
      setIsUpdatingSeq(false);
    }
  };

  // Toggle Verification
  const handleToggleVerify = async (entry: GiveawayEntry) => {
    try {
      const newStatus = !entry.verified;
      await updateDoc(doc(db, 'giveaway_entries', entry.id), { verified: newStatus });
      setEntries(entries.map(e => e.id === entry.id ? { ...e, verified: newStatus } : e));
      showToast(newStatus ? "Entry verified" : "Verification removed");
    } catch (err) {
      console.error(err);
      showToast("Failed to update verification");
    }
  };

  // Delete Entry
  const handleDeleteEntry = async (entryId: string, ticketNo: string) => {
    if (!window.confirm(`Delete entry ${ticketNo}?`)) return;
    try {
      await deleteDoc(doc(db, 'giveaway_entries', entryId));
      setEntries(entries.filter(e => e.id !== entryId));
      showToast(`Entry ${ticketNo} deleted`);
    } catch (err) {
      console.error(err);
      showToast("Failed to delete entry");
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (entries.length === 0) {
      showToast("No entries to export");
      return;
    }
    const headers = ["Ticket Number", "Contest Event", "Customer Name", "Phone", "City", "Bill Number", "Item Purchased", "Purchase Date", "Verified", "Winner", "Prize Won", "Date Entered"];
    const rows = entries.map(e => [
      e.ticketNumber,
      `"${e.campaignName || config.campaignName || `Round ${e.roundNumber || 1}`}"`,
      `"${e.customerName}"`,
      `"${e.customerPhone}"`,
      `"${e.place}"`,
      `"${e.billNumber}"`,
      `"${e.itemPurchased}"`,
      e.purchaseDate,
      e.verified ? "YES" : "NO",
      e.isWinner ? "YES" : "NO",
      `"${e.prizeWon || ''}"`,
      e.createdAt
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const safeName = (config.campaignName || 'LuckyDraw').replace(/[^a-zA-Z0-9]/g, '_');
    link.setAttribute("download", `TechBeast_LuckyDraw_Entries_${safeName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV file exported successfully!");
  };

  const handlePrintStandee = () => {
    window.print();
  };

  const filteredEntries = entries.filter(e => {
    const matchesSearch = 
      (e.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.customerPhone || '').includes(searchQuery) ||
      (e.ticketNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.billNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.place || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.campaignName || '').toLowerCase().includes(searchQuery.toLowerCase());

    const isCurrent = matchesCurrentContest(e);
    const eventName = e.campaignName || (e.roundNumber ? `Round #${e.roundNumber}` : 'General Contest');

    const matchesFilter = 
      filterContest === 'all' ? true :
      filterContest === 'current' ? isCurrent :
      eventName === filterContest;

    return matchesSearch && matchesFilter;
  });

  const standeeQrUrl = `${window.location.origin}/lucky-draw`;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 text-slate-100">
      
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-amber-500/40 text-amber-300 font-bold px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-fade-in">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📺 FULL PAGE / FULL STAGE VIEW (CLEAN CORPORATE BROADCAST VIEW) */}
      {/* ========================================================================= */}
      {isBigScreenMode && (
        <div className="fixed inset-0 z-[99999] bg-[#090d16] text-white flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden">
          
          {/* Top Stage Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center font-black text-amber-400 text-lg font-heading">
                TB
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider font-heading">
                  TECH BEAST HUBLI • {config.campaignName || 'OFFICIAL LUCKY DRAW'}
                </h1>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                  <span className="text-amber-400 font-bold uppercase">{config.campaignName || 'Active Contest'}</span>
                  <span>•</span>
                  <span>{eligiblePool.length} Eligible Participants</span>
                  <span>•</span>
                  <span>Draw Date: {config.drawDate}</span>
                </div>
              </div>
            </div>

            {/* Active Drawing Prize Tag */}
            <div className="hidden md:flex items-center gap-3 bg-slate-900/90 border border-slate-700/80 px-5 py-2.5 rounded-2xl shadow-sm">
              <span className="text-xl">{selectedPrize.icon || '🏆'}</span>
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
                  DRAWING FOR: {selectedPrize.subtitle.toUpperCase()}
                </span>
                <span className="text-sm font-bold text-white block">
                  {selectedPrize.title}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  soundEnabled ? 'bg-slate-800 text-amber-400 border-slate-700' : 'bg-slate-900 text-slate-600 border-slate-800'
                }`}
                title="Toggle tick sound effects"
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
              <button
                onClick={toggleFullscreenStage}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Minimize2 className="w-4 h-4" /> Exit Fullscreen
              </button>
            </div>
          </div>

          {/* Center Stage: Wheel & Spin Button */}
          <div className="flex-1 flex flex-col items-center justify-center my-auto space-y-6">
            
            {/* Small Screen Target indicator */}
            <div className="md:hidden text-center space-y-1">
              <span className="text-xs font-bold uppercase text-amber-400 tracking-wider">
                {selectedPrize.subtitle}: {selectedPrize.title}
              </span>
            </div>

            {/* Canvas Wheel */}
            <div className="relative">
              <canvas
                ref={bigScreenCanvasRef}
                width={520}
                height={520}
                className="max-w-full w-[340px] sm:w-[480px] md:w-[520px] h-[340px] sm:h-[480px] md:h-[520px] drop-shadow-2xl mx-auto"
              />
            </div>

            {/* Professional Spin Button */}
            <div>
              <button
                onClick={startRealisticSpin}
                disabled={isSpinning || eligiblePool.length === 0}
                className="px-12 sm:px-16 py-4 sm:py-4.5 bg-red-600 hover:bg-red-500 text-white font-black text-sm sm:text-base uppercase tracking-widest rounded-xl shadow-xl shadow-red-900/20 transform active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSpinning ? 'SPINNING WHEEL...' : `SPIN FOR ${selectedPrize.subtitle.toUpperCase()}`}
              </button>
            </div>
          </div>

          {/* Bottom Bar: Sequential Prize List */}
          <div className="border-t border-slate-800/80 pt-3 flex flex-wrap items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-500 uppercase text-[11px]">Prize Schedule:</span>
              <div className="flex items-center gap-1.5">
                {config.prizes?.map((p) => (
                  <span 
                    key={p.id}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                      p.rank === selectedPrizeRank 
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold' 
                        : currentRoundWinners.some(w => w.rank === p.rank)
                        ? 'bg-slate-900 text-slate-500 border border-slate-800 line-through opacity-50'
                        : 'bg-slate-900/60 text-slate-400 border border-slate-800/60'
                    }`}
                  >
                    {p.icon || '🎁'} {p.subtitle}
                  </span>
                ))}
              </div>
            </div>
            <div className="font-mono text-slate-500 text-[11px]">
              Press ESC or Exit button to return
            </div>
          </div>

          {/* PROMINENT CENTER STAGE WINNER ANNOUNCEMENT MODAL */}
          {currentWinner && (
            <div className="fixed inset-0 z-[100000] bg-slate-950/92 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-hidden select-none animate-fade-in">
              
              {/* Background Ambient Sunburst Rays & Pulsing Aura */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                {/* Rotating Sunburst Rays */}
                <div 
                  className="w-[180vw] h-[180vw] max-w-[1400px] max-h-[1400px] rounded-full animate-sunburst-spin opacity-45 mix-blend-screen pointer-events-none"
                  style={{
                    background: 'repeating-conic-gradient(from 0deg, rgba(245, 158, 11, 0.3) 0deg 10deg, transparent 10deg 20deg, rgba(234, 179, 8, 0.2) 20deg 30deg, transparent 30deg 40deg)'
                  }}
                />
                {/* Pulsing Aura Rings */}
                <div className="absolute w-[520px] h-[520px] sm:w-[700px] sm:h-[700px] rounded-full bg-gradient-to-tr from-amber-500/30 via-yellow-500/25 to-emerald-500/20 blur-3xl animate-pulse-halo pointer-events-none" />
                <div className="absolute w-[320px] h-[320px] sm:w-[450px] sm:h-[450px] rounded-full bg-amber-400/25 blur-2xl pointer-events-none opacity-40 animate-ping" style={{ animationDuration: '4s' }} />
              </div>

              {/* Floating Sparkles with staggered delays */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                <div className="absolute top-[10%] left-[12%] sm:left-[22%] text-2xl sm:text-4xl animate-float-sparkle" style={{ animationDelay: '0s' }}>✨</div>
                <div className="absolute top-[18%] right-[12%] sm:right-[22%] text-2xl sm:text-4xl animate-float-sparkle" style={{ animationDelay: '0.8s' }}>⭐</div>
                <div className="absolute bottom-[16%] left-[14%] sm:left-[24%] text-2xl sm:text-4xl animate-float-sparkle" style={{ animationDelay: '1.4s' }}>🎉</div>
                <div className="absolute bottom-[12%] right-[14%] sm:right-[24%] text-2xl sm:text-4xl animate-float-sparkle" style={{ animationDelay: '0.4s' }}>💫</div>
                <div className="absolute top-[6%] right-[38%] text-xl sm:text-3xl animate-float-sparkle" style={{ animationDelay: '1.8s' }}>👑</div>
                <div className="absolute bottom-[6%] left-[38%] text-xl sm:text-3xl animate-float-sparkle" style={{ animationDelay: '1.1s' }}>🎊</div>
              </div>

              {/* WINNER CARD CONTAINER */}
              <div className="relative z-10 bg-slate-900/95 border-2 border-amber-400/80 rounded-3xl p-6 sm:p-10 max-w-2xl w-full text-center shadow-2xl animate-winner-enter animate-beacon-glow backdrop-blur-2xl space-y-6 overflow-hidden">
                {/* Top Sheen Line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
                
                {/* Celebration Header Ribbon */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border border-amber-400/50 text-amber-300 text-xs sm:text-sm font-black uppercase tracking-widest animate-ribbon-float shadow-lg shadow-amber-500/20">
                  <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow" />
                  <span>WINNER ANNOUNCED!</span>
                  <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow" />
                </div>

                {/* Prize Rank Badge */}
                <div className="flex items-center justify-center">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-950/80 border border-slate-700 text-white text-xs sm:text-sm font-bold uppercase tracking-wider shadow-inner">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>
                      {currentWinner.rank === 1 ? '🥇 1ST PRIZE WINNER' : currentWinner.rank === 2 ? '🥈 2ND PRIZE WINNER' : currentWinner.rank === 3 ? '🥉 3RD PRIZE WINNER' : '🎁 PRIZE WINNER'}
                    </span>
                  </div>
                </div>

                {/* Prize Won Title */}
                <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight drop-shadow-md">
                  {currentWinner.prizeWon}
                </h3>

                {/* HERO WINNER NAME SPOTLIGHT */}
                <div className="bg-gradient-to-b from-slate-950/90 to-slate-900/90 rounded-2xl p-5 sm:p-7 border border-amber-500/30 shadow-inner relative overflow-hidden space-y-2">
                  <div className="text-[11px] sm:text-xs uppercase font-bold tracking-[0.25em] text-amber-400">
                    👑 CONGRATULATIONS TO 👑
                  </div>
                  
                  {/* Huge Shimmering Golden Name */}
                  <h2 className="text-3xl sm:text-5xl md:text-6xl font-black font-heading tracking-wide uppercase bg-gradient-to-r from-amber-100 via-yellow-300 via-amber-200 to-yellow-400 bg-[length:200%_auto] animate-shimmer-gold bg-clip-text text-transparent drop-shadow-[0_4px_30px_rgba(245,158,11,0.7)] py-2 leading-tight">
                    {currentWinner.customerName}
                  </h2>
                  
                  {/* Ticket Badge */}
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-slate-950 border border-amber-400/50 text-amber-300 font-mono font-black text-sm sm:text-base tracking-wider shadow-md">
                    <QrCode className="w-4 h-4 text-amber-400" />
                    <span>TICKET #{currentWinner.ticketNumber}</span>
                  </div>
                </div>

                {/* Customer Store Purchase Details */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 text-xs text-slate-300">
                  <span className="bg-slate-950/90 px-3.5 py-1.5 rounded-xl border border-slate-800 font-medium flex items-center gap-1.5 shadow-sm">
                    <span>📍</span> {currentWinner.place || 'Hubli'}
                  </span>
                  <span className="bg-slate-950/90 px-3.5 py-1.5 rounded-xl border border-slate-800 font-mono font-medium flex items-center gap-1.5 shadow-sm">
                    <span>🧾</span> Bill: {currentWinner.billNumber || 'Store Invoice'}
                  </span>
                  {currentWinner.itemPurchased && (
                    <span className="bg-slate-950/90 px-3.5 py-1.5 rounded-xl border border-slate-800 font-medium flex items-center gap-1.5 shadow-sm">
                      <span>💻</span> {currentWinner.itemPurchased}
                    </span>
                  )}
                </div>

                {/* Phone & Masking */}
                <div className="text-xs text-slate-400 flex items-center justify-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-mono text-slate-300 font-semibold">
                    {revealFullPhone ? currentWinner.customerPhone : `${currentWinner.customerPhone.slice(0, 3)}••••${currentWinner.customerPhone.slice(-3)}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setRevealFullPhone(!revealFullPhone)}
                    className="text-[10px] text-amber-400 hover:text-amber-300 underline cursor-pointer ml-1"
                  >
                    {revealFullPhone ? 'Mask' : 'Reveal'}
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    onClick={triggerWinnerCelebration}
                    className="w-full sm:w-auto px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-amber-300 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer"
                    title="Fire celebration confetti again"
                  >
                    <PartyPopper className="w-4 h-4 text-amber-400" /> Replay Confetti
                  </button>
                  <button
                    onClick={handleSendWinnerWhatsApp}
                    className="w-full sm:w-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-900/30"
                  >
                    <Send className="w-4 h-4" /> Send WhatsApp Alert
                  </button>
                  <button
                    onClick={handleConfirmWinnerAndNext}
                    className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-amber-500/20"
                  >
                    <CheckCircle className="w-4 h-4" /> Confirm & Next Prize <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>
      )}

      {/* Page Header (Standard Admin Panel) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 print:hidden">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white font-heading tracking-tight uppercase flex items-center gap-2 flex-wrap">
                In-Store Lucky Draw & Giveaways
                <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-md font-bold truncate max-w-[240px]">
                  {config.campaignName || 'Active Contest'}
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Manage store customer entries, spin the live lucky wheel, and print counter QR standees.
              </p>
            </div>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={toggleFullscreenStage}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Open full page stage view for big screen / video recording"
          >
            <Tv className="w-4 h-4 text-amber-400" /> Full Stage View
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Walk-in Entry
          </button>
          <button
            onClick={() => fetchData()}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCw className="w-4 h-4" /> Refresh
          </button>
          <a
            href="/lucky-draw"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <ExternalLink className="w-4 h-4" /> Open Store Form
          </a>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-800 overflow-x-auto print:hidden">
        <button
          onClick={() => setActiveTab('wheel')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'wheel'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" /> Spin The Wheel
        </button>
        <button
          onClick={() => setActiveTab('entries')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'entries'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <FileText className="w-4 h-4 text-slate-400" /> Customer Entries ({entries.length})
        </button>
        <button
          onClick={() => setActiveTab('standee')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'standee'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <QrCode className="w-4 h-4 text-slate-400" /> Counter QR Standee
        </button>
        <button
          onClick={() => setActiveTab('winners')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'winners'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-400" /> Winners Archive ({pastWinners.length})
        </button>
        <button
          onClick={() => setActiveTab('campaign')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'campaign'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Calendar className="w-4 h-4 text-slate-400" /> Campaign Setup & Next Round
        </button>
      </div>

      {/* ==================================================== */}
      {/* TAB 1: 🎡 PROFESSIONAL LIVE LUCKY WHEEL */}
      {/* ==================================================== */}
      {activeTab === 'wheel' && (
        <div className="space-y-6 print:hidden">
          
          {/* SEQUENTIAL PRIZE STEPPER */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" /> Prize Drawing Schedule:
              </span>
              <span className="text-slate-400 font-medium">
                <strong className="text-white">{eligiblePool.length}</strong> Participants in Current Pool
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {config.prizes?.map((prize) => {
                const isCurrent = prize.rank === selectedPrizeRank;
                const existingWinner = currentRoundWinners.find(w => w.rank === prize.rank);

                return (
                  <button
                    key={prize.id}
                    onClick={() => {
                      if (!isSpinning) setSelectedPrizeRank(prize.rank);
                    }}
                    disabled={isSpinning}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-slate-800/90 border-amber-500/50 shadow-sm'
                        : existingWinner
                        ? 'bg-slate-950/60 border-slate-800 opacity-60'
                        : 'bg-slate-950/60 border-slate-800/60 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-base">{prize.icon || '🎁'}</span>
                      {existingWinner ? (
                        <span className="text-[9px] font-bold uppercase text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Check className="w-3 h-3" /> DRAWN
                        </span>
                      ) : isCurrent ? (
                        <span className="text-[9px] font-bold uppercase text-amber-400 bg-amber-950/60 border border-amber-800/40 px-1.5 py-0.5 rounded">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="text-[9px] font-medium uppercase text-slate-500">
                          UPCOMING
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] font-bold uppercase text-amber-400 tracking-wider">
                      {prize.subtitle || `${prize.rank}th Prize`}
                    </div>
                    <div className="text-xs font-semibold text-white truncate">
                      {prize.title}
                    </div>

                    {existingWinner && (
                      <div className="text-[10px] text-emerald-400 font-medium mt-1 truncate">
                        ✓ {existingWinner.customerName}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ACTIVE PRIZE BANNER */}
          <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-slate-800 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <span>{selectedPrize.icon || '🏆'}</span>
                <span>Current Target: {selectedPrize.subtitle}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {selectedPrize.title}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  soundEnabled ? 'bg-slate-800 text-amber-400 border-slate-700' : 'bg-slate-950 text-slate-600 border-slate-800'
                }`}
                title="Toggle tick sound effects"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button
                onClick={toggleFullscreenStage}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
              >
                <Maximize2 className="w-4 h-4" /> Full Stage View
              </button>
            </div>
          </div>

          {/* MAIN STAGE: ROTATING CANVAS WHEEL */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-10 text-center relative overflow-hidden shadow-xl space-y-6">
            
            {/* Center Canvas */}
            <div className="relative inline-block mx-auto">
              <canvas
                ref={canvasRef}
                width={500}
                height={500}
                className="max-w-full w-[340px] sm:w-[460px] h-[340px] sm:h-[460px] drop-shadow-2xl mx-auto transition-transform"
              />
            </div>

            {/* BIG SPIN BUTTON */}
            <div>
              <button
                onClick={startRealisticSpin}
                disabled={isSpinning || eligiblePool.length === 0}
                className="px-10 sm:px-14 py-3.5 sm:py-4 bg-red-600 hover:bg-red-500 text-white font-bold text-sm sm:text-base uppercase tracking-wider rounded-xl shadow-lg shadow-red-900/20 transform active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSpinning ? 'SPINNING THE WHEEL...' : `SPIN FOR ${selectedPrize.subtitle.toUpperCase()}`}
              </button>
            </div>

            {/* STANDARD WINNER CELEBRATION CARD */}
            {currentWinner && (
              <div className="relative max-w-xl mx-auto rounded-3xl p-6 sm:p-8 space-y-4 animate-winner-enter animate-beacon-glow bg-slate-900/95 border-2 border-amber-400/80 shadow-2xl backdrop-blur-xl text-center overflow-hidden">
                {/* Ambient Top Sheen */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
                
                {/* Floating sparkles background glow */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden select-none opacity-30">
                  <div className="absolute -top-10 -left-10 w-48 h-48 rounded-full bg-amber-500/20 blur-2xl animate-pulse-halo" />
                  <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full bg-yellow-500/20 blur-2xl animate-pulse-halo" />
                </div>

                {/* Celebration Header Ribbon */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-widest animate-ribbon-float">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
                  <span>WINNER ANNOUNCED!</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
                </div>

                {/* Prize Rank Tag */}
                <div className="text-xs font-bold uppercase text-amber-400 tracking-wider">
                  {currentWinner.rank === 1 ? '🥇 1st Prize Winner' : currentWinner.rank === 2 ? '🥈 2nd Prize Winner' : currentWinner.rank === 3 ? '🥉 3rd Prize Winner' : 'Prize Winner'}
                </div>
                <div className="text-lg sm:text-xl font-bold text-white uppercase">{currentWinner.prizeWon}</div>

                {/* Big Winner Name Hero Box */}
                <div className="bg-gradient-to-b from-slate-950/90 to-slate-900/90 p-4 sm:p-6 rounded-2xl border border-amber-500/30 space-y-1.5 shadow-inner">
                  <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-amber-400/80 block">👑 OFFICIAL WINNER 👑</span>
                  <h3 className="text-2xl sm:text-4xl font-black font-heading uppercase tracking-wide bg-gradient-to-r from-amber-100 via-yellow-300 via-amber-200 to-yellow-400 bg-[length:200%_auto] animate-shimmer-gold bg-clip-text text-transparent drop-shadow-[0_2px_15px_rgba(245,158,11,0.6)] py-1">
                    {currentWinner.customerName}
                  </h3>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-950 border border-amber-400/40 text-amber-300 font-mono font-black text-xs sm:text-sm">
                    <QrCode className="w-3.5 h-3.5 text-amber-400" />
                    <span>Ticket #{currentWinner.ticketNumber}</span>
                  </div>
                </div>

                {/* Customer Details Grid */}
                <div className="grid grid-cols-2 gap-2.5 text-xs text-slate-300 bg-slate-950/90 p-3 rounded-xl border border-slate-800 text-left">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">WhatsApp Phone:</span>
                    <strong className="font-mono text-white">
                      {revealFullPhone ? currentWinner.customerPhone : `${currentWinner.customerPhone.slice(0, 3)}••••${currentWinner.customerPhone.slice(-3)}`}
                    </strong>
                    <button 
                      type="button" 
                      onClick={() => setRevealFullPhone(!revealFullPhone)}
                      className="text-[9px] text-amber-400 hover:underline block mt-0.5 cursor-pointer"
                    >
                      {revealFullPhone ? 'Mask Phone' : 'Reveal Full'}
                    </button>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">City & Invoice:</span>
                    <strong className="text-white block truncate">{currentWinner.place || 'Hubli'}</strong>
                    <span className="text-[10px] text-slate-400 block truncate">Bill: {currentWinner.billNumber || 'Store Invoice'}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={triggerWinnerCelebration}
                    className="w-full sm:w-auto px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    title="Fire celebration confetti again"
                  >
                    <PartyPopper className="w-3.5 h-3.5" /> Celebrate Again
                  </button>
                  <button
                    onClick={handleSendWinnerWhatsApp}
                    className="w-full sm:flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-lg shadow-emerald-900/30"
                  >
                    <Send className="w-3.5 h-3.5" /> Send WhatsApp Alert
                  </button>
                  <button
                    onClick={handleConfirmWinnerAndNext}
                    className="w-full sm:flex-1 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-lg shadow-amber-500/20"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Save & Next Prize <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: CUSTOMER ENTRIES LEDGER */}
      {/* ==================================================== */}
      {activeTab === 'entries' && (
        <div className="space-y-4 print:hidden">
          
          {/* Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">{config.campaignName || 'Current Contest'} Pool</span>
              <strong className="text-xl font-bold text-white">{eligiblePool.length}</strong>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Lifetime Entries</span>
              <strong className="text-xl font-bold text-amber-400">{entries.length}</strong>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Verified Bills</span>
              <strong className="text-xl font-bold text-emerald-400">{entries.filter(e => e.verified).length}</strong>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Winners Recorded</span>
              <strong className="text-xl font-bold text-blue-400">{pastWinners.length}</strong>
            </div>
          </div>

          {/* Search Toolbar */}
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, phone, ticket, bill, contest..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-slate-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={filterContest}
                onChange={(e) => setFilterContest(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-bold text-slate-300 focus:outline-none cursor-pointer max-w-[240px] truncate"
              >
                <option value="current">Current Contest ({config.campaignName})</option>
                <option value="all">All Contests Combined</option>
                {uniqueContestEvents.filter(ev => ev !== config.campaignName).map(ev => (
                  <option key={ev} value={ev}>{ev}</option>
                ))}
              </select>

              <button
                onClick={handleExportCSV}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
          </div>

          {/* Entries Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3">Ticket No</th>
                    <th className="p-3">Customer Name</th>
                    <th className="p-3">WhatsApp Mobile</th>
                    <th className="p-3">City / Place</th>
                    <th className="p-3">Bill / Invoice</th>
                    <th className="p-3">Item Purchased</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-center">Verified</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-medium text-slate-300">
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500 text-xs">
                        No customer entries found.
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 font-mono font-bold text-amber-400">
                          {entry.ticketNumber}
                          {entry.isWinner && (
                            <span className="ml-1.5 inline-block bg-amber-400/20 text-amber-300 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
                              WINNER
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-bold text-white">
                          {entry.customerName}
                        </td>
                        <td className="p-3 font-mono text-slate-300">
                          <a 
                            href={`https://wa.me/91${entry.customerPhone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-400 hover:underline flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" /> {entry.customerPhone}
                          </a>
                        </td>
                        <td className="p-3">{entry.place || '—'}</td>
                        <td className="p-3 font-mono text-slate-200">{entry.billNumber || '—'}</td>
                        <td className="p-3 truncate max-w-[180px]">{entry.itemPurchased || '—'}</td>
                        <td className="p-3 text-slate-400">{entry.purchaseDate || '—'}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleToggleVerify(entry)}
                            className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                              entry.verified 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                : 'bg-slate-950 text-slate-600 hover:text-slate-400'
                            }`}
                            title="Click to toggle bill verification"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeleteEntry(entry.id, entry.ticketNumber)}
                            className="p-1.5 text-red-400 hover:bg-red-950/40 rounded-lg transition cursor-pointer"
                            title="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 3: 🖨️ PRINTABLE BILLING COUNTER QR STANDEE */}
      {/* ==================================================== */}
      {activeTab === 'standee' && (
        <div className="space-y-6">
          
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl print:hidden">
            <div>
              <h3 className="text-sm font-bold text-white uppercase">In-Store Counter QR Standee</h3>
              <p className="text-xs text-slate-400">
                Print and place this standee on your store billing counter.
              </p>
            </div>
            <button
              onClick={handlePrintStandee}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print Standee Card
            </button>
          </div>

          {/* PRINTABLE A4 / DESKTOP STANDEE CARD */}
          <div className="flex justify-center">
            <div 
              ref={standeePrintRef}
              className="bg-white text-slate-900 p-8 rounded-3xl border-4 border-red-600 shadow-xl max-w-lg w-full text-center space-y-6 relative overflow-hidden"
            >
              {/* Header */}
              <div className="border-b-2 border-red-600 pb-4">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div className="w-10 h-10 bg-red-600 text-white rounded-xl flex items-center justify-center font-black text-lg font-heading">
                    TB
                  </div>
                  <h2 className="text-2xl font-black font-heading tracking-tight text-slate-900 uppercase">
                    TECH BEAST HUBLI
                  </h2>
                </div>
                <p className="text-[10px] font-black tracking-widest text-red-600 uppercase">
                  LAPTOPS • DESKTOPS • CUSTOM PCS • ACCESSORIES
                </p>
              </div>

              {/* Headline */}
              <div className="space-y-1">
                <span className="bg-red-600 text-white font-black text-[11px] uppercase px-3 py-1 rounded-full">
                  🎁 BUY & WIN CONTEST
                </span>
                <h3 className="text-3xl font-black font-heading text-slate-900 leading-tight uppercase mt-2">
                  SCAN TO ENTER MONTHLY LUCKY DRAW!
                </h3>
                <p className="text-xs text-slate-600 font-bold">
                  Purchase any Laptop, Desktop, or PC & Win Exciting Gaming Gifts!
                </p>
              </div>

              {/* QR Code */}
              <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-3xl inline-block shadow-inner">
                <QRCodeSVG
                  value={standeeQrUrl}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>

              {/* Steps */}
              <div className="grid grid-cols-3 gap-2 text-left bg-red-50/70 border border-red-200 p-3.5 rounded-2xl text-[11px]">
                <div>
                  <span className="font-black text-red-600 block text-xs">STEP 1</span>
                  <span className="font-bold text-slate-800">Scan this QR with phone camera</span>
                </div>
                <div>
                  <span className="font-black text-red-600 block text-xs">STEP 2</span>
                  <span className="font-bold text-slate-800">Ask staff to unlock & enter details</span>
                </div>
                <div>
                  <span className="font-black text-red-600 block text-xs">STEP 3</span>
                  <span className="font-bold text-slate-800">Win prizes on live draw date!</span>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-200 pt-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Visit Us: Tech Beast Hubli • Call/WhatsApp: +91 95352 25266
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 4: WINNERS ARCHIVE */}
      {/* ==================================================== */}
      {/* ==================================================== */}
      {/* TAB 4: WINNERS ARCHIVE & WHATSAPP DISPATCHER */}
      {/* ==================================================== */}
      {activeTab === 'winners' && (() => {
        const distinctWinnerCampaigns = Array.from(
          new Set(pastWinners.map(w => w.campaignName || `Round #${w.roundNumber || 1}`).filter(Boolean))
        );

        const filteredWinners = pastWinners.filter(w => {
          if (winnersRoundFilter === 'all') return true;
          const cName = w.campaignName || `Round #${w.roundNumber || 1}`;
          return cName === winnersRoundFilter;
        });

        return (
          <div className="space-y-4 print:hidden">
            {/* Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-lg">
              <div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wide">
                    Historical Winners Archive
                  </h3>
                  <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                    {pastWinners.length} Winners
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  All recorded winners from live spins. Send WhatsApp notifications individually or in batch.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Filter by Campaign/Round */}
                {distinctWinnerCampaigns.length > 1 && (
                  <select
                    value={winnersRoundFilter}
                    onChange={(e) => setWinnersRoundFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="all">All Contests / Rounds ({pastWinners.length})</option>
                    {distinctWinnerCampaigns.map((cName) => (
                      <option key={cName} value={cName}>{cName}</option>
                    ))}
                  </select>
                )}

                {/* 1-Click WhatsApp to Winners Button */}
                <button
                  type="button"
                  disabled={pastWinners.length === 0}
                  onClick={() => setShowWinnersWhatsAppModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" /> 📲 Send WhatsApp to Winners
                </button>

                {/* Copy Announcement */}
                <button
                  type="button"
                  disabled={pastWinners.length === 0}
                  onClick={() => handleCopyFullWinnersAnnouncement(filteredWinners)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  title="Copy ready-to-share announcement text for WhatsApp Status & Groups"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Announcement
                </button>

                <a
                  href="/lucky-draw/winners"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Public Page
                </a>
              </div>
            </div>

            {/* Winners Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredWinners.length === 0 ? (
                <div className="col-span-full bg-slate-900/80 border border-slate-800 rounded-2xl p-10 text-center space-y-2">
                  <Trophy className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 font-semibold">
                    {pastWinners.length === 0
                      ? "No winners recorded yet. Spin the lucky wheel in the live draw tab to record winners!"
                      : "No winners found for the selected contest filter."}
                  </p>
                </div>
              ) : (
                filteredWinners.map((winner) => {
                  const wKey = winner.id || winner.ticketNumber;
                  const isSent = sentWinnerIds.includes(wKey);
                  return (
                    <div
                      key={wKey}
                      className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl space-y-3 shadow-sm hover:shadow-md transition relative flex flex-col justify-between"
                    >
                      <div>
                        {/* Top Rank & Ticket */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl select-none">
                              {winner.rank === 1 ? '🥇' : winner.rank === 2 ? '🥈' : winner.rank === 3 ? '🥉' : '🎁'}
                            </span>
                            <div>
                              <span className="text-[10px] font-bold uppercase text-amber-400 truncate max-w-[180px] block">
                                {winner.campaignName || `Round #${winner.roundNumber || 1}`}
                              </span>
                              <h4 className="text-sm font-extrabold text-white truncate" title={winner.customerName}>
                                {winner.customerName}
                              </h4>
                            </div>
                          </div>
                          <span className="text-xs font-mono font-black text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30 shrink-0">
                            {winner.ticketNumber}
                          </span>
                        </div>

                        {/* Prize Won Banner */}
                        <div className="mt-2.5 bg-slate-950 p-2.5 rounded-xl text-xs font-bold text-slate-100 border border-slate-800/80 flex items-center justify-between">
                          <span className="text-slate-400 text-[10px] uppercase tracking-wider font-extrabold shrink-0">Prize:</span>
                          <span className="text-amber-300 font-extrabold truncate text-right ml-2">{winner.prizeWon}</span>
                        </div>

                        {/* Winner Photo Preview Thumbnail if available */}
                        {(() => {
                          const photos = winner.photos?.length ? winner.photos : (winner.photoUrl ? [winner.photoUrl] : []);
                          const hasPhotos = photos.length > 0;

                          return (
                            <div className="mt-2.5">
                              {hasPhotos ? (
                                <div 
                                  onClick={() => handleOpenPhotoManager(winner)}
                                  className="relative rounded-xl overflow-hidden group cursor-pointer border border-amber-500/30 bg-slate-950 aspect-[4/3] flex items-center justify-center shadow-xs"
                                  title="Click to manage winner photos"
                                >
                                  <img 
                                    src={photos[0]} 
                                    alt={`Winner ${winner.customerName}`}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                  <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm text-amber-300 border border-amber-400/40 text-[9px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <Camera className="w-3 h-3 text-amber-400" />
                                    <span>{photos.length} Photo{photos.length > 1 ? 's' : ''}</span>
                                  </div>
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-xs font-bold text-white bg-slate-800/90 px-3 py-1 rounded-lg border border-slate-600 flex items-center gap-1.5 shadow-lg">
                                      <Camera className="w-3.5 h-3.5 text-amber-400" /> Manage Photos
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenPhotoManager(winner)}
                                  className="w-full py-2 bg-slate-950 hover:bg-slate-800/80 border border-dashed border-slate-700 hover:border-amber-400/60 rounded-xl text-[11px] font-bold text-slate-400 hover:text-amber-300 transition flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                                  <span>+ Add Winner Photo</span>
                                </button>
                              )}
                            </div>
                          );
                        })()}

                        {/* Details Info */}
                        <div className="mt-2 space-y-1 text-[11px] text-slate-400">
                          <div className="flex items-center justify-between">
                            <span>📍 Location:</span>
                            <span className="text-slate-200 font-semibold">{winner.place || 'Hubli'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>📱 Phone:</span>
                            <span className="font-mono text-slate-200 font-bold">{winner.customerPhone}</span>
                          </div>
                          {winner.billNumber && (
                            <div className="flex items-center justify-between">
                              <span>🧾 Bill / Invoice:</span>
                              <span className="font-mono text-slate-300">{winner.billNumber}</span>
                            </div>
                          )}
                          {winner.itemPurchased && (
                            <div className="flex items-center justify-between">
                              <span>🛍️ Item Purchased:</span>
                              <span className="text-slate-300 truncate max-w-[160px] text-right">{winner.itemPurchased}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bottom Action Footer */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSendIndividualWinnerWhatsApp(winner)}
                          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                            isSent
                              ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
                          }`}
                          title={`Send WhatsApp message to ${winner.customerName}`}
                        >
                          {isSent ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                              <span>Sent</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenPhotoManager(winner)}
                          className="py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 hover:border-amber-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          title="Upload or manage ceremony photos"
                        >
                          <Camera className="w-3.5 h-3.5 text-amber-400" />
                          <span>Photos</span>
                        </button>

                        {winner.id && (
                          <button
                            type="button"
                            onClick={() => handleDeleteWinner(winner)}
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition cursor-pointer"
                            title="Remove winner from archive and delete photos from Cloudinary"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })()}

      {/* ==================================================== */}
      {/* TAB 5: CAMPAIGN SETUP & MULTI-MONTH RESET */}
      {/* ==================================================== */}
      {activeTab === 'campaign' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
          
          {/* Left: General Settings (7 Cols) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" /> Active Campaign Settings
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Campaign Title:
              </label>
              <input
                type="text"
                value={config.campaignName}
                onChange={(e) => setConfig({ ...config, campaignName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Subtitle / Offer Banner:
              </label>
              <input
                type="text"
                value={config.subtitle}
                onChange={(e) => setConfig({ ...config, subtitle: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-slate-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Draw Date Text:
                </label>
                <input
                  type="text"
                  value={config.drawDate}
                  onChange={(e) => setConfig({ ...config, drawDate: e.target.value })}
                  placeholder="e.g. 31st October 2026"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Draw Time:
                </label>
                <input
                  type="text"
                  value={config.drawTime}
                  onChange={(e) => setConfig({ ...config, drawTime: e.target.value })}
                  placeholder="e.g. 7:00 PM"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Campaign Status:
              </label>
              <select
                value={config.status}
                onChange={(e) => setConfig({ ...config, status: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="active">🟢 Active (Accepting Customer Bill Entries)</option>
                <option value="paused">🟡 Paused (Form closed, shows "Coming Soon")</option>
                <option value="completed">🔴 Completed / Drawing Finalized</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>🔑 Store Counter Staff PIN (In-Store Unlock Code):</span>
                <span className="text-[10px] text-slate-400 font-normal">Default: 7890</span>
              </label>
              <input
                type="text"
                maxLength={6}
                value={config.storePin || '7890'}
                onChange={(e) => setConfig({ ...config, storePin: e.target.value })}
                placeholder="e.g. 7890"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                * Store staff enters this PIN on customer's phone when scanning QR code to unlock the form. Prevents fake online entries.
              </span>
            </div>

            {/* Ticket Serial Sequence Settings */}
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-amber-400" /> Ticket Serial Number Sequence</span>
                <span className="text-[10px] text-slate-400 font-mono">Format: TB-LUCKY-XXXX</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-mono font-bold">TB-LUCKY-</span>
                  <input
                    type="number"
                    min="1"
                    value={editingSeq}
                    onChange={(e) => setEditingSeq(e.target.value)}
                    placeholder="1001"
                    className="w-full bg-transparent text-xs text-amber-300 font-mono font-bold focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  disabled={isUpdatingSeq}
                  onClick={handleUpdateTicketSequence}
                  className="px-4 py-2 bg-amber-600/20 hover:bg-amber-600/30 disabled:opacity-60 disabled:cursor-not-allowed text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  {isUpdatingSeq ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin text-amber-300" />
                      <span>Setting...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Set Next Ticket #</span>
                    </>
                  )}
                </button>
              </div>
              <span className="text-[10px] text-slate-400 block">
                * All new lucky draw tickets increment sequentially (e.g. 1001 → 1002 → 1003). You can set or reset the next starting number here.
              </span>
            </div>

            {/* Prize Tiers Manager */}
            <div className="border-t border-slate-800 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Prize Tiers ({config.prizes?.length || 0}):
                </label>
                <button
                  type="button"
                  onClick={handleAddPrize}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add Prize
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {config.prizes?.map((prize, idx) => (
                  <div key={prize.id || idx} className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <input
                      type="text"
                      value={prize.icon || '🎁'}
                      onChange={(e) => handleUpdatePrize(idx, 'icon', e.target.value)}
                      className="w-10 bg-slate-900 border border-slate-800 rounded p-1 text-center text-sm"
                    />
                    <input
                      type="text"
                      value={prize.subtitle}
                      onChange={(e) => handleUpdatePrize(idx, 'subtitle', e.target.value)}
                      placeholder="e.g. 1st Prize"
                      className="w-28 bg-slate-900 border border-slate-800 rounded p-1 text-xs text-amber-400 font-bold"
                    />
                    <input
                      type="text"
                      value={prize.title}
                      onChange={(e) => handleUpdatePrize(idx, 'title', e.target.value)}
                      placeholder="Prize Title"
                      className="flex-1 bg-slate-900 border border-slate-800 rounded p-1 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePrize(idx)}
                      className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                type="button"
                disabled={isSavingConfig}
                onClick={handleSaveConfig}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition border border-slate-700 cursor-pointer"
              >
                {isSavingConfig ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin text-white" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Settings</span>
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Right: Launch / Switch Contest Event (5 Cols) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" /> Launch New Contest Event
            </h3>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              When this contest or month is finished, launch a new named contest event (e.g. Diwali Special, New Year Fest). All past records stay safely archived!
            </p>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Active Contest:</span>
                <span className="font-bold text-amber-300 truncate max-w-[160px]">{config.campaignName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Draw Date:</span>
                <span className="font-bold text-white">{config.drawDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Counter QR Code:</span>
                <span className="font-bold text-emerald-400">Permanently Reused</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Past Archives:</span>
                <span className="font-bold text-blue-400">Safely Preserved</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleStartNextRound}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-red-600/20 cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Launch New Contest Event
            </button>
          </div>

        </div>
      )}

      {/* ==================================================== */}
      {/* MANUAL WALK-IN ENTRY MODAL */}
      {/* ==================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white uppercase font-heading flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                Add Walk-in Customer Entry
              </h3>
              <button 
                onClick={() => !isAddingEntry && setShowAddModal(false)} 
                disabled={isAddingEntry}
                className="text-slate-400 hover:text-white disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualAddEntry} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold uppercase mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  disabled={isAddingEntry}
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Ramesh Patil"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-medium focus:border-slate-600 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase mb-1">WhatsApp Mobile *</label>
                <input
                  type="tel"
                  required
                  disabled={isAddingEntry}
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold focus:border-slate-600 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold uppercase mb-1">City / Place</label>
                  <input
                    type="text"
                    disabled={isAddingEntry}
                    value={newCustPlace}
                    onChange={(e) => setNewCustPlace(e.target.value)}
                    placeholder="Hubli"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-medium focus:border-slate-600 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold uppercase mb-1">Bill / Invoice No *</label>
                  <input
                    type="text"
                    required
                    disabled={isAddingEntry}
                    value={newBillNo}
                    onChange={(e) => setNewBillNo(e.target.value)}
                    placeholder="TB-1049"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono font-bold focus:border-slate-600 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase mb-1">Item Purchased</label>
                <select
                  disabled={isAddingEntry}
                  value={newItemPurchased}
                  onChange={(e) => setNewItemPurchased(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-medium focus:border-slate-600 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="Used Laptop">Used Laptop</option>
                  <option value="New Laptop">New Laptop</option>
                  <option value="Custom Gaming PC">Custom Gaming PC</option>
                  <option value="Prebuilt Desktop PC">Prebuilt Desktop PC</option>
                  <option value="Monitor / Display">Monitor / Display</option>
                  <option value="Accessories / Peripherals">Accessories / Peripherals</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {isAddingEntry && (
                <div className="bg-slate-950 border border-amber-500/20 rounded-lg p-2.5 flex items-center gap-2 text-[11px] text-amber-300 animate-pulse">
                  <RotateCw className="w-3.5 h-3.5 animate-spin text-amber-400 shrink-0" />
                  <span>Generating sequential ticket & saving entry to database...</span>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={isAddingEntry}
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 font-bold rounded-lg cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingEntry}
                  className="px-5 py-2 bg-slate-100 hover:bg-white disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 font-bold rounded-lg cursor-pointer flex items-center gap-2 transition"
                >
                  {isAddingEntry ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin text-slate-900" />
                      <span>Saving Entry...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Entry</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* LAUNCH NEW CONTEST EVENT MODAL */}
      {/* ==================================================== */}
      {showNewContestModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white uppercase font-heading">
                    Launch New Contest Event
                  </h3>
                  <p className="text-xs text-slate-400">
                    Create a named lucky draw campaign for your store
                  </p>
                </div>
              </div>
              <button onClick={() => setShowNewContestModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewContest} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-200 font-bold uppercase mb-1.5 flex items-center justify-between">
                  <span>Contest / Event Name *</span>
                  <span className="text-[10px] text-slate-400 font-normal">e.g. Diwali Mega Lucky Draw 2026</span>
                </label>
                <input
                  type="text"
                  required
                  value={newContestName}
                  onChange={(e) => setNewContestName(e.target.value)}
                  placeholder="e.g. Diwali Mega Lucky Draw 2026"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white font-bold focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold uppercase mb-1">Draw Date Text</label>
                  <input
                    type="text"
                    value={newContestDrawDate}
                    onChange={(e) => setNewContestDrawDate(e.target.value)}
                    placeholder="e.g. 31st October 2026"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-semibold focus:border-slate-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold uppercase mb-1">Draw Time</label>
                  <input
                    type="text"
                    value={newContestDrawTime}
                    onChange={(e) => setNewContestDrawTime(e.target.value)}
                    placeholder="e.g. 7:00 PM"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-semibold focus:border-slate-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-1.5 text-[11px] text-slate-400">
                <p className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <Check className="w-3.5 h-3.5" /> All existing entries & past winners remain safely archived.
                </p>
                <p className="flex items-center gap-1.5 text-slate-300">
                  <Check className="w-3.5 h-3.5 text-slate-500" /> Your physical store QR standee will immediately accept entries for this new contest.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={isCreatingContest}
                  onClick={() => setShowNewContestModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 font-bold rounded-xl cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingContest}
                  className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-red-600/20 cursor-pointer flex items-center gap-2 transition"
                >
                  {isCreatingContest ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin text-white" />
                      <span>Activating Contest...</span>
                    </>
                  ) : (
                    <span>🚀 Activate & Start Contest</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* SEND WHATSAPP TO ALL WINNERS DISPATCH MODAL */}
      {/* ==================================================== */}
      {showWinnersWhatsAppModal && (() => {
        const distinctWinnerCampaigns = Array.from(
          new Set(pastWinners.map(w => w.campaignName || `Round #${w.roundNumber || 1}`).filter(Boolean))
        );

        const filteredWinners = pastWinners.filter(w => {
          if (winnersRoundFilter === 'all') return true;
          const cName = w.campaignName || `Round #${w.roundNumber || 1}`;
          return cName === winnersRoundFilter;
        });

        return (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-slate-900 border-2 border-emerald-500/60 rounded-3xl p-5 sm:p-7 max-w-2xl w-full shadow-2xl space-y-5 relative max-h-[90vh] flex flex-col">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white uppercase font-heading">
                      Send WhatsApp Message to Winners
                    </h3>
                    <p className="text-xs text-slate-400">
                      Notify all lucky draw winners of their prizes with customized WhatsApp messages
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowWinnersWhatsAppModal(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Contest Selection & Progress Summary */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Target Contest:</span>
                  <select
                    value={winnersRoundFilter}
                    onChange={(e) => setWinnersRoundFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-amber-300 font-bold text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="all">All Contests ({pastWinners.length} Winners)</option>
                    {distinctWinnerCampaigns.map((cName) => (
                      <option key={cName} value={cName}>{cName}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="text-slate-400">Progress:</span>
                  <span className="text-emerald-400">
                    {filteredWinners.filter(w => sentWinnerIds.includes(w.id || w.ticketNumber)).length} / {filteredWinners.length} Sent
                  </span>
                </div>
              </div>

              {/* Winners Queue List */}
              <div className="overflow-y-auto space-y-2.5 pr-1 flex-1">
                {filteredWinners.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No winners found in this category.
                  </div>
                ) : (
                  filteredWinners.map((winner) => {
                    const wKey = winner.id || winner.ticketNumber;
                    const isSent = sentWinnerIds.includes(wKey);
                    return (
                      <div
                        key={wKey}
                        className={`p-3.5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isSent
                            ? 'bg-slate-950/90 border-emerald-500/30'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl select-none shrink-0">
                            {winner.rank === 1 ? '🥇' : winner.rank === 2 ? '🥈' : winner.rank === 3 ? '🥉' : '🎁'}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-white">{winner.customerName}</h4>
                              <span className="text-[10px] font-mono text-amber-400 font-extrabold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                {winner.ticketNumber}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-300 font-semibold mt-0.5">
                              Prize: <span className="text-amber-300 font-bold">{winner.prizeWon}</span>
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                              📱 {winner.customerPhone} {winner.place ? `• 📍 ${winner.place}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <button
                            type="button"
                            onClick={() => handleSendIndividualWinnerWhatsApp(winner)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                              isSent
                                ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 font-extrabold'
                            }`}
                          >
                            {isSent ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                                <span>Sent Again</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-3.5 h-3.5" />
                                <span>Send WhatsApp</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Actions Footer */}
              <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                {/* Send Next Unsent Winner Quick Action */}
                {(() => {
                  const nextUnsent = filteredWinners.find(w => !sentWinnerIds.includes(w.id || w.ticketNumber));
                  return (
                    <div>
                      {nextUnsent ? (
                        <button
                          type="button"
                          onClick={() => handleSendIndividualWinnerWhatsApp(nextUnsent)}
                          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>⚡ Send Next: {nextUnsent.customerName} ({nextUnsent.ticketNumber})</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                          <CheckCircle className="w-4 h-4" />
                          <span>All winners have been notified via WhatsApp!</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyFullWinnersAnnouncement(filteredWinners)}
                    className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy Full List
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowWinnersWhatsAppModal(false)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ==================================================== */}
      {/* WINNER PHOTO MANAGEMENT MODAL */}
      {/* ==================================================== */}
      {editingWinnerPhoto && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 max-w-xl w-full shadow-2xl space-y-5 relative max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase font-heading">
                    Manage Winner Photos
                  </h3>
                  <p className="text-xs text-slate-400">
                    Upload prize distribution ceremony or handover photos
                  </p>
                </div>
              </div>
              <button 
                onClick={() => !isSavingWinnerPhotos && setEditingWinnerPhoto(null)} 
                disabled={isSavingWinnerPhotos}
                className="text-slate-400 hover:text-white cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Winner Summary Banner */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/90 flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {editingWinnerPhoto.rank === 1 ? '🥇' : editingWinnerPhoto.rank === 2 ? '🥈' : editingWinnerPhoto.rank === 3 ? '🥉' : '🎁'}
                  </span>
                  <strong className="text-sm font-black text-white">{editingWinnerPhoto.customerName}</strong>
                </div>
                <span className="text-xs text-amber-400 font-bold block mt-0.5">
                  Prize: {editingWinnerPhoto.prizeWon}
                </span>
              </div>
              <span className="font-mono text-xs text-slate-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 font-bold">
                {editingWinnerPhoto.ticketNumber}
              </span>
            </div>

            {/* Image Upload Component */}
            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Winner Ceremony & Handover Photos:
              </label>
              
              <ImageUpload
                images={winnerPhotoList}
                onChange={(newUrls) => setWinnerPhotoList(newUrls)}
                maxImages={6}
              />

              <p className="text-[11px] text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800/60 leading-relaxed">
                💡 <strong className="text-slate-300">Tip:</strong> These photos will appear on the public <span className="text-amber-400 font-bold">Lucky Draw Hall of Fame</span> (/lucky-draw/winners) with interactive full-screen zoom for customers.
              </p>
            </div>

            {/* Modal Actions Footer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                disabled={isSavingWinnerPhotos}
                onClick={() => setEditingWinnerPhoto(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 font-bold rounded-xl text-xs cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingWinnerPhotos}
                onClick={handleSaveWinnerPhotos}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-60 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer transition"
              >
                {isSavingWinnerPhotos ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Saving Photos...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Photos</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
