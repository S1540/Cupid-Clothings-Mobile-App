import { FilterIce, IceSheen } from "@/components/catalog/iceTheme";
import { useAuthStore } from "@/store/authStore";
import { useOrderStore } from "@/store/orderStore";
import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { cancelAnimation, Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";

export default function FirstOrderOffer() {
  const uid = useAuthStore((state) => state.user?.uid);
  const ready = useAuthStore((state) => state.ready);
  const noOrders = useOrderStore((state) => state.ownerUid === uid && state.ordersLoaded && !state.error && state.orders.length === 0);
  // Guests can discover the first-order coupon; signed-in accounts must have
  // a successfully loaded, empty history. Checkout validates the coupon.
  return ready && (!uid || noOrders) ? <WelcomeCoupon key={uid ?? "guest"} /> : null;
}

function WelcomeCoupon() {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  const sweep = useSharedValue(0);
  const [width, setWidth] = useState(320);
  useEffect(() => {
    sweep.value = withRepeat(withSequence(
      withDelay(1100, withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease), reduceMotion: ReduceMotion.System })),
      withTiming(0, { duration: 0 }),
    ), -1, false, undefined, ReduceMotion.System);
    return () => cancelAnimation(sweep);
  }, [sweep]);
  const shine = useAnimatedStyle(() => ({ transform: [{ translateX: -100 + sweep.value * (width + 200) }, { rotate: "18deg" }] }));
  const copy = async () => {
    try { await Clipboard.setStringAsync("WELCUPID10"); setCopied(true); setError(false); }
    catch { setError(true); }
  };
  return (
    <View style={styles.wrapper}>
      <View style={styles.card} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        <IceSheen />
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Animated.View style={[styles.shimmer, shine]}><LinearGradient colors={["#FFFFFF00", "#FFFFFFAA", "#FFFFFF00"]} style={{ flex: 1 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} /></Animated.View>
        </View>
        <View style={styles.badge}><Text style={styles.discount}>10%</Text></View>
        <View style={styles.content}>
          <Text style={styles.title}>10% off on your first order</Text>
          <Text selectable style={styles.code}>WELCUPID10</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Copy coupon code WELCUPID10" onPress={copy} style={({ pressed }) => [styles.button, { opacity: pressed ? 0.55 : 1 }]}>
          <Feather name={copied ? "check" : "copy"} size={15} color={FilterIce.accent} />
          <Text style={styles.buttonText}>{copied ? "Copied" : "Copy"}</Text>
        </Pressable>
      </View>
      {error && <Text accessibilityLiveRegion="polite" style={styles.error}>Could not copy. Enter WELCUPID10 at checkout.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#FFFFFF" },
  card: { minHeight: 56, flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 8, borderWidth: 1, borderColor: FilterIce.border, paddingHorizontal: 10, paddingVertical: 5, overflow: "hidden" },
  shimmer: { position: "absolute", top: -40, bottom: -40, width: 55 },
  badge: { width: 36, height: 36, borderRadius: 8, backgroundColor: "#FFFFFFB3", borderWidth: 1, borderColor: FilterIce.selectedBorder, alignItems: "center", justifyContent: "center" },
  discount: { fontSize: 13, fontWeight: "800", color: FilterIce.accent, letterSpacing: -0.5 },
  content: { flex: 1, minWidth: 0 },
  title: { fontSize: 11, fontWeight: "600", lineHeight: 16, color: "#39475B" },
  code: { fontSize: 10, fontWeight: "500", lineHeight: 14, letterSpacing: 0.7, color: FilterIce.accent, marginTop: 1 },
  button: { minHeight: 44, paddingLeft: 10, paddingRight: 2, borderLeftWidth: 1, borderLeftColor: FilterIce.border, flexDirection: "row", alignItems: "center", gap: 5 },
  buttonText: { fontSize: 11, fontWeight: "600", color: FilterIce.accent },
  error: { fontSize: 10, lineHeight: 15, color: FilterIce.accent, marginTop: 4 },
});
