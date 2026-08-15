import React, { useState } from 'react';
import { MessageCircle, Phone, Wrench, X, Sparkles, MapPin, Clock } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { Link } from 'react-router-dom';

export default function FloatingContactWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { settings } = useSettings();

  const phoneRaw = settings.supportPhone || '+91 9876543210';
  // Clean phone number for WhatsApp wa.me link (digits only, include 91 prefix if applicable)
  const digitsOnly = phoneRaw.replace(/\D/g, '');
  const waNumber = digitsOnly.startsWith('91') || digitsOnly.length > 10 ? digitsOnly : `91${digitsOnly}`;
  const whatsappUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent('Hi Tech Beast, I am visiting your website and have an inquiry about custom PCs / laptops / repairs.')}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end print:hidden">
      {/* Quick Contact Expandable Box */}
      {isOpen && (
        <div className="mb-4 w-72 sm:w-80 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-md">
                    <MessageCircle className="w-5 h-5 fill-current" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full animate-ping"></span>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full"></span>
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white leading-tight">Tech Beast Support</h4>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    Hubli Store Live Help
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Close widget"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3 pt-3 border-t border-white/10 text-[11px] text-slate-300 space-y-1">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span className="truncate">Shinde Complex, C Block, Hubballi</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Mon - Sat: 11:00 AM - 8:00 PM</span>
              </div>
            </div>
          </div>

          {/* Action List */}
          <div className="p-4 space-y-2 bg-slate-50">
            {/* WhatsApp Link */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl transition-all shadow-md group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                  <MessageCircle className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider">Chat on WhatsApp</div>
                  <div className="text-[10px] text-emerald-100 font-medium">Instant reply for price & specs</div>
                </div>
              </div>
              <Sparkles className="w-4 h-4 text-emerald-200 group-hover:scale-125 transition-transform" />
            </a>

            {/* Direct Call Link */}
            <a
              href={`tel:${phoneRaw}`}
              className="flex items-center justify-between p-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-2xl transition-all shadow-sm group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Call Store Directly</div>
                  <div className="text-[10px] text-slate-500 font-medium">{phoneRaw}</div>
                </div>
              </div>
            </a>

            {/* Repair Service Link */}
            <Link
              to="/services"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between p-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-2xl transition-all shadow-sm group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Book Computer Repair</div>
                  <div className="text-[10px] text-slate-500 font-medium">Laptops, Gaming PCs & Upgrades</div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center justify-center w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none ring-4 ring-emerald-500/20"
        aria-label="Toggle contact help"
      >
        {/* Glow pulse animation behind button */}
        <span className="absolute -inset-1 rounded-full bg-emerald-400 blur opacity-40 group-hover:opacity-75 transition duration-500"></span>

        {isOpen ? (
          <X className="w-6 h-6 relative z-10" />
        ) : (
          <div className="relative z-10 flex items-center justify-center">
            <MessageCircle className="w-7 h-7 fill-current" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full"></span>
          </div>
        )}
      </button>
    </div>
  );
}
