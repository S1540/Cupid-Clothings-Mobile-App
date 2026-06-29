import { create } from "zustand";

export interface UserData {
  uid: string;
  userName: string;
  email: string;
  number: string;
  referralCode: string;
  referredBy?: string | null;
  totalReferrals: number;
  referralEarnings: number;
  walletBalance: number;
  totalEarnings: number;
  rewardGiven: boolean;
  lastRewardAt?: any;
  activeCoupon?: string | null;
  createdAt?: any;
}

interface UserStore {
  user: UserData | null;
  userLoaded: boolean;
  setUser: (user: UserData) => void;
  updateUser: (data: Partial<UserData>) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  userLoaded: false,

  setUser: (user) =>
    set({
      user,
      userLoaded: true,
    }),

  updateUser: (data) =>
    set((state) => ({
      user: state.user
        ? {
            ...state.user,
            ...data,
          }
        : null,
    })),

  clearUser: () =>
    set({
      user: null,
      userLoaded: false,
    }),
}));
