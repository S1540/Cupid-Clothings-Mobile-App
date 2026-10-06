import { refreshConnection } from "@/lib/network";
import { fetchCatalog, useCatalogStore } from "@/store/catalogStore";
import { useNetworkStore } from "@/store/networkStore";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

/** Cached data is selected during render, including the first render after navigation. */
export function useCatalogQuery<T>(path: string | null) {
  const data = useCatalogStore((state) =>
    path ? (state.entries[path]?.data as T | undefined) : undefined,
  );
  const offline = useNetworkStore((state) => state.status === "offline");
  const [failure, setFailure] = useState<{
    path: string;
    message: string;
  } | null>(null);
  useFocusEffect(
    useCallback(() => {
      if (!path || offline) return;
      let active = true;
      setFailure(null);
      void fetchCatalog<T>(path).catch(() => {
        void refreshConnection();
        if (active)
          setFailure({
            path,
            message: "Couldn't load products. Please try again.",
          });
      });
      return () => {
        active = false;
      };
    }, [path, offline]),
  );
  const refresh = useCallback(async () => {
    if (!path) return;
    if (
      useNetworkStore.getState().status === "offline" &&
      (await refreshConnection()) === "offline"
    )
      return;
    setFailure(null);
    try {
      await fetchCatalog<T>(path, true);
    } catch {
      void refreshConnection();
      setFailure({
        path,
        message: "Couldn't load products. Please try again.",
      });
    }
  }, [path]);
  const error = failure?.path === path ? failure.message : null;
  return {
    data,
    error,
    offline,
    loading: !!path && data === undefined && !error && !offline,
    refresh,
  };
}
