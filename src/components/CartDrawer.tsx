import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { Link, useNavigate } from 'react-router-dom';

export default function CartDrawer() {
  const { cart, removeFromCart, updateQuantity, clearCart, totalPrice, isCartOpen, setIsCartOpen } = useCart();
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-[#0d0d0e] border-l border-white/10 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-bold text-white tracking-tight">Your Cart</h2>
          </div>
          <button 
            onClick={() => setIsCartOpen(false)}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
              <ShoppingBag className="h-12 w-12 opacity-20" />
              <p className="font-medium">Your cart is empty.</p>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="text-blue-500 hover:text-blue-400 font-bold text-sm"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex gap-4 p-4 rounded-2xl border border-white/5 bg-white/[0.02]">
                <div className="h-20 w-20 bg-slate-800 rounded-xl flex items-center justify-center border border-white/10 flex-shrink-0 overflow-hidden">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold text-slate-500">IMG</span>
                  )}
                </div>
                
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <Link to={`/products/${item.id}`} onClick={() => setIsCartOpen(false)} className="text-sm font-bold text-slate-200 hover:text-blue-400 transition-colors line-clamp-1">
                      {item.title}
                    </Link>
                    <div className="text-blue-400 font-bold text-sm mt-1">₹{item.price.toLocaleString('en-IN')}</div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3 bg-black/40 rounded-full border border-white/10 px-2 py-1">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="text-slate-400 hover:text-white transition-colors w-6 h-6 flex items-center justify-center"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-xs font-bold text-white w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="text-slate-400 hover:text-white transition-colors w-6 h-6 flex items-center justify-center"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors p-2"
                      title="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-6 border-t border-white/10 bg-black/20">
            <div className="flex items-center justify-between mb-6">
              <span className="text-slate-400 font-medium">Subtotal</span>
              <span className="text-xl font-bold text-white">₹{totalPrice.toLocaleString('en-IN')}</span>
            </div>
            
            <button 
              onClick={handleCheckout}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold uppercase tracking-wider transition-all shadow-lg shadow-blue-900/20"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
        
      </div>
    </>
  );
}
