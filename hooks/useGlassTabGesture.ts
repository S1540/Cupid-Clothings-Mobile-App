import { tabPositionAt } from "@/lib/navigation/bottomTabs";
import { useCallback, useEffect, useMemo } from "react";
import type { LayoutChangeEvent } from "react-native";
import { Gesture } from "react-native-gesture-handler";
import {
  cancelAnimation,
  runOnJS,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const SNAP = { damping: 24, stiffness: 280, mass: 0.7 };

/** UI-thread preview; exactly one navigation request after a completed drag. */
export function useGlassTabGesture(
  activeIndex: number,
  count: number,
  onSelect: (index: number) => void,
) {
  const width = useSharedValue(0);
  const position = useSharedValue(Math.max(0, activeIndex));
  const dragging = useSharedValue(0);
  const visibility = useSharedValue(activeIndex >= 0 ? 1 : 0);
  const committed = useSharedValue(activeIndex);

  useEffect(() => {
    committed.value = activeIndex;
    cancelAnimation(position);
    position.value = withSpring(Math.max(0, activeIndex), SNAP);
    visibility.value = withTiming(activeIndex >= 0 ? 1 : 0, { duration: 120 });
    dragging.value = 0;
  }, [activeIndex, committed, dragging, position, visibility]);

  const select = useCallback(
    (index: number) => {
      position.value = withSpring(index, SNAP);
      visibility.value = withTiming(1, { duration: 100 });
      onSelect(index);
    },
    [onSelect, position, visibility],
  );

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-8, 8])
        .failOffsetY([-16, 16])
        .maxPointers(1)
        .onStart((event) => {
          cancelAnimation(position);
          dragging.value = withTiming(1, { duration: 100 });
          visibility.value = 1;
          position.value = tabPositionAt(event.x, width.value, count);
        })
        .onUpdate((event) => {
          position.value = tabPositionAt(event.x, width.value, count);
        })
        .onEnd((event, success) => {
          if (!success || width.value <= 0) return;
          // Releasing well outside the bar cancels rather than opening a route.
          if (event.y < -24 || event.y > 76) {
            position.value = withSpring(Math.max(0, committed.value), SNAP);
            visibility.value = withTiming(committed.value >= 0 ? 1 : 0);
            return;
          }
          const index = Math.round(tabPositionAt(event.x, width.value, count));
          position.value = withSpring(index, SNAP);
          runOnJS(onSelect)(index);
        })
        .onFinalize((_event, success) => {
          dragging.value = withTiming(0, { duration: 120 });
          if (!success) {
            position.value = withSpring(Math.max(0, committed.value), SNAP);
            visibility.value = withTiming(committed.value >= 0 ? 1 : 0);
          }
        }),
    [committed, count, dragging, onSelect, position, visibility, width],
  );

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      width.value = event.nativeEvent.layout.width;
    },
    [width],
  );

  return { gesture, onLayout, select, width, position, dragging, visibility };
}
