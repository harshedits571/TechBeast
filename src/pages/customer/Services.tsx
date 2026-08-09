import React from 'react';
import { Wrench, ShieldCheck, Clock, Settings, Laptop, HardDrive, Battery, Smartphone } from 'lucide-react';
import SEO from '../../components/ui/SEO';
import { useSettings } from '../../contexts/SettingsContext';

const servicesList = [
  {
    title: "Screen Replacement",
    description: "Fast and reliable screen replacements for all major laptop and desktop monitor brands. We use high-quality original or OEM parts.",
    icon: <Laptop className="h-6 w-6 text-blue-500" />
  },
  {
    title: "Battery & Power Issues",
    description: "Laptop not holding a charge or not turning on? We diagnose power delivery issues, replace dead batteries, and fix charging ports.",
    icon: <Battery className="h-6 w-6 text-emerald-500" />
  },
  {
    title: "Data Recovery & Storage",
    description: "Failing hard drive? We offer professional data recovery services and can upgrade your slow HDD to a lightning-fast SSD.",
    icon: <HardDrive className="h-6 w-6 text-purple-500" />
  },
  {
    title: "Motherboard Repair",
    description: "Advanced micro-soldering and component-level motherboard repairs for liquid damage, short circuits, and dead components.",
    icon: <Settings className="h-6 w-6 text-red-500" />
  }
];

export default function Services() {
  const { settings } = useSettings();

  return (
    <div className="bg-[#0a0a0b] min-h-screen pt-24 pb-20">
      <SEO 
        title="Professional Repair Services"
        description="Expert computer and laptop repair services in Hubli. Screen replacement, data recovery, motherboard repair, and more."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6">
            Expert <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Repair Services</span>
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed">
            From cracked screens and dead batteries to advanced motherboard micro-soldering, our expert technicians bring your devices back to life.
          </p>
        </div>

        {/* Why Choose Us */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors">
            <div className="bg-blue-500/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/30">
              <ShieldCheck className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Guaranteed Work</h3>
            <p className="text-slate-400 text-sm leading-relaxed">All our repairs come with a standard warranty on replaced parts. We stand by the quality of our service.</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors">
            <div className="bg-emerald-500/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/30">
              <Clock className="h-6 w-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Fast Turnaround</h3>
            <p className="text-slate-400 text-sm leading-relaxed">Most common repairs like screen and battery replacements are completed within 24 to 48 hours.</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors">
            <div className="bg-purple-500/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border border-purple-500/30">
              <Wrench className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Expert Technicians</h3>
            <p className="text-slate-400 text-sm leading-relaxed">Our team has years of experience dealing with complex hardware issues across all major brands.</p>
          </div>
        </div>

        {/* Services List */}
        <div className="mb-24">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">What We Repair</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {servicesList.map((service, idx) => (
              <div key={idx} className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 p-6 rounded-2xl flex gap-6 hover:border-white/20 transition-colors">
                <div className="shrink-0 mt-1">
                  {service.icon}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white mb-2">{service.title}</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">{service.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-blue-500/20 rounded-3xl p-12 text-center max-w-4xl mx-auto relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white mb-4">Need a repair?</h2>
            <p className="text-blue-200 mb-8 max-w-xl mx-auto">
              Bring your device to our store for a quick diagnostic. We'll provide you with a transparent estimated cost before beginning any work.
            </p>
            <div className="inline-flex flex-col sm:flex-row gap-4 items-center justify-center">
              <a 
                href={`tel:${settings?.supportPhone?.replace(/\D/g,'') || '+919535225266'}`}
                className="bg-white text-blue-900 font-bold px-8 py-4 rounded-xl hover:bg-slate-100 transition-colors shadow-xl"
              >
                Call Us Now
              </a>
              <span className="text-slate-400 text-sm font-medium px-4">or visit us at</span>
              <div className="text-left bg-black/40 px-6 py-3 rounded-xl border border-white/10">
                <p className="text-white font-bold text-sm">{settings?.storeName || 'Tech Beast'}</p>
                <p className="text-slate-400 text-xs mt-1">Ground Floor, Shinde Complex,<br/>Hubballi, Karnataka</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
