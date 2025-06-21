
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { CartItem, Product } from '../types';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity: number, selectedSize: string, priceAtPurchase: number) => void;
  removeFromCart: (productId: string, selectedSize: string) => void;
  updateQuantity: (productId: string, selectedSize: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const localData = localStorage.getItem('cartItems');
    return localData ? JSON.parse(localData) : [];
  });

  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = useCallback((product: Product, quantity: number, selectedSize: string, priceAtPurchase: number) => {
    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(
        item => item.product.id === product.id && item.selectedSize === selectedSize
      );
      if (existingItemIndex > -1) {
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += quantity;
        return updatedItems;
      }
      return [...prevItems, { product, quantity, selectedSize, priceAtPurchase }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string, selectedSize: string) => {
    setCartItems(prevItems =>
      prevItems.filter(item => !(item.product.id === productId && item.selectedSize === selectedSize))
    );
  }, []);

  const updateQuantity = useCallback((productId: string, selectedSize: string, quantity: number) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.product.id === productId && item.selectedSize === selectedSize
          ? { ...item, quantity: Math.max(0, quantity) } 
          : item
      ).filter(item => item.quantity > 0) 
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const totalAmount = cartItems.reduce((total, item) => total + item.priceAtPurchase * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, itemCount, totalAmount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart debe ser utilizado dentro de un CartProvider');
  }
  return context;
};