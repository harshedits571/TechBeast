import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Monitor, ChevronRight, ArrowUpRight, Sparkles, Tag } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Quick search suggestion tags
  const popularTags = [
    { label: 'Custom PC Builder', path: '/custom-pc' },
    { label: 'Prebuilt PCs', path: '/prebuilt-pc' },
    { label: 'New Laptops', path: '/products?category=Laptops&condition=New' },
    { label: 'Used Laptops', path: '/products?category=Laptops&condition=Used' },
    { label: 'Desktops', path: '/products?category=Desktops' },
    { label: 'Accessories', path: '/products?category=Accessories' },
    { label: 'Repair Services', path: '/services' },
  ];

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
      if (!hasFetched) {
        fetchProducts();
      }
    } else {
      document.body.style.overflow = '';
      setSearchTerm('');
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(100));
      const snap = await getDocs(q);
      const items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setProducts(items);
      setHasFetched(true);
    } catch (err) {
      console.error('Error fetching products for search modal:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Filter products based on search term
  const filteredProducts = searchTerm.trim()
    ? products.filter((product) => {
        const queryStr = searchTerm.toLowerCase();
        const titleMatch = (product.title || '').toLowerCase().includes(queryStr);
        const brandMatch = (product.brand || '').toLowerCase().includes(queryStr);
        const categoryMatch = (product.category || '').toLowerCase().includes(queryStr);
        const specsMatch = typeof product.specs === 'string' 
          ? product.specs.toLowerCase().includes(queryStr)
          : false;

        return titleMatch || brandMatch || categoryMatch || specsMatch;
      }).slice(0, 8)
    : [];

  const handleSelectProduct = (productId: string) => {
    onClose();
    navigate(`/products/${productId}`);
  };

  const handleSelectTag = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-4">
      {/* Backdrop Overlay */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Search Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
          <Search className="w-6 h-6 text-red-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search laptops, GPUs, custom builds, accessories..."
            className="w-full bg-transparent text-slate-900 placeholder-slate-400 font-medium text-base sm:text-lg focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-xs font-bold bg-slate-200 text-slate-600 hover:bg-slate-300 px-2 py-1 rounded-md transition-colors"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-all"
            aria-label="Close search"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Quick Tags / Search Suggestions */}
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/30 flex items-center gap-2 overflow-x-auto hide-scrollbar">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-red-500" /> Popular:
          </span>
          <div className="flex items-center gap-2">
            {popularTags.map((tag, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectTag(tag.path)}
                className="px-3 py-1 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-700 hover:text-red-600 rounded-full text-xs font-semibold whitespace-nowrap transition-all shadow-sm flex items-center gap-1"
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-6 space-y-3">
          {loading && (
            <div className="py-12 text-center text-slate-400 text-sm flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Searching inventory...</span>
            </div>
          )}

          {!loading && searchTerm.trim() === '' && (
            <div className="py-8 text-center text-slate-500 space-y-2">
              <p className="text-sm font-medium">Type a product name, brand (Asus, Dell, HP...), or category to search.</p>
              <p className="text-xs text-slate-400">Press <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-600 font-mono text-[10px]">ESC</kbd> to exit.</p>
            </div>
          )}

          {!loading && searchTerm.trim() !== '' && filteredProducts.length === 0 && (
            <div className="py-12 text-center text-slate-500 space-y-3">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <p className="text-base font-bold text-slate-800">No products matching "{searchTerm}"</p>
                <p className="text-xs text-slate-400 mt-1">Try checking spelling or search for categories like Laptops, Desktops, or Accessories.</p>
              </div>
              <button
                onClick={() => handleSelectTag('/products')}
                className="mt-2 text-xs font-bold text-red-600 hover:text-red-700 underline uppercase tracking-wider"
              >
                Browse All Products
              </button>
            </div>
          )}

          {!loading && filteredProducts.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-3 px-2 flex justify-between items-center">
                <span>Matching Products ({filteredProducts.length})</span>
                <span className="text-slate-400">Press item to view details</span>
              </div>
              <div className="space-y-2">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleSelectProduct(product.id)}
                    className="p-3 bg-white hover:bg-red-50/50 border border-slate-200 hover:border-red-200 rounded-2xl transition-all cursor-pointer flex items-center justify-between group shadow-sm"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-14 h-14 bg-slate-50 rounded-xl border border-slate-100 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                        {product.imageUrls && product.imageUrls[0] ? (
                          <img
                            src={product.imageUrls[0]}
                            alt={product.title}
                            className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                          />
                        ) : (
                          <Monitor className="w-6 h-6 text-slate-300" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                            {product.brand || product.category || 'Tech Beast'}
                          </span>
                          {product.condition && (
                            <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
                              {product.condition}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 truncate mt-1 group-hover:text-red-600 transition-colors">
                          {product.title}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 pl-4">
                      <div className="text-right">
                        <div className="text-sm font-extrabold text-slate-900">
                          ₹{Number(product.price || 0).toLocaleString('en-IN')}
                        </div>
                        {product.oldPrice && product.oldPrice > product.price && (
                          <div className="text-xs text-slate-400 line-through">
                            ₹{Number(product.oldPrice).toLocaleString('en-IN')}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-red-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Link */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center flex items-center justify-between px-6">
          <span className="text-xs text-slate-500 font-medium">Looking for store location or repair help?</span>
          <button
            onClick={() => handleSelectTag('/services')}
            className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 uppercase tracking-wider"
          >
            Visit Repair Services <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
