import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, ScrollView, View } from "react-native";
const { width } = Dimensions.get("window");

export default function HomeSkeleton() {
  const shimmerAnim = useRef(new Animated.Value(-1)).current;
  // ANIMATION CHANGE: removed slideAnim (translateX entrance) — no longer needed.
  // ANIMATION CHANGE: opacity now starts the fade-in immediately on mount.
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // ANIMATION CHANGE: replaced the parallel [opacity + translateX] entrance
    // with a single opacity-only fade (0 -> 1), premium duration (300ms).
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Shimmer loop is untouched and starts independently/immediately,
    // so it never waits on the fade animation to finish.
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-width, width],
  });

  const SkeletonBox = ({
    height,
    width: boxWidth,
    radius = 10,
    style = {},
  }: any) => (
    <View
      style={[
        {
          overflow: "hidden",
          backgroundColor: "#ececec",
          borderRadius: radius,
          height,
          width: boxWidth,
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          width: "45%",
          height: "100%",
          backgroundColor: "rgba(255,255,255,0.6)",
          transform: [{ translateX }],
        }}
      />
    </View>
  );

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity,
        backgroundColor: "#fff",
        // ANIMATION CHANGE: transform (translateX slide) removed — the view
        // now occupies the full screen immediately, only fading in place.
      }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{
          flex: 1,
          backgroundColor: "#fff",
        }}
      >
        {/* HEADER */}
        <View
          style={{
            backgroundColor: "#fff7f8",
            paddingTop: 50,
            paddingBottom: 14,
          }}
        >
          {/* TOP BANNER */}
          <SkeletonBox height={42} width={"100%"} radius={0} />

          {/* HEADER ROW */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              marginTop: 16,
              gap: 12,
            }}
          >
            <SkeletonBox height={38} width={90} radius={8} />
            <SkeletonBox height={42} width={190} radius={30} />
            <SkeletonBox height={28} width={28} radius={99} />
            <SkeletonBox height={28} width={28} radius={99} />
          </View>

          {/* NAV */}
          <View
            style={{
              flexDirection: "row",
              paddingHorizontal: 16,
              gap: 20,
              marginTop: 18,
            }}
          >
            {[1, 2, 3, 4].map((item) => (
              <SkeletonBox key={item} height={18} width={70} radius={6} />
            ))}
          </View>
        </View>

        {/* FILTER BAR */}
        {/* <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          marginTop: 18,
        }}
      >
        <SkeletonBox height={48} width={130} radius={12} />
        <SkeletonBox height={48} width={130} radius={12} />
      </View> */}

        {/* HERO BANNER */}
        <SkeletonBox
          height={420}
          width={width}
          radius={0}
          style={{
            alignSelf: "center",
            marginTop: 18,
          }}
        />

        {/* DOTS */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
            marginTop: 14,
          }}
        >
          <SkeletonBox height={4} width={8} radius={99} />
          <SkeletonBox height={4} width={28} radius={99} />
        </View>

        {/* SHOP BY CATEGORY */}
        <View
          style={{
            marginTop: 30,
            paddingHorizontal: 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <SkeletonBox height={24} width={180} radius={6} />
            <SkeletonBox height={18} width={50} radius={6} />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: 18,
              marginTop: 22,
            }}
          >
            {[1, 2, 3, 4, 5].map((item) => (
              <View
                key={item}
                style={{
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <SkeletonBox height={78} width={78} radius={99} />
                <SkeletonBox height={14} width={70} radius={5} />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* TRENDING */}
        <View
          style={{
            marginTop: 36,
            paddingHorizontal: 16,
          }}
        >
          <SkeletonBox height={28} width={170} radius={6} />

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 22,
            }}
          >
            {[1, 2].map((item) => (
              <View
                key={item}
                style={{
                  width: "48%",
                }}
              >
                <SkeletonBox height={280} width={"100%"} radius={16} />

                <SkeletonBox
                  height={16}
                  width={"80%"}
                  radius={5}
                  style={{
                    marginTop: 10,
                  }}
                />

                <SkeletonBox
                  height={14}
                  width={"50%"}
                  radius={5}
                  style={{
                    marginTop: 8,
                  }}
                />
              </View>
            ))}
          </View>
        </View>

        {/* BOTTOM SPACE */}
        <View style={{ height: 120 }} />
      </ScrollView>
    </Animated.View>
  );
}
