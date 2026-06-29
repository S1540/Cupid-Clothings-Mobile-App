// components/product/ProductInfo.tsx
import { Entypo, Feather, MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";

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
  offersVisible: boolean;
  setOffersVisible: (v: boolean) => void;
};

const ProductInfo = React.memo(
  ({
    product,
    selectedOptions,
    setSelectedOptions,
    offersVisible,
    setOffersVisible,
  }: ProductInfoProps) => {
    const router = useRouter();

    const isVariantAvailable = (optionName: string, value: string) =>
      product.variants.some(
        (v) =>
          v.selectedOptions.some(
            (o) => o.name === optionName && o.value === value,
          ) && v.available,
      );

    return (
      <View style={{ paddingHorizontal: 16, paddingTop: 20, gap: 16 }}>
        {/* Delivery location nudge */}
        <Pressable
          onPress={() => router.push("/Select-Location")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: "#fff5f7",
            borderRadius: 6,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderWidth: 0.5,
            borderColor: "#F87387",
          }}
        >
          <MaterialIcons name="add-location-alt" size={15} color="#ff5c84" />
          <Text style={{ fontSize: 13, color: "#ff5c84", fontWeight: "500" }}>
            Add delivery location for exact discount
          </Text>
        </Pressable>

        {/* Product title */}
        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            color: "#111",
            lineHeight: 30,
            letterSpacing: -0.3,
          }}
        >
          {product.title}
        </Text>

        {/* Short description */}
        <Text
          style={{
            fontSize: 15,
            color: "#777",
            lineHeight: 22,
            fontWeight: "400",
          }}
        >
          {product.description?.slice(0, 115) + " ..."}
        </Text>

        {/* Price row */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "800",
              color: "#111",
              letterSpacing: -0.5,
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
                style={{ fontSize: 13, fontWeight: "700", color: "#22a55b" }}
              >
                {product.discountPercent}% off
              </Text>
            </View>
          )}
        </View>

        {/* Offers trigger */}
        <Pressable
          onPress={() => setOffersVisible(true)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            backgroundColor: "#f0fdf4",
            borderRadius: 6,
            paddingHorizontal: 12,
            paddingVertical: 8,
            alignSelf: "flex-start",
          }}
        >
          <Text
            style={{
              fontSize: 13,
              color: "#22a55b",
              fontWeight: "600",
            }}
          >
            30% off on first order · 2 offers available
          </Text>
          <Entypo
            name={offersVisible ? "chevron-up" : "chevron-down"}
            size={14}
            color="#22a55b"
          />
        </Pressable>

        {/* Offers bottom sheet */}
        <Modal
          visible={offersVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setOffersVisible(false)}
        >
          <Pressable
            onPress={() => setOffersVisible(false)}
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}
          />
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: "#fff",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              gap: 16,
            }}
          >
            <View
              style={{
                width: 36,
                height: 4,
                backgroundColor: "#e0e0e0",
                borderRadius: 99,
                alignSelf: "center",
                marginBottom: 4,
              }}
            />
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#111" }}>
              Available Offers
            </Text>
            {[
              {
                icon: "tag",
                title: "30% off on First Order",
                desc: "Use code FIRST30 on your first purchase. Max discount ₹200.",
                tag: "FIRST30",
              },
              {
                icon: "credit-card",
                title: "10% off on UPI Payment",
                desc: "Get 10% instant discount on UPI payments. Max discount ₹100.",
                tag: "UPI10",
              },
            ].map((offer, i) => (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  gap: 14,
                  alignItems: "flex-start",
                  backgroundColor: "#fff5f7",
                  borderRadius: 12,
                  borderWidth: 0.5,
                  borderColor: "#ffd6de",
                  padding: 16,
                }}
              >
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 99,
                    backgroundColor: "#ff5c84",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name={offer.icon as any} size={16} color="#fff" />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text
                    style={{ fontSize: 14, fontWeight: "700", color: "#111" }}
                  >
                    {offer.title}
                  </Text>
                  <Text style={{ fontSize: 13, color: "#777", lineHeight: 19 }}>
                    {offer.desc}
                  </Text>
                  <View
                    style={{
                      alignSelf: "flex-start",
                      borderWidth: 1,
                      borderColor: "#ff5c84",
                      borderRadius: 6,
                      borderStyle: "dashed",
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      marginTop: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#ff5c84",
                        fontWeight: "800",
                        letterSpacing: 1.5,
                      }}
                    >
                      {offer.tag}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
            <View style={{ height: 16 }} />
          </View>
        </Modal>

        <View style={{ height: 0.5, backgroundColor: "#f0f0f0" }} />

        {/* Size / Option selection */}
        {product.options?.map((option) => (
          <View key={option.name} style={{ gap: 12 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: "600", color: "#111" }}>
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
                      setSelectedOptions((prev) => ({
                        ...prev,
                        [option.name]: value,
                      }))
                    }
                    style={{
                      minWidth: 44,
                      height: 44,
                      borderRadius: 6,
                      paddingHorizontal: 12,
                      borderWidth: selected ? 1.5 : 1,
                      borderColor: selected
                        ? "#F87387"
                        : available
                          ? "#ddd"
                          : "#f0f0f0",
                      borderStyle: available ? "solid" : "dashed",
                      backgroundColor: selected
                        ? "#fff5f7"
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
                          ? "#ff5c84"
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
        ))}

        <View style={{ height: 0.5, backgroundColor: "#f0f0f0" }} />
      </View>
    );
  },
);

export default ProductInfo;
