import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, ScrollView, View } from "react-native";

const { width } = Dimensions.get("window");

const CartSkeleton = () => {
  const shimmerAnim = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1100,
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
    radius = 12,
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
          backgroundColor: "rgba(255,255,255,0.65)",
          transform: [{ translateX }],
        }}
      />
    </View>
  );

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={{
        flex: 1,
        backgroundColor: "#f6f6f6",
      }}
      contentContainerStyle={{
        padding: 16,
        paddingTop: 18,
        paddingBottom: 40,
      }}
    >
      {/* DELIVERY BOX */}
      <View
        style={{
          backgroundColor: "#fff7f8",
          borderRadius: 10,
          borderWidth: 0.5,
          borderColor: "#f0d7de",
          padding: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 18,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <SkeletonBox height={42} width={42} radius={12} />

          <View>
            <SkeletonBox height={16} width={140} radius={6} />

            <SkeletonBox
              height={12}
              width={110}
              radius={6}
              style={{
                marginTop: 8,
              }}
            />
          </View>
        </View>

        <SkeletonBox height={40} width={92} radius={10} />
      </View>

      {/* HEADING */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 18,
        }}
      >
        <SkeletonBox height={28} width={120} radius={6} />

        <SkeletonBox height={24} width={70} radius={99} />
      </View>

      {/* CART ITEMS */}
      {[1, 2, 3].map((item) => (
        <View
          key={item}
          style={{
            backgroundColor: "#fff",
            borderRadius: 10,
            borderWidth: 0.5,
            borderColor: "#f0f0f0",
            overflow: "hidden",
            marginBottom: 14,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              padding: 12,
              gap: 12,
            }}
          >
            {/* IMAGE */}
            <SkeletonBox height={150} width={100} radius={8} />

            {/* RIGHT CONTENT */}
            <View
              style={{
                flex: 1,
                justifyContent: "space-between",
              }}
            >
              <View>
                {/* TITLE */}
                <SkeletonBox height={16} width={"92%"} radius={5} />

                <SkeletonBox
                  height={16}
                  width={"72%"}
                  radius={5}
                  style={{
                    marginTop: 8,
                  }}
                />

                {/* SIZE */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    marginTop: 14,
                  }}
                >
                  <SkeletonBox height={32} width={74} radius={7} />

                  <SkeletonBox height={14} width={80} radius={6} />
                </View>

                {/* PRICE */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    marginTop: 16,
                  }}
                >
                  <SkeletonBox height={28} width={70} radius={6} />

                  <SkeletonBox height={18} width={54} radius={6} />
                </View>

                {/* OFFER */}
                <SkeletonBox
                  height={16}
                  width={150}
                  radius={6}
                  style={{
                    marginTop: 14,
                  }}
                />
              </View>

              {/* BUTTONS */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 14,
                }}
              >
                <SkeletonBox height={40} width={120} radius={8} />

                <SkeletonBox height={22} width={80} radius={6} />
              </View>
            </View>
          </View>

          {/* DELIVERY STRIP */}
          <View
            style={{
              borderTopWidth: 0.5,
              borderTopColor: "#f2f2f2",
              paddingHorizontal: 12,
              paddingVertical: 10,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              backgroundColor: "#fcfcfc",
            }}
          >
            <SkeletonBox height={18} width={18} radius={99} />

            <SkeletonBox height={14} width={220} radius={6} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

export default CartSkeleton;
