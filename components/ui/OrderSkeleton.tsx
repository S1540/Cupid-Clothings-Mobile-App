// Skeleton loader for Orders list — add inside Orders.tsx (or its own component if you prefer)
import React, { useEffect, useRef } from "react";
import { View, Animated, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Shimmer = ({ style }: { style: any }) => {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={[
        { backgroundColor: "#EFEFEF", borderRadius: 6 },
        style,
        { opacity },
      ]}
    />
  );
};

const OrderRowSkeleton = () => (
  <View
    style={{
      flexDirection: "row",
      gap: 14,
      paddingHorizontal: 20,
      paddingVertical: 18,
      borderBottomWidth: 1,
      borderBottomColor: "#F4F4F4",
    }}
  >
    {/* Thumbnail */}
    <Shimmer style={{ width: 64, height: 72, borderRadius: 12 }} />

    {/* Info */}
    <View style={{ flex: 1, justifyContent: "center", gap: 8 }}>
      <Shimmer style={{ width: "70%", height: 14 }} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
        <Shimmer style={{ width: 6, height: 6, borderRadius: 3 }} />
        <Shimmer style={{ width: 70, height: 12 }} />
        <Shimmer style={{ width: 90, height: 12 }} />
      </View>
    </View>

    {/* Chevron placeholder */}
    <View style={{ justifyContent: "center" }}>
      <Shimmer style={{ width: 6, height: 12 }} />
    </View>
  </View>
);

export const OrdersSkeleton = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 14,
          borderBottomWidth: 8,
          borderBottomColor: "#FAFAFA",
        }}
      >
        <Shimmer style={{ width: 110, height: 20 }} />
      </View>

      {/* Rows */}
      {[1, 2, 3, 4, 5].map((i) => (
        <OrderRowSkeleton key={i} />
      ))}
    </View>
  );
};
