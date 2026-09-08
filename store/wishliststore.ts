import { create } from "zustand";

type WishlistStore = {
  wishlistIds: string[];
  clear: () => void;
  toggleWishlist: (id: string) => void;
  isWishlisted: (id: string) => boolean;
};

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  wishlistIds: [],
  clear: () => set({ wishlistIds: [] }),

  toggleWishlist: (id) =>
    set((state) => ({
      wishlistIds: state.wishlistIds.includes(id)
        ? state.wishlistIds.filter((x) => x !== id)
        : [...state.wishlistIds, id],
    })),

  isWishlisted: (id) => get().wishlistIds.includes(id),
}));
