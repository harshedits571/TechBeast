import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, MoreVertical, Edit, Trash2, Download, ChevronDown } from 'lucide-react';
import { collection, getDocs, query, orderBy, deleteDoc, doc, updateDoc, limit, startAfter } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAdmin } from '../../contexts/AdminContext';
import { exportToCsv } from '../../utils/exportCsv';
import { TableBodySkeleton } from '../../components/ui/Skeleton';
import { deleteCloudinaryImage } from '../../utils/cloudinary';
import { useSecurityPin } from '../../contexts/SecurityPinContext';

export default function ProductsList() {
  const { confirmWithPin } = useSecurityPin();
  const { productsState } = useAdmin();
  const { data: products, loading, pageSize, setPageSize, currentPage, setCurrentPage, hasNextPage, setCursors } = productsState;

  const [searchTerm, setSearchTerm] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const categories = ['All', 'New Laptops', 'Used Laptops', 'Desktops', 'Accessories', 'Spare Parts', 'Components', 'Prebuilt PC'];
  
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const categoryParam = searchParams.get('category');

  const [selectedCategory, setSelectedCategory] = useState<string>(
    categoryParam && categories.includes(categoryParam) ? categoryParam : 'All'
  );

  useEffect(() => {
    if (categoryParam && categories.includes(categoryParam)) {
      setSelectedCategory(categoryParam);
    } else if (!categoryParam) {
      setSelectedCategory('All');
    }
  }, [categoryParam]);

  const navigate = useNavigate();

  const handleTabClick = (cat: string) => {
    setSelectedCategory(cat);
    if (cat === 'All') {
      navigate('/admin/products');
    } else {
      navigate(`/admin/products?category=${cat}`);
    }
  };



  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const handleStatusUpdate = async (productId: string, newStatus: string) => {
    try {
      setUpdatingStatusId(productId);
      await updateDoc(doc(db, "products", productId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status.");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleDelete = (id: string, title?: string) => {
    confirmWithPin({
      title: "Delete Product",
      itemName: title || id,
      description: "Enter your 4-digit Admin PIN to permanently delete this product and its Cloudinary media assets.",
      confirmText: "Verify PIN & Delete Product",
      onConfirm: async () => {
        try {
          const productToDelete = products.find(p => p.id === id);

          // Delete images from Cloudinary first
          if (productToDelete?.imageUrls?.length > 0) {
            console.log(`Deleting ${productToDelete.imageUrls.length} images from Cloudinary...`);
            for (const url of productToDelete.imageUrls) {
              await deleteCloudinaryImage(url);
            }
          }

          await deleteDoc(doc(db, "products", id));
        } catch (error) {
          console.error("Error deleting product:", error);
          alert("Failed to delete product.");
        }
      }
    });
  };

  const toggleDropdown = (id: string) => {
    if (openDropdownId === id) {
      setOpenDropdownId(null);
    } else {
      setOpenDropdownId(id);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesCategory = false;
    const pCat = p.category || '';
    const isLaptop = pCat === 'Laptops' || pCat === 'New Laptops' || pCat === 'Used Laptops' || pCat.toLowerCase().includes('laptop');

    if (selectedCategory === 'All') {
      matchesCategory = true;
    } else if (selectedCategory === 'New Laptops') {
      matchesCategory = isLaptop && (pCat === 'New Laptops' || !p.condition || p.condition === 'New');
    } else if (selectedCategory === 'Used Laptops') {
      matchesCategory = isLaptop && (pCat === 'Used Laptops' || (p.condition && p.condition !== 'New'));
    } else if (selectedCategory === 'Desktops') {
      matchesCategory = pCat === 'Desktops' || pCat === 'Desktop Parts' || pCat === 'Desktop' || pCat === 'Components' || pCat === 'Component';
    } else if (selectedCategory === 'Components') {
      matchesCategory = pCat === 'Components' || pCat === 'Component' || pCat === 'Desktops' || pCat === 'Desktop Parts' || pCat === 'Processors' || pCat === 'RAM' || pCat === 'Motherboards';
    } else {
      matchesCategory = pCat === selectedCategory;
    }

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Products</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your inventory, pricing, and product details.</p>
        </div>
        <Link to="/admin/products/new" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full text-xs font-bold transition-all shadow-lg shadow-blue-900/20 uppercase tracking-wider flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      <div className="bg-[#0d0d0e] rounded-3xl border border-white/10 flex flex-col overflow-hidden shadow-2xl">
        {/* Toolbar */}
        <div className="p-6 border-b border-white/5 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-500" />
              </div>
              <input
                type="text"
                placeholder="Search products by title, SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-500 text-white placeholder-slate-500"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => exportToCsv('products.csv', products)} className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-full text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white transition-colors uppercase tracking-widest">
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 scrollbar-none border-t border-white/5">
            {categories.map(cat => {
              let count = 0;
              if (cat === 'All') count = products.length;
              else if (cat === 'New Laptops') count = products.filter(p => {
                const pCat = p.category || '';
                const isL = pCat === 'Laptops' || pCat === 'New Laptops' || pCat === 'Used Laptops' || pCat.toLowerCase().includes('laptop');
                return isL && (pCat === 'New Laptops' || !p.condition || p.condition === 'New');
              }).length;
              else if (cat === 'Used Laptops') count = products.filter(p => {
                const pCat = p.category || '';
                const isL = pCat === 'Laptops' || pCat === 'New Laptops' || pCat === 'Used Laptops' || pCat.toLowerCase().includes('laptop');
                return isL && (pCat === 'Used Laptops' || (p.condition && p.condition !== 'New'));
              }).length;
              else count = products.filter(p => p.category === cat).length;
              
              const isActive = selectedCategory === cat;

              return (
                <button
                  key={cat}
                  onClick={() => handleTabClick(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 uppercase tracking-wider ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-left text-[10px] text-slate-500 uppercase tracking-tighter border-b border-white/5">
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Condition</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <TableBodySkeleton columns={8} rows={5} />
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500">No products found.</td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const currentStatus = product.status || (Number(product.stock) > 0 ? 'In Stock' : 'Out of Stock');
                  const isUpdating = updatingStatusId === product.id;

                  return (
                    <tr key={product.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center w-full max-w-[200px] sm:max-w-xs lg:max-w-sm">
                          <div className="h-10 w-10 flex-shrink-0 bg-slate-800 rounded-xl border border-white/5 flex items-center justify-center overflow-hidden">
                            {product.imageUrls && product.imageUrls.length > 0 ? (
                              <img src={product.imageUrls[0]} alt={product.title} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-slate-500 text-[10px] font-bold">IMG</span>
                            )}
                          </div>
                          <div className="ml-4 flex-1 min-w-0">
                            <div className="text-sm font-bold text-slate-200 truncate" title={product.title}>{product.title}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-400">{product.sku}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{product.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-[10px] font-bold rounded-md border ${product.condition === 'New'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          }`}>
                          {(product.condition || 'Unknown').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-bold">{product.stock}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-bold">₹{Number(product.price).toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative inline-flex items-center">
                          <select
                            value={currentStatus}
                            onChange={(e) => handleStatusUpdate(product.id, e.target.value)}
                            disabled={isUpdating}
                            title="Click to switch status (In Stock / Out of Stock / Offline)"
                            className={`appearance-none cursor-pointer pl-3 pr-8 py-1 text-[11px] font-extrabold rounded-lg border transition-all focus:outline-none focus:ring-1 uppercase tracking-wider ${
                              currentStatus === 'Offline'
                                ? 'bg-slate-800/90 text-slate-300 border-slate-700 hover:border-slate-500 focus:ring-slate-500'
                                : currentStatus === 'Out of Stock'
                                ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:border-red-500/50 focus:ring-red-500'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:border-emerald-500/50 focus:ring-emerald-500'
                            } ${isUpdating ? 'opacity-50 cursor-wait' : ''}`}
                          >
                            <option value="In Stock" className="bg-[#18181b] text-emerald-400 font-bold">IN STOCK</option>
                            <option value="Out of Stock" className="bg-[#18181b] text-red-400 font-bold">OUT OF STOCK</option>
                            <option value="Offline" className="bg-[#18181b] text-slate-400 font-bold">OFFLINE</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-current opacity-70">
                            <ChevronDown className="h-3.5 w-3.5" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2 relative">
                          <Link to={`/admin/products/edit/${product.id}`} className="text-slate-500 hover:text-blue-400 transition-colors p-1" title="Edit">
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button onClick={() => handleDelete(product.id, product.title)} className="text-slate-500 hover:text-red-400 transition-colors p-1" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <div className="relative">
                            <button onClick={() => toggleDropdown(product.id)} className="text-slate-500 hover:text-white transition-colors p-1" title="More options">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            {openDropdownId === product.id && (
                              <div className="absolute right-0 mt-2 w-52 bg-[#1a1a1c] border border-white/10 rounded-xl shadow-2xl z-20 py-1.5 flex flex-col text-xs text-left">
                                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">
                                  Quick Status Change
                                </div>
                                <button 
                                  onClick={() => { handleStatusUpdate(product.id, 'In Stock'); setOpenDropdownId(null); }} 
                                  className={`px-3 py-2 flex items-center gap-2 transition-colors ${currentStatus === 'In Stock' ? 'text-emerald-400 font-bold bg-white/5' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                                >
                                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                  Set In Stock
                                </button>
                                <button 
                                  onClick={() => { handleStatusUpdate(product.id, 'Out of Stock'); setOpenDropdownId(null); }} 
                                  className={`px-3 py-2 flex items-center gap-2 transition-colors ${currentStatus === 'Out of Stock' ? 'text-red-400 font-bold bg-white/5' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                                >
                                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                  Set Out of Stock
                                </button>
                                <button 
                                  onClick={() => { handleStatusUpdate(product.id, 'Offline'); setOpenDropdownId(null); }} 
                                  className={`px-3 py-2 flex items-center gap-2 transition-colors ${currentStatus === 'Offline' ? 'text-slate-300 font-bold bg-white/5' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                                >
                                  <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                                  Make Offline (Hide)
                                </button>
                                <div className="h-px bg-white/5 my-1" />
                                {currentStatus !== 'Offline' ? (
                                  <Link to={`/products/${product.id}`} target="_blank" className="text-left px-3 py-2 text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                                    View in Store
                                  </Link>
                                ) : (
                                  <span className="px-3 py-2 text-slate-500 italic">
                                    Hidden in Store (Offline)
                                  </span>
                                )}
                                <button onClick={() => { navigator.clipboard.writeText(product.id); setOpenDropdownId(null); }} className="text-left px-3 py-2 text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                                  Copy Product ID
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-t border-white/5 flex items-center justify-between text-xs text-slate-500 uppercase tracking-widest font-bold">
          <div className="flex items-center gap-4">
            <span className="whitespace-nowrap">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(0);
                setCursors([null]);
              }}
              className="bg-[#1a1a1c] border border-white/10 rounded-md py-1 px-2 text-white outline-none cursor-pointer"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={75}>75</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div className="flex gap-2 items-center">
            <span className="mr-4">Page {currentPage + 1}</span>
            <button
              onClick={() => setCurrentPage(p => p - 1)}
              disabled={currentPage === 0 || loading}
              className="px-4 py-2 border border-white/10 rounded-full hover:bg-white/5 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={!hasNextPage || loading}
              className="px-4 py-2 border border-white/10 rounded-full hover:bg-white/5 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
