import { create } from "zustand";

/**
 * The only cart-line shape used by the app. `cartKey` is derived from the
 * Shopify product and variant IDs, so two variants of one product stay
 * independent everywhere the cart is stored.
 */
export type CartItem = {
  cartKey: string;
  productId: string;
  variantId: string;
  title: string;
  image: string;
  price: number;
  compareAtPrice?: number;
  discountPercent?: number;
  handle: string;
  quantity: number;
  size: string;
};

export const CART_STORAGE_KEY = "cartItems";

export function createCartKey(productId: string, variantId: string): string {
  return `${productId}::${variantId}`;
}

export function getCartQuantity(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.quantity, 0);
}

type CartStore = {
  cartItems: CartItem[];
  setCartItems: (items: CartItem[]) => void;
  addCartItem: (item: CartItem) => void;
  setCartItemQuantity: (cartKey: string, quantity: number) => void;
  removeCartItem: (cartKey: string) => void;
  cartCount: number;
};

export const useCartStore = create<CartStore>((set, get) => ({
  cartItems: [],
  cartCount: 0,

  setCartItems: (items) =>
    set({
      cartItems: items,
      cartCount: getCartQuantity(items),
    }),

  addCartItem: (item) => {
    const existing = get().cartItems;
    const already = existing.find((current) => current.cartKey === item.cartKey);
    const updated = already
      ? existing.map((current) =>
          current.cartKey === item.cartKey
            ? { ...current, quantity: current.quantity + item.quantity }
            : current,
        )
      : [item, ...existing];

    set({
      cartItems: updated,
      cartCount: getCartQuantity(updated),
    });
  },

  setCartItemQuantity: (cartKey, quantity) => {
    const updated = get().cartItems.map((item) =>
      item.cartKey === cartKey ? { ...item, quantity } : item,
    );

    set({
      cartItems: updated,
      cartCount: getCartQuantity(updated),
    });
  },

  removeCartItem: (cartKey) => {
    const updated = get().cartItems.filter(
      (item) => item.cartKey !== cartKey,
    );

    set({
      cartItems: updated,
      cartCount: getCartQuantity(updated),
    });
  },
}));
