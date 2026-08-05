import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Heart, Share2, Check, ShieldCheck, Truck, RotateCcw, Cpu, HardDrive, Monitor, Battery, Gift, Star } from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, getDoc, collection, getDocs, addDoc, query, orderBy } from 'firebase/firestore';
import { useCart } from '../../contexts/CartContext';
import { useSettings } from '../../contexts/SettingsContext';

export default function ProductDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('specs');
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { settings, loading: settingsLoading } = useSettings();

  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewForm, setReviewForm] = useState({ name: '', rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [mainImageIndex, setMainImageIndex] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() });
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
      } catch (e) {
        console.error("Error fetching reviews", e);
      }
    };

    fetchProduct();
    fetchReviews();
  }, [id]);

  if (loading || settingsLoading) {
    return <div className="bg-white min-h-screen flex items-center justify-center text-slate-900">Loading product details...</div>;
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
    } catch(err) {
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const isDiscounted = product.oldPrice && product.oldPrice > product.price;
  const discountAmount = isDiscounted ? (product.oldPrice - product.price) : 0;
  const discountPercent = isDiscounted ? Math.round((discountAmount / product.oldPrice) * 100) : 0;

  const specs = {
    'Weight': '2.5 kg',
    'Dimensions': '40.4 x 30.75 x 3.2 cm',
    'Brand': product.brand || (product.title ? product.title.split(' ')[0] : 'Unknown'),
    'Processor': product.processor || 'Not Specified',
    'RAM Size': product.ram || 'Not Specified',
    'SSD Storage': product.storage || 'Not Specified',
    'GPU': product.graphics || 'Not Specified',
    'Screen Size': product.displayType || 'Not Specified',
    'Operating System': product.os || 'Not Specified',
    'Battery': '4-Cell 90WHr',
    'Model Number': product.modelNumber || 'Not Specified',
  };

  return (
    <div className="bg-white min-h-screen text-slate-800 font-sans pb-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Top Product Section */}
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Left Column - Images */}
          <div className="w-full lg:w-[45%] flex gap-4 h-[500px]">
             {/* Thumbnails */}
             <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-2 w-20">
               {product.imageUrls && product.imageUrls.length > 0 ? (
                 product.imageUrls.map((url: string, index: number) => (
                   <div 
                     key={index} 
                     onClick={() => setMainImageIndex(index)}
                     className={`w-full aspect-square border ${mainImageIndex === index ? 'border-blue-600' : 'border-slate-200'} rounded-sm flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors bg-white relative overflow-hidden`}
                   >
                     <img src={url} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                   </div>
                 ))
               ) : (
                 [1, 2, 3, 4].map((i) => (
                   <div key={i} className={`w-full aspect-square border ${i === 1 ? 'border-blue-600' : 'border-slate-200'} rounded-sm flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors bg-slate-50 relative`}>
                      <div className="w-3/4 h-3/4 bg-slate-800 rounded-sm flex items-center justify-center border border-slate-900">
                         <span className="text-[8px] text-white/30">IMG {i}</span>
                      </div>
                   </div>
                 ))
               )}
             </div>
             
             {/* Main Image */}
             <div className="flex-1 border border-slate-200 rounded-sm relative bg-white flex items-center justify-center group overflow-hidden">
                <button className="absolute top-4 right-4 bg-white border border-slate-200 rounded-full p-2 text-slate-500 hover:text-blue-600 shadow-sm z-10 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
                </button>
                
                {product.imageUrls && product.imageUrls.length > 0 ? (
                  <img 
                    src={product.imageUrls[mainImageIndex]} 
                    alt={product.title} 
                    className="w-full h-full object-contain p-4"
                  />
                ) : (
                  <div className="w-4/5 h-4/5 flex flex-col items-center justify-center relative">
                     <div className="w-full h-full bg-slate-900 rounded-t-lg border-8 border-black relative overflow-hidden flex items-center justify-center shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-orange-500/20 to-yellow-500/20"></div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-30">
                           <div className="w-1/2 h-1/2 border-2 border-red-500 transform rotate-45"></div>
                        </div>
                        <span className="text-white/40 font-bold text-4xl z-10">MSI</span>
                     </div>
                     <div className="w-[110%] h-4 bg-slate-800 rounded-b-2xl shadow-xl border-t border-slate-600 relative overflow-hidden">
                        <div className="absolute top-0 w-full h-[1px] bg-gradient-to-r from-red-500 via-green-500 to-blue-500"></div>
                     </div>
                  </div>
                )}
             </div>
          </div>

          {/* Right Column - Product Details */}
          <div className="flex-1 lg:pl-4">
             <h1 className="text-[22px] font-normal text-slate-800 leading-snug mb-3 uppercase">
               {product.title}
             </h1>
             
             {/* Rating */}
             <div className="flex items-center gap-2 mb-4">
               <div className="flex text-blue-800">
                 {[1, 2, 3, 4, 5].map((i) => (
                   <Star key={i} className={`h-3 w-3 ${i <= 4 ? 'fill-current' : 'fill-slate-200 text-slate-200'}`} />
                 ))}
               </div>
               <span className="text-xs text-slate-500">2 reviews</span>
             </div>

             {/* Pricing */}
             <div className="flex items-baseline gap-3 mb-1">
                <span className="text-2xl font-semibold text-blue-700">₹ {Number(product.price).toLocaleString('en-IN')}</span>
                {product.oldPrice && (
                  <span className="text-sm text-slate-400 line-through">₹ {Number(product.oldPrice).toLocaleString('en-IN')}</span>
                )}
             </div>
             {isDiscounted && (
               <div className="text-xs text-emerald-500 mb-4">
                 Discount: ₹ {discountAmount.toLocaleString('en-IN')} ({discountPercent}%)
               </div>
             )}

             {/* View Count */}
             <div className="flex items-center gap-2 text-xs text-slate-600 mb-6">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-900"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
               <span className="font-semibold text-slate-800">20</span> people are viewing this right now
             </div>

             {/* Call Banner - Dynamic from Settings */}
             {settings.supportPhone && (
               <div className="bg-[#f0f7ff] border-l-2 border-blue-500 p-3 mb-6 text-sm text-slate-600 flex items-center">
                  Call <a href={`tel:${settings.supportPhone}`} className="text-blue-600 font-semibold mx-1 underline">{settings.supportPhone}</a> for more details and quick response.
               </div>
             )}

             {/* Warranty Links */}
             <div className="space-y-2 mb-6">
                <div className="text-xs text-slate-600">
                  Warranty : {settings.warrantyText} <a href="#" className="text-blue-600 hover:underline">Know More</a>
                </div>
                <div className="text-xs text-slate-600">
                  Nearest Service Center : <a href="#" className="text-blue-600 hover:underline">Find Here</a>
                </div>
                <div className="text-xs text-slate-600">
                  Extended Warranty – <a href="#" className="text-blue-600 hover:underline">Secure It Now</a>
                </div>
             </div>

             {/* Bank Offer Banner - Dynamic from Settings */}
             {settings.bankOfferText && (
               <div className="border border-blue-900 rounded-sm p-4 mb-6 relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-2">
                     <div className="flex items-center gap-2">
                        <div className="bg-blue-900 text-white text-xs font-bold px-2 py-0.5 rounded-sm">BANK OFFER</div>
                     </div>
                  </div>
                  <div className="text-center text-sm text-blue-900 font-bold mt-2">
                    {settings.bankOfferText}
                  </div>
                  <div className="text-[8px] text-right text-red-600 mt-2">T & C Apply*</div>
               </div>
             )}

             {/* Stock Progress */}
             <div className="mb-6">
               {product.stock > 0 ? (
                 <>
                  <div className="text-xs text-slate-600 mb-2">Hurry Up! Only <span className="text-red-500 font-semibold">Few</span> Left in Stock!</div>
                  <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                     <div className="w-[15%] h-full bg-red-600 rounded-full"></div>
                  </div>
                 </>
               ) : (
                  <div className="text-sm font-bold text-red-600 mb-2">Out of stock</div>
               )}
             </div>

             {/* Add to Cart Actions */}
             <div className="flex items-center gap-4 mb-6 border-b border-slate-200 pb-6">
                <div className={`flex items-center border border-slate-300 rounded-full bg-white px-4 py-2 w-28 justify-between ${product.stock <= 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                   <button className="text-slate-500 hover:text-black focus:outline-none">-</button>
                   <span className="text-sm font-semibold text-slate-800">01</span>
                   <button className="text-slate-500 hover:text-black focus:outline-none">+</button>
                </div>
                <button 
                  onClick={() => addToCart({
                    id: product.id,
                    title: product.title,
                    price: Number(product.price),
                    quantity: 1
                  })}
                  disabled={product.stock <= 0}
                  className={`flex-1 text-white text-sm font-bold py-3 px-6 rounded-full transition-colors flex items-center justify-center uppercase tracking-wider ${product.stock > 0 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-400 cursor-not-allowed'}`}
                >
                  {product.stock > 0 ? 'Add to cart' : 'Out of stock'}
                </button>
             </div>

             {/* Secondary Actions */}
             <div className="flex items-center justify-between text-xs text-slate-500 mb-8 font-semibold">
                <div className="flex items-center gap-6">
                  <button className="flex items-center gap-1.5 hover:text-blue-600">
                    <Heart className="h-4 w-4" /> ADD WISHLIST
                  </button>
                  <button className="flex items-center gap-1.5 hover:text-blue-600">
                    <RotateCcw className="h-4 w-4" /> ADD COMPARE
                  </button>
                </div>
                <button className="flex items-center gap-1.5 hover:text-blue-600">
                  <Share2 className="h-4 w-4" /> Share
                </button>
             </div>

             {/* Dispatch & Meta */}
             <div className="border-t border-slate-200 pt-6 space-y-3">
                {settings.estimatedDispatch && (
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Truck className="h-4 w-4 text-slate-500" />
                    Estimated Dispatch: <span className="font-semibold text-slate-900">{settings.estimatedDispatch}</span>
                  </div>
                )}
                
                <div className="grid grid-cols-[120px_1fr] gap-2 text-xs pt-4">
                  <div className="text-slate-500">Availability:</div>
                  <div className={`${product.stock > 0 ? 'text-emerald-500' : 'text-red-500'} font-semibold`}>
                    {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                  </div>
                  
                  <div className="text-slate-500">SKU:</div>
                  <div className="text-slate-700">{product.sku || 'N/A'}</div>
                  
                  <div className="text-slate-500">Vendor:</div>
                  <div className="text-slate-700">{product.brand || 'TechBeast'}</div>
                  
                  <div className="text-slate-500">Model Number:</div>
                  <div className="text-slate-700">{product.modelNumber || 'N/A'}</div>
                </div>
             </div>

             {/* Payment Icons Mock */}
             <div className="flex items-center justify-end gap-2 mt-8 opacity-70">
                <div className="h-6 w-10 bg-blue-800 rounded-sm text-[8px] text-white flex items-center justify-center font-bold">VISA</div>
                <div className="h-6 w-10 bg-sky-500 rounded-sm text-[8px] text-white flex items-center justify-center font-bold">AMEX</div>
                <div className="h-6 w-10 bg-black rounded-sm text-[8px] text-white flex items-center justify-center font-bold">Pay</div>
                <div className="h-6 w-10 bg-orange-500 rounded-sm text-[8px] text-white flex items-center justify-center font-bold">DISC</div>
             </div>

          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-16">
          <div className="flex justify-center border-b border-slate-200">
            <nav className="flex space-x-12">
              <button
                onClick={() => setActiveTab('specs')}
                className={`py-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
                  activeTab === 'specs'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Description
              </button>
              <button
                onClick={() => setActiveTab('shipping')}
                className={`py-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
                  activeTab === 'shipping' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Shipping & Return
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`py-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
                  activeTab === 'reviews' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Reviews ({reviews.length})
              </button>
              <button
                onClick={() => setActiveTab('faqs')}
                className={`py-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
                  activeTab === 'faqs' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                FAQs
              </button>
            </nav>
          </div>
          
          <div className="py-12">
            {activeTab === 'specs' && (
              <div className="max-w-4xl mx-auto">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-6">Additional Information</h3>
                
                <div className="flex flex-col gap-2">
                  {Object.entries(specs).map(([key, value]) => (
                    value !== 'Not Specified' && (
                      <div key={key} className="flex bg-[#f8f9fa] rounded-[4px] p-3">
                        <div className="w-[180px] text-xs font-semibold text-slate-600 pl-2">{key}</div>
                        <div className="flex-1 text-xs text-slate-800">{value}</div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
            
             {activeTab === 'shipping' && (
               <div className="max-w-4xl mx-auto prose prose-sm text-slate-600">
                 <h4 className="font-bold text-slate-900 text-xs uppercase tracking-widest mb-4">In-Store Pickup</h4>
                 <p className="mb-8">Available immediately during store hours for items in stock. Reserve online and pay at the store.</p>
                 
                 <h4 className="font-bold text-slate-900 text-xs uppercase tracking-widest mb-4">Return Policy</h4>
                 <p>Used items come with a 7-day return window if the device is defective. The item must be returned in the exact condition it was purchased with all included accessories.</p>
               </div>
            )}
            
            {activeTab === 'reviews' && (
              <div className="max-w-4xl mx-auto">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-6">Customer Reviews</h3>
                <form onSubmit={handleReviewSubmit} className="mb-10 bg-slate-50 p-6 rounded-lg border border-slate-200">
                  <h4 className="font-bold text-slate-800 mb-4">Write a Review</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input required type="text" placeholder="Your Name" value={reviewForm.name} onChange={e => setReviewForm({...reviewForm, name: e.target.value})} className="w-full bg-white border border-slate-200 rounded px-4 py-2 text-sm focus:outline-none focus:border-blue-500" />
                    <select value={reviewForm.rating} onChange={e => setReviewForm({...reviewForm, rating: Number(e.target.value)})} className="w-full bg-white border border-slate-200 rounded px-4 py-2 text-sm focus:outline-none focus:border-blue-500">
                      <option value={5}>5 Stars - Excellent</option>
                      <option value={4}>4 Stars - Very Good</option>
                      <option value={3}>3 Stars - Good</option>
                      <option value={2}>2 Stars - Fair</option>
                      <option value={1}>1 Star - Poor</option>
                    </select>
                  </div>
                  <textarea required placeholder="Your Review" rows={4} value={reviewForm.comment} onChange={e => setReviewForm({...reviewForm, comment: e.target.value})} className="w-full bg-white border border-slate-200 rounded px-4 py-2 text-sm focus:outline-none focus:border-blue-500 mb-4"></textarea>
                  <button type="submit" disabled={submittingReview} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded text-sm transition-colors">{submittingReview ? 'Submitting...' : 'Submit Review'}</button>
                </form>
                <div className="space-y-6">
                  {reviews.length === 0 ? <p className="text-sm text-slate-500">No reviews yet. Be the first to review this product!</p> : reviews.map(review => (
                    <div key={review.id} className="border-b border-slate-100 pb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex text-blue-800">
                          {[1, 2, 3, 4, 5].map(i => <Star key={i} className={`h-4 w-4 ${i <= review.rating ? 'fill-current' : 'fill-slate-200 text-slate-200'}`} />)}
                        </div>
                        <span className="font-bold text-slate-800 text-sm">{review.name}</span>
                        <span className="text-xs text-slate-400">• {new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-slate-600">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === 'faqs' && (
              <div className="max-w-4xl mx-auto">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-6">Frequently Asked Questions</h3>
                <div className="space-y-4">
                  <div className="bg-[#f8f9fa] rounded p-5 border border-slate-100">
                    <p className="font-bold text-slate-800 text-sm mb-3 flex items-start gap-2">
                      <span className="text-blue-600">Q:</span> Does this product come with a warranty?
                    </p>
                    <p className="text-sm text-slate-600 ml-6">
                      <span className="font-bold text-slate-700 mr-2">A:</span>
                      Yes, all our refurbished products come with a minimum 6-month warranty covering hardware defects.
                    </p>
                  </div>
                  <div className="bg-[#f8f9fa] rounded p-5 border border-slate-100">
                    <p className="font-bold text-slate-800 text-sm mb-3 flex items-start gap-2">
                      <span className="text-blue-600">Q:</span> What condition is this device in?
                    </p>
                    <p className="text-sm text-slate-600 ml-6">
                      <span className="font-bold text-slate-700 mr-2">A:</span>
                      Our products are fully tested and professionally refurbished. The specific cosmetic condition is listed in the product specifications above.
                    </p>
                  </div>
                  <div className="bg-[#f8f9fa] rounded p-5 border border-slate-100">
                    <p className="font-bold text-slate-800 text-sm mb-3 flex items-start gap-2">
                      <span className="text-blue-600">Q:</span> Can I return the product if I don't like it?
                    </p>
                    <p className="text-sm text-slate-600 ml-6">
                      <span className="font-bold text-slate-700 mr-2">A:</span>
                      We offer a 7-day return policy for defective devices. Please refer to our Shipping & Return tab for more detailed information.
                    </p>
                  </div>
                  <div className="bg-[#f8f9fa] rounded p-5 border border-slate-100">
                    <p className="font-bold text-slate-800 text-sm mb-3 flex items-start gap-2">
                      <span className="text-blue-600">Q:</span> Do you offer EMI options?
                    </p>
                    <p className="text-sm text-slate-600 ml-6">
                      <span className="font-bold text-slate-700 mr-2">A:</span>
                      Yes, we support EMI options on most major credit cards. You can see the full EMI details at the checkout page.
                    </p>
                  </div>
                  <div className="bg-[#f8f9fa] rounded p-5 border border-slate-100">
                    <p className="font-bold text-slate-800 text-sm mb-3 flex items-start gap-2">
                      <span className="text-blue-600">Q:</span> Is the original charger included?
                    </p>
                    <p className="text-sm text-slate-600 ml-6">
                      <span className="font-bold text-slate-700 mr-2">A:</span>
                      Yes, a compatible or original power adapter is included with all laptop and smartphone purchases.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
