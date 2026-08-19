import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface CartItem {
  id: string;
  title: string;
  price: number;
  image?: string;
  quantity: number;
  stock?: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  validateCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('techbeast_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('techbeast_cart', JSON.stringify(cart));
  }, [cart]);

  const validateCart = async () => {
    if (cart.length === 0) return;

    let cartChanged = false;
    const updatedCart = [...cart];

    for (let i = 0; i < updatedCart.length; i++) {
      const item = updatedCart[i];
      if (!item) continue;

      try {
        // Try products collection first
        let docSnap = await getDoc(doc(db, 'products', item.id));
        if (!docSnap.exists()) {
          // If not found, try prebuilt-pcs
          docSnap = await getDoc(doc(db, 'prebuilt-pcs', item.id));
        }

        if (!docSnap.exists()) {
          // Product was completely removed from the database
          updatedCart[i].quantity = 0;
          cartChanged = true;
          continue;
        }

        const data = docSnap.data();
        const currentStock = data.stock !== undefined ? data.stock : 0;
        
        if (item.stock !== currentStock) {
          updatedCart[i].stock = currentStock;
          cartChanged = true;
        }

        // If the quantity in cart exceeds available stock, reduce it
        // If stock is 0, this will set quantity to 0 (which gets filtered out)
        if (updatedCart[i].quantity > currentStock) {
          updatedCart[i].quantity = currentStock;
          cartChanged = true;
        }
      } catch (err) {
        console.error(`Error validating cart item ${item.id}:`, err);
      }
    }

    if (cartChanged) {
      // Filter out items that are out of stock (quantity = 0)
      const validCart = updatedCart.filter(item => item.quantity > 0);
      setCart(validCart);
    }
  };

  // Validate on initial load
  useEffect(() => {
    validateCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Validate whenever the cart is opened
  useEffect(() => {
    if (isCartOpen) {
      validateCart();
    }
  }, [isCartOpen]);

  const addToCart = (item: CartItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(i => i.id === item.id);
      if (existingItem) {
        return prevCart.map(i => {
          if (i.id === item.id) {
            const newQuantity = i.quantity + item.quantity;
            return { ...i, quantity: i.stock !== undefined ? Math.min(newQuantity, i.stock) : newQuantity };
          }
          return i;
        });
      }
      return [...prevCart, { ...item, quantity: item.stock !== undefined ? Math.min(item.quantity, item.stock) : item.quantity }];
    });
    setIsCartOpen(true); // Open cart automatically when adding
  };

  const removeFromCart = (id: string) => {
    setCart(prevCart => prevCart.filter(i => i.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart(prevCart => 
      prevCart.map(i => {
        if (i.id === id) {
          return { ...i, quantity: i.stock !== undefined ? Math.min(quantity, i.stock) : quantity };
        }
        return i;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ 
      cart, addToCart, removeFromCart, updateQuantity, clearCart, 
      totalItems, totalPrice, isCartOpen, setIsCartOpen, validateCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
