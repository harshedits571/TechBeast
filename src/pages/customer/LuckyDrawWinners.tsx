import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Trophy, Gift, Search, Sparkles, ArrowRight, MapPin, Camera, Eye, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../../components/ui/SEO';

interface WinnerRecord {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerPhone?: string;
  place?: string;
  itemPurchased?: string;
  prizeWon: string;
  rank?: number;
  campaignName?: string;
  roundNumber?: number;
  drawnAt: string;
  photos?: string[];
  photoUrl?: string;
}

export default function LuckyDrawWinners() {
  const [winners, setWinners] = useState<WinnerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContest, setSelectedContest] = useState<string>('all');
  const [lightboxWinner, setLightboxWinner] = useState<WinnerRecord | null>(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  useEffect(() => {
    async function fetchWinners() {
      try {
        let list: WinnerRecord[] = [];
        try {
          const q = query(collection(db, 'giveaway_winners'), orderBy('drawnAt', 'desc'));
          const snap = await getDocs(q);
          list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as WinnerRecord[];
        } catch {
          const snap = await getDocs(collection(db, 'giveaway_winners'));
          list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as WinnerRecord[];
          list.sort((a, b) => new Date(b.drawnAt || 0).getTime() - new Date(a.drawnAt || 0).getTime());
        }
        setWinners(list);
      } catch (err) {
        console.warn("Error fetching winners:", err);
        setWinners([]);
      } finally {
        setLoading(false);
      }
    }
    fetchWinners();
  }, []);

  const maskPhone = (phone?: string) => {
    if (!phone) return '';
    const clean = phone.replace(/\D/g, '');
    if (clean.length < 10) return clean;
    return `${clean.slice(0, 3)} •••• ${clean.slice(-3)}`;
  };

  const filteredWinners = winners.filter(w => {
    const matchesSearch = 
      (w.customerName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (w.ticketNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (w.place?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (w.prizeWon?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (w.campaignName?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    const eventName = w.campaignName || `Round #${w.roundNumber || 1}`;
    const matchesContest = selectedContest === 'all' || eventName === selectedContest || String(w.roundNumber || 1) === selectedContest;
    return matchesSearch && matchesContest;
  });

  const uniqueContests = Array.from(new Set(winners.map(w => w.campaignName || `Round #${w.roundNumber || 1}`))).filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-8 px-4 sm:px-6 lg:px-8">
      <SEO
        title="Lucky Draw Winners & Hall of Fame - Tech Beast Hubli"
        description="Official Tech Beast Lucky Draw winners announcement list. See verified customer winners for laptops, gaming accessories, and gift hampers!"
      />

      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-3 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-black uppercase tracking-wider">
            <Trophy className="w-4 h-4 text-amber-600" />
            <span>Official Hall of Fame</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900 uppercase tracking-tight">
            Lucky Draw Winners
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto font-medium">
            Congratulations to all our lucky Tech Beast store customers who won exciting gaming gear and accessories!
          </p>

          <div className="pt-2">
            <Link
              to="/lucky-draw"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-red-600/20 transition"
            >
              <Sparkles className="w-4 h-4" /> Enter Store Lucky Draw <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search winner name, ticket no, contest..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-red-500 focus:bg-white focus:outline-none font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider whitespace-nowrap">Filter Contest:</span>
            <select
              value={selectedContest}
              onChange={(e) => setSelectedContest(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer max-w-[240px] truncate"
            >
              <option value="all">All Contests & Events</option>
              {uniqueContests.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Winners List Grid */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600 mx-auto mb-3" />
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Loading verified winners...</p>
          </div>
        ) : filteredWinners.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
              <Gift className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 uppercase">No Winners Recorded Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Our live lucky draw will take place on the scheduled draw date. Enter your purchase bill to be the first winner!
            </p>
            <Link
              to="/lucky-draw"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs uppercase"
            >
              Enter Lucky Draw Now
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredWinners.map((winner) => {
              const photos = winner.photos?.length ? winner.photos : (winner.photoUrl ? [winner.photoUrl] : []);
              const hasPhoto = photos.length > 0;

              return (
                <div 
                  key={winner.id}
                  className="bg-white border border-slate-200/80 hover:border-amber-300 hover:shadow-lg transition-all rounded-3xl p-5 shadow-xs space-y-4 relative overflow-hidden flex flex-col justify-between"
                >
                  <div className="space-y-3.5">
                    {/* Top Header info */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl select-none">
                          {winner.rank === 1 ? '🥇' : winner.rank === 2 ? '🥈' : winner.rank === 3 ? '🥉' : '🎁'}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider">
                              {winner.rank === 1 ? '1st Prize Winner' : winner.rank === 2 ? '2nd Prize Winner' : winner.rank === 3 ? '3rd Prize Winner' : 'Special Winner'}
                            </span>
                            {winner.campaignName && (
                              <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 truncate max-w-[150px]">
                                {winner.campaignName}
                              </span>
                            )}
                          </div>
                          <h4 className="text-base font-extrabold text-slate-900 truncate">{winner.customerName}</h4>
                        </div>
                      </div>

                      <span className="bg-slate-100 text-slate-800 font-mono text-[10px] font-black px-2.5 py-1 rounded-lg border border-slate-200 shrink-0">
                        {winner.ticketNumber}
                      </span>
                    </div>

                    {/* Winner Photo Thumbnail if available */}
                    {hasPhoto && (
                      <div 
                        className="relative rounded-2xl overflow-hidden group cursor-pointer border border-amber-200/80 bg-slate-950 shadow-xs"
                        onClick={() => {
                          setLightboxWinner(winner);
                          setActivePhotoIdx(0);
                        }}
                      >
                        <div className="aspect-[4/3] w-full overflow-hidden bg-slate-950 flex items-center justify-center">
                          <img 
                            src={photos[0]} 
                            alt={`Winner ${winner.customerName}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                          />
                        </div>
                        
                        {/* Overlay Badge */}
                        <div className="absolute top-2.5 right-2.5 bg-black/75 backdrop-blur-md text-amber-300 border border-amber-400/40 text-[10px] font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-md">
                          <Camera className="w-3.5 h-3.5 text-amber-400" />
                          <span>{photos.length > 1 ? `${photos.length} Photos` : 'Photo'}</span>
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                          <span className="text-[11px] font-extrabold text-white bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/30 shadow-lg">
                            <Eye className="w-3.5 h-3.5 text-amber-300" /> View Handover Photo
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Prize Banner */}
                    <div className="bg-gradient-to-r from-red-50 via-amber-50 to-red-50 border border-amber-200 rounded-2xl p-3 text-center">
                      <span className="text-[9px] font-black uppercase text-amber-800 tracking-widest block">PRIZE WON</span>
                      <strong className="text-xs sm:text-sm font-black text-slate-900 block mt-0.5">{winner.prizeWon}</strong>
                    </div>
                  </div>

                  {/* Details Footer */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-3 border-t border-slate-100 text-slate-500 font-medium">
                    {winner.place && (
                      <div className="flex items-center gap-1 truncate">
                        <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        <span className="truncate font-semibold">{winner.place}</span>
                      </div>
                    )}
                    {winner.customerPhone && (
                      <div className="text-right font-mono text-slate-700 font-bold">
                        {maskPhone(winner.customerPhone)}
                      </div>
                    )}
                    {winner.itemPurchased && (
                      <div className="col-span-2 text-[10px] text-slate-400 truncate">
                        Item Purchased: <span className="text-slate-700 font-bold">{winner.itemPurchased}</span>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* FULLSCREEN PHOTO LIGHTBOX MODAL */}
      {lightboxWinner && (() => {
        const photos = lightboxWinner.photos?.length ? lightboxWinner.photos : (lightboxWinner.photoUrl ? [lightboxWinner.photoUrl] : []);
        const currentPhoto = photos[activePhotoIdx] || photos[0];

        return (
          <div 
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in"
            onClick={() => setLightboxWinner(null)}
          >
            <div 
              className="relative max-w-3xl w-full bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Lightbox Header */}
              <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
                <div className="flex items-center gap-3">
                  <span className="text-2xl select-none">
                    {lightboxWinner.rank === 1 ? '🥇' : lightboxWinner.rank === 2 ? '🥈' : lightboxWinner.rank === 3 ? '🥉' : '🎁'}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-white">{lightboxWinner.customerName}</h3>
                      <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-bold">
                        {lightboxWinner.ticketNumber}
                      </span>
                    </div>
                    <p className="text-xs text-amber-300 font-bold mt-0.5">
                      Prize Won: {lightboxWinner.prizeWon}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setLightboxWinner(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Main Image Display */}
              <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[300px] max-h-[58vh] p-2">
                <img 
                  src={currentPhoto} 
                  alt={`Winner ${lightboxWinner.customerName}`}
                  className="max-w-full max-h-[56vh] object-contain rounded-xl shadow-2xl" 
                />

                {/* Left/Right Carousel Controls */}
                {photos.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition cursor-pointer shadow-lg"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePhotoIdx((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition cursor-pointer shadow-lg"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnail Strip if multiple photos */}
              {photos.length > 1 && (
                <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-center gap-2 overflow-x-auto">
                  {photos.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActivePhotoIdx(idx)}
                      className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition cursor-pointer shrink-0 ${
                        activePhotoIdx === idx ? 'border-amber-400 scale-105 shadow-md' : 'border-slate-700 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={p} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

    </div>
  );
}

