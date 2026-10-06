import { FilterIce, IceSheen } from "./iceTheme";
import { CupidPalette } from "@/constants/theme";
import { useRef, useState } from "react";
import { PanResponder, Pressable, StyleSheet, Text, View } from "react-native";
import {
  clampRange,
  MAX_PRICE,
  MIN_PRICE,
  money,
  QUICK_PRICES,
} from "@/lib/catalogFilters";

export default function PriceRangeFilter({
  value,
  onChange,
}: {
  value: [number, number] | null;
  onChange: (value: [number, number] | null) => void;
}) {
  const range = value ?? [MIN_PRICE, MAX_PRICE];
  const [width, setWidth] = useState(1);
  const latest = useRef({ range, width, onChange });
  latest.current = { range, width, onChange };
  const drag = useRef({ index: 0, start: 0, coincident: false });
  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event) => {
        const current = latest.current;
        const price =
          MIN_PRICE +
          ((event.nativeEvent.locationX - 22) / current.width) *
            (MAX_PRICE - MIN_PRICE);
        const index =
          Math.abs(price - current.range[0]) <=
          Math.abs(price - current.range[1])
            ? 0
            : 1;
        drag.current = {
          index,
          start: current.range[index],
          coincident: current.range[0] === current.range[1],
        };
      },
      onPanResponderMove: (_, gesture) => {
        const current = latest.current;
        const index = drag.current.coincident
          ? gesture.dx < 0
            ? 0
            : 1
          : drag.current.index;
        if (Math.abs(gesture.dx) > 2) {
          drag.current.index = index;
          drag.current.coincident = false;
        }
        const next =
          drag.current.start +
          (gesture.dx / current.width) * (MAX_PRICE - MIN_PRICE);
        current.onChange(
          index === 0
            ? clampRange(Math.min(next, current.range[1]), current.range[1])
            : clampRange(current.range[0], next),
        );
      },
    }),
  ).current;
  const adjust = (index: number, delta: number) =>
    onChange(
      index === 0
        ? clampRange(Math.min(range[0] + delta, range[1]), range[1])
        : clampRange(range[0], range[1] + delta),
    );
  const position = (price: number) =>
    ((price - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * width;
  return (
    <View>
      {QUICK_PRICES.map(([min, max]) => {
        const active = value?.[0] === min && value?.[1] === max;
        return (
          <Pressable
            key={min}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${money(min)} to ${money(max)}`}
            onPress={() => onChange(active ? null : [min, max])}
            style={[styles.option, active && styles.active]}
          >
            {active && <IceSheen />}
            <Text style={[styles.label, active && styles.activeLabel]}>
              {money(min)} – {money(max)}
            </Text>
          </Pressable>
        );
      })}
      <View style={styles.rangePanel}>
        <IceSheen />
        <Text style={styles.heading}>Custom range</Text>
        <View style={styles.priceValues}>
          <View style={styles.priceBox}>
            <Text style={styles.valueLabel}>MIN</Text>
            <Text style={styles.valueText}>{money(range[0])}</Text>
          </View>
          <Text style={styles.rangeDash}>–</Text>
          <View style={styles.priceBox}>
            <Text style={styles.valueLabel}>MAX</Text>
            <Text style={styles.valueText}>{money(range[1])}</Text>
          </View>
        </View>
        <View
          {...responder.panHandlers}
          style={styles.slider}
          onLayout={(event) =>
            setWidth(Math.max(1, event.nativeEvent.layout.width - 44))
          }
        >
          <View pointerEvents="none" style={styles.track} />
          <View
            pointerEvents="none"
            style={[
              styles.selectedTrack,
              {
                left: 22 + position(range[0]),
                width: position(range[1]) - position(range[0]),
              },
            ]}
          />
          {[0, 1].map((index) => (
            <View
              key={index}
              pointerEvents="none"
              accessible
              accessibilityRole="adjustable"
              accessibilityLabel={`${index === 0 ? "Minimum" : "Maximum"} price`}
              accessibilityValue={{
                min: index === 0 ? MIN_PRICE : range[0],
                max: index === 0 ? range[1] : MAX_PRICE,
                now: range[index],
                text: money(range[index]),
              }}
              accessibilityActions={[
                { name: "increment", label: "Increase by 10 rupees" },
                { name: "decrement", label: "Decrease by 10 rupees" },
              ]}
              onAccessibilityAction={(event) =>
                adjust(
                  index,
                  event.nativeEvent.actionName === "increment" ? 10 : -10,
                )
              }
              style={[
                styles.thumbTarget,
                { left: position(range[index]), top: 14 },
              ]}
            >
              <View style={styles.thumb}>
                <View style={styles.thumbGrip} />
                <View style={styles.thumbGrip} />
              </View>
            </View>
          ))}
        </View>
        <View style={styles.endpoints}>
          <Text style={styles.hint}>{money(MIN_PRICE)}</Text>
          <Text style={styles.hint}>{money(MAX_PRICE)}</Text>
        </View>
        <Text style={styles.hint}>Slide to adjust your budget</Text>
      </View>
      {value && (
        <Pressable
          accessibilityRole="button"
          onPress={() => onChange(null)}
          style={styles.option}
        >
          <Text style={styles.activeLabel}>Reset price</Text>
        </Pressable>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  rangePanel: {
    overflow: "hidden",
    marginTop: 12,
    marginBottom: 12,
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: FilterIce.selectedBorder,
    borderRadius: 12,
    backgroundColor: CupidPalette.surface,
  },
  priceValues: { flexDirection: "row", alignItems: "center", gap: 6 },
  priceBox: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.8)",
    borderWidth: 1,
    borderColor: FilterIce.selectedBorder,
    borderRadius: 6,
  },
  valueLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    color: CupidPalette.muted,
    marginBottom: 4,
  },
  valueText: { fontSize: 15, fontWeight: "800", color: CupidPalette.ink },
  rangeDash: { color: CupidPalette.muted, fontSize: 14 },
  heading: {
    fontSize: 14,
    fontWeight: "700",
    color: CupidPalette.ink,
    marginBottom: 14,
  },
  hint: { fontSize: 12, color: CupidPalette.muted, lineHeight: 18 },
  slider: { height: 64, marginTop: 8 },
  track: {
    position: "absolute",
    left: 22,
    right: 22,
    top: 33,
    height: 6,
    backgroundColor: FilterIce.border,
    borderRadius: 5,
  },
  selectedTrack: {
    position: "absolute",
    top: 33,
    height: 6,
    borderRadius: 5,
    backgroundColor: FilterIce.track,
  },
  thumbTarget: {
    position: "absolute",
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  thumb: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: FilterIce.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    elevation: 3,
    borderColor: FilterIce.selectedBorder,
    backgroundColor: CupidPalette.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  thumbGrip: {
    width: 2,
    height: 10,
    borderRadius: 1,
    backgroundColor: FilterIce.track,
  },
  endpoints: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  option: {
    overflow: "hidden",
    minHeight: 48,
    padding: 12,
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FilterIce.border,
    marginBottom: 10,
  },
  active: { backgroundColor: FilterIce.track, borderColor: FilterIce.selectedBorder },
  label: { fontSize: 13, fontWeight: "600", color: CupidPalette.muted },
  activeLabel: { color: CupidPalette.ink, fontWeight: "600" },
});
