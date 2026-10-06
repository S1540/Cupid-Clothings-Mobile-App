import { useFocusEffect } from "expo-router";
import { type ReactNode, useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import DimLoadingOverlay from "./DimLoadingOverlay";
import HomeSkeleton, { type SkeletonVariant } from "./HomeSkeleton";

export const ROUTE_PREVIEW_MS = 100;

/** Overlay rather than unmount the list: preserve scroll and let images load underneath. */
export default function CatalogLoadingBoundary({
  children,
  routeKey,
  loading,
  variant,
  skipPreview = false,
  topInset = 0,
  presentation = "skeleton",
}: {
  children: ReactNode;
  routeKey: string;
  loading: boolean;
  variant: SkeletonVariant;
  skipPreview?: boolean;
  topInset?: number;
  presentation?: "skeleton" | "dim";
}) {
  const [preview, setPreview] = useState({ key: routeKey, active: true });
  useFocusEffect(
    useCallback(() => {
      setPreview({ key: routeKey, active: true });
      const timer = setTimeout(
        () => setPreview({ key: routeKey, active: false }),
        ROUTE_PREVIEW_MS,
      );
      return () => clearTimeout(timer);
    }, [routeKey]),
  );
  const visible =
    !skipPreview && (loading || preview.key !== routeKey || preview.active);
  return (
    <View style={styles.fill}>
      <View
        style={styles.fill}
        pointerEvents={visible ? "none" : "auto"}
        accessibilityElementsHidden={visible}
        importantForAccessibility={visible ? "no-hide-descendants" : "auto"}
      >
        {children}
      </View>
      {presentation === "dim" ? (
        <DimLoadingOverlay visible={visible} />
      ) : (
        visible && (
          <View style={StyleSheet.absoluteFill}>
            <HomeSkeleton variant={variant} topInset={topInset} />
          </View>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
