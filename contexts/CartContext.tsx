
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useMemo } from 'react';
import { CartItem, Product } from '../types';
import { useAuth } from './AuthContext'; // Import useAuth
import useDebouncedCallback from '../hooks/useDebouncedCallback'; // Import useDebouncedCallback

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

const CART_UPDATE_DEBOUNCE_DELAY = 500; // 500ms debounce delay

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser, updateUserCart, loadingAuth } = useAuth();
  const [localCartItems, setLocalCartItems] = useState<CartItem[]>([]); // For non-logged-in users

  // Determine which cart items to use based on login state
  const cartItemsSource = useMemo(() => {
    if (!loadingAuth && currentUser && currentUser.cartItems) {
      return currentUser.cartItems;
    }
    return localCartItems;
  }, [currentUser, localCartItems, loadingAuth]);

  // Effect to initialize localCartItems if user logs out or if profile has no cart.
  useEffect(() => {
    if (!loadingAuth) {
      if (!currentUser) {
        // If user logs out, preserve localCartItems if you want cart to persist after logout
        // For now, we'll clear it to make it truly ephemeral for logged-out.
        // Or, if app is designed that cart is always tied to user, clear it.
        // setLocalCartItems([]); // Clears cart on logout
        // If current design implies local cart is for guests only, and profile cart is separate:
        // This is fine. When currentUser becomes null, cartItemsSource switches to localCartItems.
      } else if (currentUser && !currentUser.cartItems) {
        // If logged-in user has no cart in profile, ensure local state reflects empty
        // This helps if they had items in localCart, then logged in to an account with no cart.
        // We want the profile (empty) to take precedence.
        // However, cartItemsSource already handles this priority.
      }
    }
  }, [currentUser, loadingAuth]);

  const performCartUpdate = useCallback(async (newCart: CartItem[]) => {
    if (currentUser) {
      try {
        await updateUserCart(newCart);
      } catch (error) {
        console.error("CartContext: Failed to update cart in profile:", error);
        // Optionally, show a notification to the user
      }
    } else {
      setLocalCartItems(newCart);
    }
  }, [currentUser, updateUserCart]);

  const debouncedHandleCartUpdate = useDebouncedCallback(
    performCartUpdate,
    CART_UPDATE_DEBOUNCE_DELAY
  );

  const addToCart = useCallback((product: Product, quantity: number, selectedSize: string, priceAtPurchase: number) => {
    const currentCart = currentUser ? (currentUser.cartItems || []) : localCartItems;
    const existingItemIndex = currentCart.findIndex(
      item => item.product.id === product.id && item.selectedSize === selectedSize
    );
    let newCart;
    if (existingItemIndex > -1) {
      newCart = [...currentCart];
      newCart[existingItemIndex].quantity += quantity;
    } else {
      newCart = [...currentCart, { product, quantity, selectedSize, priceAtPurchase }];
    }
    debouncedHandleCartUpdate(newCart);
  }, [currentUser, localCartItems, debouncedHandleCartUpdate]);

  const removeFromCart = useCallback((productId: string, selectedSize: string) => {
    const currentCart = currentUser ? (currentUser.cartItems || []) : localCartItems;
    const newCart = currentCart.filter(item => !(item.product.id === productId && item.selectedSize === selectedSize));
    debouncedHandleCartUpdate(newCart);
  }, [currentUser, localCartItems, debouncedHandleCartUpdate]);

  const updateQuantity = useCallback((productId: string, selectedSize: string, quantity: number) => {
    const currentCart = currentUser ? (currentUser.cartItems || []) : localCartItems;
    const newCart = currentCart
      .map(item =>
        item.product.id === productId && item.selectedSize === selectedSize
          ? { ...item, quantity: Math.max(0, quantity) } 
          : item
      )
      .filter(item => item.quantity > 0);
    debouncedHandleCartUpdate(newCart);
  }, [currentUser, localCartItems, debouncedHandleCartUpdate]);

  const clearCart = useCallback(() => {
    debouncedHandleCartUpdate([]);
  }, [debouncedHandleCartUpdate]);

  const itemCount = useMemo(() => cartItemsSource.reduce((total, item) => total + item.quantity, 0), [cartItemsSource]);
  const totalAmount = useMemo(() => cartItemsSource.reduce((total, item) => total + item.priceAtPurchase * item.quantity, 0), [cartItemsSource]);

  return (
    <CartContext.Provider value={{ 
      cartItems: cartItemsSource, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart, 
      itemCount, 
      totalAmount 
    }}>
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
