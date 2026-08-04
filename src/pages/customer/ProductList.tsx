import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Filter, ChevronDown, Check, Star } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export default function ProductList() {
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');
  
  const [sortBy, setSortBy] = useState('featured');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const displayedProducts = categoryFilter 
    ? products.filter(p => p.category === categoryFilter)
    : products;

  return (
    <div className="bg-[#0a0a0b] min-h-screen text-slate-300">
      {/* Header */}
      <div className="bg-[#0d0d0e] border-b border-white/5 pt-16 pb-12 shadow-xl shadow-black/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white">
            {categoryFilter ? categoryFilter : 'All Products'}
          </h1>
          <p className="mt-2 text-slate-500 text-sm font-medium">
            Browse our premium selection of {categoryFilter?.toLowerCase() || 'tech products'}.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar Filters */}
          <div className={`w-full lg:w-64 flex-shrink-0 ${isFilterOpen ? 'block' : 'hidden lg:block'}`}>
            <div className="space-y-10 sticky top-28">
              {/* Categories */}
              <div>
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Categories</h3>
                <ul className="space-y-3">
                  {['All', 'Laptops', 'Desktops', 'Accessories', 'Components'].map((cat) => (
                    <li key={cat}>
                      <Link 
                        to={cat === 'All' ? '/products' : `/products?category=${cat}`}
                        className={`text-sm font-bold flex items-center justify-between transition-colors ${
                          (cat === 'All' && !categoryFilter) || cat === categoryFilter 
                            ? 'text-blue-500' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {cat}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Condition */}
              <div>
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Condition</h3>
                <ul className="space-y-4">
                  {['New', 'Used - Like New', 'Used - Good', 'Used - Fair'].map((condition) => (
                    <li key={condition} className="flex items-center">
                      <input
                        id={`condition-${condition}`}
                        type="checkbox"
                        className="h-4 w-4 rounded border-white/20 bg-white/5 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <label htmlFor={`condition-${condition}`} className="ml-3 text-sm font-bold text-slate-400 cursor-pointer hover:text-white transition-colors">
                        {condition}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Price</h3>
                <div className="flex items-center gap-2">
                  <input type="number" placeholder="Min" className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all" />
                  <span className="text-slate-500 font-bold">-</span>
                  <input type="number" placeholder="Max" className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all" />
                </div>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between pb-6 mb-8 border-b border-white/5">
              <button 
                className="lg:hidden flex items-center gap-2 text-xs font-bold text-white bg-white/5 px-4 py-2 rounded-full border border-white/10 uppercase tracking-widest"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <Filter className="h-4 w-4" />
                Filters
              </button>
              
              <div className="hidden lg:block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Showing {displayedProducts.length} results
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sort by:</span>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-xs font-bold border-0 bg-transparent text-white focus:ring-0 cursor-pointer appearance-none outline-none"
                >
                  <option value="featured" className="bg-[#0d0d0e]">Featured</option>
                  <option value="newest" className="bg-[#0d0d0e]">Newest</option>
                  <option value="price-low" className="bg-[#0d0d0e]">Price: Low to High</option>
                  <option value="price-high" className="bg-[#0d0d0e]">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedProducts.map((product) => (
                <Link key={product.id} to={`/products/${product.id}`} className="group relative bg-[#0d0d0e] border border-white/10 rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-blue-900/10 hover:border-blue-500/30 transition-all duration-300 flex flex-col">
                  {/* Badge */}
                  {product.condition !== 'New' && (
                    <div className="absolute top-4 left-4 z-10">
                      <span className="bg-amber-500/20 text-amber-500 border border-amber-500/30 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest backdrop-blur-md">
                        {product.condition}
                      </span>
                    </div>
                  )}
                  {product.oldPrice && (
                    <div className="absolute top-4 right-4 z-10">
                      <span className="bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-red-500/20">
                        Sale
                      </span>
                    </div>
                  )}

                  {/* Image Placeholder */}
                  <div className="aspect-[4/3] bg-white/5 w-full flex items-center justify-center group-hover:bg-white/10 transition-colors duration-500 border-b border-white/5">
                    <span className="text-slate-600 text-[10px] font-bold tracking-[0.2em] uppercase">Product Image</span>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex flex-col flex-1">
                    <div className="text-[10px] font-bold text-blue-500 mb-2 uppercase tracking-widest">{product.category}</div>
                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">{product.title}</h3>
                    
                    <div className="flex items-center gap-1 mb-6">
                      <div className="flex text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < Math.floor(product.rating || 5) ? 'fill-current' : 'text-slate-700'}`} />
                        ))}
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 ml-2">({product.reviews || 0})</span>
                    </div>
                    
                    <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                      <div className="flex flex-col">
                        {product.oldPrice && (
                          <span className="text-[10px] font-bold text-slate-500 line-through">${product.oldPrice.toFixed(2)}</span>
                        )}
                        <span className="text-xl font-bold text-white">${product.price.toFixed(2)}</span>
                      </div>
                      <button className="bg-blue-600 text-white px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-lg shadow-blue-600/20">
                        View
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            {displayedProducts.length === 0 && (
              <div className="text-center py-20 bg-[#0d0d0e] rounded-3xl border border-white/5">
                <h3 className="text-lg font-bold text-white mb-2">No products found</h3>
                <p className="text-sm font-medium text-slate-500">Try adjusting your filters or search terms.</p>
                <button 
                  onClick={() => window.location.href = '/products'}
                  className="mt-6 inline-flex items-center px-6 py-3 rounded-full text-xs font-bold text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors uppercase tracking-widest"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
