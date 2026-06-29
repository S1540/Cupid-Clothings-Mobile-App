import React, { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";

const CircleLoader = () => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        backgroundColor: "rgba(255,255,255,0.5)",
        backdropFilter: "blur(100px)",
      }}
    >
      <Animated.View
        style={{
          width: 42,
          height: 42,
          borderRadius: 999,
          borderWidth: 4,
          borderTopColor: "#ff4f7b",
          borderRightColor: "#ff4f7b",
          borderBottomColor: "#ffd3de",
          borderLeftColor: "#ffd3de",
          transform: [{ rotate: spin }],
        }}
      />
    </View>
  );
};

export default CircleLoader;
