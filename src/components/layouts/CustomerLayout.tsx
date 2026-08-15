import { Outlet, Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, Search, User, MonitorSmartphone, Monitor, Cpu, Wrench, Sparkles, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCart } from '../../contexts/CartContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import CartDrawer from '../CartDrawer';
import AuthModal from '../auth/AuthModal';
import SearchModal from '../SearchModal';
import FloatingContactWidget from '../FloatingContactWidget';

export default function CustomerLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { totalItems, setIsCartOpen } = useCart();
  const { settings } = useSettings();
  const { user, role, logout, isAuthModalOpen, openAuthModal, closeAuthModal } = useAuth();
  const location = useLocation();

  // Handle Ctrl+K / Cmd+K search shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const isQueryActive = (query: string) => {
    return location.pathname === '/products' && location.search.includes(query);
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 text-slate-700 flex flex-col font-sans relative">
      {/* Top Promo Banner */}
      {settings.promoBannerEnabled && settings.promoBannerText && (
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white text-center py-2 px-4 text-xs font-semibold tracking-wide flex items-center justify-center gap-2 shadow-inner">
          <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-300 animate-spin" /> Offer
          </span>
          <span>{settings.promoBannerText}</span>
        </div>
      )}

      {/* Main Sticky Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 gap-4">
            
            {/* Brand Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="relative p-0.5 rounded-2xl bg-gradient-to-tr from-red-600 to-purple-600 shadow-xs group-hover:scale-105 transition-transform duration-200">
                  <img 
                    src="/logo2.jpeg" 
                    alt={settings.storeName || 'Tech Beast Logo'} 
                    className="h-11 w-auto object-contain rounded-xl bg-white" 
                  />
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="font-extrabold text-xl uppercase tracking-wider text-slate-900 leading-tight group-hover:text-red-600 transition-colors">
                    {settings.storeName || 'Tech Beast'}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                    Gaming & Technology
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2 text-xs font-bold uppercase tracking-wider">
              {/* Home */}
              <Link 
                to="/" 
                className={`px-3 py-2 rounded-lg transition-all ${
                  isActive('/') 
                    ? 'text-red-600 bg-red-50/80 font-extrabold' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                Home
              </Link>

              {/* Custom PC Builder Badge Link */}
              <Link 
                to="/custom-pc" 
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 shadow-xs border ${
                  isActive('/custom-pc')
                    ? 'bg-red-600 text-white border-red-600 shadow-red-500/20'
                    : 'bg-red-50 text-red-700 border-red-200/80 hover:bg-red-600 hover:text-white hover:border-red-600 hover:shadow-red-500/20'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Custom PC</span>
                <span className="bg-red-700 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black tracking-normal uppercase ml-0.5">
                  BUILD
                </span>
              </Link>

              {/* Prebuilt PCs Badge Link */}
              <Link 
                to="/prebuilt-pc" 
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 shadow-xs border ${
                  isActive('/prebuilt-pc')
                    ? 'bg-purple-700 text-white border-purple-700 shadow-purple-500/20'
                    : 'bg-purple-50 text-purple-700 border-purple-200/80 hover:bg-purple-700 hover:text-white hover:border-purple-700 hover:shadow-purple-500/20'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Prebuilt PCs</span>
                <span className="bg-purple-900 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black tracking-normal uppercase ml-0.5">
                  RIGS
                </span>
              </Link>

              {/* New Laptops */}
              <Link 
                to="/products?category=Laptops&condition=New" 
                className={`px-3 py-2 rounded-lg transition-all ${
                  isQueryActive('condition=New')
                    ? 'text-red-600 bg-red-50/80 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                New Laptops
              </Link>

              {/* Used Laptops */}
              <Link 
                to="/products?category=Laptops&condition=Used" 
                className={`px-3 py-2 rounded-lg transition-all ${
                  isQueryActive('condition=Used')
                    ? 'text-red-600 bg-red-50/80 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                Used Laptops
              </Link>

              {/* Desktops */}
              <Link 
                to="/products?category=Desktops" 
                className={`px-3 py-2 rounded-lg transition-all ${
                  isQueryActive('category=Desktops')
                    ? 'text-red-600 bg-red-50/80 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                Desktops
              </Link>

              {/* Accessories */}
              <Link 
                to="/products?category=Accessories" 
                className={`px-3 py-2 rounded-lg transition-all ${
                  isQueryActive('category=Accessories')
                    ? 'text-red-600 bg-red-50/80 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                Accessories
              </Link>
            </nav>

            {/* Actions Bar */}
            <div className="hidden lg:flex items-center space-x-3">
              {/* Search Trigger */}
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-2 bg-slate-100/80 hover:bg-slate-200/80 text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded-full text-xs font-medium transition-all border border-slate-200/80 shadow-2xs"
                title="Search products (Ctrl+K)"
              >
                <Search className="h-3.5 w-3.5 text-slate-500" />
                <span className="hidden xl:inline text-slate-500">Search products...</span>
                <kbd className="hidden xl:inline-flex items-center gap-0.5 text-[10px] bg-white border border-slate-200 rounded px-1.5 py-0.5 font-mono text-slate-400 shadow-2xs">
                  ⌘K
                </kbd>
              </button>

              {/* Divider */}
              <div className="h-5 w-px bg-slate-200 my-auto"></div>

              {/* User Account / Admin */}
              {user ? (
                role === 'admin' ? (
                  <Link 
                    to="/admin" 
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all shadow-xs"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-red-400" />
                    <span>Admin</span>
                  </Link>
                ) : (
                  <button 
                    onClick={logout} 
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-all"
                  >
                    <User className="h-3.5 w-3.5 text-slate-500" />
                    <span>Sign Out</span>
                  </button>
                )
              ) : (
                <button 
                  onClick={openAuthModal} 
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-300 text-slate-700 text-xs font-bold hover:border-red-600 hover:text-red-600 hover:bg-red-50/50 transition-all"
                >
                  <User className="h-3.5 w-3.5" />
                  <span>Sign In</span>
                </button>
              )}

              {/* Shopping Cart Button */}
              <button 
                onClick={() => setIsCartOpen(true)} 
                className="relative p-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-700 rounded-full transition-all flex items-center justify-center group border border-slate-200/80 shadow-2xs"
                title="Shopping Cart"
              >
                <ShoppingCart className="h-4 w-4 group-hover:scale-110 transition-transform" />
                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-black rounded-full h-4 w-4 flex items-center justify-center ring-2 ring-white shadow-xs">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>

            {/* Mobile menu & action buttons */}
            <div className="lg:hidden flex items-center space-x-2">
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="text-slate-500 hover:text-red-600 transition-colors p-2 bg-slate-100 rounded-full"
                aria-label="Open Search"
              >
                <Search className="h-5 w-5" />
              </button>

              <button 
                onClick={() => setIsCartOpen(true)} 
                className="text-slate-500 hover:text-red-600 transition-colors relative p-2 bg-slate-100 rounded-full"
              >
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black rounded-full h-4 w-4 flex items-center justify-center ring-2 ring-white shadow-xs">
                    {totalItems}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                className="text-slate-700 hover:text-red-600 p-2 bg-slate-100 rounded-full transition-colors"
                aria-label="Toggle Menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {isMenuOpen && (
          <div className="lg:hidden bg-white/98 backdrop-blur-lg border-b border-slate-200 shadow-xl absolute w-full z-40 transition-all">
            <div className="px-4 pt-3 pb-5 space-y-2 text-xs font-bold uppercase tracking-wider">
              {/* Core Feature CTAs */}
              <Link 
                to="/custom-pc" 
                className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl shadow-sm" 
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="flex items-center gap-2.5">
                  <Cpu className="w-4 h-4 text-white" />
                  <span className="font-extrabold">Custom PC Builder</span>
                </span>
                <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-black tracking-normal uppercase">Build Now</span>
              </Link>

              <Link 
                to="/prebuilt-pc" 
                className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-sm" 
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="flex items-center gap-2.5">
                  <MonitorSmartphone className="w-4 h-4 text-white" />
                  <span className="font-extrabold">Prebuilt Gaming PCs</span>
                </span>
                <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-black tracking-normal uppercase">Explore Rigs</span>
              </Link>

              <Link 
                to="/services" 
                className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white rounded-xl shadow-sm" 
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="flex items-center gap-2.5">
                  <Wrench className="w-4 h-4 text-red-400" />
                  <span className="font-extrabold">Repair & Services</span>
                </span>
                <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-black tracking-normal uppercase">Book Repair</span>
              </Link>

              <div className="h-px bg-slate-200 my-3"></div>

              {/* Standard Links */}
              <Link to="/" className="block px-3 py-2.5 text-slate-700 hover:text-red-600 hover:bg-slate-50 rounded-lg" onClick={() => setIsMenuOpen(false)}>Home</Link>
              <Link to="/products?category=Laptops&condition=New" className="block px-3 py-2.5 text-slate-700 hover:text-red-600 hover:bg-slate-50 rounded-lg" onClick={() => setIsMenuOpen(false)}>New Laptops</Link>
              <Link to="/products?category=Laptops&condition=Used" className="block px-3 py-2.5 text-slate-700 hover:text-red-600 hover:bg-slate-50 rounded-lg" onClick={() => setIsMenuOpen(false)}>Used Laptops</Link>
              <Link to="/products?category=Desktops" className="block px-3 py-2.5 text-slate-700 hover:text-red-600 hover:bg-slate-50 rounded-lg" onClick={() => setIsMenuOpen(false)}>Desktops</Link>
              <Link to="/products?category=Accessories" className="block px-3 py-2.5 text-slate-700 hover:text-red-600 hover:bg-slate-50 rounded-lg" onClick={() => setIsMenuOpen(false)}>Accessories</Link>
              <Link to="/products" className="block px-3 py-2.5 text-slate-700 hover:text-red-600 hover:bg-slate-50 rounded-lg" onClick={() => setIsMenuOpen(false)}>Shop All Products</Link>
              
              <div className="h-px bg-slate-200 my-3"></div>

              {user ? (
                role === 'admin' ? (
                  <Link to="/admin" className="block px-3 py-2.5 text-red-600 font-extrabold hover:bg-red-50 rounded-lg" onClick={() => setIsMenuOpen(false)}>Admin Portal</Link>
                ) : (
                  <button onClick={() => { logout(); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-2.5 text-slate-700 hover:text-red-600 hover:bg-slate-50 rounded-lg">Sign Out</button>
                )
              ) : (
                <button onClick={() => { openAuthModal(); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-2.5 text-red-600 font-extrabold hover:bg-red-50 rounded-lg">Sign In / Register</button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white text-slate-500 py-12 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-1">
            <div className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center font-bold text-white text-xs">
                {settings.storeName ? settings.storeName.substring(0, 2).toUpperCase() : 'TB'}
              </div>
              {settings.storeName}
            </div>
            <p className="text-xs leading-relaxed text-slate-500 font-medium">
              Hubli’s Ultimate Tech Destination for Gaming PCs, Laptops, Desktops, Upgrades & Repairs. Smart technology, honest pricing, and expert support. Built for Performance. Trusted by Hubli.
            </p>
          </div>
          <div>
            <h3 className="text-xs text-slate-900 font-bold uppercase tracking-widest mb-4">Shop</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/products?category=Laptops&condition=New" className="hover:text-blue-600 transition-colors">New Laptops</Link></li>
              <li><Link to="/products?category=Laptops&condition=Used" className="hover:text-blue-600 transition-colors">Used Laptops</Link></li>
              <li><Link to="/products?category=Desktops" className="hover:text-blue-600 transition-colors">Desktops</Link></li>
              <li><Link to="/products?category=Accessories" className="hover:text-blue-600 transition-colors">Accessories</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs text-slate-900 font-bold uppercase tracking-widest mb-4">Services</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/services" className="hover:text-blue-600 transition-colors font-bold text-slate-700">Repair Services</Link></li>
              <li><Link to="/services" className="hover:text-blue-600 transition-colors">Laptop Repair</Link></li>
              <li><Link to="/services" className="hover:text-blue-600 transition-colors">Desktop Repair</Link></li>
              <li><Link to="/services" className="hover:text-blue-600 transition-colors">Data Recovery</Link></li>
              <li><Link to="/services" className="hover:text-blue-600 transition-colors">Custom PC Build</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs text-slate-900 font-bold uppercase tracking-widest mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li>Ground Floor, Shinde Complex, No.183 C Block, Hubballi, Karnataka 580029</li>
              <li>Phone: {settings.supportPhone}</li>
              <li>Email: {settings.contactEmail}</li>
              <li>Mon - Sat: 11:00 AM - 8:00 PM</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs text-slate-900 font-bold uppercase tracking-widest mb-4">Legal & Links</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/sitemap" className="hover:text-purple-600 transition-colors font-bold text-purple-700">Site Map</Link></li>
              <li><Link to="/legal/privacy-policy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/legal/terms-and-conditions" className="hover:text-blue-600 transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/legal/refund-policy" className="hover:text-blue-600 transition-colors">Refund & Return Policy</Link></li>
              <li><Link to="/legal/shipping-policy" className="hover:text-blue-600 transition-colors">Shipping Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-200 text-xs text-center text-slate-400 font-bold uppercase tracking-widest">
          &copy; {new Date().getFullYear()} {settings.storeName}. All rights reserved.
        </div>
      </footer>

      {/* Drawers & Modals */}
      <CartDrawer />
      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      
      {/* Floating Assistance Widget */}
      <FloatingContactWidget />
    </div>
  );
}

