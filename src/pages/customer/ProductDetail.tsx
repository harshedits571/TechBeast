import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Share2, Check, ShieldCheck, Truck, RotateCcw, Cpu, HardDrive, Monitor, Battery, Gift, Star } from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, getDoc, collection, getDocs, addDoc, query, orderBy, updateDoc, increment } from 'firebase/firestore';
import { useCart } from '../../contexts/CartContext';
import { useSettings } from '../../contexts/SettingsContext';
import WarrantyModal from '../../components/WarrantyModal';
import { DetailSkeleton } from '../../components/ui/Skeleton';
import SEO from '../../components/ui/SEO';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('specs');
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { settings, loading: settingsLoading } = useSettings();

  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewForm, setReviewForm] = useState({ name: '', rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [isWarrantyModalOpen, setIsWarrantyModalOpen] = useState(false);
  const [accessoryImages, setAccessoryImages] = useState<Record<string, string>>({});
  const [selectedAccessoryImage, setSelectedAccessoryImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const productData = docSnap.data();
          const currentViews = productData.views || 0;
          
          const viewedProducts = JSON.parse(localStorage.getItem('viewedProducts') || '[]');
          
          if (!viewedProducts.includes(id)) {
            // First time viewing for this user
            setProduct({ id: docSnap.id, ...productData, views: currentViews + 1 });
            
            // Save to localStorage
            viewedProducts.push(id);
            localStorage.setItem('viewedProducts', JSON.stringify(viewedProducts));
            
            // Update in Firestore
            updateDoc(docRef, {
              views: increment(1)
            }).catch(e => console.error("Error updating views:", e));
          } else {
            // Already viewed by this user
            setProduct({ id: docSnap.id, ...productData, views: currentViews });
          }
          
        } else {
          console.error("No such product!");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchReviews = async () => {
      if (!id) return;
      try {
        const revQuery = query(collection(db, "products", id, "reviews"), orderBy("createdAt", "desc"));
        const revSnap = await getDocs(revQuery);
        setReviews(revSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch inventory for accessory images
        try {
          const invRef = collection(db, 'inventory');
          const invSnap = await getDocs(invRef);
          const images: Record<string, string> = {};
          invSnap.docs.forEach(d => {
            const data = d.data();
            if (data.name && data.imageUrls && data.imageUrls.length > 0) {
              images[data.name] = data.imageUrls[0];
            }
          });
          setAccessoryImages(images);
        } catch (err) {
          console.error("Error fetching accessory images", err);
        }
      } catch (e) {
        console.error("Error fetching reviews", e);
      }
    };

    fetchProduct();
    fetchReviews();
  }, [id]);

  if (loading || settingsLoading) {
    return <DetailSkeleton />;
  }

  if (!product) {
    return <div className="bg-white min-h-screen flex flex-col items-center justify-center text-slate-900">
      <h2 className="text-2xl font-bold mb-4">Product not found</h2>
      <Link to="/products" className="text-blue-600 hover:underline">Back to products</Link>
    </div>;
  }

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !reviewForm.name || !reviewForm.comment) return;
    setSubmittingReview(true);
    try {
      const newReview = { ...reviewForm, createdAt: new Date().toISOString() };
      const docRef = await addDoc(collection(db, "products", id, "reviews"), newReview);
      setReviews([{ id: docRef.id, ...newReview }, ...reviews]);
      setReviewForm({ name: '', rating: 5, comment: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const isDiscounted = product.oldPrice && product.oldPrice > product.price;
  const discountAmount = isDiscounted ? (product.oldPrice - product.price) : 0;
  const discountPercent = isDiscounted ? Math.round((discountAmount / product.oldPrice) * 100) : 0;

  const isDesktop = product.category === 'Desktops';
  const isFullSystem = product.category === 'Laptops' || (isDesktop && product.componentType === 'Assembled PC');
  const isRAM = isDesktop && product.componentType === 'RAM';
  const isProcessor = isDesktop && product.componentType === 'Processor';
  const isStorage = isDesktop && product.componentType === 'Storage (SSD/HDD)';
  const isGraphics = isDesktop && product.componentType === 'Graphics Card';
  const isCabinet = isDesktop && product.componentType === 'Cabinet';
  const isMotherboard = isDesktop && product.componentType === 'Motherboard';
  const isPowerSupply = isDesktop && product.componentType === 'Power Supply';

  const specs: Record<string, string> = {
    'Brand': product.brand || (product.title ? product.title.split(' ')[0] : 'Unknown'),
    'Model Number': product.modelNumber || 'Not Specified',
  };

  if (product.brandWarranty) {
    specs['Brand Warranty'] = product.brandWarranty;
  }

  if (isFullSystem || isProcessor) {
    specs['Processor'] = [product.processor, product.processorGen !== 'N/A' ? product.processorGen : '', product.processorModel].filter(Boolean).join(' ') || 'Not Specified';
  }
  if (isFullSystem || isRAM) {
    specs['Memory (RAM)'] = [product.ram, product.ramType, product.ramFreq].filter(Boolean).join(' ') || 'Not Specified';
  }
  if (isFullSystem) {
    specs['Storage'] = [product.storage, product.storageType].filter(Boolean).join(' ') || 'Not Specified';
    specs['Graphics (GPU)'] = product.graphics || 'Not Specified';
    specs['Display'] = product.displayType || 'Not Specified';
    specs['Operating System'] = product.os || 'Not Specified';
  }
  if (isStorage) {
    specs['Storage Capacity'] = product.storage || 'Not Specified';
    specs['Storage Type'] = product.storageType || 'Not Specified';
  }
  if (isGraphics) {
    specs['Graphics (GPU)'] = product.graphics || 'Not Specified';
  }
  if (isCabinet) {
    specs['Form Factor'] = product.cabinetFormFactor || 'Not Specified';
    specs['Included Fans'] = product.cabinetFans || 'Not Specified';
  }
  if (isMotherboard) {
    specs['CPU Socket'] = product.motherboardSocket || 'Not Specified';
    specs['Form Factor'] = product.motherboardFormFactor || 'Not Specified';
  }
  if (isPowerSupply) {
    specs['Wattage'] = product.powerSupplyWattage || 'Not Specified';
    specs['Efficiency Rating'] = product.powerSupplyRating || 'Not Specified';
  }

  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.title,
    "image": product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls : ["https://www.techbeasthubli.in/logo.png"],
    "description": product.description || `Buy ${product.title} at Tech Beast Hubli. Best second hand laptop store in Hubli.`,
    "sku": product.sku || product.id,
    "mpn": product.modelNumber || undefined,
    "brand": {
      "@type": "Brand",
      "name": product.brand || "Unknown"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://www.techbeasthubli.in/products/${product.id}`,
      "priceCurrency": "INR",
      "price": product.price,
      "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      "itemCondition": product.condition === 'New' ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition",
      "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "Tech Beast Hubli"
      }
    },
    "aggregateRating": reviews.length > 0 ? {
      "@type": "AggregateRating",
      "ratingValue": (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1),
      "reviewCount": reviews.length
    } : undefined
  };

  const handleBuyNow = () => {
    if (!product || product.stock <= 0) return;
    addToCart({
      id: product.id,
      title: product.title,
      price: Number(product.price),
      quantity: quantity,
      image: product.imageUrls?.[0],
      stock: product.stock
    });
    navigate('/checkout');
  };

  return (
    <div className="bg-[#f8f9fa] min-h-screen text-slate-800 font-sans pb-20">
      <SEO 
        title={`${product.title} - Tech Beast Hubli`} 
        description={product.description ? product.description.substring(0, 155) : `Buy ${product.title} - Premium Second Hand Laptops & Computer Repairs in Hubli`}
        schema={productSchema}
        ogImage={product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : undefined}
      />
      
      {/* Breadcrumb - Optional */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
        <a href="/" className="hover:text-blue-600 transition-colors">Home</a>
        <span>/</span>
        <a href="/products" className="hover:text-blue-600 transition-colors">{product.category}</a>
        <span>/</span>
        <span className="text-slate-800">{product.title}</span>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-8">

        {/* Top Product Section */}
        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_450px] gap-8 items-start">
            
          {/* 1. Image Gallery Card (Top Left) */}
          <div className="order-1 lg:col-start-1 lg:row-start-1 bg-white rounded-3xl border border-slate-200 p-4 sm:p-8 shadow-sm relative w-full">
              {isDiscounted && (
                <div className="absolute top-8 left-8 bg-red-600 text-white text-xs font-bold px-4 py-1.5 rounded-full z-10 shadow-sm">
                  SALE
                </div>
              )}
              
              {/* Main Image */}
              <div className="w-full aspect-[4/3] sm:aspect-video bg-[#f8f9fa] rounded-2xl flex items-center justify-center relative mb-6 overflow-hidden">
                <button className="absolute top-4 right-4 bg-white border border-slate-200 rounded-full p-2 text-slate-500 hover:text-blue-600 shadow-sm z-10 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" /></svg>
                </button>

                {product.imageUrls && product.imageUrls.length > 0 ? (
                  <img
                    src={product.imageUrls[mainImageIndex]}
                    alt={product.title}
                    className="w-full h-full object-contain p-8 mix-blend-multiply transition-opacity duration-300"
                  />
                ) : (
                  <div className="w-4/5 h-4/5 flex flex-col items-center justify-center relative opacity-50">
                     <span className="text-slate-400 font-bold text-2xl z-10">No Image Available</span>
                  </div>
                )}
              </div>
              
              {/* Thumbnails Row */}
              <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-2">
                {product.imageUrls && product.imageUrls.length > 0 && product.imageUrls.map((url: string, index: number) => (
                  <div
                    key={index}
                    onClick={() => setMainImageIndex(index)}
                    className={`shrink-0 w-20 sm:w-24 aspect-square border-2 ${mainImageIndex === index ? 'border-red-500' : 'border-slate-100'} rounded-xl flex items-center justify-center cursor-pointer hover:border-red-400 transition-colors bg-white overflow-hidden p-2`}
                  >
                    <img src={url} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
                ))}
              </div>
            </div>



          {/* 3. Information Tabs Card (Bottom Left) */}
          <div className="order-3 lg:col-start-1 lg:row-start-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden w-full">
              <div className="flex border-b border-slate-100 px-6 sm:px-8 bg-slate-50/50">
                <nav className="flex space-x-6 sm:space-x-10 overflow-x-auto custom-scrollbar">
                  <button
                    onClick={() => setActiveTab('specs')}
                    className={`py-5 text-[11px] font-bold uppercase tracking-widest transition-colors border-b-2 whitespace-nowrap ${activeTab === 'specs'
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('shipping')}
                    className={`py-5 text-[11px] font-bold uppercase tracking-widest transition-colors border-b-2 whitespace-nowrap ${activeTab === 'shipping' 
                      ? 'border-red-600 text-red-600' 
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                  >
                    Specs & Shipping
                  </button>

                  <button
                    onClick={() => setActiveTab('faqs')}
                    className={`py-5 text-[11px] font-bold uppercase tracking-widest transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${activeTab === 'faqs' 
                      ? 'border-red-600 text-red-600' 
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                  >
                    Q&A <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full text-[9px]">4</span>
                  </button>
                </nav>
              </div>

              <div className="p-6 sm:p-8">
                {activeTab === 'specs' && (
                  <div className="prose prose-sm prose-slate max-w-none text-slate-600 text-[13px] leading-relaxed">
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-widest mb-4">Product Details</h4>
                    <ul className="list-disc pl-4 space-y-2 marker:text-slate-300">
                       <li>Premium Build Quality</li>
                       <li>High Performance Components</li>
                       <li>Tested by TechBeast Certified Technicians</li>
                       <li>Secure Packaging & Dispatch</li>
                    </ul>
                    
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-widest mt-8 mb-4">Specifications</h4>
                    <div className="flex flex-col gap-1.5">
                      {Object.entries(specs).map(([key, value]) => (
                        value !== 'Not Specified' && (
                          <div key={key} className="flex border-b border-slate-50 pb-1">
                            <div className="w-[140px] text-xs font-semibold text-slate-500">{key}</div>
                            <div className="flex-1 text-xs text-slate-800">{value}</div>
                          </div>
                        )
                      ))}
                    </div>

                    {product.rawSpecifications && (
                      <div className="mt-8">
                        <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                          {product.rawSpecifications.split('\n').filter(line => line.trim()).map((line: string, idx: number) => {
                            const isEven = idx % 2 === 0;
                            const formattedLine = line.trim().replace(/^-/, '').trim();
                            
                            if (formattedLine.includes(':')) {
                              const [key, ...rest] = formattedLine.split(':');
                              const value = rest.join(':').trim();
                              
                              return (
                                <div key={idx} className={`flex flex-col sm:flex-row px-5 py-3.5 ${isEven ? 'bg-[#f8f9fa]' : 'bg-white'}`}>
                                  <div className="w-full sm:w-[200px] shrink-0 text-[13px] font-semibold text-slate-600">{key.trim()}</div>
                                  <div className="w-full sm:flex-1 text-[13px] text-slate-800 mt-1 sm:mt-0">{value}</div>
                                </div>
                              );
                            }
                            
                            return (
                              <div key={idx} className={`px-5 py-3.5 ${isEven ? 'bg-[#f8f9fa]' : 'bg-white'}`}>
                                <div className="text-[13px] font-bold text-slate-800 uppercase tracking-widest">{formattedLine}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'shipping' && (
                  <div className="prose prose-sm text-slate-600 text-[13px] leading-relaxed">
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-widest mb-4">In-Store Pickup</h4>
                    <p className="mb-6">Available immediately during store hours for items in stock. Reserve online and pay at the store.</p>

                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-widest mb-4">Return Policy</h4>
                    <p>Used items come with a 7-day return window if the device is defective. The item must be returned in the exact condition it was purchased with all included accessories.</p>
                  </div>
                )}



                {activeTab === 'faqs' && (
                  <div>
                    <div className="space-y-4">
                      <div className="bg-[#f8f9fa] rounded-2xl p-5 border border-slate-100">
                        <p className="font-bold text-slate-800 text-sm mb-2 flex items-start gap-2">
                          <span className="text-red-500 font-black">Q:</span> Does this product come with a warranty?
                        </p>
                        <p className="text-[13px] text-slate-600 ml-6 leading-relaxed">
                          Yes, all our refurbished products come with a minimum warranty covering hardware defects. New products have 1 year warranty.
                        </p>
                      </div>
                      <div className="bg-[#f8f9fa] rounded-2xl p-5 border border-slate-100">
                        <p className="font-bold text-slate-800 text-sm mb-2 flex items-start gap-2">
                          <span className="text-red-500 font-black">Q:</span> What condition is this device in?
                        </p>
                        <p className="text-[13px] text-slate-600 ml-6 leading-relaxed">
                          Our products are fully tested and professionally refurbished. The specific cosmetic condition is listed in the product specifications above.
                        </p>
                      </div>
                      <div className="bg-[#f8f9fa] rounded-2xl p-5 border border-slate-100">
                        <p className="font-bold text-slate-800 text-sm mb-2 flex items-start gap-2">
                          <span className="text-red-500 font-black">Q:</span> Can I return the product if I don't like it?
                        </p>
                        <p className="text-[13px] text-slate-600 ml-6 leading-relaxed">
                          We offer a 7-day return policy for defective devices. Please refer to our Shipping & Return tab for more detailed information.
                        </p>
                      </div>
                      <div className="bg-[#f8f9fa] rounded-2xl p-5 border border-slate-100">
                        <p className="font-bold text-slate-800 text-sm mb-2 flex items-start gap-2">
                          <span className="text-red-500 font-black">Q:</span> Do you offer EMI options?
                        </p>
                        <p className="text-[13px] text-slate-600 ml-6 leading-relaxed">
                          Yes, we support EMI options on most major credit cards. You can see the full EMI details at the checkout page.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          {/* 2. Right Column - Product Info (Middle on mobile, Right on Desktop) */}
          <div className="order-2 lg:col-start-2 lg:row-start-1 lg:row-span-2 flex flex-col gap-6 w-full">
            
            {/* Header Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm relative">
              <div className="flex items-center justify-between mb-4">
                <span className={`inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-sm shadow-sm ${product.condition === 'New'
                  ? 'bg-red-500 text-white'
                  : 'bg-amber-500 text-white'
                  }`}>
                  {product.category || 'Product'} {product.componentType && `(${product.componentType})`}
                </span>
                <button className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest">
                  <Share2 className="h-4 w-4" /> Share
                </button>
              </div>
              
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2 leading-tight tracking-tight">
                {product.title}
              </h1>
              
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                SKU: {product.sku || 'N/A'}
              </div>


            </div>

            {/* Pricing & Actions Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col gap-6">
              
              {/* Pricing */}
              <div>
                <div className="flex items-baseline gap-3 mb-1">
                  <span className="text-3xl font-extrabold text-slate-900">₹{Number(product.price).toLocaleString('en-IN')}</span>
                  {product.oldPrice && (
                    <span className="text-sm font-bold text-slate-400 line-through">₹{Number(product.oldPrice).toLocaleString('en-IN')}</span>
                  )}
                  {isDiscounted && (
                    <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-sm ml-2 tracking-widest uppercase">
                      Save Extra
                    </span>
                  )}
                </div>
              </div>

              {/* Stock Status & Availability */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Availability</div>
                <div className={`text-xs font-bold flex items-center gap-1.5 ${product.stock > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  <div className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                  {product.stock > 0 ? 'IN STOCK' : 'OUT OF STOCK'}
                </div>
              </div>

              {/* Add to Cart Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className={`flex items-center border-2 border-slate-200 rounded-xl bg-white px-4 py-3 sm:py-3.5 w-full sm:w-32 justify-between ${product.stock <= 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="text-slate-500 hover:text-black font-bold focus:outline-none">-</button>
                  <span className="text-sm font-bold text-slate-800">{quantity.toString().padStart(2, '0')}</span>
                  <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="text-slate-500 hover:text-black font-bold focus:outline-none">+</button>
                </div>
                <button
                  onClick={() => addToCart({
                    id: product.id,
                    title: product.title,
                    price: Number(product.price),
                    quantity: quantity,
                    image: product.imageUrls?.[0],
                    stock: product.stock
                  })}
                  disabled={product.stock <= 0}
                  className={`flex-1 w-full text-slate-900 border-2 border-slate-900 text-sm font-bold py-3 sm:py-3.5 px-6 rounded-xl transition-colors flex items-center justify-center uppercase tracking-widest ${product.stock > 0 ? 'hover:bg-slate-50' : 'bg-slate-100 border-slate-300 text-slate-400 cursor-not-allowed'}`}
                >
                  {product.stock > 0 ? 'Add to cart' : 'Out of stock'}
                </button>
              </div>
              <button
                onClick={handleBuyNow}
                disabled={product.stock <= 0}
                className={`w-full text-white text-sm font-bold py-3.5 px-6 rounded-xl transition-colors flex items-center justify-center uppercase tracking-widest ${product.stock > 0 ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-400 cursor-not-allowed hidden'}`}
              >
                Buy it Now
              </button>

              {/* Warranty Links */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="text-xs font-medium text-slate-600 flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Warranty Protection</span>
                  <span>
                    {product.condition === 'New'
                      ? <span className="font-bold text-slate-800">
                          {product.brandWarranty || '1 Year'} by {product.brand || 'Brand'} Service Center
                          {isFullSystem && ' + 1-Year TechBeast Software Support'}
                        </span>
                      : <span className="font-bold text-slate-800">{settings.warrantyText || '3 Months TechBeast Certified Warranty'}</span>
                    } 
                    <button onClick={() => setIsWarrantyModalOpen(true)} className="text-blue-600 font-bold hover:underline bg-transparent border-none p-0 cursor-pointer ml-1">Know More</button>
                  </span>
                </div>
                {product.condition !== 'New' && (
                  <div className="text-xs font-medium text-slate-600">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">Upgrade Options</span>
                    Extended Warranty – <button onClick={() => setIsWarrantyModalOpen(true)} className="text-blue-600 font-bold hover:underline">Secure It Now</button>
                  </div>
                )}
                <div className="text-xs font-medium text-slate-600 pt-2">
                  Nearest Service Center : <a href="#" className="text-blue-600 font-bold hover:underline">Find Here</a>
                </div>
              </div>

              {/* Free Accessories Highlight */}
              {(() => {
                const combo = settings.accessoryCombos?.find(c => c.id === product.comboId);
                const comboItems = combo?.items || [];
                const customItems = product.accessories ? product.accessories.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
                const allAccessories = [...new Set([...comboItems, ...customItems])];

                if (allAccessories.length === 0) return null;

                return (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 relative overflow-hidden shadow-sm mt-2">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100 rounded-bl-full -z-0 opacity-50"></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="bg-emerald-500 text-white p-1 rounded-full shadow-sm">
                          <Gift className="w-3 h-3" />
                        </div>
                        <h3 className="font-bold text-emerald-800 text-[10px] uppercase tracking-widest">FREE ACCESSORIES INCLUDED!</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {allAccessories.map((accessory: string, idx: number) => {
                          const hasImage = !!accessoryImages[accessory];
                          return (
                            <span
                              key={idx}
                              onClick={() => hasImage && setSelectedAccessoryImage(accessoryImages[accessory])}
                              className={`bg-white border border-emerald-200 text-emerald-700 text-[9px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 uppercase tracking-widest ${hasImage ? 'cursor-pointer hover:bg-emerald-50 transition-colors' : ''}`}
                              title={hasImage ? "Click to view image" : ""}
                            >
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                              {accessory}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
            
          </div>
        </div>
      </div>

        <WarrantyModal
          isOpen={isWarrantyModalOpen}
          onClose={() => setIsWarrantyModalOpen(false)}
          isNew={product?.condition === 'New'}
          brandWarranty={product?.brandWarranty}
          isDesktopPart={!isFullSystem}
        />

        {/* Accessory Image Modal */}
        {selectedAccessoryImage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" onClick={() => setSelectedAccessoryImage(null)}>
            <div className="relative max-w-3xl w-full max-h-[90vh] bg-white rounded-lg p-2 flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
              <button onClick={() => setSelectedAccessoryImage(null)} className="absolute -top-12 right-0 text-white hover:text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
              <img src={selectedAccessoryImage} alt="Accessory" className="max-w-full max-h-[85vh] object-contain rounded-lg" />
            </div>
          </div>
        )}
    </div>
  );
}
