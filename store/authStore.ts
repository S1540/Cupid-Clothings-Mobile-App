import { create } from "zustand";
import type { User } from "@react-native-firebase/auth";

type AuthState = {
  user: User | null;
  ready: boolean;
  error: string | null;
  setSession: (user: User | null) => void;
  setError: (error: string | null) => void;
};
export const useAuthStore = create<AuthState>((set) => ({
  user: null, ready: false, error: null,
  setSession: (user) => set({ user, ready: true, error: null }),
  setError: (error) => set({ error }),
}));
