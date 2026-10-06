import { create } from "zustand";

export type ConnectionStatus = "unknown" | "online" | "offline";
type ConnectionState = { isConnected: boolean | null; isInternetReachable: boolean | null };

export function connectionStatus(state: ConnectionState): ConnectionStatus {
  if (state.isConnected === false || state.isInternetReachable === false) return "offline";
  if (state.isConnected === true && state.isInternetReachable === true) return "online";
  return "unknown";
}

export const useNetworkStore = create<{ status: ConnectionStatus }>(() => ({ status: "unknown" }));
