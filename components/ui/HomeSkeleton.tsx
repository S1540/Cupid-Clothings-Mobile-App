import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { AccessibilityInfo, Animated, StyleSheet, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type SkeletonVariant = "home" | "category" | "product";

function Lines() {
  return <View style={styles.lines}><View style={[styles.block, styles.line]} /><View style={[styles.block, styles.shortLine]} /></View>;
}

/** The real header stays visible; placeholders match the content below it. */
export default function HomeSkeleton({ variant = "home", topInset = 0 }: { variant?: SkeletonVariant; topInset?: number }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const shimmer = useRef(new Animated.Value(0)).current;
  const cardWidth = (width - 44) / 2;
  const heroHeight = Math.round(width * (895 / 1345));
  useEffect(() => {
    let active = true;
    const animation = Animated.loop(Animated.timing(shimmer, {
      toValue: 1, duration: 1100, useNativeDriver: true, isInteraction: false,
    }));
    const update = (reduceMotion: boolean) => {
      if (!active) return;
      animation.stop();
      shimmer.setValue(0);
      if (!reduceMotion && active) animation.start();
    };
    void AccessibilityInfo.isReduceMotionEnabled().then(update).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", update);
    return () => { active = false; animation.stop(); subscription.remove(); };
  }, [shimmer]);

  return (
    <View style={[styles.page, { paddingTop: topInset }]} accessible accessibilityLabel="Loading products" accessibilityState={{ busy: true }}>
      <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {variant === "home" ? (
          <>
            <View style={[styles.hero, { height: heroHeight, paddingTop: insets.top + 112 }]}>
              <View style={[styles.block, styles.heroTag]} />
            </View>
            <View style={styles.dots}><View style={styles.activeDot} /><View style={styles.dot} /><View style={styles.dot} /></View>
            <View style={styles.categories}>
              {[0, 1, 2, 3].map((item) => <View key={item} style={styles.category}>
                <View style={[styles.block, { width: (width - 68) / 4, height: (width - 68) / 4, borderRadius: 50 }]} />
                <View style={[styles.block, styles.categoryLabel]} />
              </View>)}
            </View>
            <View style={[styles.block, styles.offer, { height: width * 0.24 }]} />
            <View style={[styles.block, styles.heading]} />
          </>
        ) : variant === "product" ? (
          <>
            <View style={[styles.block, { width, height: Math.min(width * 1.5, 580), borderRadius: 0 }]} />
            <View style={styles.dots}><View style={styles.activeDot} /><View style={styles.dot} /><View style={styles.dot} /></View>
            <View style={styles.productInfo}><Lines /><View style={[styles.block, styles.price]} /></View>
          </>
        ) : (
          <View style={styles.filters}>
            {[0, 1, 2, 3].map((item) => <View key={item} style={[styles.block, styles.pill, { width: (width - 62) / 4 }]} />)}
          </View>
        )}
        {variant !== "product" && <View style={styles.grid}>
          {[0, 1, 2, 3].map((item) => <View key={item} style={{ width: cardWidth }}>
            <View style={[styles.block, { height: cardWidth * 1.35 }]} /><Lines />
          </View>)}
        </View>}
      </View>
      <Animated.View pointerEvents="none" style={[styles.shimmer, {
        width: width * 0.65, height,
        transform: [{ translateX: shimmer.interpolate({ inputRange: [0, 1], outputRange: [-width, width * 1.6] }) }],
      }]}>
        <LinearGradient colors={["transparent", "rgba(255,255,255,0.5)", "transparent"]}
          start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFillObject} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, overflow: "hidden", backgroundColor: "#FFF9FA" },
  block: { backgroundColor: "#F0E5E8", borderRadius: 10 },
  hero: { backgroundColor: "#F4E8EC", justifyContent: "flex-end", padding: 24 },
  heroTag: { width: "42%", height: 30, backgroundColor: "#E9D9DF", borderRadius: 5 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 5, paddingVertical: 12 },
  activeDot: { width: 18, height: 4, borderRadius: 3, backgroundColor: "#D9BAC5" },
  dot: { width: 5, height: 4, borderRadius: 3, backgroundColor: "#E7DADF" },
  categories: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, marginVertical: 14 },
  category: { alignItems: "center", gap: 10 },
  categoryLabel: { width: 44, height: 8, borderRadius: 4 },
  offer: { margin: 16, marginTop: 6, borderRadius: 12 },
  heading: { height: 16, width: "42%", marginHorizontal: 16, marginBottom: 18 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 16 },
  lines: { gap: 8, paddingTop: 12, paddingBottom: 18 },
  line: { width: "82%", height: 10, borderRadius: 4 },
  shortLine: { width: "42%", height: 10, borderRadius: 4 },
  filters: { flexDirection: "row", gap: 10, padding: 16, paddingVertical: 20 },
  pill: { height: 30, borderRadius: 18 },
  productInfo: { paddingHorizontal: 20 },
  price: { width: 84, height: 22, borderRadius: 5 },
  shimmer: { position: "absolute", top: 0, left: 0 },
});
