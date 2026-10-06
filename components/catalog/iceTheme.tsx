import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

// Matches the translucent ice at the top corner of Home's Hot Deals.
export const FilterIce = {
  header: "#FFF7F8",
  frost: "#ECF2FD",
  border: "#DEE4EF",
  selectedBorder: "#B8C6DC",
  accent: "#536278",
  track: "#CEDBF0",
} as const;

export function IceSheen({ blendHeader = false }: { blendHeader?: boolean }) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: "#FFFFFF" }]}>
      <LinearGradient
        colors={["#A9C3F566", "#E4E0FF", "#FBEAF2", "#FFF8FA"]}
        locations={[0, 0.4, 0.72, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={["rgba(255,255,255,0.45)", "rgba(255,255,255,0.15)", "rgba(255,255,255,0.35)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {blendHeader && (
        <LinearGradient
          colors={[FilterIce.header, "rgba(255,247,248,0.75)", "rgba(255,255,255,0.4)"]}
          locations={[0, 0.45, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
    </View>
  );
}
