// components/WarrningLable.tsx
//
// Premium "Shop with Confidence" trust/assurance section for Cupid.
// Title / description / card are unchanged — the feature grid is now a
// compact, infinite truck carousel: each stat holds for 2s, then the
// current one exits to the RIGHT while the next enters from the LEFT.
// Truck visual is a looping Lottie animation.

import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import LottieView from "lottie-react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// ─── Brand tokens ───────────────────────────────────────────────────────────
const PRIMARY = "#F0417D";
const PAGE_BG = "#FFF7F8";
const CARD_BG = "transparent";
const BORDER = "#ebc0d0";
const INK = "#1A1A1A";
const SECONDARY = "#707070";
const GREEN = "#22C55E";
const ICON_TINT = "#FDEAF0";
const TRUCK_LOTTIE = require("../assets/lottie/truck.json");

// ─── Carousel timing (ms) ────────────────────────────────────────────────
const HOLD_MS = 2000; // pause on each stat
const SLIDE_MS = 500; // single relay transition — old exits + new enters together

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export interface TrustFeature {
  id: string;
  icon: IconName;
  iconColor?: string;
  title: string;
  subtitle: string;
}

const DEFAULT_FEATURES: TrustFeature[] = [
  {
    id: "secure",
    icon: "shield-check-outline",
    title: "Secure Payments",
    subtitle: "100% Safe Checkout",
  },
  {
    id: "delivery",
    icon: "truck-fast-outline",
    title: "Fast Delivery",
    subtitle: "Quick dispatch across India",
  },
  {
    id: "returns",
    icon: "backup-restore",
    title: "Easy Returns",
    subtitle: "Simple & hassle-free process",
  },
  {
    id: "quality",
    icon: "check-decagram-outline",
    iconColor: GREEN,
    title: "Premium Quality",
    subtitle: "Quality checked before dispatch",
  },
];

const DESCRIPTION =
  "Your happiness is our priority. Every order is backed by secure payments, premium-quality products, fast delivery, and hassle-free support - so you can shop with complete confidence.";

// ─── Truck carousel — single filmstrip, one continuous pan per transition ──
// All stats are laid out side-by-side (each exactly `barWidth` wide) inside
// one row. We only ever move that ONE row's translateX — there's no second
// independently-animated element, so two stats can never occupy the same
// space at the same time.
//
// Direction: each item exits to the RIGHT, the next enters from the LEFT.
// To get that while keeping the visible sequence A→B→C→D→A unchanged, the
// strip is laid out in reverse ([A, D, C, B, A]) and starts already
// scrolled to the far end, animating translateX back toward 0 — that
// increasing (less-negative) translateX is what produces the left-to-right
// motion.
const TruckStatCarousel = memo(({ features }: { features: TrustFeature[] }) => {
  const [barWidth, setBarWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;

  // [A, D, C, B, A] — first real item, then the rest reversed, ending back
  // on a duplicate of the first (for a seamless loop reset).
  const extended = useRef([features[0], ...features.slice().reverse()]).current;

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    setBarWidth(e.nativeEvent.layout.width);
  }, []);

  useEffect(() => {
    if (!barWidth) return;

    const N = features.length;
    const startX = -N * barWidth; // shows extended[N] = A (the real first item)
    translateX.setValue(startX);

    const steps = features.map((_, i) =>
      Animated.sequence([
        Animated.delay(HOLD_MS),
        Animated.timing(translateX, {
          toValue: -(N - (i + 1)) * barWidth,
          duration: SLIDE_MS,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );

    const cycle = Animated.sequence([
      ...steps,
      Animated.timing(translateX, {
        toValue: startX,
        duration: 0,
        useNativeDriver: true,
      }),
    ]);

    const loop = Animated.loop(cycle, { iterations: -1 });
    loop.start();
    return () => loop.stop();
  }, [barWidth, features, translateX]);

  return (
    <View style={styles.statsBar} onLayout={handleLayout}>
      {barWidth > 0 && (
        <Animated.View
          style={[
            styles.stripRow,
            { width: barWidth * extended.length, transform: [{ translateX }] },
          ]}
        >
          {extended.map((feature, idx) => (
            <View
              key={`${feature.id}-${idx}`}
              style={[styles.statSlot, { width: barWidth }]}
            >
              <Text style={styles.statText} numberOfLines={1}>
                <Text style={styles.statTitle}>{feature.title}</Text>
                <Text style={styles.statSubtitle}> · {feature.subtitle}</Text>
              </Text>
              <LottieView
                source={TRUCK_LOTTIE}
                autoPlay
                loop
                style={styles.truckLottie}
              />
            </View>
          ))}
        </Animated.View>
      )}
    </View>
  );
});

// ─── Main component ─────────────────────────────────────────────────────────
interface WarrningLableProps {
  features?: TrustFeature[];
  containerStyle?: ViewStyle;
}

function WarrningLable({
  features = DEFAULT_FEATURES,
  containerStyle,
}: WarrningLableProps) {
  return (
    <View style={[styles.sectionWrap, containerStyle]}>
      <View style={styles.card}>
        <Text style={styles.title}>💖 Shop with Confidence</Text>

        <Text style={styles.description}>{DESCRIPTION}</Text>

        <View style={styles.divider} />

        <TruckStatCarousel features={features} />
      </View>
    </View>
  );
}

export default memo(WarrningLable);

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  sectionWrap: {
    // backgroundColor: PAGE_BG,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 20,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E65A1E",
    letterSpacing: -0.2,
    textShadowColor: "rgba(230, 90, 30, 0.72)",
    textShadowOffset: {
      width: 0.8,
      height: 0.9,
    },
    textShadowRadius: 0.8,
  },
  description: {
    marginTop: 8,
    fontSize: 12.5,
    lineHeight: 19,
    color: SECONDARY,
    fontWeight: "400",
  },
  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginTop: 18,
    marginBottom: 16,
  },

  // Compact announcement-bar-style container for the truck carousel.
  statsBar: {
    height: 46,
    borderRadius: 4,
    backgroundColor: ICON_TINT,
    overflow: "hidden",
  },
  stripRow: {
    flexDirection: "row",
    height: "100%",
  },
  statSlot: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingHorizontal: 6,
  },
  truckLottie: {
    width: 50,
    height: 50,
  },
  statText: {
    flexShrink: 1,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: INK,
  },
  statSubtitle: {
    fontSize: 11,
    color: SECONDARY,
    fontWeight: "400",
  },
});
