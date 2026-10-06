import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, StyleSheet, View } from "react-native";

export default function DimLoadingOverlay({ visible }: { visible: boolean }) {
  const opacity = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) setMounted(true);
    const animation = Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: visible ? 60 : 80,
      useNativeDriver: true,
      isInteraction: false,
    });
    animation.start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
    return () => animation.stop();
  }, [visible, opacity]);

  if (!visible && !mounted) return null;
  return (
    <Animated.View
      style={[styles.overlay, { opacity }]}
      accessible
      accessibilityLabel="Loading products"
      accessibilityState={{ busy: true }}
    >
      <View style={styles.loader}>
        <ActivityIndicator
          size="small"
          color="#E74778"
          style={styles.spinner}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(30, 18, 24, 0.16)",
    zIndex: 10,
  },
  loader: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FAEDF1",
    shadowColor: "#492335",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
  },
  spinner: { transform: [{ scale: 1.25 }] },
});
