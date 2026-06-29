import React, { useEffect, useRef } from "react";
import { View, Animated, Dimensions, ScrollView } from "react-native";

const { width } = Dimensions.get("window");

export default function Loader() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  const Bone = ({
    w,
    h,
    radius = 6,
    style = {},
  }: {
    w: number | string;
    h: number;
    radius?: number;
    style?: any;
  }) => (
    <View
      style={[
        {
          width: w as any,
          height: h,
          borderRadius: radius,
          backgroundColor: "#ebebeb",
          overflow: "hidden",
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: width,
          transform: [{ translateX }],
          // background: "transparent",
        }}
      >
        <View
          style={{
            flex: 1,
            flexDirection: "row",
          }}
        >
          <View style={{ flex: 1, backgroundColor: "#ebebeb" }} />
          <View
            style={{
              width: 80,
              backgroundColor: "rgba(255,255,255,0.55)",
              transform: [{ skewX: "-20deg" }],
            }}
          />
          <View style={{ flex: 1, backgroundColor: "#ebebeb" }} />
        </View>
      </Animated.View>
    </View>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#fff" }}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
    >
      {/* Main image — full width, no side gaps */}
      <Bone w={width} h={520} radius={0} />

      {/* Thumbnail strip */}
      <View
        style={{
          flexDirection: "row",
          gap: 8,
          paddingHorizontal: 14,
          paddingVertical: 12,
          backgroundColor: "#fff",
        }}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <Bone key={i} w={58} h={58} radius={8} />
        ))}
      </View>

      {/* Info */}
      <View style={{ paddingHorizontal: 16, gap: 14 }}>
        {/* Delivery pill */}
        <Bone w={220} h={32} radius={6} />

        {/* Title */}
        <View style={{ gap: 8 }}>
          <Bone w="92%" h={17} radius={4} />
          <Bone w="65%" h={17} radius={4} />
        </View>

        {/* Short desc */}
        <View style={{ gap: 6 }}>
          <Bone w="100%" h={12} radius={3} />
          <Bone w="80%" h={12} radius={3} />
          <Bone w="55%" h={12} radius={3} />
        </View>

        {/* Price row */}
        <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
          <Bone w={90} h={28} radius={4} />
          <Bone w={60} h={20} radius={4} />
          <Bone w={55} h={20} radius={4} />
        </View>

        {/* Offer line */}
        <Bone w={180} h={12} radius={3} />

        <View style={{ height: 0.5, backgroundColor: "#f0f0f0" }} />

        {/* Size label */}
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Bone w={100} h={14} radius={3} />
          <Bone w={70} h={14} radius={3} />
        </View>

        {/* Size chips */}
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {[44, 36, 44, 44, 50, 36, 44].map((w, i) => (
            <Bone key={i} w={w} h={40} radius={6} />
          ))}
        </View>

        <View style={{ height: 0.5, backgroundColor: "#f0f0f0" }} />

        {/* Sold by */}
        <Bone w="100%" h={64} radius={10} />

        {/* Product details card */}
        <Bone w="100%" h={52} radius={10} />

        {/* Instructions */}
        <Bone w="100%" h={130} radius={10} />
      </View>
    </ScrollView>
  );
}
