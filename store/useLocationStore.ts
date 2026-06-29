import { create } from "zustand";

interface LocationStore {
  location: string;
  coords: [number, number] | null;
  setLocation: (locationName: string, coords: [number, number] | null) => void;
}

export const useLocationStore = create<LocationStore>((set) => ({
  location: "",
  coords: null,
  setLocation: (name, coords) =>
    set({
      location: name,
      coords,
    }),
}));
