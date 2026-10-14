import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { memo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGlassTabGesture } from "@/hooks/useGlassTabGesture";
import { BOTTOM_TABS, type BottomTab } from "@/lib/navigation/bottomTabs";

const INK = "#46546D";
const ACTIVE = "#A13C60";

const GlassTab = memo(function GlassTab({
  tab,
  index,
  selected,
  position,
  visibility,
  onPress,
  badge,
}: {
  tab: BottomTab;
  index: number;
  selected: boolean;
  position: SharedValue<number>;
  visibility: SharedValue<number>;
  onPress: () => void;
  badge: number;
}) {
  const iconStyle = useAnimatedStyle(() => {
    const proximity =
      Math.max(0, 1 - Math.abs(position.value - index)) * visibility.value;
    return {
      transform: [{ translateY: -proximity }, { scale: 1 + proximity * 0.07 }],
    };
  });
  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      Math.max(0, 1 - Math.abs(position.value - index)) * visibility.value,
      [0, 1],
      [INK, ACTIVE],
    ),
  }));
  return (
    <Pressable
      style={styles.tab}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={
        badge > 0 ? `${tab.label}, ${badge} items` : tab.label
      }
      accessibilityHint="Tap to open. You can also slide across the bottom bar."
      testID={`bottom-tab-${tab.label.toLowerCase()}`}
    >
      <Animated.View style={[styles.icon, iconStyle]}>
        {index === 0 ? (
          <Image
            source={require("../../assets/images/notification-icon.png")}
            style={styles.logo}
            contentFit="contain"
          />
        ) : (
          <Ionicons name={tab.icon} size={23} color={selected ? ACTIVE : INK} />
        )}
        {badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
          </View>
        )}
      </Animated.View>
      <Animated.Text
        numberOfLines={1}
        maxFontSizeMultiplier={1.3}
        style={[styles.label, labelStyle]}
      >
        {tab.label}
      </Animated.Text>
    </Pressable>
  );
});

export default function GlassTabBar({
  activeIndex,
  cartCount,
  onSelect,
}: {
  activeIndex: number;
  cartCount: number;
  onSelect: (index: number) => void;
}) {
  const insets = useSafeAreaInsets();
  const { gesture, onLayout, select, width, position, dragging, visibility } =
    useGlassTabGesture(activeIndex, BOTTOM_TABS.length, onSelect);
  const lensStyle = useAnimatedStyle(() => ({
    width: Math.max(0, width.value / BOTTOM_TABS.length - 6),
    opacity: width.value > 0 ? visibility.value : 0,
    transform: [
      { translateX: (position.value * width.value) / BOTTOM_TABS.length },
      { scaleX: 1 + dragging.value * 0.04 },
      { scaleY: 1 + dragging.value * 0.04 },
    ],
  }));

  return (
    <View
      pointerEvents="box-none"
      style={[styles.dock, { bottom: Math.max(insets.bottom, 10) }]}
    >
      <View style={styles.surface}>
        <BlurView
          pointerEvents="none"
          tint="light"
          intensity={Platform.OS === "ios" ? 65 : 35}
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          pointerEvents="none"
          colors={[
            "rgba(255,255,255,0.78)",
            "rgba(239,245,255,0.65)",
            "rgba(255,239,245,0.60)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <GestureDetector gesture={gesture}>
          <View collapsable={false} onLayout={onLayout} style={styles.track}>
            <Animated.View
              pointerEvents="none"
              style={[styles.lens, lensStyle]}
            >
              <LinearGradient
                colors={[
                  "rgba(255,255,255,0.98)",
                  "rgba(222,235,255,0.86)",
                  "rgba(255,221,233,0.80)",
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.shine} />
            </Animated.View>
            {BOTTOM_TABS.map((tab, index) => (
              <GlassTab
                key={tab.route}
                tab={tab}
                index={index}
                selected={index === activeIndex}
                position={position}
                visibility={visibility}
                onPress={() => select(index)}
                badge={tab.label === "Cart" ? cartCount : 0}
              />
            ))}
          </View>
        </GestureDetector>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 9999,
    borderRadius: 30,
    shadowColor: "#39465F",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.14,
    shadowRadius: 15,
    elevation: 10,
  },
  surface: {
    height: 58,
    padding: 5,
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.95)",
    backgroundColor: "rgba(244,247,253,0.52)",
  },
  track: { flex: 1, flexDirection: "row" },
  lens: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 3,
    borderRadius: 23,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.95)",
  },
  shine: {
    position: "absolute",
    top: 1,
    left: 12,
    right: 12,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  tab: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
  },
  icon: {
    width: 28,
    height: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { width: 27, height: 27 },
  label: { fontSize: 10.5, fontWeight: "600", letterSpacing: 0.1 },
  badge: {
    position: "absolute",
    right: -8,
    top: -3,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: "#F87387",
    borderWidth: 1,
    borderColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#FFF", fontSize: 8, fontWeight: "700" },
});
