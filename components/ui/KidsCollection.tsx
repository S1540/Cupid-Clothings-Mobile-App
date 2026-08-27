// components/ui/PromoHotDeals.tsx
import React, { useEffect, useMemo } from "react";
import {
  FlatList,
  ImageBackground,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
  interpolateColor,
} from "react-native-reanimated";

// ─────────────────────────────────────────────────────────────────────────
// ANIMATED HEADING (character-by-character premium animation)
// ─────────────────────────────────────────────────────────────────────────
type AnimatedHeadingProps = {
  text: string;
  fontSize?: number;
  activeColor?: string;
  inactiveColor?: string;
  letterDuration?: number;
  fontWeight?:
    "400" | "500" | "600" | "700" | "800" | "900" | "normal" | "bold";
  letterSpacing?: number;
  style?: any;
};

function AnimatedLetter({
  char,
  index,
  total,
  progress,
  fontSize,
  activeColor,
  inactiveColor,
  fontWeight,
  letterSpacing,
}: {
  char: string;
  index: number;
  total: number;
  progress: ReturnType<typeof useSharedValue<number>>;
  fontSize: number;
  activeColor: string;
  inactiveColor: string;
  fontWeight: AnimatedHeadingProps["fontWeight"];
  letterSpacing: number;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    "worklet";
    const rawDistance = Math.abs(progress.value - index);
    const distance = Math.min(rawDistance, total - rawDistance);

    const scale = interpolate(distance, [0, 1], [1.35, 1], "clamp");
    const colorProgress = interpolate(distance, [0, 1], [0, 1], "clamp");
    const color = interpolateColor(
      colorProgress,
      [0, 1],
      [activeColor, inactiveColor],
    );

    return {
      transform: [{ scale }],
      color,
    };
  });

  return (
    <Animated.Text
      style={[
        {
          fontSize,
          fontWeight,
          letterSpacing,
          includeFontPadding: false,
        },
        animatedStyle,
      ]}
    >
      {char === " " ? "\u00A0" : char}
    </Animated.Text>
  );
}

export function AnimatedHeading({
  text,
  fontSize = 20,
  activeColor = "#F87387",
  inactiveColor = "#1c1c1c",
  letterDuration = 220,
  fontWeight = "800",
  letterSpacing = 1,
  style,
}: AnimatedHeadingProps) {
  const letters = useMemo(() => text.split(""), [text]);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(letters.length, {
        duration: letters.length * letterDuration,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [letters.length, letterDuration]);

  return (
    <View style={[styles.headingRow, style]}>
      {letters.map((char, i) => (
        <AnimatedLetter
          key={`${char}-${i}`}
          char={char}
          index={i}
          total={letters.length}
          progress={progress}
          fontSize={fontSize}
          activeColor={activeColor}
          inactiveColor={inactiveColor}
          fontWeight={fontWeight}
          letterSpacing={letterSpacing}
        />
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PROMO COLLECTIONS SECTION (background auto-grows with content)
// ─────────────────────────────────────────────────────────────────────────
export type KidsCollectionItem = {
  id: number | string;
  title: string;
  handle: string;
  image: string;
};

type PromoHotDealsProps = {
  heading?: string;
  backgroundImage: string;
  data: KidsCollectionItem[];
  cardWidth?: number;
  cardHeight?: number;
  activeColor?: string;
  inactiveColor?: string;
  /**
   * Pass any extra rows/sections here (e.g. a second FlatList, more cards, etc.)
   * They render INSIDE the same ImageBackground, so the bg auto-stretches
   * to fit whatever you add — no fixed height needed anywhere.
   */
  children?: React.ReactNode;
};

export default function KidsCollections({
  //   heading = `HOT DEALS `,
  backgroundImage,
  data,
  cardWidth = 180,
  cardHeight = 320,
  children,
}: PromoHotDealsProps) {
  return (
    <ImageBackground
      source={{ uri: backgroundImage }}
      style={styles.container}
      imageStyle={styles.bgImage}
    >
      {/* Content wrapper: no fixed height anywhere below.
          ImageBackground will always match this View's natural height. */}
      <View style={styles.contentWrap}>
        {/* <View style={styles.headingWrap}>
          <AnimatedHeading
            text={heading}
            fontSize={22}
            activeColor={activeColor}
            inactiveColor={inactiveColor}
          />
        </View> */}

        <FlatList
          horizontal
          data={data}
          keyExtractor={(item) => item.id.toString()}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                router.push(`/product/${item.handle}`);
              }}
              style={[styles.card, { width: cardWidth, marginRight: 0 }]}
            >
              <Image
                source={{ uri: item.image }}
                style={{
                  width: cardWidth,
                  height: cardHeight,
                }}
                contentFit="cover"
              />
            </Pressable>
          )}
        />

        {/* Anything passed as children (extra row of cards, another
            FlatList, banner, etc.) renders here — bg grows automatically */}
        {children}
      </View>
    </ImageBackground>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  container: {
    width: "100%",
    marginBottom: 8,
    overflow: "hidden",
  },
  bgImage: {
    borderRadius: 0,
  },
  contentWrap: {
    paddingBottom: 20,
  },
  headingWrap: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  listContent: {
    paddingHorizontal: 0,
  },
  card: {
    overflow: "hidden",
    backgroundColor: "transparent",
  },
});
