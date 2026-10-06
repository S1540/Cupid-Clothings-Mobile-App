import { refreshConnection } from "@/lib/network";
import { useNetworkStore } from "@/store/networkStore";
import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function NoInternet({
  onRetry,
}: {
  onRetry: () => Promise<unknown>;
}) {
  const [checking, setChecking] = useState(false);
  const retry = async () => {
    setChecking(true);
    try {
      await onRetry();
    } finally {
      setChecking(false);
    }
  };
  return (
    <View style={styles.empty} accessibilityLiveRegion="polite">
      <View style={styles.icon}>
        <Feather name="wifi-off" size={34} color="#A82D49" />
      </View>
      <Text style={styles.title}>No internet connection</Text>
      <Text style={styles.body}>
        Check your Wi-Fi or mobile data, then try again.
      </Text>
      <Pressable
        accessibilityRole="button"
        disabled={checking}
        onPress={() => void retry()}
        style={styles.retry}
      >
        {checking ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.retryText}>Try again</Text>
        )}
      </Pressable>
    </View>
  );
}

export function NetworkNotice({
  bottomOffset = 16,
}: {
  bottomOffset?: number;
}) {
  const offline = useNetworkStore((state) => state.status === "offline");
  const insets = useSafeAreaInsets();
  const [checking, setChecking] = useState(false);
  if (!offline) return null;
  return (
    <View
      style={[styles.notice, { bottom: insets.bottom + bottomOffset }]}
      accessibilityLiveRegion="polite"
    >
      <Feather name="wifi-off" size={19} color="#A82D49" />
      <Text style={styles.noticeText}>No internet connection</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Check internet connection"
        disabled={checking}
        hitSlop={8}
        onPress={async () => {
          setChecking(true);
          try {
            await refreshConnection();
          } finally {
            setChecking(false);
          }
        }}
        style={styles.noticeRetry}
      >
        <Text style={styles.noticeAction}>
          {checking ? "Checking…" : "Retry"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: "#FFF9FA",
  },
  icon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FBE8ED",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    color: "#262126",
    fontSize: 21,
    fontWeight: "700",
    textAlign: "center",
  },
  body: {
    color: "#7C7075",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 10,
    maxWidth: 280,
  },
  retry: {
    marginTop: 24,
    backgroundColor: "#A82D49",
    borderRadius: 24,
    paddingHorizontal: 28,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  retryText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  notice: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 1000,
    elevation: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFF1F4",
    borderColor: "#F0CDD6",
    borderWidth: 1,
  },
  noticeText: { flex: 1, fontSize: 13, color: "#5D3541", fontWeight: "500" },
  noticeRetry: { minHeight: 32, justifyContent: "center" },
  noticeAction: { color: "#A82D49", fontWeight: "700", fontSize: 13 },
});
