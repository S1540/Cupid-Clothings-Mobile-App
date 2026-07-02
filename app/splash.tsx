import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";

export default function SplashScreen() {
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),

      Animated.timing(opacity, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      router.replace("/(tabs)");
    }, 2300);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <Animated.Image
        source={require("../assets/images/splash.png")}
        style={[
          styles.logo,
          {
            opacity,
            transform: [{ scale }],
          },
        ]}
      />

      <Animated.Text
        style={[
          styles.title,
          {
            opacity,
          },
        ]}
      >
        CUPID CLOTHING
      </Animated.Text>

      <Animated.Text
        style={[
          styles.tagline,
          {
            opacity,
          },
        ]}
      >
        Premium Fashion For Everyone
      </Animated.Text>

      <View style={styles.loader}>
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F0F",
    justifyContent: "center",
    alignItems: "center",
  },

  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 2,
  },

  tagline: {
    marginTop: 10,
    color: "#B8B8B8",
    fontSize: 14,
    letterSpacing: 1,
  },

  loader: {
    flexDirection: "row",
    position: "absolute",
    bottom: 70,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 20,
    backgroundColor: "#D4AF37",
    marginHorizontal: 6,
  },
});
