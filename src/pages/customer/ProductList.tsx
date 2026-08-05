import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Filter, ChevronDown, Check, Star, X, Search } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export default function ProductList() {
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');
  
  const [sortBy, setSortBy] = useState('featured');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedGens, setSelectedGens] = useState<string[]>([]);
  const [selectedRamTypes, setSelectedRamTypes] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

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

  const availableBrands = Array.from(new Set(products.map(p => {
    if (p.brand) return p.brand;
    if (p.title) return p.title.split(' ')[0];
    return 'Unknown';
  }))).filter(Boolean).sort();

  const availableGens = Array.from(new Set(products.map(p => p.processorGen))).filter(Boolean).sort();
  const availableRamTypes = Array.from(new Set(products.map(p => p.ramType))).filter(Boolean).sort();

  const displayedProducts = products.filter(p => {
    // Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesTitle = p.title?.toLowerCase().includes(q);
      const matchesSku = p.sku?.toLowerCase().includes(q);
      if (!matchesTitle && !matchesSku) return false;
    }

    // Category Filter
    if (categoryFilter && p.category !== categoryFilter) return false;
    
    // Brand Filter
    const productBrand = p.brand || (p.title ? p.title.split(' ')[0] : 'Unknown');
    if (selectedBrands.length > 0 && !selectedBrands.includes(productBrand)) return false;
    
    // Condition Filter
    if (selectedConditions.length > 0 && !selectedConditions.includes(p.condition)) return false;

    // Generation Filter
    if (selectedGens.length > 0 && (!p.processorGen || !selectedGens.includes(p.processorGen))) return false;

    // RAM Type Filter
    if (selectedRamTypes.length > 0 && (!p.ramType || !selectedRamTypes.includes(p.ramType))) return false;

    // In Stock Only Filter
    if (inStockOnly && (!p.stock || p.stock <= 0)) return false;
    
    // Price Filter
    const price = Number(p.price);
    if (minPrice && price < Number(minPrice)) return false;
    if (maxPrice && price > Number(maxPrice)) return false;
    
    return true;
  }).sort((a, b) => {
    if (sortBy === 'price-low') return Number(a.price) - Number(b.price);
    if (sortBy === 'price-high') return Number(b.price) - Number(a.price);
    if (sortBy === 'newest') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    return 0; // 'featured'
  });

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 font-sans pb-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT SIDEBAR - FILTERS */}
          <div className={`w-full lg:w-64 flex-shrink-0 ${isFilterOpen ? 'block' : 'hidden lg:block'} bg-white p-6 shadow-sm border border-slate-200 rounded-sm`}>
            <div className="text-lg text-slate-500 mb-6">Filters</div>
            
            <div className="space-y-6">
              {/* BRAND Filter */}
              <div>
                <div className="flex items-center justify-between cursor-pointer text-sm font-bold text-slate-700 mb-3 uppercase">
                  <span>Brand</span>
                  <ChevronDown className="h-4 w-4 rotate-180 text-slate-400" />
                </div>
                <ul className="space-y-2">
                  {availableBrands.map((brand: any) => (
                    <li key={brand} className="flex items-center justify-between group">
                      <label className="flex items-center cursor-pointer text-sm text-slate-600 group-hover:text-blue-600">
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(brand)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedBrands([...selectedBrands, brand]);
                            else setSelectedBrands(selectedBrands.filter(b => b !== brand));
                          }}
                          className="mr-3 h-4 w-4 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        {brand}
                      </label>
                      <span className="text-xs text-slate-400">(22)</span>
                    </li>
                  ))}
                  {/* Mock extra brands to look like screenshot */}
                  {['Acer', 'Asus', 'Dell', 'Gigabyte', 'HP', 'Lenovo', 'MSI', 'Samsung'].map(mockBrand => (
                    !availableBrands.includes(mockBrand) && (
                      <li key={mockBrand} className="flex items-center justify-between group">
                        <label className="flex items-center cursor-pointer text-sm text-slate-600 group-hover:text-blue-600">
                          <input type="checkbox" className="mr-3 h-4 w-4 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500" />
                          {mockBrand}
                        </label>
                        <span className="text-xs text-slate-400">({Math.floor(Math.random() * 30) + 1})</span>
                      </li>
                    )
                  ))}
                </ul>
              </div>

              {/* AVAILABILITY Filter */}
              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between cursor-pointer text-sm font-bold text-slate-700 mb-3 uppercase">
                  <span>Availability</span>
                  <ChevronDown className="h-4 w-4 rotate-180 text-slate-400" />
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center justify-between group">
                    <label className="flex items-center cursor-pointer text-sm text-slate-600 group-hover:text-blue-600">
                      <input
                        type="checkbox"
                        checked={inStockOnly}
                        onChange={(e) => setInStockOnly(e.target.checked)}
                        className="mr-3 h-4 w-4 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      In Stock Only
                    </label>
                  </li>
                </ul>
              </div>

              {/* GENERATION Filter */}
              {availableGens.length > 0 && (
                <div className="border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between cursor-pointer text-sm font-bold text-slate-700 mb-3 uppercase">
                    <span>Generation Type</span>
                    <ChevronDown className="h-4 w-4 rotate-180 text-slate-400" />
                  </div>
                  <ul className="space-y-2">
                    {availableGens.map((gen: any) => (
                      <li key={gen} className="flex items-center justify-between group">
                        <label className="flex items-center cursor-pointer text-sm text-slate-600 group-hover:text-blue-600">
                          <input
                            type="checkbox"
                            checked={selectedGens.includes(gen)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedGens([...selectedGens, gen]);
                              else setSelectedGens(selectedGens.filter(g => g !== gen));
                            }}
                            className="mr-3 h-4 w-4 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          {gen}
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* RAM TYPE Filter */}
              {availableRamTypes.length > 0 && (
                <div className="border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between cursor-pointer text-sm font-bold text-slate-700 mb-3 uppercase">
                    <span>RAM Type</span>
                    <ChevronDown className="h-4 w-4 rotate-180 text-slate-400" />
                  </div>
                  <ul className="space-y-2">
                    {availableRamTypes.map((rt: any) => (
                      <li key={rt} className="flex items-center justify-between group">
                        <label className="flex items-center cursor-pointer text-sm text-slate-600 group-hover:text-blue-600">
                          <input
                            type="checkbox"
                            checked={selectedRamTypes.includes(rt)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedRamTypes([...selectedRamTypes, rt]);
                              else setSelectedRamTypes(selectedRamTypes.filter(r => r !== rt));
                            }}
                            className="mr-3 h-4 w-4 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          {rt}
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* PRICE Filter */}
              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between cursor-pointer text-sm font-bold text-slate-700 mb-3 uppercase">
                  <span>Price Range</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" placeholder="Min ₹" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500" />
                  <span className="text-slate-400">-</span>
                  <input type="number" placeholder="Max ₹" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              {/* Mock Placeholders */}
              {['Shop By OS', 'Budget'].map(filterName => (
                <div key={filterName} className="border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between cursor-pointer text-sm font-bold text-slate-700 uppercase opacity-50">
                    <span>{filterName} (Coming Soon)</span>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT SIDE - PRODUCT GRID */}
          <div className="flex-1">
            
            {/* Header Block */}
            <div className="bg-white p-6 shadow-sm border border-slate-200 rounded-sm mb-6">
              <h1 className="text-2xl font-bold text-slate-800 mb-2">
                {categoryFilter ? categoryFilter : 'Laptops'}
              </h1>
              <p className="text-sm text-slate-500 leading-relaxed">
                Buy laptops online at the best price in India. Explore gaming, business, and everyday laptops from top brands including HP, Dell, Lenovo, ASUS, Acer, Apple, MSI, and Samsung. Compare laptop prices in India and choose from premium, mid-range, and budget-friendly models with a genuine warranty and reliable delivery.
              </p>
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 shadow-sm border border-slate-200 rounded-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button 
                  className="lg:hidden flex items-center gap-2 text-sm text-slate-600 border border-slate-300 px-3 py-1 rounded-sm"
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                >
                  <Filter className="h-4 w-4" /> Filters
                </button>
                <span className="text-sm text-slate-500 whitespace-nowrap">{displayedProducts.length} products</span>
              </div>
              
              <div className="flex-1 max-w-md relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by product name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Mock View Toggles */}
              <div className="hidden lg:flex items-center gap-3 text-slate-300">
                <div className="grid grid-cols-2 gap-0.5 cursor-pointer hover:text-slate-600">
                   <div className="w-1.5 h-1.5 bg-current rounded-sm"></div><div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                   <div className="w-1.5 h-1.5 bg-current rounded-sm"></div><div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                </div>
                <div className="grid grid-cols-3 gap-0.5 cursor-pointer hover:text-slate-600">
                   <div className="w-1 h-1.5 bg-current rounded-sm"></div><div className="w-1 h-1.5 bg-current rounded-sm"></div><div className="w-1 h-1.5 bg-current rounded-sm"></div>
                   <div className="w-1 h-1.5 bg-current rounded-sm"></div><div className="w-1 h-1.5 bg-current rounded-sm"></div><div className="w-1 h-1.5 bg-current rounded-sm"></div>
                </div>
                <div className="grid grid-cols-4 gap-0.5 cursor-pointer text-slate-800">
                   <div className="w-1 h-1 bg-current"></div><div className="w-1 h-1 bg-current"></div><div className="w-1 h-1 bg-current"></div><div className="w-1 h-1 bg-current"></div>
                   <div className="w-1 h-1 bg-current"></div><div className="w-1 h-1 bg-current"></div><div className="w-1 h-1 bg-current"></div><div className="w-1 h-1 bg-current"></div>
                   <div className="w-1 h-1 bg-current"></div><div className="w-1 h-1 bg-current"></div><div className="w-1 h-1 bg-current"></div><div className="w-1 h-1 bg-current"></div>
                </div>
                <div className="flex flex-col gap-0.5 cursor-pointer hover:text-slate-600 ml-2">
                   <div className="w-4 h-0.5 bg-current"></div>
                   <div className="w-4 h-0.5 bg-current"></div>
                   <div className="w-4 h-0.5 bg-current"></div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Sort by:</span>
                <div className="relative">
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="text-sm font-medium text-slate-800 border-0 bg-transparent pr-6 focus:ring-0 cursor-pointer appearance-none outline-none"
                  >
                    <option value="featured">Featured</option>
                    <option value="newest">Newest</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                  <ChevronDown className="h-4 w-4 absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayedProducts.map((product) => {
                const isDiscounted = product.oldPrice && product.oldPrice > product.price;
                const discountPercent = isDiscounted 
                  ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) 
                  : Math.floor(Math.random() * 20) + 5; // Fake discount if none provided to match screenshot
                
                const emiAmount = Math.round(product.price / 12);

                return (
                  <Link key={product.id} to={`/products/${product.id}`} className="group bg-white border border-slate-200 rounded-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col relative p-4">
                    
                    {/* Discount Badge */}
                    <div className="absolute top-4 left-4 z-10">
                      <span className="bg-black text-white text-[10px] font-bold px-2 py-1 rounded-sm">
                        -{discountPercent}%
                      </span>
                    </div>

                    {/* Image Placeholder */}
                    <div className="aspect-[4/3] w-full flex items-center justify-center mb-4 pt-8">
                      {product.imageUrls && product.imageUrls.length > 0 ? (
                        <div className="relative w-full h-full flex flex-col items-center justify-center group-hover:scale-105 transition-transform duration-500 px-4">
                          <img 
                            src={product.imageUrls[0]} 
                            alt={product.title} 
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="relative w-3/4 h-3/4 flex flex-col items-center justify-center group-hover:scale-105 transition-transform duration-500">
                           <div className="w-full h-full bg-slate-800 rounded-t-md border-4 border-slate-900 relative overflow-hidden flex items-center justify-center">
                              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20"></div>
                              <span className="text-white/20 font-bold text-2xl">MSI</span>
                           </div>
                           <div className="w-[110%] h-3 bg-slate-300 rounded-b-xl shadow-md border-t border-slate-400"></div>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-col flex-1">
                      <h3 className="text-xs font-bold text-slate-700 mb-2 line-clamp-2 uppercase leading-relaxed group-hover:text-blue-600 transition-colors">
                        {product.title}
                      </h3>
                      
                      <div className="mt-auto pt-2 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-blue-600">₹ {Number(product.price).toLocaleString('en-IN')}</span>
                          {product.oldPrice ? (
                             <span className="text-xs text-slate-400 line-through">₹ {Number(product.oldPrice).toLocaleString('en-IN')}</span>
                          ) : (
                             <span className="text-xs text-slate-400 line-through">₹ {Number(product.price + (product.price * 0.1)).toLocaleString('en-IN')}</span>
                          )}
                        </div>

                        {product.stock > 0 ? (
                          <div className="flex items-center gap-1 text-xs font-medium text-emerald-500 pt-1">
                            <Check className="h-3 w-3" /> In stock
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs font-medium text-red-500 pt-1">
                            <X className="h-3 w-3" /> Out of stock
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            
            {displayedProducts.length === 0 && (
              <div className="text-center py-20 bg-white rounded-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-2">No products found</h3>
                <p className="text-sm text-slate-500">Try adjusting your filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
