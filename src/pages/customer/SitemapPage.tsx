import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  Cpu,
  Monitor,
  ShoppingBag,
  Wrench,
  ShieldCheck,
  FileText,
  MapPin,
  ChevronRight,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import SEO from '../../components/ui/SEO';

export default function SitemapPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sitemapSections = [
    {
      title: "Core Pages & Navigation",
      icon: Home,
      links: [
        { name: "Home Page", path: "/", desc: "Tech Beast Hubli main store home" },
        { name: "All Products Catalog", path: "/products", desc: "Browse laptops, desktops & accessories" },
        { name: "Repair Services", path: "/services", desc: "Laptop, PC repair & ticket tracking" },
        { name: "Checkout & Cart", path: "/checkout", desc: "Review items and buy online" },
      ]
    },
    {
      title: "PC Building & Prebuilt Rigs",
      icon: Cpu,
      links: [
        { name: "Custom PC Landing", path: "/custom-pc", desc: "Select Intel or AMD platform" },
        { name: "Live Custom PC Configurator", path: "/custom-pc/builder", desc: "Interactive socket & RAM matching builder" },
        { name: "Prebuilt Gaming Desktops", path: "/prebuilt-pc", desc: "Pre-configured rigs with custom upgrades" },
      ]
    },
    {
      title: "Product Categories",
      icon: ShoppingBag,
      links: [
        { name: "New Laptops", path: "/products?category=Laptops&condition=New", desc: "Brand new ASUS, MSI, HP, Lenovo & Dell Laptops" },
        { name: "Used Laptops", path: "/products?category=Laptops&condition=Used", desc: "Certified pre-owned & refurbished laptops with warranty" },
        { name: "Desktop Computers", path: "/products?category=Desktops", desc: "High-performance assembled desktop PCs" },
        { name: "PC Components & Accessories", path: "/products?category=Accessories", desc: "Monitors, keyboards, mice, RAM & SSDs" },
      ]
    },
    {
      title: "Legal & Store Policies",
      icon: FileText,
      links: [
        { name: "Terms & Conditions", path: "/legal/terms-and-conditions", desc: "Store policies and service agreements" },
        { name: "Privacy Policy", path: "/legal/privacy-policy", desc: "Data protection and privacy guidelines" },
        { name: "Shipping & Delivery Policy", path: "/legal/shipping-policy", desc: "Hubli local & pan-India shipping details" },
        { name: "Return & Refund Policy", path: "/legal/return-policy", desc: "Warranty claims & replacement rules" },
      ]
    }
  ];

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <SEO
        title="Sitemap - Tech Beast Hubli"
        description="Comprehensive sitemap and directory of all pages, custom PC builders, prebuilt desktops, and repair services at Tech Beast Hubli."
      />

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-sm space-y-3">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Website Directory
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Tech Beast Site Map
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
            Easily navigate and explore all sections of Tech Beast Hubli — including custom PC builders, prebuilt gaming desktops, repair services, and legal documentation.
          </p>
        </div>

        {/* Directory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {sitemapSections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <div key={idx} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="bg-purple-600 text-white p-2.5 rounded-2xl shadow-sm">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-extrabold text-slate-900">{section.title}</h2>
                </div>

                <ul className="space-y-3">
                  {section.links.map((link, lIdx) => (
                    <li key={lIdx}>
                      <Link
                        to={link.path}
                        className="group flex items-start justify-between p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all"
                      >
                        <div>
                          <div className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors flex items-center gap-1.5">
                            {link.name}
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{link.desc}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Store Location Banner */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-400" /> Visit Tech Beast Store in Hubli
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ground Floor, Shinde Complex, No.183 C Block, Hubballi, Karnataka 580029 • Phone: +91 95352 25266
            </p>
          </div>
          <Link
            to="/services"
            className="shrink-0 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-6 py-3 rounded-xl uppercase tracking-wider transition-all shadow-md"
          >
            Contact & Location
          </Link>
        </div>

      </div>
    </div>
  );
}
