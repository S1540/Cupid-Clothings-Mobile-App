import { Entypo, MaterialIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { useCartStore } from "@/store/cartStore";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import BundleProgress from "./BunleProgress";

type Variant = {
  id: string;
  title: string;
  available: boolean;
  price: string;
  selectedOptions: { name: string; value: string }[];
};

type Option = { name: string; values: string[] };

type Product = {
  id: string;
  title: string;
  handle: string;
  description: string;
  images: { url: string; alt: string }[];
  price: string;
  compareAtPrice: string | null;
  discountPercent: number | null;
  currency: string;
  options: Option[];
  variants: Variant[];
};

type ProductInfoProps = {
  product: Product;
  selectedOptions: Record<string, string>;
  setSelectedOptions: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  offersVisible?: boolean;
  setOffersVisible?: (v: boolean) => void;
};

// ─── Coupon data (replace with API data later if needed) ───────────────────
type Coupon = {
  code: string;
  title: string;
  description: string;
  brand: string;
};

const COUPONS: Coupon[] = [
  {
    code: "WELCUPID10",
    title: "Extra 10% OFF",
    description: "10% Off On Your First Order Using This Code",
    brand: "CUPID",
  },
  {
    code: "FLAT250",
    title: "FLAT 250 OFF",
    description: "Get instant discount of 250 off on above ₹1999",
    brand: "CUPID",
  },
];

// ─── Coupon Card ─────────────────────────────────────────────────────────
const CouponCard = React.memo(({ coupon }: { coupon: Coupon }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(coupon.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, [coupon.code]);

  // ── Shimmer sweep (more noticeable now) ──────────────────────────────────
  const shimmerX = useSharedValue(-1);
  useEffect(() => {
    shimmerX.value = withRepeat(
      withSequence(
        withDelay(
          1200,
          withTiming(1, {
            duration: 950,
            easing: Easing.inOut(Easing.ease),
          }),
        ),
        withTiming(-1, { duration: 0 }),
      ),
      -1,
      false,
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value * 220 }, { rotate: "18deg" }],
  }));

  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.55 + pulse.value * 0.45,
  }));

  return (
    <View style={styles.couponCard}>
      {/* shimmer sweep overlay — wider + brighter for visibility */}
      <View pointerEvents="none" style={styles.shimmerClip}>
        <Animated.View style={[styles.shimmerBar, shimmerStyle]}>
          <LinearGradient
            colors={[
              "transparent",
              "#ffffff99",
              "#ffffffcc",
              "#ffffff99",
              "transparent",
            ]}
            locations={[0, 0.35, 0.5, 0.65, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      </View>

      <View style={styles.couponTopRow}>
        <Text style={styles.couponTitle}>{coupon.title}</Text>
        <MaterialIcons name="local-offer" size={14} color="#759EF0" />
      </View>

      <Text style={styles.couponDescription} numberOfLines={2}>
        {coupon.description}
      </Text>

      <View style={styles.couponBottomRow}>
        <Animated.View style={[styles.codeChip, pulseStyle]}>
          <Text style={styles.codeChipText}>{coupon.code}</Text>
        </Animated.View>
        <Pressable onPress={handleCopy} hitSlop={8}>
          <Text style={styles.copyText}>
            {copied ? "Copied!" : "Copy Code"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
});
const ProductInfo = React.memo(
  ({ product, selectedOptions, setSelectedOptions }: ProductInfoProps) => {
    const router = useRouter();
    const cartCount = useCartStore((s) => s.cartCount);

    const isVariantAvailable = (optionName: string, value: string) =>
      product.variants.some(
        (v) =>
          v.selectedOptions.some(
            (o) => o.name === optionName && o.value === value,
          ) && v.available,
      );

    return (
      <View style={{ paddingHorizontal: 16, paddingTop: 14, gap: 12 }}>
        {/* Delivery location nudge */}
        <Pressable
          onPress={() => router.push("/Select-Location")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: "#759EF026",
            borderRadius: 6,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderWidth: 0.5,
            borderColor: "#759EF0DB",
          }}
        >
          <MaterialIcons name="add-location-alt" size={15} color="#555" />
          <Text style={{ fontSize: 13, color: "#555", fontWeight: "500" }}>
            See Delivery Expectation Date
          </Text>
        </Pressable>

        {/* Product title */}
        <Text
          style={{
            fontSize: 17,
            fontWeight: "600",
            color: "#1F2224E8",
            lineHeight: 20,
            letterSpacing: -0.1,
          }}
        >
          {product.title}
        </Text>

        {/* Short description */}
        <Text
          style={{
            fontSize: 13,
            color: "#777",
            lineHeight: 18,
            fontWeight: "400",
          }}
        >
          {product.description?.slice(0, 115) + " ..."}
        </Text>

        {/* Price row */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "600",
              color: "#111",
              letterSpacing: -0.7,
            }}
          >
            ₹{product.price}
          </Text>
          {product.compareAtPrice && (
            <Text
              style={{
                fontSize: 16,
                color: "#bbb",
                textDecorationLine: "line-through",
                fontWeight: "400",
              }}
            >
              ₹{product.compareAtPrice}
            </Text>
          )}
          {!!product.discountPercent && (
            <View
              style={{
                backgroundColor: "#f0fdf4",
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}
            >
              <Text
                style={{ fontSize: 13, fontWeight: "500", color: "#22a55b" }}
              >
                {product.discountPercent}% off
              </Text>
            </View>
          )}
        </View>

        {/* ─── Inline "Save More" coupon section ─── */}

        <View
          style={{
            height: 0.5,
            backgroundColor: "#6D6C6C30",
            marginBottom: 8,
          }}
        />

        {/* Size / Option selection */}
        {product.options?.map((option) => {
          if (option.name === "Color") return null;

          return (
            <View key={option.name} style={{ gap: 12 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ fontSize: 15, fontWeight: "600", color: "#111" }}
                >
                  Select {option.name}
                </Text>
                {option.name === "Size" && (
                  <Pressable>
                    <Text
                      style={{
                        fontSize: 13,
                        color: "#ff5c84",
                        fontWeight: "600",
                      }}
                    >
                      Size Guide
                    </Text>
                  </Pressable>
                )}
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {option.values?.map((value) => {
                  const available = isVariantAvailable(option.name, value);
                  const selected = selectedOptions[option.name] === value;
                  return (
                    <Pressable
                      key={value}
                      onPress={() =>
                        available &&
                        setSelectedOptions((prev: any) => ({
                          ...prev,
                          [option.name]: value,
                        }))
                      }
                      style={{
                        minWidth: 44,
                        height: 44,
                        borderRadius: 6,
                        paddingHorizontal: 12,
                        borderWidth: selected ? 1 : 0.5,
                        borderColor: selected
                          ? "#759EF06E"
                          : available
                            ? "#ddd"
                            : "#f0f0f0",
                        borderStyle: available ? "solid" : "dashed",
                        backgroundColor: selected
                          ? "#759EF026"
                          : available
                            ? "#fff"
                            : "#fafafa",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: available ? 1 : 0.55,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "600",
                          color: selected
                            ? "#555"
                            : available
                              ? "#444"
                              : "#bbb",
                        }}
                      >
                        {value}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}

        <View style={styles.saveMoreSection}>
          <Text style={styles.saveMoreTitle}>Save More</Text>
          <Text style={styles.saveMoreSubtitle}>
            Apply coupons during checkout
          </Text>

          <FlatList
            data={COUPONS}
            keyExtractor={(item) => item.code}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 16, paddingTop: 12 }}
            renderItem={({ item }) => <CouponCard coupon={item} />}
            ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
          />
        </View>
        <BundleProgress currentItemsInCart={cartCount} maxItems={3} />
        <View style={{ height: 0.5, backgroundColor: "#f0f0f0" }} />
      </View>
    );
  },
);

export default ProductInfo;

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  saveMoreSection: {
    marginTop: 12,
    paddingTop: 14,
    paddingBottom: 4,
    borderTopWidth: 0.5,
    borderTopColor: "#6D6C6C30",
  },
  saveMoreTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  saveMoreSubtitle: {
    fontSize: 12.5,
    color: "#888",
    marginTop: 2,
  },
  couponCard: {
    width: 250,
    backgroundColor: "#F6F9FF",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#759EF04A",
    paddingHorizontal: 12,
    paddingVertical: 10,
    overflow: "hidden",
    // subtle premium glow
    shadowColor: "#759EF0",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 2,
  },
  shimmerClip: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    borderRadius: 10,
  },
  shimmerBar: {
    position: "absolute",
    top: -40,
    left: -60,
    width: 30,
    height: 220,
  },
  couponTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  couponTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#1c2b57",
  },
  couponDescription: {
    fontSize: 11.5,
    color: "#6b7a99",
    lineHeight: 15,
    marginBottom: 8,
  },
  couponBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  codeChip: {
    borderWidth: 1,
    borderColor: "#759EF0",
    borderStyle: "dashed",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#759EF014",
  },
  codeChipText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#4A6FD6",
    letterSpacing: 0.8,
  },
  copyText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4A6FD6",
  },
});
