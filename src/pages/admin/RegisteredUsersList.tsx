import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Download, 
  Laptop, 
  Monitor, 
  Headphones, 
  MessageCircle, 
  Phone, 
  Mail, 
  ExternalLink, 
  Eye, 
  Clock, 
  Tag, 
  Sparkles, 
  Layers, 
  ChevronRight, 
  ArrowUpRight,
  Filter,
  Flame,
  CheckCircle2,
  X,
  Building2,
  Cpu,
  ArrowUpDown,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  ArrowDownAZ,
  ArrowUpAZ,
  RotateCw,
  ShoppingBag
} from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { exportToCsv } from '../../utils/exportCsv';
import { TableBodySkeleton } from '../../components/ui/Skeleton';
import { generateWhatsAppInquiryUrl, CustomerViewItem } from '../../utils/activityTracker';

interface CustomerLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt?: string;
  lastActive?: string;
  lastViewedProduct?: string;
  lastViewedCategory?: string;
  viewedProducts?: CustomerViewItem[];
  totalViews?: number;
  totalSpent?: number;
  ordersCount?: number;
  registeredOnline?: boolean;
}

type SortOption = 'ACTIVITY' | 'NAME_ASC' | 'NAME_DESC' | 'PHONE' | 'VIEWS_COUNT' | 'DATE_NEWEST' | 'DATE_OLDEST';

export default function RegisteredUsersList() {
  const [users, setUsers] = useState<CustomerLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<'ALL' | 'LAPTOPS' | 'DESKTOPS' | 'ACCESSORIES' | 'HIGH_INTEREST'>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('ACTIVITY');
  
  // Pagination State (25, 50, 75, 100)
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(0);

  // Modals
  const [activeCustomerModal, setActiveCustomerModal] = useState<CustomerLead | null>(null);
  const [selectedProductForInquiry, setSelectedProductForInquiry] = useState<{
    customer: CustomerLead;
    product: CustomerViewItem;
  } | null>(null);

  // Real-time synchronization logic
  useEffect(() => {
    setLoading(true);
    let rawCustomers: any[] = [];
    let rawViews: any[] = [];

    const processAndSync = () => {
      const customersMap = new Map<string, CustomerLead>();

      // 1. Process customers
      rawCustomers.forEach(docSnap => {
        const data = typeof docSnap.data === 'function' ? docSnap.data() : docSnap;
        const id = docSnap.id || data.id;

        // Include if registeredOnline is true OR if they have viewedProducts
        if (data.registeredOnline || (data.viewedProducts && data.viewedProducts.length > 0)) {
          const rawList: CustomerViewItem[] = Array.isArray(data.viewedProducts) ? data.viewedProducts : [];
          
          // Strict deduplication by productId: combine view counts and keep latest timestamp
          const dedupedMap = new Map<string, CustomerViewItem>();
          rawList.forEach(item => {
            if (!item.productId) return;
            const existing = dedupedMap.get(item.productId);
            if (existing) {
              existing.viewCount = (existing.viewCount || 1) + (item.viewCount || 1);
              if (new Date(item.viewedAt || 0).getTime() > new Date(existing.viewedAt || 0).getTime()) {
                existing.viewedAt = item.viewedAt;
              }
            } else {
              dedupedMap.set(item.productId, { ...item, viewCount: item.viewCount || 1 });
            }
          });

          const viewedList = Array.from(dedupedMap.values());
          const totalViews = viewedList.reduce((sum, item) => sum + (item.viewCount || 1), 0);
          
          customersMap.set(id, {
            id: id,
            name: data.name || 'Customer',
            email: data.email || '',
            phone: data.phone || '',
            createdAt: data.createdAt || '',
            lastActive: data.lastActive || data.createdAt || '',
            lastViewedProduct: data.lastViewedProduct || (viewedList[0]?.title) || '',
            lastViewedCategory: data.lastViewedCategory || (viewedList[0]?.category) || '',
            viewedProducts: viewedList,
            totalViews: totalViews,
            totalSpent: data.totalSpent || 0,
            ordersCount: data.ordersCount || 0,
            registeredOnline: !!data.registeredOnline
          });
        }
      });

      // 2. Process customer_views collection to merge live granular views
      rawViews.forEach(vDoc => {
        const vData = typeof vDoc.data === 'function' ? vDoc.data() : vDoc;
        const custId = vData.customerId || (vData.customerPhone ? vData.customerPhone.replace(/\D/g, '') : null);
        if (!custId) return;

        let cust = customersMap.get(custId);
        if (!cust) {
          cust = {
            id: custId,
            name: vData.customerName || 'Customer',
            email: vData.customerEmail || '',
            phone: vData.customerPhone || '',
            createdAt: vData.firstViewedAt || vData.viewedAt || '',
            lastActive: vData.lastViewedAt || vData.viewedAt || '',
            lastViewedProduct: vData.productTitle || '',
            lastViewedCategory: vData.productCategory || '',
            viewedProducts: [],
            totalViews: 0,
            registeredOnline: true
          };
          customersMap.set(custId, cust);
        }

        // Update lastActive timestamp if more recent
        const viewDateStr = vData.lastViewedAt || vData.viewedAt;
        if (viewDateStr) {
          const viewTime = new Date(viewDateStr).getTime();
          const currentActiveTime = cust.lastActive ? new Date(cust.lastActive).getTime() : 0;
          if (viewTime > currentActiveTime) {
            cust.lastActive = viewDateStr;
          }
        }

        const existingViewIndex = cust.viewedProducts?.findIndex(item => item.productId === vData.productId);
        const viewItem: CustomerViewItem = {
          productId: vData.productId,
          title: vData.productTitle,
          category: vData.productCategory || 'General',
          price: Number(vData.productPrice || 0),
          oldPrice: vData.productOldPrice ? Number(vData.productOldPrice) : undefined,
          imageUrl: vData.productImage || '',
          condition: vData.productCondition || '',
          brand: vData.productBrand || '',
          sku: vData.productSku || '',
          viewedAt: vData.lastViewedAt || vData.viewedAt || new Date().toISOString(),
          viewCount: Number(vData.viewCount || 1)
        };

        if (existingViewIndex !== undefined && existingViewIndex >= 0 && cust.viewedProducts) {
          cust.viewedProducts[existingViewIndex] = {
            ...cust.viewedProducts[existingViewIndex],
            ...viewItem,
            viewCount: Math.max(cust.viewedProducts[existingViewIndex].viewCount || 1, viewItem.viewCount)
          };
        } else {
          cust.viewedProducts = cust.viewedProducts || [];
          cust.viewedProducts.push(viewItem);
        }
      });

      // Convert map to array and recalculate stats
      const result = Array.from(customersMap.values()).map(c => {
        const viewed = (c.viewedProducts || []).sort((a, b) => 
          new Date(b.viewedAt || 0).getTime() - new Date(a.viewedAt || 0).getTime()
        );
        const total = viewed.reduce((sum, item) => sum + (item.viewCount || 1), 0);
        return {
          ...c,
          viewedProducts: viewed,
          totalViews: total,
          lastViewedProduct: viewed[0]?.title || c.lastViewedProduct || '',
          lastViewedCategory: viewed[0]?.category || c.lastViewedCategory || ''
        };
      });

      setUsers(result);
      setLoading(false);
    };

    // Set up real-time onSnapshot listeners
    const unsubCustomers = onSnapshot(collection(db, 'customers'), (snapshot) => {
      rawCustomers = snapshot.docs;
      processAndSync();
    }, (err) => {
      console.error("Live sync error on customers collection:", err);
      setLoading(false);
    });

    const unsubViews = onSnapshot(collection(db, 'customer_views'), (snapshot) => {
      rawViews = snapshot.docs;
      processAndSync();
    }, (err) => {
      console.error("Live sync error on customer_views collection:", err);
      setLoading(false);
    });

    return () => {
      unsubCustomers();
      unsubViews();
    };
  }, []);

  // Filter & Sort users
  const processedUsers = useMemo(() => {
    // 1. Search filter
    const q = searchTerm.toLowerCase().trim();
    let result = users.filter(user => {
      const matchesSearch = !q || (
        user.name?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q) ||
        user.phone?.includes(q) ||
        user.lastViewedProduct?.toLowerCase().includes(q) ||
        user.viewedProducts?.some(p => 
          p.title?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q)
        )
      );

      if (!matchesSearch) return false;

      // 2. Category Tab filter
      if (selectedCategoryTab === 'ALL') return true;

      if (selectedCategoryTab === 'LAPTOPS') {
        return user.viewedProducts?.some(p => {
          const cat = (p.category || '').toLowerCase();
          return cat.includes('laptop');
        });
      }

      if (selectedCategoryTab === 'DESKTOPS') {
        return user.viewedProducts?.some(p => {
          const cat = (p.category || '').toLowerCase();
          return cat.includes('desktop') || cat.includes('prebuilt') || cat.includes('pc') || cat.includes('rig');
        });
      }

      if (selectedCategoryTab === 'ACCESSORIES') {
        return user.viewedProducts?.some(p => {
          const cat = (p.category || '').toLowerCase();
          return cat.includes('accessor') || cat.includes('component') || cat.includes('part') || cat.includes('ram') || cat.includes('ssd');
        });
      }

      if (selectedCategoryTab === 'HIGH_INTEREST') {
        return (user.totalViews || 0) >= 3 || (user.viewedProducts?.length || 0) >= 2;
      }

      return true;
    });

    // 3. Sorting logic
    result.sort((a, b) => {
      if (sortBy === 'ACTIVITY') {
        // Most Recent Activity / Viewed Product (Default - Repeat or new activity auto jumps to top)
        const timeA = new Date(a.lastActive || a.viewedProducts?.[0]?.viewedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.lastActive || b.viewedProducts?.[0]?.viewedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      }
      if (sortBy === 'NAME_ASC') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (sortBy === 'NAME_DESC') {
        return (b.name || '').localeCompare(a.name || '');
      }
      if (sortBy === 'PHONE') {
        return (a.phone || '').localeCompare(b.phone || '');
      }
      if (sortBy === 'VIEWS_COUNT') {
        return (b.totalViews || 0) - (a.totalViews || 0);
      }
      if (sortBy === 'DATE_NEWEST') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (sortBy === 'DATE_OLDEST') {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      return 0;
    });

    return result;
  }, [users, searchTerm, selectedCategoryTab, sortBy]);

  // Reset current page when filters, search, or sort change
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, selectedCategoryTab, sortBy, pageSize]);

  // Paginated Sliced Users for Performance (25, 50, 75, 100)
  const totalPages = Math.ceil(processedUsers.length / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = currentPage * pageSize;
    return processedUsers.slice(start, start + pageSize);
  }, [processedUsers, currentPage, pageSize]);

  // Overall KPIs
  const stats = useMemo(() => {
    const totalWebUsers = users.length;
    const activeBrowsers = users.filter(u => (u.viewedProducts && u.viewedProducts.length > 0)).length;
    const totalViewsCount = users.reduce((sum, u) => sum + (u.totalViews || 0), 0);
    
    // Category Breakdown
    let laptopViews = 0;
    let desktopViews = 0;
    let accessoryViews = 0;

    users.forEach(u => {
      u.viewedProducts?.forEach(p => {
        const cat = (p.category || '').toLowerCase();
        const count = p.viewCount || 1;
        if (cat.includes('laptop')) laptopViews += count;
        else if (cat.includes('desktop') || cat.includes('prebuilt') || cat.includes('pc')) desktopViews += count;
        else if (cat.includes('accessor') || cat.includes('component') || cat.includes('part')) accessoryViews += count;
      });
    });

    return {
      totalWebUsers,
      activeBrowsers,
      totalViewsCount,
      laptopViews,
      desktopViews,
      accessoryViews
    };
  }, [users]);

  // Export CSV with full viewed products lead detail
  const handleExportCsv = () => {
    const csvData = processedUsers.map(u => ({
      'Customer Name': u.name,
      'Phone Number': u.phone,
      'Email Address': u.email,
      'Registered Date': u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A',
      'Last Active': u.lastActive ? new Date(u.lastActive).toLocaleString() : 'N/A',
      'Total Products Viewed': u.viewedProducts?.length || 0,
      'Total View Page Hits': u.totalViews || 0,
      'Most Recent Product Viewed': u.lastViewedProduct || 'None',
      'All Viewed Products List': (u.viewedProducts || []).map(p => `${p.title} (₹${p.price} | ${p.category} | ${p.viewCount || 1} views)`).join('; ')
    }));

    exportToCsv('customer-product-leads.csv', csvData);
  };

  const getCategoryBadgeColor = (category: string) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('used laptop')) return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    if (cat.includes('new laptop')) return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    if (cat.includes('laptop')) return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    if (cat.includes('prebuilt') || cat.includes('pc') || cat.includes('rig')) return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    if (cat.includes('desktop')) return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
    if (cat.includes('accessor')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
  };

  const formatRelativeTime = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'N/A';
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 2) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return d.toLocaleDateString();
    } catch (e) {
      return 'N/A';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <Users className="h-6 w-6 text-blue-500" />
            Web Accounts & Product Leads
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            See which registered customer is viewing which Laptop, Desktop, or Accessory for follow-up inquiries.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2 shadow-sm shadow-emerald-500/5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Live Auto-Sync Active</span>
          </div>
          <button 
            onClick={handleExportCsv} 
            className="px-5 py-2 text-xs font-bold text-slate-300 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all uppercase tracking-wider flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Leads CSV
          </button>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0d0d0e] border border-white/10 rounded-3xl p-5 flex items-center justify-between shadow-xl">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Registered Accounts</div>
            <div className="text-2xl font-extrabold text-white mt-1">{stats.totalWebUsers}</div>
            <div className="text-xs text-blue-400 font-medium mt-1">Online Profiles</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#0d0d0e] border border-white/10 rounded-3xl p-5 flex items-center justify-between shadow-xl">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Browsers</div>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1">{stats.activeBrowsers}</div>
            <div className="text-xs text-slate-400 font-medium mt-1">Interested Leads</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <Eye className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#0d0d0e] border border-white/10 rounded-3xl p-5 flex items-center justify-between shadow-xl">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Laptop Inquiries</div>
            <div className="text-2xl font-extrabold text-rose-400 mt-1">{stats.laptopViews}</div>
            <div className="text-xs text-slate-400 font-medium mt-1">Laptops Viewed</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
            <Laptop className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#0d0d0e] border border-white/10 rounded-3xl p-5 flex items-center justify-between shadow-xl">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">PC & Rigs Viewed</div>
            <div className="text-2xl font-extrabold text-purple-400 mt-1">{stats.desktopViews}</div>
            <div className="text-xs text-slate-400 font-medium mt-1">Desktops & Prebuilts</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
            <Monitor className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-[#0d0d0e] rounded-3xl border border-white/10 flex flex-col overflow-hidden shadow-2xl">
        
        {/* Filter Tabs, Search Bar & Sorting Toolbar */}
        <div className="p-4 sm:p-6 border-b border-white/5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px] max-w-lg">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-500" />
              </div>
              <input
                type="text"
                placeholder="Search by customer name, phone, email, or viewed laptop / PC model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-500 text-white placeholder-slate-500 shadow-inner"
              />
            </div>

            {/* Sort Dropdown Selector */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-xs text-slate-300">
                <ArrowUpDown className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer pr-1"
                >
                  <option value="ACTIVITY" className="bg-[#141416] text-white">⚡ Most Recent Viewed / Active (Auto Top)</option>
                  <option value="NAME_ASC" className="bg-[#141416] text-white">🔤 Customer Name (A - Z)</option>
                  <option value="NAME_DESC" className="bg-[#141416] text-white">🔤 Customer Name (Z - A)</option>
                  <option value="PHONE" className="bg-[#141416] text-white">📞 Contact Number</option>
                  <option value="VIEWS_COUNT" className="bg-[#141416] text-white">🔥 Most Products Viewed (Highest First)</option>
                  <option value="DATE_NEWEST" className="bg-[#141416] text-white">📅 Registered Date (Newest First)</option>
                  <option value="DATE_OLDEST" className="bg-[#141416] text-white">📅 Registered Date (Oldest First)</option>
                </select>
              </div>

              {/* Rows Per Page Selector (25, 50, 75, 100) */}
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-xs text-slate-300">
                <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
                >
                  <option value={25} className="bg-[#141416] text-white">25</option>
                  <option value={50} className="bg-[#141416] text-white">50</option>
                  <option value={75} className="bg-[#141416] text-white">75</option>
                  <option value={100} className="bg-[#141416] text-white">100</option>
                </select>
              </div>
            </div>
          </div>

          {/* Filter Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 text-xs font-bold uppercase tracking-wider">
            <button
              onClick={() => setSelectedCategoryTab('ALL')}
              className={`px-4 py-2 rounded-full transition-all flex items-center gap-1.5 whitespace-nowrap ${
                selectedCategoryTab === 'ALL'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> All Users ({users.length})
            </button>

            <button
              onClick={() => setSelectedCategoryTab('LAPTOPS')}
              className={`px-4 py-2 rounded-full transition-all flex items-center gap-1.5 whitespace-nowrap ${
                selectedCategoryTab === 'LAPTOPS'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" /> Laptops Browsers
            </button>

            <button
              onClick={() => setSelectedCategoryTab('DESKTOPS')}
              className={`px-4 py-2 rounded-full transition-all flex items-center gap-1.5 whitespace-nowrap ${
                selectedCategoryTab === 'DESKTOPS'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" /> Desktops & Prebuilt PCs
            </button>

            <button
              onClick={() => setSelectedCategoryTab('ACCESSORIES')}
              className={`px-4 py-2 rounded-full transition-all flex items-center gap-1.5 whitespace-nowrap ${
                selectedCategoryTab === 'ACCESSORIES'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
              }`}
            >
              <Headphones className="w-3.5 h-3.5" /> Accessories
            </button>

            <button
              onClick={() => setSelectedCategoryTab('HIGH_INTEREST')}
              className={`px-4 py-2 rounded-full transition-all flex items-center gap-1.5 whitespace-nowrap ${
                selectedCategoryTab === 'HIGH_INTEREST'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
              }`}
            >
              <Flame className="w-3.5 h-3.5" /> High Intent Leads (Multiple Views)
            </button>
          </div>
        </div>

        {/* Table List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                {/* Customer Profile Column Header */}
                <th 
                  onClick={() => setSortBy(sortBy === 'NAME_ASC' ? 'NAME_DESC' : 'NAME_ASC')}
                  className="p-4 sm:p-5 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Customer Profile</span>
                    {sortBy === 'NAME_ASC' && <ArrowDownAZ className="w-3.5 h-3.5 text-blue-400" />}
                    {sortBy === 'NAME_DESC' && <ArrowUpAZ className="w-3.5 h-3.5 text-blue-400" />}
                  </div>
                </th>

                {/* Contact Column Header */}
                <th 
                  onClick={() => setSortBy('PHONE')}
                  className="p-4 sm:p-5 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Contact Number</span>
                    {sortBy === 'PHONE' && <ArrowUpDown className="w-3.5 h-3.5 text-blue-400" />}
                  </div>
                </th>

                {/* Viewed Products Header */}
                <th 
                  onClick={() => setSortBy(sortBy === 'ACTIVITY' ? 'VIEWS_COUNT' : 'ACTIVITY')}
                  className="p-4 sm:p-5 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Last Viewed Product & Activity</span>
                    {sortBy === 'ACTIVITY' && <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Auto Top Active</span>}
                    {sortBy === 'VIEWS_COUNT' && <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">Highest Views</span>}
                  </div>
                </th>

                {/* Inquiry & Actions Header */}
                <th className="p-4 sm:p-5 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap text-right">
                  Inquiry & Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <TableBodySkeleton columns={4} rows={6} />
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-500">
                    <div className="max-w-md mx-auto space-y-3">
                      <Users className="w-12 h-12 text-slate-600 mx-auto opacity-50" />
                      <p className="text-base font-bold text-slate-300">No customer records found</p>
                      <p className="text-xs text-slate-500">Try changing your search query or tab filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => {
                  const viewedItems = user.viewedProducts || [];
                  const latestProduct = viewedItems[0];
                  const hasViews = viewedItems.length > 0;

                  return (
                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                      
                      {/* 1. Customer Profile */}
                      <td className="p-4 sm:p-5 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-extrabold text-xs border border-blue-500/30 shrink-0">
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white group-hover:text-blue-400 transition-colors flex items-center gap-2 text-sm leading-tight">
                              {user.name}
                              {user.registeredOnline && (
                                <span className="bg-blue-500/10 text-blue-400 text-[9px] font-bold px-1.5 py-0.2 rounded border border-blue-500/20 uppercase tracking-wider">
                                  Online
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2">
                              <span>Joined: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
                              <span>•</span>
                              <span className="text-emerald-400 font-medium">Active: {formatRelativeTime(user.lastActive)}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Contact Information */}
                      <td className="p-4 sm:p-5 align-middle whitespace-nowrap">
                        <div className="space-y-0.5">
                          {user.phone ? (
                            <a 
                              href={`tel:${user.phone}`} 
                              className="text-xs font-bold text-white hover:text-blue-400 transition-colors flex items-center gap-1.5 font-mono"
                            >
                              <Phone className="w-3 h-3 text-slate-500" />
                              {user.phone}
                            </a>
                          ) : (
                            <span className="text-xs text-slate-500">No phone</span>
                          )}

                          {user.email ? (
                            <a 
                              href={`mailto:${user.email}`} 
                              className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5"
                            >
                              <Mail className="w-3 h-3 text-slate-500" />
                              {user.email}
                            </a>
                          ) : (
                            <span className="text-xs text-slate-600">No email</span>
                          )}
                        </div>
                      </td>

                      {/* 3. Last Viewed Product & Compact Activity (Clean Single-Line View) */}
                      <td className="p-4 sm:p-5 align-middle">
                        {hasViews && latestProduct ? (
                          <div className="flex items-center gap-3">
                            {/* Sleek Last Viewed Product Item */}
                            <div 
                              onClick={() => setSelectedProductForInquiry({ customer: user, product: latestProduct })}
                              className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/40 rounded-xl p-1.5 px-2.5 flex items-center gap-2.5 transition-all cursor-pointer group/item shadow-sm"
                              title="Last viewed product - Click to inquire on WhatsApp"
                            >
                              {latestProduct.imageUrl ? (
                                <img 
                                  src={latestProduct.imageUrl} 
                                  alt={latestProduct.title} 
                                  className="w-7 h-7 object-contain rounded-md bg-white/10 p-0.5 shrink-0" 
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-md bg-slate-800 flex items-center justify-center shrink-0 text-slate-500">
                                  <Laptop className="w-3.5 h-3.5" />
                                </div>
                              )}

                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-200 group-hover/item:text-blue-400 transition-colors truncate max-w-[200px] leading-tight">
                                  {latestProduct.title}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[11px] font-extrabold text-emerald-400">
                                    ₹{Number(latestProduct.price || 0).toLocaleString('en-IN')}
                                  </span>
                                  <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-widest ${getCategoryBadgeColor(latestProduct.category)}`}>
                                    {latestProduct.category}
                                  </span>
                                  {latestProduct.viewCount && latestProduct.viewCount > 1 && (
                                    <span className="text-[8px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 rounded" title={`Viewed ${latestProduct.viewCount} times`}>
                                      {latestProduct.viewCount}x
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* If customer viewed more than 1 product, show compact view count badge button */}
                            {viewedItems.length > 1 ? (
                              <button
                                onClick={() => setActiveCustomerModal(user)}
                                className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/30 rounded-xl text-[10px] font-bold text-slate-400 hover:text-white transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0"
                                title="Click to view all products browsed by this customer"
                              >
                                <span className="text-blue-400 font-extrabold">+{viewedItems.length - 1} more</span>
                                <span className="text-slate-500">({user.totalViews} total views)</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-500 whitespace-nowrap">
                                1 product viewed
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500 italic flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-600" />
                            No products viewed yet
                          </div>
                        )}
                      </td>

                      {/* 4. Inquiry & Action Buttons */}
                      <td className="p-4 sm:p-5 align-middle text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          
                          {/* 1-Click WhatsApp Sales Inquiry */}
                          {user.phone && latestProduct && (
                            <a
                              href={generateWhatsAppInquiryUrl(
                                user.phone,
                                user.name,
                                latestProduct.title,
                                latestProduct.price,
                                latestProduct.category
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-[#25D366]/20 hover:bg-[#25D366] text-[#25D366] hover:text-white border border-[#25D366]/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm uppercase tracking-wider"
                              title={`Send inquiry message on WhatsApp regarding ${latestProduct.title}`}
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>Inquire</span>
                            </a>
                          )}

                          {/* Inspect All Activity Modal Button */}
                          <button
                            onClick={() => setActiveCustomerModal(user)}
                            className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-colors"
                            title="View Full Browsing History"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Link to CRM Customer Profile */}
                          <Link
                            to={`/admin/customers/${user.id}`}
                            className="p-1.5 bg-white/5 hover:bg-blue-600/20 text-slate-400 hover:text-blue-400 border border-white/10 hover:border-blue-500/30 rounded-xl transition-colors"
                            title="Open Customer Profile (Repairs & Orders)"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls Footer (25, 50, 75, 100) */}
        <div className="p-4 sm:p-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-bold uppercase tracking-widest">
          
          <div className="flex items-center gap-4">
            <span>
              Showing {processedUsers.length > 0 ? currentPage * pageSize + 1 : 0} - {Math.min((currentPage + 1) * pageSize, processedUsers.length)} of {processedUsers.length} Users
            </span>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-bold text-[10px]">Per Page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(0);
                }}
                className="bg-[#1a1a1c] border border-white/10 rounded-lg py-1 px-2.5 text-white outline-none cursor-pointer text-xs"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={75}>75</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="mr-3 text-white">Page {currentPage + 1} of {totalPages}</span>
            
            <button
              onClick={() => setCurrentPage(0)}
              disabled={currentPage === 0 || loading}
              className="p-2 border border-white/10 rounded-xl hover:bg-white/5 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={currentPage === 0 || loading}
              className="px-3.5 py-1.5 border border-white/10 rounded-xl hover:bg-white/5 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
              disabled={currentPage >= totalPages - 1 || loading}
              className="px-3.5 py-1.5 border border-white/10 rounded-xl hover:bg-white/5 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentPage(totalPages - 1)}
              disabled={currentPage >= totalPages - 1 || loading}
              className="p-2 border border-white/10 rounded-xl hover:bg-white/5 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

      {/* --- MODAL 1: FULL CUSTOMER BROWSING TIMELINE (SLEEK LIST-TYPE VIEW) --- */}
      {activeCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#121214] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-extrabold text-lg border border-blue-500/30">
                  {activeCustomerModal.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {activeCustomerModal.name}
                    <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-500/30 uppercase tracking-wider">
                      Lead Profile
                    </span>
                  </h2>
                  <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                    {activeCustomerModal.phone && (
                      <span className="flex items-center gap-1 font-mono text-slate-300">
                        <Phone className="w-3.5 h-3.5 text-slate-500" /> {activeCustomerModal.phone}
                      </span>
                    )}
                    {activeCustomerModal.email && (
                      <span className="flex items-center gap-1 text-slate-400">
                        <Mail className="w-3.5 h-3.5 text-slate-500" /> {activeCustomerModal.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveCustomerModal(null)}
                className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Viewed Products Compact List View */}
            <div className="flex-1 overflow-y-auto custom-scrollbar py-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-500" />
                  All Products Viewed ({activeCustomerModal.viewedProducts?.length || 0} unique items • {activeCustomerModal.totalViews || 0} total hits)
                </h3>
              </div>

              {(!activeCustomerModal.viewedProducts || activeCustomerModal.viewedProducts.length === 0) ? (
                <div className="p-8 text-center text-slate-500 bg-white/5 rounded-2xl border border-white/5">
                  No products viewed yet by this customer.
                </div>
              ) : (
                /* Sleek Compact List-Type Table */
                <div className="overflow-x-auto border border-white/10 rounded-2xl bg-white/[0.02]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/5 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-3 pl-4">Product Details</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Price</th>
                        <th className="p-3 text-center">View Count</th>
                        <th className="p-3">Last Viewed</th>
                        <th className="p-3 pr-4 text-right">Inquiry</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {activeCustomerModal.viewedProducts.map((prod, idx) => (
                        <tr key={idx} className="hover:bg-white/5 transition-colors group">
                          {/* Product */}
                          <td className="p-3 pl-4">
                            <div className="flex items-center gap-3">
                              {prod.imageUrl ? (
                                <img 
                                  src={prod.imageUrl} 
                                  alt={prod.title} 
                                  className="w-8 h-8 object-contain rounded bg-white/10 p-0.5 shrink-0" 
                                />
                              ) : (
                                <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center shrink-0 text-slate-500">
                                  <Laptop className="w-4 h-4" />
                                </div>
                              )}
                              <div className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors line-clamp-1 max-w-[200px]">
                                {prod.title}
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="p-3 whitespace-nowrap">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest ${getCategoryBadgeColor(prod.category)}`}>
                              {prod.category}
                            </span>
                          </td>

                          {/* Price */}
                          <td className="p-3 whitespace-nowrap font-extrabold text-emerald-400">
                            ₹{Number(prod.price || 0).toLocaleString('en-IN')}
                          </td>

                          {/* View count */}
                          <td className="p-3 text-center whitespace-nowrap">
                            <span className="font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 text-[10px]">
                              {prod.viewCount || 1}x Views
                            </span>
                          </td>

                          {/* Last Viewed */}
                          <td className="p-3 whitespace-nowrap text-slate-400 text-[11px]">
                            {prod.viewedAt ? new Date(prod.viewedAt).toLocaleDateString() : 'Recently'}
                          </td>

                          {/* Actions */}
                          <td className="p-3 pr-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              {activeCustomerModal.phone && (
                                <a
                                  href={generateWhatsAppInquiryUrl(
                                    activeCustomerModal.phone,
                                    activeCustomerModal.name,
                                    prod.title,
                                    prod.price,
                                    prod.category
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 uppercase tracking-wider shadow-sm"
                                  title="Send WhatsApp Inquiry for this product"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  Inquire
                                </a>
                              )}

                              <a
                                href={prod.category.includes('Prebuilt') ? `/prebuilt-pc/${prod.productId}` : `/products/${prod.productId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-all border border-white/10"
                                title="Open product page on website"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-white/10 pt-4 flex items-center justify-between">
              <Link
                to={`/admin/customers/${activeCustomerModal.id}`}
                className="text-xs font-bold text-blue-400 hover:underline flex items-center gap-1.5"
              >
                Open Full CRM Customer Profile &rarr;
              </Link>
              <button
                onClick={() => setActiveCustomerModal(null)}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all uppercase tracking-wider"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- MODAL 2: QUICK PRODUCT INQUIRY PREVIEW --- */}
      {selectedProductForInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#141417] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-6">
            
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Direct Sales Follow-up</span>
                <h3 className="text-xl font-bold text-white mt-1">Contact Customer on WhatsApp</h3>
              </div>
              <button
                onClick={() => setSelectedProductForInquiry(null)}
                className="p-1.5 text-slate-400 hover:text-white bg-white/5 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
              {selectedProductForInquiry.product.imageUrl ? (
                <img 
                  src={selectedProductForInquiry.product.imageUrl} 
                  alt={selectedProductForInquiry.product.title} 
                  className="w-16 h-16 object-contain rounded-xl bg-white/10 p-1 shrink-0" 
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 text-slate-500">
                  <Laptop className="w-7 h-7" />
                </div>
              )}
              <div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest ${getCategoryBadgeColor(selectedProductForInquiry.product.category)}`}>
                  {selectedProductForInquiry.product.category}
                </span>
                <h4 className="font-bold text-white text-sm mt-1">
                  {selectedProductForInquiry.product.title}
                </h4>
                <div className="text-base font-extrabold text-emerald-400 mt-1">
                  ₹{Number(selectedProductForInquiry.product.price || 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Customer Contact Details */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold uppercase tracking-wider">Customer:</span>
                <span className="text-white font-bold">{selectedProductForInquiry.customer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold uppercase tracking-wider">Phone:</span>
                <span className="text-emerald-400 font-mono font-bold">{selectedProductForInquiry.customer.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold uppercase tracking-wider">Times Viewed:</span>
                <span className="text-amber-400 font-bold">{selectedProductForInquiry.product.viewCount || 1} times</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              {selectedProductForInquiry.customer.phone ? (
                <a
                  href={generateWhatsAppInquiryUrl(
                    selectedProductForInquiry.customer.phone,
                    selectedProductForInquiry.customer.name,
                    selectedProductForInquiry.product.title,
                    selectedProductForInquiry.product.price,
                    selectedProductForInquiry.product.category
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 uppercase tracking-wider"
                >
                  <MessageCircle className="w-5 h-5" />
                  Launch WhatsApp Inquiry
                </a>
              ) : (
                <div className="text-xs text-red-400 text-center font-bold">
                  No phone number available for this user.
                </div>
              )}

              <button
                onClick={() => setSelectedProductForInquiry(null)}
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl text-xs font-bold transition-all uppercase tracking-wider"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
