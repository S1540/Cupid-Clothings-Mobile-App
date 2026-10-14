import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useCartStore } from "@/store/cartStore";
import BundleProgress from "./BunleProgress";
import PaymentOffers from "./PaymentOffers";

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
  onReadMore?: () => void;
};

const ProductInfo = React.memo(
  ({
    product,
    selectedOptions,
    setSelectedOptions,
    onReadMore,
  }: ProductInfoProps) => {
    const router = useRouter();
    const cartCount = useCartStore((s) => s.cartCount);

    const isVariantAvailable = (optionName: string, value: string) =>
      product.variants.some(
        (v) =>
          v.selectedOptions.some(
            (o) => o.name === optionName && o.value === value,
          ) && v.available,
      );
    const selectedVariant = product.variants.find((variant) =>
      Object.entries(selectedOptions).every(([optionName, optionValue]) =>
        variant.selectedOptions.some(
          (option) =>
            option.name === optionName && option.value === optionValue,
        ),
      ),
    );
    // console.log("Selected Options:", selectedOptions);
    // console.log("Selected Variant:", selectedVariant?.title);
    // console.log("Selected Price:", selectedVariant?.price);

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
          {product.description?.slice(0, 115)}
          {product.description?.length > 115 && (
            <>
              <Text>... </Text>
              <Text
                onPress={onReadMore}
                style={{ color: "#F87387", fontWeight: "700" }}
              >
                Read more ↓
              </Text>
            </>
          )}
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
            ₹{selectedVariant?.price ?? product.price}
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
                {/* {option.name === "Size" && (
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
                )} */}
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

        <PaymentOffers />
        <BundleProgress currentItemsInCart={cartCount} maxItems={3} />
        <View style={{ height: 0.5, backgroundColor: "#f0f0f0" }} />
      </View>
    );
  },
);

ProductInfo.displayName = "ProductInfo";
export default ProductInfo;
