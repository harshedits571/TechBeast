import { Outlet, Link } from 'react-router-dom';
import { ShoppingCart, Menu, Search, User, MonitorSmartphone, Monitor, Cpu, Keyboard } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../../contexts/CartContext';
import CartDrawer from '../CartDrawer';
import { useSettings } from '../../contexts/SettingsContext';

export default function CustomerLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { totalItems, setIsCartOpen } = useCart();
  const { settings } = useSettings();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 flex flex-col font-sans select-none">
      {/* Top Bar */}
      <div className="bg-blue-600 text-white py-1.5 px-4 text-[10px] uppercase tracking-widest font-bold flex justify-between items-center">
        <div>Call us: {settings.supportPhone} | Expert Repairs & Premium Hardware</div>
        <div className="flex gap-4">
          <Link to="/admin" className="hover:text-blue-200 transition-colors">Admin Portal</Link>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">
                  {settings.storeName ? settings.storeName.substring(0, 2).toUpperCase() : 'TB'}
                </div>
                {settings.storeName} <span className="text-blue-600 underline decoration-2 underline-offset-4 text-sm mt-1">Store</span>
              </Link>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex space-x-8 text-xs font-bold uppercase tracking-wider">
              <Link to="/" className="text-slate-600 hover:text-blue-600 transition-colors">Home</Link>
              <Link to="/products?category=Laptops" className="text-slate-600 hover:text-blue-600 transition-colors">Laptops</Link>
              <Link to="/products?category=Desktops" className="text-slate-600 hover:text-blue-600 transition-colors">Desktops</Link>
              <Link to="/products?category=Accessories" className="text-slate-600 hover:text-blue-600 transition-colors">Accessories</Link>
              <Link to="/services" className="text-slate-600 hover:text-blue-600 transition-colors">Repair Services</Link>
            </nav>

            {/* Actions */}
            <div className="hidden md:flex items-center space-x-6">
              <button className="text-slate-500 hover:text-blue-600 transition-colors">
                <Search className="h-5 w-5" />
              </button>
              <button className="text-slate-500 hover:text-blue-600 transition-colors">
                <User className="h-5 w-5" />
              </button>
              <button onClick={() => setIsCartOpen(true)} className="text-slate-500 hover:text-blue-600 transition-colors relative">
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">{totalItems}</span>
                )}
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-500 hover:text-blue-600 p-2">
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-200">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 text-xs font-bold uppercase tracking-wider">
              <Link to="/" className="block px-3 py-2 text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg">Home</Link>
              <Link to="/products" className="block px-3 py-2 text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg">Shop All</Link>
              <Link to="/services" className="block px-3 py-2 text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg">Repair Services</Link>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
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
              <li>123 Tech Avenue, Silicon Valley, CA</li>
              <li>Phone: {settings.supportPhone}</li>
              <li>Email: {settings.contactEmail}</li>
              <li>Mon - Sat: 10:00 AM - 8:00 PM</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-200 text-xs text-center text-slate-400 font-bold uppercase tracking-widest">
          &copy; {new Date().getFullYear()} {settings.storeName}. All rights reserved.
        </div>
      </footer>
      
      <CartDrawer />
    </div>
  );
}
