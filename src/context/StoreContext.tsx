import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { CartItem, CustomerUser, Product } from '../types/store';
import { calculateCartTotals, canAddToCart } from '../utils/storeLogic';
import { fetchCurrentUser, logoutUser } from '../utils/api';

const CART_STORAGE_KEY = 'tbl_cart_v1';
const WISHLIST_STORAGE_KEY = 'tbl_wishlist_v1';

interface ToastMessage {
  id: number;
  text: string;
  tone?: 'default' | 'error';
}

interface StoreContextValue {
  currentPath: string;
  navigate: (path: string) => void;
  user: CustomerUser | null;
  authLoading: boolean;
  setUser: (user: CustomerUser | null) => void;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
  cart: CartItem[];
  cartTotals: ReturnType<typeof calculateCartTotals>;
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  addToCart: (
    product: Product,
    options?: { size?: string; color?: string; quantity?: number; openDrawer?: boolean },
  ) => boolean;
  updateCartQuantity: (
    productId: number,
    selectedSize: string,
    selectedColor: string,
    nextQty: number,
  ) => void;
  removeFromCart: (productId: number, selectedSize: string, selectedColor: string) => void;
  clearCart: () => void;
  wishlistIds: number[];
  toggleWishlist: (productId: number, productName?: string) => void;
  isWishlisted: (productId: number) => boolean;
  toast: ToastMessage | null;
  showToast: (text: string, tone?: 'default' | 'error') => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [currentPath, setCurrentPath] = useState<string>(
    () => window.location.pathname + window.location.search,
  );
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [cart, setCart] = useState<CartItem[]>(() => readStorage<CartItem[]>(CART_STORAGE_KEY, []));
  const [wishlistIds, setWishlistIds] = useState<number[]>(() =>
    readStorage<number[]>(WISHLIST_STORAGE_KEY, []),
  );
  const [isCartOpen, setCartOpen] = useState(false);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((text: string, tone: 'default' | 'error' = 'default') => {
    const id = Date.now();
    setToast({ id, text, tone });
    window.setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 3400);
  }, []);

  const navigate = useCallback((path: string) => {
    const target = path.startsWith('/') ? path : `/${path}`;
    if (window.location.pathname + window.location.search !== target) {
      window.history.pushState({}, '', target);
    }
    setCurrentPath(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setCurrentPath(window.location.pathname + window.location.search);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const me = await fetchCurrentUser();
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore storage quota errors
    }
  }, [cart]);

  useEffect(() => {
    try {
      window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistIds));
    } catch {
      // ignore storage quota errors
    }
  }, [wishlistIds]);

  const signOut = useCallback(async () => {
    await logoutUser();
    setUser(null);
    showToast('Signed out of your account.');
  }, [showToast]);

  const addToCart = useCallback(
    (
      product: Product,
      options?: { size?: string; color?: string; quantity?: number; openDrawer?: boolean },
    ): boolean => {
      const selectedSize = options?.size || product.sizes[0] || 'Standard';
      const selectedColor = options?.color || product.colors[0] || 'Black';
      const quantity = options?.quantity ?? 1;

      const existing = cart.find(
        (item) =>
          item.productId === product.id &&
          item.selectedSize === selectedSize &&
          item.selectedColor === selectedColor,
      );
      const existingQty = existing ? existing.quantity : 0;
      const check = canAddToCart(product, quantity, existingQty);

      if (!check.allowed) {
        showToast(check.reason || 'Unable to add item.', 'error');
        return false;
      }

      setCart((prev) => {
        const idx = prev.findIndex(
          (item) =>
            item.productId === product.id &&
            item.selectedSize === selectedSize &&
            item.selectedColor === selectedColor,
        );
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            quantity: updated[idx].quantity + quantity,
            maxStock: product.stock,
          };
          return updated;
        }
        return [
          ...prev,
          {
            productId: product.id,
            slug: product.slug,
            name: product.name,
            category: product.category,
            price: product.price,
            image: product.images[0] || '',
            selectedSize,
            selectedColor,
            quantity,
            maxStock: product.stock,
          },
        ];
      });

      if (options?.openDrawer !== false) {
        setCartOpen(true);
      } else {
        showToast(`Added ${product.name} to your bag.`);
      }
      return true;
    },
    [cart, showToast],
  );

  const updateCartQuantity = useCallback(
    (productId: number, selectedSize: string, selectedColor: string, nextQty: number) => {
      setCart((prev) => {
        if (nextQty <= 0) {
          return prev.filter(
            (i) =>
              !(
                i.productId === productId &&
                i.selectedSize === selectedSize &&
                i.selectedColor === selectedColor
              ),
          );
        }
        return prev.map((i) => {
          if (
            i.productId === productId &&
            i.selectedSize === selectedSize &&
            i.selectedColor === selectedColor
          ) {
            const clamped = Math.min(nextQty, i.maxStock || nextQty);
            return { ...i, quantity: clamped };
          }
          return i;
        });
      });
    },
    [],
  );

  const removeFromCart = useCallback(
    (productId: number, selectedSize: string, selectedColor: string) => {
      setCart((prev) =>
        prev.filter(
          (i) =>
            !(
              i.productId === productId &&
              i.selectedSize === selectedSize &&
              i.selectedColor === selectedColor
            ),
        ),
      );
    },
    [],
  );

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const toggleWishlist = useCallback(
    (productId: number, productName?: string) => {
      setWishlistIds((prev) => {
        const exists = prev.includes(productId);
        if (exists) {
          showToast(productName ? `Removed ${productName} from wishlist.` : 'Removed from wishlist.');
          return prev.filter((id) => id !== productId);
        }
        showToast(productName ? `Saved ${productName} to wishlist.` : 'Saved to wishlist.');
        return [...prev, productId];
      });
    },
    [showToast],
  );

  const isWishlisted = useCallback(
    (productId: number) => wishlistIds.includes(productId),
    [wishlistIds],
  );

  const cartTotals = useMemo(() => calculateCartTotals(cart), [cart]);

  return (
    <StoreContext.Provider
      value={{
        currentPath,
        navigate,
        user,
        authLoading,
        setUser,
        refreshUser,
        signOut,
        cart,
        cartTotals,
        isCartOpen,
        setCartOpen,
        isSearchOpen,
        setSearchOpen,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        wishlistIds,
        toggleWishlist,
        isWishlisted,
        toast,
        showToast,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
