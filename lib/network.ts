import { AppState, NativeModules, Platform } from "react-native";
import { connectionStatus, useNetworkStore } from "@/store/networkStore";

type NetInfoApi = typeof import("@react-native-community/netinfo").default;
let netInfo: NetInfoApi | null | undefined;
let pendingCheck: Promise<ReturnType<typeof useNetworkStore.getState>["status"]> | null = null;

function getNetInfo(): NetInfoApi | null {
  if (netInfo !== undefined) return netInfo;
  // Do not evaluate the package at all in an older binary: its module body throws.
  if (Platform.OS !== "web" && !NativeModules.RNCNetInfo) {
    netInfo = null;
    return null;
  }
  // Conditional require is intentional: a static import crashes before this guard.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  netInfo = require("@react-native-community/netinfo").default as NetInfoApi;
  return netInfo;
}

async function canReach(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    // Any HTTP response, including 5xx, proves a network connection exists.
    await fetch(url, { method: "HEAD", cache: "no-store", signal: controller.signal });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function checkConnection() {
  const native = getNetInfo();
  try {
    if (native) {
      const state = await native.refresh();
      useNetworkStore.setState({ status: connectionStatus(state) });
    } else {
      const api = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
      const reachable = (api && await canReach(`${api}/health`)) ||
        await canReach("https://clients3.google.com/generate_204");
      useNetworkStore.setState({ status: reachable ? "online" : "offline" });
    }
  } catch {
    // A failed native check is not proof that the device is offline.
  }
  return useNetworkStore.getState().status;
}

export function refreshConnection() {
  if (!pendingCheck) {
    pendingCheck = checkConnection().finally(() => { pendingCheck = null; });
  }
  return pendingCheck;
}

export function monitorConnection() {
  const native = getNetInfo();
  const unsubscribe = native?.addEventListener((state) => {
    useNetworkStore.setState({ status: connectionStatus(state) });
  });
  // Older installed apps can still run after a JS reload, without a native rebuild.
  const timer = native ? null : setInterval(() => {
    if (!AppState.currentState || AppState.currentState === "active") void refreshConnection();
  }, 15000);
  if (!native) void refreshConnection();
  const subscription = AppState.addEventListener("change", (state) => {
    if (state === "active") void refreshConnection();
  });
  return () => {
    unsubscribe?.();
    if (timer !== null) clearInterval(timer);
    subscription.remove();
  };
}
