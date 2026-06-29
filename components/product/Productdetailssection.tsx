// components/product/ProductDetailsSection.tsx
import { EvilIcons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";

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
};

type ProductDetailsSectionProps = {
  product: Product;
};

const PRODUCT_INFO = [
  {
    id: 1,
    icon: "refresh-cw",
    text: "Machine Wash",
    color: "#3b82f6",
    bg: "#dbeafe",
  },
  {
    id: 2,
    icon: "truck",
    text: "Shipping within 1-2 working days",
    color: "#22c55e",
    bg: "#dcfce7",
  },
  {
    id: 3,
    icon: "rotate-ccw",
    text: "Return this item within 7 days of delivery. For more details, go through our Return & Exchange Policy.",
    color: "#f59e0b",
    bg: "#fef3c7",
  },
  {
    id: 4,
    icon: "info",
    text: "Make sure to check the size chart for the appropriate size.",
    color: "#ec4899",
    bg: "#fce7f3",
  },
];

const TRUST_BADGES = [
  {
    id: 1,
    title: "Secure\nPayment",
    icon: "shield-lock-outline",
    color: "#22c55e",
    bg: "#dcfce7",
  },
  {
    id: 2,
    title: "Fast\nDelivery",
    icon: "truck-fast-outline",
    color: "#3b82f6",
    bg: "#dbeafe",
  },
  {
    id: 3,
    title: "Easy\nReturns",
    icon: "cached",
    color: "#f59e0b",
    bg: "#fef3c7",
  },
  {
    id: 4,
    title: "Quality\nAssured",
    icon: "medal-outline",
    color: "#ec4899",
    bg: "#fce7f3",
  },
];

const ProductDetailsSection = React.memo(
  ({ product }: ProductDetailsSectionProps) => {
    const [expanded, setExpanded] = useState(false);

    return (
      <View style={{ paddingHorizontal: 16, gap: 12, paddingTop: 4 }}>
        {/* Sold by */}
        <Pressable
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#fff5f7",
            borderRadius: 6,
            borderWidth: 0.5,
            borderColor: "#ffd6de",
            paddingHorizontal: 16,
            paddingVertical: 14,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 99,
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              <Image
                source={require("../../assets/images/icon.png")}
                style={{ width: 38, height: 38 }}
              />
            </View>
            <View style={{ gap: 2 }}>
              <Text style={{ fontSize: 12, color: "#999", fontWeight: "500" }}>
                Sold by
              </Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#111" }}>
                Cupid Clothing
              </Text>
            </View>
          </View>
          <EvilIcons name="chevron-right" size={24} color="#ccc" />
        </Pressable>

        {/* Product details accordion */}
        <Pressable
          onPress={() => setExpanded(!expanded)}
          style={{
            backgroundColor: "#fff",
            borderRadius: 6,
            borderWidth: 0.5,
            borderColor: "#f0f0f0",
            padding: 16,
            gap: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 0.7,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#111" }}>
              Product Details
            </Text>
            <Feather
              name={expanded ? "chevron-up" : "chevron-down"}
              size={18}
              color="#F87387"
            />
          </View>
          {product.description
            ?.split(/\n|\.\s+/)
            .map((line) => line.trim())
            .filter((line) => line.length > 0)
            .slice(0, expanded ? undefined : 0)
            .map((line, i) => (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                <View
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 99,
                    backgroundColor: "#ff5c84",
                    marginTop: 8,
                  }}
                />
                <Text
                  style={{
                    flex: 1,
                    fontSize: 14,
                    color: "#555",
                    lineHeight: 22,
                    fontWeight: "400",
                  }}
                >
                  {line}
                </Text>
              </View>
            ))}
        </Pressable>

        {/* Care instructions + trust badges */}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 6,
            borderWidth: 0.5,
            borderColor: "#f0f0f0",
            padding: 16,
            gap: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 0.6,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "700", color: "#111" }}>
            Other Details & Instructions
          </Text>

          {PRODUCT_INFO.map((item) => (
            <View
              key={item.id}
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 14,
              }}
            >
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 999,
                  backgroundColor: item.bg,
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 1,
                }}
              >
                <Feather name={item.icon as any} size={13} color={item.color} />
              </View>
              <Text
                style={{
                  flex: 1,
                  fontSize: 14,
                  color: "#555",
                  lineHeight: 21,
                  fontWeight: "400",
                }}
              >
                {item.text}
              </Text>
            </View>
          ))}

          {/* Trust badges */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 8,
              paddingVertical: 12,
              paddingHorizontal: 4,
              borderWidth: 0.5,
              borderRadius: 6,
              borderColor: "#f0f0f0",
              backgroundColor: "#fafafa",
            }}
          >
            {TRUST_BADGES.map((badge) => (
              <View
                key={badge.id}
                style={{
                  width: "23%",
                  alignItems: "center",
                  gap: 8,
                  paddingVertical: 8,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 999,
                    backgroundColor: badge.bg,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MaterialCommunityIcons
                    name={badge.icon as any}
                    size={22}
                    color={badge.color}
                  />
                </View>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: "#333",
                    textAlign: "center",
                    lineHeight: 15,
                  }}
                >
                  {badge.title}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View
          style={{ height: 1, backgroundColor: "#f5f5f5", marginVertical: 4 }}
        />
      </View>
    );
  },
);

export default ProductDetailsSection;
