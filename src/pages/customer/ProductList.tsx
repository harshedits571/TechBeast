import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Filter, ChevronDown, Check, Star, X, Search, Monitor } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { CardGridSkeleton } from '../../components/ui/Skeleton';
import SEO from '../../components/ui/SEO';

function normalizeBrand(brand: string) {
  if (!brand) return 'Unknown';
  const upper = brand.trim().toUpperCase();
  if (['HP', 'MSI', 'LG', 'IBM', 'JBL', 'AMD'].includes(upper)) return upper;
  return brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
}

function inferComponentType(product: any): string {
  if (product.componentType) return product.componentType;
  const title = (product.title || '').toLowerCase();
  const cat = (product.category || '').toLowerCase();
  if (title.includes('motherboard') || title.includes('atx') || title.includes('matx') || title.includes('b650') || title.includes('b760') || title.includes('x870') || title.includes('z790')) return 'Motherboard';
  if (title.includes('processor') || title.includes('intel core') || title.includes('ryzen') || title.includes('i3') || title.includes('i5') || title.includes('i7') || title.includes('i9')) return 'Processor';
  if (title.includes('cabinet') || title.includes('case') || title.includes('tower')) return 'Cabinet';
  if (title.includes('ram') || title.includes('ddr4') || title.includes('ddr5') || title.includes('memory')) return 'RAM';
  if (title.includes('graphics') || title.includes('gpu') || title.includes('rtx') || title.includes('gtx') || title.includes('radeon')) return 'Graphics Card';
  if (title.includes('power supply') || title.includes('psu') || title.includes('smps')) return 'Power Supply';
  if (title.includes('ssd') || title.includes('nvme') || title.includes('hdd') || title.includes('hard drive')) return 'Storage';
  if (title.includes('cooler') || title.includes('fan') || title.includes('liquid')) return 'Cooler';
  if (cat === 'components' || cat === 'component' || cat === 'desktop parts') return 'Component';
  return '';
}

export default function ProductList() {
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');
  const conditionFilter = searchParams.get('condition');
  
  const [sortBy, setSortBy] = useState('featured');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedGens, setSelectedGens] = useState<string[]>([]);
  const [selectedRamTypes, setSelectedRamTypes] = useState<string[]>([]);
  const [selectedComponentTypes, setSelectedComponentTypes] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination State (10, 20, 30, 50 per page)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Sort newest first by default
        productsData.sort((a: any, b: any) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (a.updatedAt ? new Date(a.updatedAt).getTime() : 0);
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (b.updatedAt ? new Date(b.updatedAt).getTime() : 0);
          return timeB - timeA;
        });
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const productMatchesCategoryAndCondition = (p: any) => {
    // Exclude Prebuilt PCs from standard store listings (they have dedicated /prebuilt-pc page)
    const isPrebuiltPC = p.isPrebuilt || p.category === 'Pre-built PC' || p.category === 'Prebuilt PC';
    if (isPrebuiltPC && categoryFilter !== 'Pre-built PC' && categoryFilter !== 'Prebuilt PC') return false;

    const pCatLower = (p.category || '').toLowerCase();
    const isLaptop = pCatLower.includes('laptop');
    const isDesktop = pCatLower.includes('desktop') || pCatLower.includes('component');

    // Category Filter
    if (categoryFilter) {
      const catLow = categoryFilter.toLowerCase();
      if (catLow.includes('laptop')) {
        if (!isLaptop) return false;
      } else if (catLow.includes('desktop')) {
        if (!isDesktop) return false;
      } else if (catLow.includes('component')) {
        const isComponent = pCatLower.includes('component') || pCatLower.includes('desktop') || pCatLower.includes('processor') || pCatLower.includes('ram') || pCatLower.includes('motherboard') || pCatLower.includes('graphic');
        if (!isComponent) return false;
      } else if (pCatLower !== catLow) {
        return false;
      }
    }

    // Condition Filter (from URL condition parameter)
    if (conditionFilter) {
      const condLower = (p.condition || '').toLowerCase();
      if (conditionFilter.toLowerCase() === 'new') {
        const isNew = condLower === 'new' || pCatLower.includes('new') || (!condLower && !pCatLower.includes('used'));
        if (!isNew) return false;
      } else if (conditionFilter.toLowerCase() === 'used') {
        const isUsed = condLower.includes('used') || condLower.includes('second') || condLower.includes('refurbished') || condLower.includes('pre-owned') || pCatLower.includes('used');
        if (!isUsed) return false;
      } else {
        if (condLower !== conditionFilter.toLowerCase() && !pCatLower.includes(conditionFilter.toLowerCase())) return false;
      }
    }

    return true;
  };

  const relevantProducts = products.filter(productMatchesCategoryAndCondition);

  const availableBrands = Array.from(new Set(relevantProducts.map(p => {
    let b = p.brand;
    if (!b && p.title) b = p.title.split(' ')[0];
    return normalizeBrand(b);
  }))).filter(Boolean).sort();

  const availableGens = Array.from(new Set(relevantProducts.map(p => p.processorGen))).filter(Boolean).sort();
  const availableRamTypes = Array.from(new Set(relevantProducts.map(p => p.ramType))).filter(Boolean).sort();
  const availableComponentTypes = Array.from(new Set(relevantProducts.map(p => inferComponentType(p)))).filter(Boolean).sort();
  const availableConditions = Array.from(new Set(relevantProducts.map(p => p.condition))).filter(Boolean).sort();

  const pageTitle = conditionFilter
    ? (categoryFilter ? `${conditionFilter} ${categoryFilter}` : `${conditionFilter} Products`)
    : (categoryFilter || 'All Products');

  const displayedProducts = relevantProducts.filter(p => {
    // Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesTitle = p.title?.toLowerCase().includes(q);
      const matchesSku = p.sku?.toLowerCase().includes(q);
      if (!matchesTitle && !matchesSku) return false;
    }
    
    // Brand Filter
    let productBrand = p.brand || (p.title ? p.title.split(' ')[0] : 'Unknown');
    productBrand = normalizeBrand(productBrand);
    if (selectedBrands.length > 0 && !selectedBrands.includes(productBrand)) return false;
    
    // Condition Filter (from checkboxes)
    if (selectedConditions.length > 0) {
      const pCond = (p.condition || '').toLowerCase();
      const pCatLower = (p.category || '').toLowerCase();
      const matchesCond = selectedConditions.some(c => {
        const cLow = c.toLowerCase();
        if (cLow === 'used' || cLow.includes('second')) {
          return pCond.includes('used') || pCond.includes('second') || pCond.includes('refurbished') || pCatLower.includes('used');
        }
        if (cLow === 'new') {
          return pCond === 'new' || pCatLower.includes('new');
        }
        return pCond === cLow;
      });
      if (!matchesCond) return false;
    }

    // Generation Filter
    if (selectedGens.length > 0 && (!p.processorGen || !selectedGens.includes(p.processorGen))) return false;

    // RAM Type Filter
    if (selectedRamTypes.length > 0 && (!p.ramType || !selectedRamTypes.includes(p.ramType))) return false;

    // Component Type Filter
    const productCompType = inferComponentType(p);
    if (selectedComponentTypes.length > 0 && (!productCompType || !selectedComponentTypes.includes(productCompType))) return false;

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
      <SEO 
        title={`${pageTitle} - Tech Beast Hubli`}
        description={`Explore our wide range of ${pageTitle.toLowerCase()} at Tech Beast Hubli. Get premium quality at the best prices.`}
      />
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT SIDEBAR - FILTERS */}
          <div className={`w-full lg:w-64 flex-shrink-0 ${isFilterOpen ? 'block' : 'hidden lg:block'} bg-white p-6 shadow-sm border border-slate-200 rounded-sm`}>
            <div className="text-lg text-slate-500 mb-6">Filters</div>
            
            <div className="space-y-6">
              {/* COMPONENT TYPE Filter (For Desktops & Components) */}
              {(categoryFilter === 'Desktops' || categoryFilter === 'Components') && availableComponentTypes.length > 0 && (
                <div>
                  <div className="flex items-center justify-between cursor-pointer text-sm font-bold text-slate-700 mb-3 uppercase">
                    <span>Component Type</span>
                    <ChevronDown className="h-4 w-4 rotate-180 text-slate-400" />
                  </div>
                  <ul className="space-y-2">
                    {availableComponentTypes.map((type: any) => {
                      const count = relevantProducts.filter(p => inferComponentType(p) === type).length;
                      
                      if (count === 0) return null;
                      return (
                        <li key={type} className="flex items-center justify-between group">
                          <label className="flex items-center cursor-pointer text-sm text-slate-600 group-hover:text-blue-600">
                            <input
                              type="checkbox"
                              checked={selectedComponentTypes.includes(type)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedComponentTypes([...selectedComponentTypes, type]);
                                else setSelectedComponentTypes(selectedComponentTypes.filter(t => t !== type));
                              }}
                              className="mr-3 h-4 w-4 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            {type}
                          </label>
                          <span className="text-xs text-slate-400">({count})</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* BRAND Filter */}
              <div className={categoryFilter === 'Desktops' && availableComponentTypes.length > 0 ? "border-t border-slate-100 pt-4" : ""}>
                <div className="flex items-center justify-between cursor-pointer text-sm font-bold text-slate-700 mb-3 uppercase">
                  <span>Brand</span>
                  <ChevronDown className="h-4 w-4 rotate-180 text-slate-400" />
                </div>
                <ul className="space-y-2">
                  {availableBrands.map((brand: any) => {
                    const count = relevantProducts.filter(p => {
                      let b = p.brand;
                      if (!b && p.title) b = p.title.split(' ')[0];
                      return normalizeBrand(b) === brand;
                    }).length;
                    
                    if (count === 0) return null;
                    return (
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
                        <span className="text-xs text-slate-400">({count})</span>
                      </li>
                    );
                  })}
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
                    {availableGens.map((gen: any) => {
                      const count = relevantProducts.filter(p => p.processorGen === gen).length;
                      
                      if (count === 0) return null;
                      return (
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
                          <span className="text-xs text-slate-400">({count})</span>
                        </li>
                      );
                    })}
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
                    {availableRamTypes.map((rt: any) => {
                      const count = relevantProducts.filter(p => p.ramType === rt).length;

                      if (count === 0) return null;
                      return (
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
                          <span className="text-xs text-slate-400">({count})</span>
                        </li>
                      );
                    })}
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
                {pageTitle}
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

              <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                <span className="text-sm text-slate-500">Per page:</span>
                <select 
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="text-sm font-medium text-slate-800 border border-slate-200 bg-slate-50 rounded px-2 py-1 focus:ring-0 cursor-pointer outline-none font-bold"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={30}>30</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {/* Product Grid */}
            {loading ? (
              <CardGridSkeleton count={8} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayedProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((product) => {
                const isDiscounted = product.oldPrice && product.oldPrice > product.price;
                const discountPercent = isDiscounted 
                  ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) 
                  : Math.floor(Math.random() * 20) + 5; // Fake discount if none provided to match screenshot
                
                const emiAmount = Math.round(product.price / 12);

                return (
                  <Link key={product.id} to={`/products/${product.id}`} className="group bg-white border border-slate-200 rounded-xl hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col relative p-4 h-full">
                    
                    {/* Discount Badge */}
                    <div className="absolute top-3 left-3 z-10">
                      <span className="bg-black text-white text-[10px] font-black px-2 py-0.5 rounded shadow-sm">
                        -{discountPercent}%
                      </span>
                    </div>

                    {/* Standardized Centered Bounding Box for Horizontal & Vertical Images */}
                    <div className="w-full h-48 sm:h-52 flex items-center justify-center p-3 mb-3 bg-slate-50/70 rounded-xl overflow-hidden relative">
                      {product.imageUrls && product.imageUrls.length > 0 ? (
                        <img 
                          src={product.imageUrls[0]} 
                          alt={product.title} 
                          loading="lazy"
                          className="max-h-full max-w-full w-auto h-auto object-contain object-center group-hover:scale-105 transition-transform duration-300 mx-auto my-auto"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 group-hover:scale-105 transition-transform duration-300">
                          <Monitor className="h-14 w-14 text-slate-300 stroke-[1.5]" />
                          <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Tech Beast</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-col flex-1">
                      <h3 className="h-10 text-xs font-bold text-slate-800 mb-2 line-clamp-2 uppercase leading-snug group-hover:text-blue-600 transition-colors">
                        {product.title}
                      </h3>
                      
                      <div className="mt-auto pt-2 space-y-1.5 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="text-base sm:text-lg font-black text-blue-600 font-mono">₹ {Number(product.price).toLocaleString('en-IN')}</span>
                          {product.oldPrice ? (
                             <span className="text-xs text-slate-400 line-through">₹ {Number(product.oldPrice).toLocaleString('en-IN')}</span>
                          ) : (
                             <span className="text-xs text-slate-400 line-through">₹ {Number(product.price + (product.price * 0.1)).toLocaleString('en-IN')}</span>
                          )}
                        </div>

                        {product.stock > 0 ? (
                          <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                            <Check className="h-3.5 w-3.5" /> In stock
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs font-semibold text-red-500">
                            <X className="h-3.5 w-3.5" /> Out of stock
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            )}

            {/* Bottom Pagination Controls */}
            {Math.ceil(displayedProducts.length / itemsPerPage) > 1 && (
              <div className="flex items-center justify-end border border-slate-200 bg-white rounded-sm p-4 mt-6 text-sm text-slate-600">
                <div className="flex items-center gap-1.5 font-bold flex-wrap">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => {
                      setCurrentPage(p => Math.max(1, p - 1));
                      window.scrollTo({ top: 200, behavior: 'smooth' });
                    }}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-200 rounded text-slate-700 transition cursor-pointer text-xs"
                  >
                    Previous
                  </button>

                  {Array.from({ length: Math.ceil(displayedProducts.length / itemsPerPage) }, (_, i) => i + 1).map(pageNum => (
                    <button
                      key={pageNum}
                      onClick={() => {
                        setCurrentPage(pageNum);
                        window.scrollTo({ top: 200, behavior: 'smooth' });
                      }}
                      className={`w-8 h-8 rounded border transition cursor-pointer text-xs font-bold ${
                        currentPage === pageNum
                          ? 'bg-blue-600 border-blue-600 text-white font-extrabold shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    disabled={currentPage === Math.ceil(displayedProducts.length / itemsPerPage)}
                    onClick={() => {
                      setCurrentPage(p => Math.min(Math.ceil(displayedProducts.length / itemsPerPage), p + 1));
                      window.scrollTo({ top: 200, behavior: 'smooth' });
                    }}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-200 rounded text-slate-700 transition cursor-pointer text-xs"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
            
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
