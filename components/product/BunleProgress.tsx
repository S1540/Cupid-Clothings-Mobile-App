// components/product/BundleProgress.tsx
import React, { useEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

// ─────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────
type BundleProgressProps = {
  currentItemsInCart: number;
  maxItems: number;
  accentColor?: string;
  trackColor?: string;
  discountLabel?: string;
  style?: any;
};

type StepState = "completed" | "active" | "pending";

const CIRCLE_SIZE = 24;
const RING_SIZE = CIRCLE_SIZE + 12;

// ─────────────────────────────────────────────────────────────────────────
// DISCOUNT BADGE — highlighted, with animated shimmer sweep layer
// ─────────────────────────────────────────────────────────────────────────
function DiscountBadge({ label }: { label: string }) {
  const shimmerX = useSharedValue(-1);

  useEffect(() => {
    shimmerX.value = withRepeat(
      withSequence(
        withDelay(
          1200,
          withTiming(1, {
            duration: 950,
            easing: Easing.inOut(Easing.ease),
          }),
        ),
        withTiming(-1, { duration: 0 }),
      ),
      -1,
      false,
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value * 90 }, { rotate: "18deg" }],
  }));

  return (
    <View style={styles.discountBadge}>
      {/* animated shimmer sweep overlay */}
      <View pointerEvents="none" style={styles.discountShimmerClip}>
        <Animated.View style={[styles.discountShimmerBar, shimmerStyle]}>
          <LinearGradient
            colors={[
              "transparent",
              "#ffffff99",
              "#ffffffcc",
              "#ffffff99",
              "transparent",
            ]}
            locations={[0, 0.35, 0.5, 0.65, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      </View>

      <Text style={styles.discountBadgeText}>{label}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// STEP CIRCLE (with rotating glow ring + orbiting sparkle when active)
// Kept strictly black/gray regardless of the card's coupon-style theme.
// ─────────────────────────────────────────────────────────────────────────
function StepCircle({
  index,
  state,
  accentColor,
}: {
  index: number;
  state: StepState;
  accentColor: string;
}) {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (state === "completed") {
      scale.value = withSequence(
        withTiming(1.22, { duration: 140, easing: Easing.out(Easing.ease) }),
        withSpring(1, { damping: 7, stiffness: 180 }),
      );
    } else if (state === "active") {
      scale.value = withSpring(1.05, { damping: 8, stiffness: 150 });
    } else {
      scale.value = withTiming(1, { duration: 200 });
    }
  }, [state]);

  useEffect(() => {
    if (state === "active") {
      rotation.value = 0;
      rotation.value = withRepeat(
        withTiming(360, { duration: 2600, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      rotation.value = 0;
    }
  }, [state]);

  const circleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={styles.stepWrap}>
      {state === "active" && (
        <>
          <Animated.View
            style={[
              styles.glowRing,
              rotateStyle,
              {
                borderTopColor: accentColor,
                borderRightColor: `${accentColor}55`,
              },
            ]}
          />
          <Animated.View style={[styles.sparkleOrbit, rotateStyle]}>
            <View
              style={[styles.sparkleDot, { backgroundColor: accentColor }]}
            />
          </Animated.View>
        </>
      )}

      <Animated.View
        style={[
          styles.circle,
          circleAnimatedStyle,
          state === "completed" && {
            backgroundColor: accentColor,
            borderColor: accentColor,
          },
          state === "active" && {
            backgroundColor: "#fff",
            borderColor: accentColor,
          },
          state === "pending" && {
            backgroundColor: "#fff",
            borderColor: "#e2e2e2",
          },
        ]}
      >
        {state === "completed" ? (
          <View style={styles.completedInnerDot} />
        ) : (
          <Text
            style={[
              styles.stepNumber,
              { color: state === "active" ? accentColor : "#bbb" },
            ]}
          >
            {index}
          </Text>
        )}
      </Animated.View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SEGMENT (connector line between two circles, animates fill on change)
// ─────────────────────────────────────────────────────────────────────────
function Segment({
  filled,
  accentColor,
  trackColor,
}: {
  filled: boolean;
  accentColor: string;
  trackColor: string;
}) {
  const progress = useSharedValue(filled ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(filled ? 1 : 0, {
      duration: 550,
      easing: Easing.out(Easing.cubic),
    });
  }, [filled]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${interpolate(progress.value, [0, 1], [0, 100])}%`,
  }));

  return (
    <View style={[styles.segmentTrack, { backgroundColor: trackColor }]}>
      <Animated.View
        style={[
          styles.segmentFill,
          fillStyle,
          { backgroundColor: accentColor },
        ]}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────
export default function BundleProgress({
  currentItemsInCart,
  maxItems,
  accentColor = "#4A4A4A",
  trackColor = "#00000014",
  discountLabel,
  style,
}: BundleProgressProps) {
  const clampedCurrent = Math.max(0, Math.min(currentItemsInCart, maxItems));
  const isCompleted = clampedCurrent >= maxItems;
  const remaining = Math.max(maxItems - clampedCurrent, 0);

  const steps = useMemo(
    () => Array.from({ length: maxItems }, (_, i) => i + 1),
    [maxItems],
  );

  // Auto-derive the discount label if not explicitly passed:
  // Pack of 2 → 5% OFF, Pack of 3 → 10% OFF
  const resolvedDiscountLabel = useMemo(() => {
    if (discountLabel) return discountLabel;
    if (maxItems === 2) return "5% OFF";
    if (maxItems === 3) return " UPTO 10% OFF";
    return null;
  }, [discountLabel, maxItems]);

  const getStepState = (stepIndex: number): StepState => {
    if (clampedCurrent >= stepIndex) return "completed";
    if (stepIndex === clampedCurrent + 1) return "active";
    return "pending";
  };

  const containerScale = useSharedValue(1);
  useEffect(() => {
    if (isCompleted) {
      containerScale.value = withSequence(
        withTiming(1.012, { duration: 160, easing: Easing.out(Easing.ease) }),
        withSpring(1, { damping: 9, stiffness: 170 }),
      );
    }
  }, [isCompleted]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: containerScale.value }],
  }));

  const message = useMemo(() => {
    if (isCompleted) return "Congratulations! Bundle Offer Unlocked 🎉";

    if (clampedCurrent === 0) {
      return `Buy 2 item${maxItems > 1 ? "s" : ""} to unlock 5% Off Bundle Discount\nOffer Auto Apply On Checkout`;
    }

    if (remaining === 1) {
      const prefix = maxItems === 2 ? "Great!" : "Almost there!";
      return `${prefix} Add 1 more item to unlock 10% Bundle Discount\nOffer Auto Apply On Checkout`;
    }

    return `Add 1 more item to unlock 5% or Add 2 more items to unlock 10% Bundle Discount\nOffer Auto Apply On Checkout`;
  }, [clampedCurrent, maxItems, remaining, isCompleted]);

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle, style]}>
      <View style={styles.topRow}>
        <View style={styles.titleGroup}>
          <Text style={styles.title}>Save more with Bundle Offer</Text>
          {resolvedDiscountLabel && (
            <DiscountBadge label={resolvedDiscountLabel} />
          )}
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>
            {clampedCurrent}/{maxItems}
          </Text>
        </View>
      </View>

      <View style={styles.stepsRow}>
        {steps.map((stepIndex, i) => (
          <React.Fragment key={stepIndex}>
            <StepCircle
              index={stepIndex}
              state={getStepState(stepIndex)}
              accentColor={accentColor}
            />
            {i < steps.length - 1 && (
              <Segment
                filled={clampedCurrent >= stepIndex}
                accentColor={accentColor}
                trackColor={trackColor}
              />
            )}
          </React.Fragment>
        ))}
      </View>

      <Text
        style={[
          styles.message,
          isCompleted && { color: "#111", fontWeight: "700" },
        ]}
      >
        {message}
      </Text>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// STYLES
// Card container mirrors the coupon card exactly (bg / border / shadow).
// Circles, ring, sparkle, and progress fill stay black/gray on purpose.
// ─────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    // ── same as couponCard ──
    backgroundColor: "#F6F9FF",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#759EF04A",
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: "#759EF0",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 2,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  titleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    // ── same as couponTitle ──
    fontSize: 13.5,
    fontWeight: "700",
    color: "#1c2b57",
  },
  countBadge: {
    // ── same as codeChip ──
    borderWidth: 1,
    borderColor: "#759EF0",
    borderStyle: "dashed",
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    backgroundColor: "#759EF014",
  },
  countBadgeText: {
    // ── same as codeChipText ──
    fontSize: 10.5,
    fontWeight: "800",
    color: "#4A6FD6",
    letterSpacing: 0.6,
  },
  // ── Discount badge (highlighted, animated shimmer) ──
  discountBadge: {
    backgroundColor: "#22a55b",
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    overflow: "hidden",
  },
  discountBadgeText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.4,
  },
  discountShimmerClip: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    borderRadius: 4,
  },
  discountShimmerBar: {
    position: "absolute",
    top: -30,
    left: -20,
    width: 18,
    height: 90,
  },
  stepsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  completedInnerDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#fff",
  },
  stepNumber: {
    fontSize: 11,
    fontWeight: "700",
  },
  glowRing: {
    position: "absolute",
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2,
    borderColor: "transparent",
  },
  sparkleOrbit: {
    position: "absolute",
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
  },
  sparkleDot: {
    position: "absolute",
    top: -2,
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  segmentTrack: {
    flex: 1,
    height: 4,
    borderRadius: 4.5,
    overflow: "hidden",
  },
  segmentFill: {
    height: "100%",
    borderRadius: 4.5,
  },
  message: {
    // ── same as couponDescription ──
    fontSize: 11.5,
    color: "#6b7a99",
    lineHeight: 15,
    marginTop: 8,
  },
});
