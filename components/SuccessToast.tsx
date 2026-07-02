import React, { useEffect, useRef } from "react";
import { Animated, Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";

type Props = {
  visible: boolean;
  text?: string;
  pathname?: any;
  linkText?: string;
};

const SuccessToast = ({
  visible,
  text = "Added to Bag Successfully",
  pathname = "/Cart",
  linkText = "Go to Bag",
}: Props) => {
  const slideAnim = useRef(new Animated.Value(200)).current;
  const router = useRouter();

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.spring(slideAnim, {
          toValue: -40,
          useNativeDriver: true,
          friction: 8,
          tension: 70,
        }),

        Animated.delay(1400),

        Animated.timing(slideAnim, {
          toValue: 200,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Animated.View
      style={{
        position: "absolute",
        bottom: 40,
        left: 16,
        right: 16,
        zIndex: 99999,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <View
        style={{
          backgroundColor: "#111",
          borderRadius: 14,
          paddingVertical: 14,
          paddingHorizontal: 16,
          flexDirection: "row-reverse",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          shadowColor: "#000",
          shadowOpacity: 0.18,
          shadowRadius: 10,
          elevation: 10,
        }}
      >
        <Pressable
          onPress={() => router.push(pathname)}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 6,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#F87387", fontSize: 15, fontWeight: "700" }}>
            {linkText}
          </Text>
        </Pressable>

        <Text
          style={{
            flex: 1,
            color: "#fff",
            fontSize: 15,
            fontWeight: "700",
          }}
        >
          {text}
        </Text>
      </View>
    </Animated.View>
  );
};

export default SuccessToast;
