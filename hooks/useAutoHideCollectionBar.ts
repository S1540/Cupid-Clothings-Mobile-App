import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  AccessibilityInfo,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

import { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

const TOP_THRESHOLD = 8;

export function useAutoHideCollectionBar(routeKey: string, ready: boolean, height: number) {
  const progress = useSharedValue(1);
  const slideStyle = useAnimatedStyle(() => ({ transform: [{ translateY: (progress.value - 1) * height }] }));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const offset = useRef(0);
  const direction = useRef(0);
  const distance = useRef(0);
  const locked = useRef(false);
  const visible = useRef(true);
  const [hidden, setHidden] = useState(false);
  const [screenReader, setScreenReader] = useState(false);
  const clearTimer = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);
  const reveal = useCallback((show: boolean) => {
    if (visible.current === show) return;
    visible.current = show;
    setHidden(!show);
    progress.value = withTiming(show ? 1 : 0, {
      duration: show ? 360 : 280,
      easing: show ? Easing.bezier(0.16, 1, 0.3, 1) : Easing.bezier(0.4, 0, 0.2, 1),
    });
  }, [progress]);
  const scheduleHide = useCallback(() => {
    clearTimer();
    if (offset.current <= TOP_THRESHOLD) {
      reveal(true);
      return;
    }
    if (!ready || locked.current || screenReader) return;
    timer.current = setTimeout(() => {
      timer.current = null;
      if (offset.current > TOP_THRESHOLD && !locked.current) reveal(false);
    }, 2000);
  }, [clearTimer, ready, reveal, screenReader]);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
      if (mounted) setScreenReader(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener("screenReaderChanged", setScreenReader);
    return () => { mounted = false; subscription.remove(); };
  }, []);

  useFocusEffect(useCallback(() => {
    if (!routeKey) return;
    // At the collection's top the controls remain visible without an idle timer.
    offset.current = 0;
    direction.current = 0;
    distance.current = 0;
    reveal(true);
    scheduleHide();
    return () => { clearTimer(); cancelAnimation(progress); };
  }, [routeKey, clearTimer, progress, reveal, scheduleHide]));

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    // Clamp overscroll so bouncing at either edge never reverses the toolbar.
    const y = Math.max(0, Math.min(contentOffset.y, Math.max(0, contentSize.height - layoutMeasurement.height)));
    const delta = y - offset.current;
    offset.current = y;
    if (y <= TOP_THRESHOLD) {
      direction.current = 0;
      distance.current = 0;
      clearTimer();
      reveal(true);
      return;
    }
    if (!locked.current && !screenReader && Math.abs(delta) > 0.5) {
      const nextDirection = Math.sign(delta);
      distance.current = nextDirection === direction.current ? distance.current + Math.abs(delta) : Math.abs(delta);
      direction.current = nextDirection;
      // Forward scrolling gets the same two-second grace period as stopping.
      if (distance.current >= 8 && delta < 0) reveal(true);
    }
    scheduleHide();
  }, [clearTimer, reveal, scheduleHide, screenReader]);

  const onSheetChange = useCallback((open: boolean) => {
    locked.current = open;
    clearTimer();
    if (open) reveal(true);
    else scheduleHide();
  }, [clearTimer, reveal, scheduleHide]);

  // A downward pull can reveal controls even when already at the top on Android.
  const touchY = useRef(0);
  return {
    slideStyle,
    hidden,
    onScroll,
    onSheetChange,
    onScrollBeginDrag: clearTimer,
    onScrollEndDrag: scheduleHide,
    onMomentumScrollEnd: scheduleHide,
    onTouchStart: (event: { nativeEvent: { pageY: number } }) => {
      touchY.current = event.nativeEvent.pageY;
      clearTimer();
    },
    onTouchMove: (event: { nativeEvent: { pageY: number } }) => {
      if (offset.current <= 0 && event.nativeEvent.pageY - touchY.current > 12) reveal(true);
    },
    onTouchEnd: scheduleHide,
  };
}
