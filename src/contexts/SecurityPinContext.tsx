import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { ShieldAlert, Lock, KeyRound, Eye, EyeOff, X, CheckCircle, AlertTriangle, RotateCw, Trash2 } from 'lucide-react';
import { useSettings } from './SettingsContext';

export interface PinConfirmOptions {
  title?: string;
  description?: string;
  itemName?: string;
  confirmText?: string;
  dangerLevel?: 'danger' | 'warning';
  onConfirm: () => Promise<void> | void;
}

interface SecurityPinContextType {
  confirmWithPin: (options: PinConfirmOptions) => void;
  adminSecurityPin: string;
}

const SecurityPinContext = createContext<SecurityPinContextType | null>(null);

export const SecurityPinProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = useSettings();
  const configuredPin = settings.adminSecurityPin || '1234';

  const [isOpen, setIsOpen] = useState(false);
  const [modalOptions, setModalOptions] = useState<PinConfirmOptions | null>(null);
  
  // 4 individual digit boxes for smooth OTP-style typing
  const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', '']);
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  const confirmWithPin = (options: PinConfirmOptions) => {
    setModalOptions(options);
    setPinDigits(['', '', '', '']);
    setErrorMsg(null);
    setIsShaking(false);
    setIsProcessing(false);
    setShowPin(false);
    setIsOpen(true);
  };

  // Auto-focus first input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRefs[0]?.current?.focus();
        inputRefs[0]?.current?.select();
      }, 100);
    }
  }, [isOpen]);

  const handleDigitChange = (index: number, val: string) => {
    setErrorMsg(null);
    const cleaned = val.replace(/\D/g, '');

    // Handle full 4-digit paste
    if (cleaned.length >= 4) {
      const pasted = cleaned.slice(0, 4).split('');
      setPinDigits(pasted);
      inputRefs[3]?.current?.focus();
      return;
    }

    const digit = cleaned.slice(-1);
    const newDigits = [...pinDigits];
    newDigits[index] = digit;
    setPinDigits(newDigits);

    if (digit && index < 3) {
      inputRefs[index + 1]?.current?.focus();
      inputRefs[index + 1]?.current?.select();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!pinDigits[index] && index > 0) {
        const newDigits = [...pinDigits];
        newDigits[index - 1] = '';
        setPinDigits(newDigits);
        inputRefs[index - 1]?.current?.focus();
      } else {
        const newDigits = [...pinDigits];
        newDigits[index] = '';
        setPinDigits(newDigits);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs[index - 1]?.current?.focus();
    } else if (e.key === 'ArrowRight' && index < 3) {
      inputRefs[index + 1]?.current?.focus();
    } else if (e.key === 'Escape' && !isProcessing) {
      handleClose();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      executeVerification();
    }
  };

  const handleClose = () => {
    if (isProcessing) return;
    setIsOpen(false);
    setModalOptions(null);
    setPinDigits(['', '', '', '']);
    setErrorMsg(null);
  };

  const executeVerification = async () => {
    const entered = pinDigits.join('');
    if (entered.length < 4) {
      setErrorMsg('Please enter the full 4-digit security PIN.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    if (entered !== configuredPin) {
      setErrorMsg('Incorrect Security PIN! Check Admin Settings.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setPinDigits(['', '', '', '']);
      inputRefs[0]?.current?.focus();
      return;
    }

    if (!modalOptions?.onConfirm) {
      handleClose();
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMsg(null);
      await modalOptions.onConfirm();
      setIsOpen(false);
      setModalOptions(null);
    } catch (err: any) {
      console.error("Error executing confirmed action:", err);
      setErrorMsg(err?.message || 'Action failed to execute. Check your permissions.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SecurityPinContext.Provider value={{ confirmWithPin, adminSecurityPin: configuredPin }}>
      {children}

      {/* Global Security PIN Confirmation Modal */}
      {isOpen && modalOptions && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fade-in">
          <div 
            className={`bg-[#111318] border border-red-500/30 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 relative transition-transform ${
              isShaking ? 'animate-shake' : ''
            }`}
          >
            {/* Top Close Button */}
            <button
              onClick={handleClose}
              disabled={isProcessing}
              className="absolute top-5 right-5 text-slate-400 hover:text-white transition disabled:opacity-50 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Icon & Title */}
            <div className="flex items-center gap-3.5 border-b border-white/10 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white uppercase tracking-wide">
                  {modalOptions.title || 'Security PIN Required'}
                </h3>
                <span className="text-[11px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20 inline-block mt-0.5">
                  Protected Delete Action
                </span>
              </div>
            </div>

            {/* Description & Target Item Preview */}
            <div className="space-y-2">
              <p className="text-xs text-slate-300 leading-relaxed">
                {modalOptions.description || 'To prevent accidental data loss, please enter your 4-digit Admin PIN to confirm permanent deletion.'}
              </p>

              {modalOptions.itemName && (
                <div className="bg-slate-950/90 border border-white/10 p-3 rounded-xl flex items-center gap-2.5">
                  <Trash2 className="w-4 h-4 text-red-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Target to delete:</span>
                    <strong className="text-xs text-white truncate block">{modalOptions.itemName}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* 4-Digit PIN Input Area */}
            <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-white/5 text-center">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <KeyRound className="w-3.5 h-3.5" /> Enter 4-Digit PIN:
                </label>
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
                >
                  {showPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showPin ? 'Hide' : 'Show'}</span>
                </button>
              </div>

              {/* 4 PIN Digit Boxes */}
              <div className="flex justify-center items-center gap-3">
                {pinDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={inputRefs[idx]}
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    disabled={isProcessing}
                    className={`w-12 h-14 text-center text-2xl font-mono font-black rounded-xl border bg-[#0d0d0e] transition-all focus:outline-none ${
                      errorMsg 
                        ? 'border-red-500 text-red-400 focus:border-red-400 shadow-lg shadow-red-500/20' 
                        : digit
                        ? 'border-amber-400 text-amber-300 shadow-md shadow-amber-400/20'
                        : 'border-white/10 text-white focus:border-amber-400'
                    }`}
                  />
                ))}
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-red-400 font-bold animate-fade-in pt-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <p className="text-[10px] text-slate-500 mt-1">
                Default PIN is <span className="font-mono text-slate-400 font-bold">1234</span> (Customizable in Admin Settings)
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={handleClose}
                disabled={isProcessing}
                className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={executeVerification}
                disabled={isProcessing || pinDigits.join('').length < 4}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-extrabold rounded-xl text-xs shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                {isProcessing ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin text-white" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{modalOptions.confirmText || 'Verify & Delete'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </SecurityPinContext.Provider>
  );
};

export const useSecurityPin = () => {
  const context = useContext(SecurityPinContext);
  if (!context) {
    throw new Error('useSecurityPin must be used within a SecurityPinProvider');
  }
  return context;
};
