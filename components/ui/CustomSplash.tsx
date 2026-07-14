import { useEffect, useRef } from "react";
import { Image, StyleSheet, Animated, Easing } from "react-native";

export default function CustomSplash({ onFinish }: { onFinish: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    // Entry: fade + scale in
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.back(0.8)),
        useNativeDriver: true,
      }),
    ]).start();

    // Hold, then crossfade out into the mounted home screen
    const holdTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 600, // within your 500-700ms window
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1.08, // subtle "breathe out" zoom, not a slide
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) onFinish();
      });
    }, 1400);

    return () => clearTimeout(holdTimer);
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        {
          opacity,
          transform: [{ scale }],
        },
      ]}
    >
      <Image
        source={require("../../assets/images/splash.png")}
        style={styles.image}
        resizeMode="cover"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FFF7F8",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    elevation: 9999,
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
