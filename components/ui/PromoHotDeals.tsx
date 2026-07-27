// components/ui/PromoHotDeals.tsx
import React, { useEffect, useMemo } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
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
// ANIMATED HEADING (character-by-character premium animation) — unchanged
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
  inactiveColor = "#555",
  letterDuration = 180,
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
// STATIC PASTEL GRADIENT BACKGROUND
// Clean, premium, no movement — just a soft layered gradient.
// ─────────────────────────────────────────────────────────────────────────
function StaticGradientBackground() {
  return (
    <View style={styles.gradientLayer}>
      <LinearGradient
        colors={["#A9C3F566", "#E4E0FF", "#FBEAF2", "#FFF8FA"]}
        locations={[0, 0.4, 0.72, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Soft white overlay — lightens & unifies the colors */}
      <LinearGradient
        colors={[
          "rgba(255,255,255,0.45)",
          "rgba(255,255,255,0.15)",
          "rgba(255,255,255,0.35)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PROMO COLLECTIONS SECTION (background auto-grows with content)
// ─────────────────────────────────────────────────────────────────────────
export type PromoCollectionItem = {
  id: number | string;
  title: string;
  handle: string;
  image: string;
};

type PromoHotDealsProps = {
  heading?: string;
  backgroundImage: string;
  data: PromoCollectionItem[];
  cardWidth?: number;
  cardHeight?: number;
  activeColor?: string;
  inactiveColor?: string;
  children?: React.ReactNode;
};

export default function PromoHotDeals({
  heading = "",
  backgroundImage,
  data,
  cardWidth = 180,
  cardHeight = 280,
  activeColor = "#F87387",
  inactiveColor = "#555",
  children,
}: PromoHotDealsProps) {
  void backgroundImage;

  return (
    <View style={styles.container}>
      <StaticGradientBackground />

      <View style={styles.contentWrap}>
        <View style={styles.headingWrap}>
          <AnimatedHeading
            text={heading}
            fontSize={22}
            activeColor={activeColor}
            inactiveColor={inactiveColor}
          />
        </View>

        <FlatList
          horizontal
          data={data}
          keyExtractor={(item) => item.id.toString()}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/category/${item.handle}`)}
              style={[styles.card, { width: cardWidth, marginRight: 6 }]}
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

        {children}
      </View>
    </View>
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
    marginBottom: 20,
    overflow: "hidden",
    position: "relative",
  },
  gradientLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  contentWrap: {
    paddingVertical: 20,
  },
  headingWrap: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  card: {
    overflow: "hidden",
    backgroundColor: "#00000010",
  },
});
