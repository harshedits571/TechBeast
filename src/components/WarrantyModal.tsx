import React from 'react';
import { X, Shield, AlertTriangle, PenTool, CheckCircle2 } from 'lucide-react';

interface WarrantyModalProps {
  isOpen: boolean;
  onClose: () => void;
  isNew?: boolean;
  brandWarranty?: string;
}

export default function WarrantyModal({ isOpen, onClose, isNew, brandWarranty }: WarrantyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {isNew ? 'Brand & TechBeast Warranty' : 'TechBeast Certified Warranty'}
              </h2>
              <p className="text-sm text-slate-500">
                {isNew ? (brandWarranty || 'Brand Warranty') + ' + 1-Year Software Support' : 'Comprehensive 3-Month Protection Plan'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <div className="space-y-8">
            
            {/* Introduction */}
            <p className="text-slate-600 leading-relaxed">
              {isNew 
                ? `This new product is covered by the official brand warranty (${brandWarranty || 'Terms specified by brand'}). Hardware issues must be claimed directly at the brand's authorized service center. Additionally, TechBeast provides a complimentary 1-year warranty specifically for software-related issues.`
                : `Every TechBeast certified used product goes through a rigorous testing process. We stand behind our quality with a comprehensive 3-month hardware warranty to ensure your complete peace of mind.`
              }
            </p>

            {/* Coverage Section */}
            <section>
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                What is Covered
              </h3>
              {isNew ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-2">By Brand Service Center</h4>
                    <ul className="space-y-2">
                      <li className="flex gap-3 text-slate-600"><span className="text-emerald-500 mt-1">•</span><span className="leading-relaxed">All hardware defects covered under the standard {brandWarranty || 'Brand Warranty'} terms.</span></li>
                      <li className="flex gap-3 text-slate-600"><span className="text-emerald-500 mt-1">•</span><span className="leading-relaxed">Motherboard, Display, Keyboard, Battery, and internal component failures.</span></li>
                    </ul>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                    <h4 className="font-bold text-blue-800 text-sm uppercase tracking-wider mb-2">By TechBeast (1-Year Software Support)</h4>
                    <ul className="space-y-2">
                      <li className="flex gap-3 text-slate-600"><span className="text-blue-500 mt-1">•</span><span className="leading-relaxed">Free Windows OS re-installation and corruption fixes.</span></li>
                      <li className="flex gap-3 text-slate-600"><span className="text-blue-500 mt-1">•</span><span className="leading-relaxed">Driver updates, missing drivers, and BIOS flashing assistance.</span></li>
                      <li className="flex gap-3 text-slate-600"><span className="text-blue-500 mt-1">•</span><span className="leading-relaxed">Basic software troubleshooting and configuration.</span></li>
                    </ul>
                  </div>
                </div>
              ) : (
                <ul className="space-y-3">
                  {[
                    "Motherboard and internal component failures under normal use.",
                    "Display screen malfunctions (excluding accidental cracks or bleeding).",
                    "Keyboard, trackpad, and internal ports failures.",
                    "Battery issues (if battery health drops below 50% within the first 30 days).",
                    "RAM and internal storage (SSD/HDD) read/write failures."
                  ].map((item, i) => (
                    <li key={i} className="flex gap-3 text-slate-600">
                      <span className="text-emerald-500 mt-1">•</span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Exclusions Section */}
            <section className="bg-red-50/50 border border-red-100 rounded-xl p-5">
              <h3 className="flex items-center gap-2 text-lg font-bold text-red-700 mb-4">
                <AlertTriangle className="h-5 w-5" />
                What is NOT Covered (Voiding Conditions)
              </h3>
              <ul className="space-y-3">
                {[
                  "Physical damage, drops, dents, or broken screens after delivery.",
                  "Liquid damage, moisture, or spills on the device.",
                  isNew ? "Hardware issues (These MUST be directed to the Brand Service Center, not TechBeast)." : "Software issues, operating system crashes, or virus/malware infections.",
                  "Unauthorized repairs, opening the device chassis, or tampering with warranty seals.",
                  "Power surges, electrical short circuits caused by faulty home wiring or third-party chargers."
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-red-800/80">
                    <span className="text-red-400 mt-1">•</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Claim Process */}
            <section>
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
                <PenTool className="h-5 w-5 text-blue-500" />
                How to Claim Warranty
              </h3>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="bg-white text-slate-700 font-bold w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-slate-200 shadow-sm">1</div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Contact Support</h4>
                    <p className="text-sm text-slate-600 mt-1">Reach out to our support team with your order number and a brief description or video of the issue.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="bg-white text-slate-700 font-bold w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-slate-200 shadow-sm">2</div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Remote Diagnosis</h4>
                    <p className="text-sm text-slate-600 mt-1">Our technicians will try to troubleshoot the problem remotely. Many issues are software-related and can be fixed instantly.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="bg-white text-slate-700 font-bold w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-slate-200 shadow-sm">3</div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Service Center / Pickup</h4>
                    <p className="text-sm text-slate-600 mt-1">If hardware repair is needed, you can drop the device at our nearest service center or arrange a pickup (shipping charges may apply).</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Legal */}
            <div className="text-xs text-slate-400 border-t border-slate-100 pt-6">
              <p>TechBeast reserves the right to repair or replace the defective unit with a unit of equal or greater value at our sole discretion. Data loss is not covered; please ensure you back up your data regularly. The 3-month period begins from the date the product is delivered to the customer.</p>
            </div>

          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end">
          <button 
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 px-6 rounded-xl transition-colors"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
