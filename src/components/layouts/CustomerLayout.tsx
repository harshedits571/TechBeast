import { Outlet, Link } from 'react-router-dom';
import { ShoppingCart, Menu, Search, User, MonitorSmartphone, Monitor, Cpu, Keyboard } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../../contexts/CartContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import CartDrawer from '../CartDrawer';
import AuthModal from '../auth/AuthModal';

export default function CustomerLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { totalItems, setIsCartOpen } = useCart();
  const { settings } = useSettings();
  const { user, role, logout, isAuthModalOpen, openAuthModal, closeAuthModal } = useAuth();

  return (
    <div className="min-h-[100dvh] bg-slate-50 text-slate-700 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center gap-3">
                <img src="/logo2.jpeg" alt={settings.storeName || 'Store Logo'} className="h-12 object-contain rounded-xl" />
                <span className="font-bold text-xl uppercase tracking-widest text-slate-900 hidden sm:block">
                  {settings.storeName || 'Tech Beast'}
                </span>
              </Link>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center space-x-4 xl:space-x-8 text-xs font-bold uppercase tracking-wider">
              <Link to="/" className="text-slate-600 hover:text-red-600 transition-colors">Home</Link>
              <Link to="/products?category=Laptops" className="text-slate-600 hover:text-red-600 transition-colors">Laptops</Link>
              <Link to="/products?category=Desktops" className="text-slate-600 hover:text-red-600 transition-colors">Desktops</Link>
              <Link to="/products?category=Accessories" className="text-slate-600 hover:text-red-600 transition-colors">Accessories</Link>
              <Link to="/services" className="text-slate-600 hover:text-red-600 transition-colors">Repair Services</Link>
            </nav>

            {/* Actions */}
            <div className="hidden lg:flex items-center space-x-4 xl:space-x-6">
              <button className="text-slate-500 hover:text-red-600 transition-colors relative">
                <Search className="h-5 w-5" />
              </button>

              {user ? (
                role === 'admin' ? (
                  <Link to="/admin" className="text-slate-500 hover:text-red-600 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                    <User className="h-5 w-5" />
                    <span>Admin Portal</span>
                  </Link>
                ) : (
                  <button onClick={logout} className="text-slate-500 hover:text-red-600 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                    <User className="h-5 w-5" />
                    <span>Sign Out</span>
                  </button>
                )
              ) : (
                <button onClick={openAuthModal} className="text-slate-500 hover:text-red-600 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                  <User className="h-5 w-5" />
                  <span>Sign In</span>
                </button>
              )}

              <button onClick={() => setIsCartOpen(true)} className="text-slate-500 hover:text-red-600 transition-colors relative">
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">{totalItems}</span>
                )}
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden flex items-center space-x-4">
              <button onClick={() => setIsCartOpen(true)} className="text-slate-500 hover:text-red-600 transition-colors relative">
                <ShoppingCart className="h-6 w-6" />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">{totalItems}</span>
                )}
              </button>
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-500 hover:text-blue-600 p-1">
                <Menu className="h-7 w-7" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-200 shadow-lg absolute w-full z-40">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 text-xs font-bold uppercase tracking-wider">
              <Link to="/" className="block px-3 py-2 text-slate-600 hover:text-red-600 hover:bg-slate-50 rounded-lg" onClick={() => setIsMenuOpen(false)}>Home</Link>
              <Link to="/products" className="block px-3 py-2 text-slate-600 hover:text-red-600 hover:bg-slate-50 rounded-lg" onClick={() => setIsMenuOpen(false)}>Shop All</Link>
              <Link to="/services" className="block px-3 py-2 text-slate-600 hover:text-red-600 hover:bg-slate-50 rounded-lg" onClick={() => setIsMenuOpen(false)}>Repair Services</Link>
              {user ? (
                role === 'admin' ? (
                  <Link to="/admin" className="block px-3 py-2 text-slate-600 hover:text-red-600 hover:bg-slate-50 rounded-lg" onClick={() => setIsMenuOpen(false)}>Admin Portal</Link>
                ) : (
                  <button onClick={() => { logout(); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-slate-600 hover:text-red-600 hover:bg-slate-50 rounded-lg">Sign Out</button>
                )
              ) : (
                <button onClick={() => { openAuthModal(); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-slate-600 hover:text-red-600 hover:bg-slate-50 rounded-lg">Sign In</button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Promo Banner */}
      {settings.promoBannerEnabled && settings.promoBannerText && (
        <div className="bg-red-600 text-white text-center py-2 px-4 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-inner">
          <span className="animate-pulse">🔥</span> {settings.promoBannerText} <span className="animate-pulse">🔥</span>
        </div>
      )}

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
              Premium computer retail and professional repair services. We provide top-quality new and used laptops, desktops, and expert technical support.
            </p>
          </div>
          <div>
            <h3 className="text-xs text-slate-900 font-bold uppercase tracking-widest mb-4">Shop</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/products?category=Laptops" className="hover:text-blue-600 transition-colors">New Laptops</Link></li>
              <li><Link to="/products?condition=Used" className="hover:text-blue-600 transition-colors">Used Laptops</Link></li>
              <li><Link to="/products?category=Desktops" className="hover:text-blue-600 transition-colors">Desktops</Link></li>
              <li><Link to="/products?category=Accessories" className="hover:text-blue-600 transition-colors">Accessories</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs text-slate-900 font-bold uppercase tracking-widest mb-4">Services</h3>
            <ul className="space-y-3 text-sm">
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
            <h3 className="text-xs text-slate-900 font-bold uppercase tracking-widest mb-4">Legal</h3>
            <ul className="space-y-3 text-sm">
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

      <CartDrawer />
      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />
    </div>
  );
}
