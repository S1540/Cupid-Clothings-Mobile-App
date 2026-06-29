import { create } from "zustand";

export type CartItem = {
  id: string;
  title: string;
  variantId: string;
  image: string;
  price: number;
  compareAtPrice?: number;
  discountPercent?: number;
  handle: string;
  quantity: number;
  size: string;
};

type CartStore = {
  cartItems: CartItem[];
  setCartItems: (items: CartItem[]) => void;
  addCartItem: (item: CartItem) => void;
  removeCartItem: (id: string, size: string) => void;
  cartCount: number;
};

export const useCartStore = create<CartStore>((set, get) => ({
  cartItems: [],
  cartCount: 0,

  setCartItems: (items) =>
    set({
      cartItems: items,
      cartCount: items.length,
    }),

  addCartItem: (item) => {
    const existing = get().cartItems;
    const already = existing.find(
      (i) => i.id === item.id && i.size === item.size,
    );

    let updated = [];
    if (already) {
      updated = existing.map((i) =>
        i.id === item.id && i.size === item.size
          ? {
              ...i,
              quantity: i.quantity + 1,
            }
          : i,
      );
    } else {
      updated = [item, ...existing];
    }

    set({
      cartItems: updated,
      cartCount: updated.length,
    });
  },

  removeCartItem: (id, size) => {
    const updated = get().cartItems.filter(
      (i) => !(i.id === id && i.size === size),
    );

    set({
      cartItems: updated,
      cartCount: updated.length,
    });
  },
}));
