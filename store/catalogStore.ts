import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type CacheEntry = { data: unknown; updatedAt: number };
type CatalogState = { entries: Record<string, CacheEntry> };
const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
const MAX_ENTRIES = 60;
const RETENTION = 24 * 60 * 60 * 1000;
const requests = new Map<string, Promise<unknown>>();

export const collectionPath = (handle: string) =>
  `/api/products/${encodeURIComponent(handle)}`;
export const searchPath = (query: string) =>
  `/api/products/search?q=${encodeURIComponent(query.trim())}`;
export const productPath = (handle: string) =>
  `/api/products/product/${encodeURIComponent(handle)}`;
export const MENU_PATH = "/api/products/menu/new-menu-07-12-2024";
export const REVIEW_SUMMARY_PATH = "/api/judgeme/review-summary";

function validData(path: string, data: any): boolean {
  if (path === REVIEW_SUMMARY_PATH)
    return data?.success === true && !!data.products && typeof data.products === "object";
  if (path.startsWith("/api/products/menu/")) return Array.isArray(data);
  const isProduct = (item: any) =>
    item && typeof item.id === "string" && typeof item.handle === "string" &&
    typeof item.title === "string" && Array.isArray(item.images);
  if (path.startsWith("/api/products/product/"))
    return isProduct(data) && Array.isArray(data.options) && Array.isArray(data.variants);
  return path.startsWith("/api/products/") && Array.isArray(data) && data.every(isProduct);
}

// Bound storage size and discard expired/corrupt entries on app restart.
function prune(entries: Record<string, CacheEntry>, disk = false) {
  const result: Record<string, CacheEntry> = {};
  let bytes = 0;
  for (const [key, entry] of Object.entries(entries)
    .filter(([, value]) => value && Number.isFinite(value.updatedAt))
    .sort((a, b) => b[1].updatedAt - a[1].updatedAt)) {
    if (Object.keys(result).length >= MAX_ENTRIES) break;
    if (Date.now() - entry.updatedAt > RETENTION || entry.updatedAt > Date.now()) continue;
    if (!validData(key, entry.data)) continue;
    if (disk) {
      const size = JSON.stringify([key, entry]).length * 2;
      if (bytes + size > 1_500_000) continue;
      bytes += size;
    }
    result[key] = entry;
  }
  return result;
}

export const useCatalogStore = create<CatalogState>()(
  persist(() => ({ entries: {} }), {
    name: `cupid-catalog-v1:${API_URL}`,
    version: 1,
    storage: createJSONStorage(() => ({
      getItem: (key) => AsyncStorage.getItem(key),
      // A full disk must not turn a successful catalog request into an error.
      setItem: async (key, value) => {
        try { await AsyncStorage.setItem(key, value); }
        catch { /* Keep the in-memory cache usable when storage is unavailable. */ }
      },
      removeItem: (key) => AsyncStorage.removeItem(key),
    })),
    partialize: (state) => ({ entries: prune(state.entries, true) }),
    merge: (saved, current) => {
      const entries = (saved as Partial<CatalogState> | null)?.entries;
      return { entries: { ...(entries && typeof entries === "object" ? prune(entries) : {}), ...current.entries } };
    },
    skipHydration: true,
  }),
);

// Start restoring during the app splash. Requests wait so disk data isn't overwritten.
export const catalogReady = Promise.resolve(useCatalogStore.persist.rehydrate());

export async function fetchCatalog<T>(path: string, force = false): Promise<T> {
  await catalogReady;
  const pending = requests.get(path);
  if (pending) return pending as Promise<T>;
  const entry = useCatalogStore.getState().entries[path];
  const freshFor = path.startsWith("/api/products/product/") ? 60_000 : 5 * 60_000;
  if (!force && entry && Date.now() - entry.updatedAt < freshFor) return entry.data as T;

  const request = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    try {
      const response = await fetch(`${API_URL}${path}`, { signal: controller.signal });
      if (!response.ok) throw new Error(`Catalog request failed (${response.status})`);
      let data = await response.json();
      if (path.startsWith("/api/products/menu/") && !Array.isArray(data)) data = data?.menu;
      if (!validData(path, data)) throw new Error("Invalid catalog response");
      useCatalogStore.setState((state) => {
        const previous = state.entries[path];
        // Preserve references for unchanged data: no list jump or repeat image render.
        const stableData = previous && JSON.stringify(previous.data) === JSON.stringify(data)
          ? previous.data : data;
        const others = { ...state.entries };
        delete others[path];
        return { entries: prune({ [path]: { data: stableData, updatedAt: Date.now() }, ...others }) };
      });
      return useCatalogStore.getState().entries[path]?.data as T;
    } finally {
      clearTimeout(timer);
    }
  })();
  requests.set(path, request);
  try { return await request; }
  finally { requests.delete(path); }
}
