// components/ui/ComfortCategoryGrid.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  withSpring,
  Easing,
} from "react-native-reanimated";

// ─────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────
export type CategoryItem = {
  id: string;
  title: string;
  handle: string;
  image: string;
  subtitle?: string;
  buttonText?: string;
  icon?: React.ReactNode;
};

interface Props {
  title: string;
  subtitle: string;
  data: CategoryItem[];
  onPress: (item: CategoryItem) => void;
  onPressViewAll?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────
// PER-CARD THEME (cycles through reference's pink / purple / pink / orange)
// ─────────────────────────────────────────────────────────────────────────
const CARD_THEMES = [
  { bg: "#FDE7EF", button: "#F0417D", buttonBg: "#FCE1EB" },
  { bg: "#EFE7FB", button: "#7C3FD6", buttonBg: "#E7DCF9" },
  { bg: "#FDE9EF", button: "#F0417D", buttonBg: "#FCE1EB" },
  { bg: "#FDECD8", button: "#E08A1F", buttonBg: "#FBE4C2" },
];

// ─────────────────────────────────────────────────────────────────────────
// VIEWPORT VISIBILITY HOOK
// Polls the container's position (via measureInWindow) until it enters the
// visible screen area, then flips a boolean ONCE and stops polling.
// ─────────────────────────────────────────────────────────────────────────
function useEnterViewportOnce(ref: React.RefObject<View | null>) {
  const [hasEntered, setHasEntered] = useState(false);
  const hasEnteredRef = useRef(false);

  useEffect(() => {
    if (hasEnteredRef.current) return;

    const screenHeight = Dimensions.get("window").height;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    const check = () => {
      if (cancelled || hasEnteredRef.current) return;
      const node = ref.current as any;
      if (!node || typeof node.measureInWindow !== "function") return;

      node.measureInWindow((_x: number, y: number, _w: number, h: number) => {
        if (cancelled || hasEnteredRef.current) return;
        const isVisible = y < screenHeight && y + h > 0;
        if (isVisible) {
          hasEnteredRef.current = true;
          setHasEntered(true);
          if (intervalId) clearInterval(intervalId);
        }
      });
    };

    const startTimeout = setTimeout(() => {
      check();
      intervalId = setInterval(check, 120);
    }, 16);

    return () => {
      cancelled = true;
      clearTimeout(startTimeout);
      if (intervalId) clearInterval(intervalId);
    };
  }, [ref]);

  return hasEntered;
}
// ─────────────────────────────────────────────────────────────────────────
// SINGLE CARD
// ─────────────────────────────────────────────────────────────────────────
const CategoryCard = React.memo(
  ({
    item,
    theme,
    cardWidth,
    onPress,
  }: {
    item: CategoryItem;
    theme: (typeof CARD_THEMES)[number];
    cardWidth: number;
    onPress: (item: CategoryItem) => void;
  }) => {
    const imageScale = useSharedValue(1);
    const cardScale = useSharedValue(1);

    const handlePressIn = useCallback(() => {
      imageScale.value = withTiming(1.06, {
        duration: 220,
        easing: Easing.out(Easing.ease),
      });
      cardScale.value = withTiming(0.98, {
        duration: 220,
        easing: Easing.out(Easing.ease),
      });
    }, []);

    const handlePressOut = useCallback(() => {
      imageScale.value = withTiming(1, {
        duration: 220,
        easing: Easing.out(Easing.ease),
      });
      cardScale.value = withTiming(1, {
        duration: 220,
        easing: Easing.out(Easing.ease),
      });
    }, []);

    const imageAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: imageScale.value }],
    }));

    const cardAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: cardScale.value }],
    }));

    return (
      <Animated.View
        style={[
          styles.card,
          { width: cardWidth, backgroundColor: theme.bg },
          cardAnimatedStyle,
        ]}
      >
        <Pressable
          onPress={() => onPress(item)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.pressable}
        >
          {/* Image with rounded top corners + slight zoom on press */}
          <View style={styles.imageWrap}>
            <Animated.View style={imageAnimatedStyle}>
              <Image
                source={{ uri: item.image }}
                style={styles.image}
                contentFit="cover"
                transition={150}
              />
            </Animated.View>

            {/* Floating circular icon, top-right */}
            {item.icon && <View style={styles.iconCircle}>{item.icon}</View>}
          </View>

          {/* Text content */}
          <View style={styles.textWrap}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title.toUpperCase()}
            </Text>
            {!!item.subtitle && (
              <Text style={styles.cardSubtitle} numberOfLines={1}>
                {item.subtitle}
              </Text>
            )}
          </View>

          {/* CTA button — pinned to bottom */}
          <View style={styles.ctaRow}>
            <View
              style={[styles.ctaButton, { backgroundColor: theme.buttonBg }]}
            >
              <Text style={[styles.ctaText, { color: theme.button }]}>
                {item.buttonText ?? "SHOP NOW"}
              </Text>
              <Feather name="chevron-right" size={14} color={theme.button} />
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  },
);

// ─────────────────────────────────────────────────────────────────────────
// ANIMATED HEADER TITLE — "pop" effect (scale + opacity), now triggered
// ONLY when the component enters the viewport (instead of on mount).
// ─────────────────────────────────────────────────────────────────────────
function AnimatedTitle({ title, play }: { title: string; play: boolean }) {
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);
  const hasPlayed = useRef(false);

  useEffect(() => {
    if (!play || hasPlayed.current) return;
    hasPlayed.current = true;

    opacity.value = withTiming(1, {
      duration: 260,
      easing: Easing.out(Easing.ease),
    });
    scale.value = withSequence(
      withTiming(1.08, { duration: 220, easing: Easing.out(Easing.ease) }),
      withSpring(1, { damping: 7, stiffness: 160 }),
    );
  }, [play]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.Text style={[styles.title, animatedStyle]} numberOfLines={1}>
      {title}
    </Animated.Text>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// MAIN GRID COMPONENT
// ─────────────────────────────────────────────────────────────────────────
function ComfortCategoryGrid({
  title,
  subtitle,
  data,
  onPress,
  onPressViewAll,
}: Props) {
  const { width } = useWindowDimensions();
  const containerRef = useRef<View>(null);
  const hasEntered = useEnterViewportOnce(containerRef);

  const HORIZONTAL_PADDING = 16;
  const GAP = 6;
  const cardWidth = (width - HORIZONTAL_PADDING * 2 - GAP) / 2;

  const keyExtractor = useCallback((item: CategoryItem) => item.id, []);

  const renderItem = useCallback(
    ({ item, index }: { item: CategoryItem; index: number }) => (
      <CategoryCard
        item={item}
        theme={CARD_THEMES[index % CARD_THEMES.length]}
        cardWidth={cardWidth}
        onPress={onPress}
      />
    ),
    [cardWidth, onPress],
  );

  return (
    <View ref={containerRef} style={styles.container}>
      {/* Static top-to-center gradient — fades gradually, no animation */}
      <LinearGradient
        colors={["#759EF01A", "#759EF01A", "#759EF000"]}
        locations={[0, 0.55, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.topGradient}
        pointerEvents="none"
      />

      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <AnimatedTitle title={title} play={hasEntered} />
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>

        {/* ss */}
      </View>

      {/* 2-column grid */}
      <FlatList
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        numColumns={2}
        scrollEnabled={false}
        columnWrapperStyle={{ gap: GAP, paddingHorizontal: HORIZONTAL_PADDING }}
        contentContainerStyle={{ gap: 16, paddingTop: 16 }}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        removeClippedSubviews
      />
    </View>
  );
}

export default React.memo(ComfortCategoryGrid);

// ─────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 16,
    position: "relative",
  },
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1c1c1c",
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 11,
    color: "#888",
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingTop: 4,
  },
  viewAllText: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#7C3FD6",
  },
  card: {
    overflow: "hidden",
    paddingBottom: 12,
    marginBottom: 6,
  },
  pressable: {
    flex: 1,
  },
  imageWrap: {
    width: "100%",
    aspectRatio: 0.95,
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  iconCircle: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    opacity: 0.7,
    borderRadius: 17,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  textWrap: {
    paddingHorizontal: 1,
    paddingTop: 10,
  },
  cardTitle: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#1c1c1c",
    letterSpacing: 0.2,
  },
  cardSubtitle: {
    fontSize: 11.5,
    color: "#6b6b6b",
    lineHeight: 15,
    marginTop: 3,
  },
  ctaRow: {
    paddingHorizontal: 0,
    marginTop: 10,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 2,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  ctaText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});
