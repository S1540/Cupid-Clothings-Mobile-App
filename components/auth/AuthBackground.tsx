import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

export type AuthBackgroundVariant = "soft" | "welcome" | "verification";

/** Decorative layers stay outside the form and never intercept input. */
export default function AuthBackground({
  variant,
}: {
  variant: AuthBackgroundVariant;
}) {
  return (
    <View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.canvas}
    >
      {variant === "soft" && (
        <LinearGradient
          colors={["#F8F5FC", "#FFF7F9", "#EEF4FB"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View
        style={[
          styles.roseOrb,
          variant === "verification" && styles.verificationOrb,
        ]}
      />
      <View
        style={[
          styles.blueOrb,
          variant === "verification" && styles.verificationBlue,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  roseOrb: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    top: -100,
    right: -115,
    backgroundColor: "#FDEFF4",
  },
  blueOrb: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    bottom: -160,
    left: -180,
    backgroundColor: "#EFF5FD",
  },
  verificationOrb: {
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -120,
    right: -100,
    backgroundColor: "#FFF5F8",
  },
  verificationBlue: { backgroundColor: "#F7FAFF" },
});
