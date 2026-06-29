// components/product/ProductBottomSection.tsx
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

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

type ProductBottomSectionProps = {
  viewedProducts: Product[];
  exploreProducts: Product[];
};

const REVIEWS = [
  {
    id: 1,
    name: "Priya S.",
    rating: 5,
    title: "Absolutely love it!",
    body: "The fabric is so soft and comfortable. Fits perfectly and looks exactly like the photos. Will definitely buy more!",
    date: "12 May 2025",
    verified: true,
  },
  {
    id: 2,
    name: "Anjali M.",
    rating: 4,
    title: "Great quality",
    body: "Very happy with the purchase. The color is vibrant and the stitching is neat. Delivery was also quick.",
    date: "3 Apr 2025",
    verified: true,
  },
  {
    id: 3,
    name: "Ritu K.",
    rating: 5,
    title: "Perfect fit!",
    body: "Ordered L size and it fits like a dream. The material is premium and feels great on skin.",
    date: "28 Mar 2025",
    verified: false,
  },
  {
    id: 4,
    name: "Sneha T.",
    rating: 4,
    title: "Nice product",
    body: "Good quality for the price. Slight color difference from screen but still looks good.",
    date: "15 Feb 2025",
    verified: true,
  },
  {
    id: 5,
    name: "Kavita R.",
    rating: 5,
    title: "Highly recommend!",
    body: "Bought this for my sister and she loved it. Super comfortable and stylish!",
    date: "2 Jan 2025",
    verified: true,
  },
];

const ProductBottomSection = React.memo(
  ({ viewedProducts, exploreProducts }: ProductBottomSectionProps) => {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const [showAll, setShowAll] = useState(false);

    // Memoized shuffle so order stays stable across re-renders
    const shuffled = useMemo(
      () => [...REVIEWS].sort(() => Math.random() - 0.5),
      [],
    );
    const displayed = showAll ? shuffled : shuffled.slice(0, 2);
    const avgRating = (
      REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length
    ).toFixed(1);

    // Explore card: half screen minus padding and gap
    const exploreCardWidth = (width - 32 - 10) / 2;
    const exploreCardImageHeight = Math.round(exploreCardWidth * 1.35);

    // Recently viewed card: fixed 200px wide, portrait image
    const recentCardImageHeight = Math.round(200 * 1.2);

    return (
      <View style={{ gap: 0 }}>
        {/* ── Reviews ──────────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 16, gap: 14, marginBottom: 24 }}>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#111" }}>
                Customer Reviews
              </Text>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Text
                  style={{ fontSize: 24, fontWeight: "800", color: "#111" }}
                >
                  {avgRating}
                </Text>
                <View style={{ flexDirection: "row" }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Text
                      key={s}
                      style={{
                        fontSize: 15,
                        color:
                          parseFloat(avgRating) >= s ? "#FFB800" : "#e0e0e0",
                      }}
                    >
                      ★
                    </Text>
                  ))}
                </View>
                <Text style={{ fontSize: 13, color: "#aaa" }}>
                  ({REVIEWS.length})
                </Text>
              </View>
            </View>
            <Pressable
              style={{
                borderWidth: 1,
                borderColor: "#F87387",
                borderRadius: 6,
                paddingHorizontal: 14,
                paddingVertical: 8,
              }}
            >
              <Text
                style={{ fontSize: 13, color: "#F87387", fontWeight: "600" }}
              >
                Write Review
              </Text>
            </Pressable>
          </View>

          {/* Review cards */}
          {displayed.map((review) => (
            <View
              key={review.id}
              style={{
                backgroundColor: "#fff",
                borderRadius: 6,
                borderWidth: 0.5,
                borderColor: "#f0f0f0",
                padding: 16,
                gap: 10,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
                elevation: 1,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 99,
                      backgroundColor: "#fff0f4",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "700",
                        color: "#ff5c84",
                      }}
                    >
                      {review.name.charAt(0)}
                    </Text>
                  </View>
                  <View style={{ gap: 2 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "700",
                        color: "#111",
                      }}
                    >
                      {review.name}
                    </Text>
                    {review.verified && (
                      <Text
                        style={{
                          fontSize: 11,
                          color: "#22a55b",
                          fontWeight: "500",
                        }}
                      >
                        ✓ Verified Purchase
                      </Text>
                    )}
                  </View>
                </View>
                <Text
                  style={{
                    fontSize: 13,
                    color: "#FFB800",
                    letterSpacing: 1,
                  }}
                >
                  {"★".repeat(review.rating)}
                  {"☆".repeat(5 - review.rating)}
                </Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#111" }}>
                {review.title}
              </Text>
              <Text style={{ fontSize: 14, color: "#666", lineHeight: 21 }}>
                {review.body}
              </Text>
              <Text style={{ fontSize: 12, color: "#bbb" }}>{review.date}</Text>
            </View>
          ))}

          {!showAll && (
            <Pressable
              onPress={() => setShowAll(true)}
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: 6,
                paddingVertical: 14,
                borderWidth: 0.5,
                borderColor: "#f0f0f0",
                borderRadius: 12,
                backgroundColor: "#fafafa",
              }}
            >
              <Text
                style={{ fontSize: 14, fontWeight: "600", color: "#ff5c84" }}
              >
                View All {REVIEWS.length} Reviews
              </Text>
              <Feather name="chevron-down" size={14} color="#ff5c84" />
            </Pressable>
          )}
        </View>

        {/* ── Recently Viewed ───────────────────────────────────────── */}
        {viewedProducts.length > 0 && (
          <View
            style={{
              gap: 14,
              marginBottom: 24,
            }}
          >
            <View
              style={{
                height: 1,
                backgroundColor: "#f5f5f5",
                marginHorizontal: 16,
                marginBottom: 4,
              }}
            />
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#111",
                paddingHorizontal: 16,
              }}
            >
              Recently Viewed
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}
            >
              {viewedProducts.map((item: Product, index) => (
                <Pressable
                  key={`${item.handle}-${index}`}
                  onPress={() =>
                    router.push({
                      pathname: "/product/[handle]",
                      params: { handle: item.handle },
                    })
                  }
                  style={{
                    width: 180,
                    backgroundColor: "#fff",
                    borderRadius: 6,
                    borderWidth: 0.3,
                    borderColor: "#f0f0f0",
                    overflow: "hidden",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.02,
                    shadowRadius: 4,
                    elevation: 0.03,
                  }}
                >
                  <Image
                    source={{ uri: item.images?.[0]?.url }}
                    style={{ width: "100%", height: recentCardImageHeight }}
                    resizeMode="cover"
                  />
                  <View style={{ padding: 10, gap: 4 }}>
                    <Text
                      numberOfLines={2}
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: "#111",
                        lineHeight: 18,
                      }}
                    >
                      {item.title}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 6,
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "800",
                          color: "#111",
                        }}
                      >
                        ₹{item.price}
                      </Text>
                      {item.compareAtPrice && (
                        <Text
                          style={{
                            fontSize: 11,
                            color: "#bbb",
                            textDecorationLine: "line-through",
                          }}
                        >
                          ₹{item.compareAtPrice}
                        </Text>
                      )}
                    </View>
                    {!!item.discountPercent && (
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "700",
                          color: "#22a55b",
                        }}
                      >
                        {item.discountPercent}% off
                      </Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Explore Like This ─────────────────────────────────────── */}
        {exploreProducts.length > 0 && (
          <View
            style={{
              paddingHorizontal: 16,
              gap: 14,
              marginBottom: 24,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#111" }}>
              Explore Like This
            </Text>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              {exploreProducts.map((item: Product, index) => (
                <Pressable
                  key={`${item.handle}-${index}`}
                  onPress={() =>
                    router.push({
                      pathname: "/product/[handle]",
                      params: { handle: item.handle },
                    })
                  }
                  style={{
                    width: exploreCardWidth,
                    backgroundColor: "#fff",
                    borderRadius: 6,
                    borderWidth: 0.3,
                    borderColor: "#f0f0f0",
                    overflow: "hidden",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.02,
                    shadowRadius: 4,
                    elevation: 0.3,
                  }}
                >
                  <Image
                    source={{ uri: item.images?.[0]?.url }}
                    style={{ width: "100%", height: exploreCardImageHeight }}
                    resizeMode="cover"
                  />
                  <View style={{ padding: 10, gap: 4 }}>
                    <Text
                      numberOfLines={2}
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: "#111",
                        lineHeight: 18,
                      }}
                    >
                      {item.title}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 6,
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "800",
                          color: "#111",
                        }}
                      >
                        ₹{item.price}
                      </Text>
                      {item.compareAtPrice && (
                        <Text
                          style={{
                            fontSize: 11,
                            color: "#bbb",
                            textDecorationLine: "line-through",
                          }}
                        >
                          ₹{item.compareAtPrice}
                        </Text>
                      )}
                    </View>
                    {!!item.discountPercent && (
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "700",
                          color: "#22a55b",
                        }}
                      >
                        {item.discountPercent}% off
                      </Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  },
);

export default ProductBottomSection;
