import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, MoreVertical, Edit, Trash2, Download } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, orderBy, deleteDoc, doc, limit, startAfter } from 'firebase/firestore';
import { exportToCsv } from '../../utils/exportCsv';
import { TableBodySkeleton } from '../../components/ui/Skeleton';
import { deleteCloudinaryImage } from '../../utils/cloudinary';
export default function ProductsList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Pagination state
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(0);
  const [cursors, setCursors] = useState<any[]>([null]);
  const [hasNextPage, setHasNextPage] = useState(true);

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this product? This will also delete its images from Cloudinary.")) {
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
        setProducts(products.filter(p => p.id !== id));
      } catch (error) {
        console.error("Error deleting product:", error);
        alert("Failed to delete product.");
      }
    }
  };

  const toggleDropdown = (id: string) => {
    if (openDropdownId === id) {
      setOpenDropdownId(null);
    } else {
      setOpenDropdownId(id);
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let q;
        const currentCursor = cursors[currentPage];

        if (currentCursor) {
          q = query(collection(db, "products"), orderBy("createdAt", "desc"), startAfter(currentCursor), limit(pageSize));
        } else {
          q = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(pageSize));
        }

        const querySnapshot = await getDocs(q);
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as any)
        }));

        setProducts(productsData);
        setHasNextPage(querySnapshot.docs.length === pageSize);

        if (querySnapshot.docs.length > 0) {
          const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
          setCursors(prev => {
            const newCursors = [...prev];
            newCursors[currentPage + 1] = lastDoc;
            return newCursors;
          });
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [pageSize, currentPage]);

  const filteredProducts = products.filter(p =>
    p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="p-6 border-b border-white/5 flex items-center gap-4">
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
            <button className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-full text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white transition-colors uppercase tracking-widest">
              <Filter className="h-4 w-4" />
              Filters
            </button>
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
                filteredProducts.map((product) => (
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
                      <span className={`px-2 py-1 text-[10px] font-bold rounded-md border ${product.stock <= 0
                          ? 'bg-red-500/10 text-red-500 border-red-500/20'
                          : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                        }`}>
                        {product.stock <= 0 ? 'OUT OF STOCK' : (product.status || 'Unknown').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2 relative">
                        <Link to={`/admin/products/edit/${product.id}`} className="text-slate-500 hover:text-blue-400 transition-colors p-1" title="Edit">
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button onClick={() => handleDelete(product.id)} className="text-slate-500 hover:text-red-400 transition-colors p-1" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <div className="relative">
                          <button onClick={() => toggleDropdown(product.id)} className="text-slate-500 hover:text-white transition-colors p-1" title="More options">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {openDropdownId === product.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-[#1a1a1c] border border-white/10 rounded-xl shadow-2xl z-10 py-1 flex flex-col">
                              <Link to={`/products/${product.id}`} target="_blank" className="text-left px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                                View in Store
                              </Link>
                              <button onClick={() => { navigator.clipboard.writeText(product.id); setOpenDropdownId(null); }} className="text-left px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                                Copy Product ID
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
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
