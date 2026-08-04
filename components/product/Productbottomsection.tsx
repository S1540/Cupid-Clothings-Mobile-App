// components/product/ProductBottomSection.tsx
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { auth } from "@/firebaseConfig";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
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

type Review = {
  id: number;
  rating: number;
  title: string;
  body: string;
  reviewer: { name: string };
  verified: boolean;
  created_at: string;
  pictures?: any[];
};

type ReviewSummary = {
  averageRating: number;
  reviewCount: number;
} | null;

type ProductBottomSectionProps = {
  productId: string;
  productTitle: string;
  reviewSummary: ReviewSummary;
  reviews: Review[];
  viewedProducts: Product[];
  exploreProducts: Product[];
  onReviewSubmitted: (review: Review) => void;
};

function formatDate(isoString: string) {
  if (!isoString) return "";
  try {
    return new Date(isoString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

const ProductBottomSection = React.memo(
  ({
    productId,
    productTitle,
    reviewSummary,
    reviews,
    viewedProducts,
    exploreProducts,
    onReviewSubmitted,
  }: ProductBottomSectionProps) => {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const [showAll, setShowAll] = useState(false);
    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const [rating, setRating] = useState(0);
    const [name, setName] = useState(auth.currentUser?.displayName || "");
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [formError, setFormError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const displayed = showAll ? reviews : reviews.slice(0, 2);
    const avgRating = reviewSummary?.averageRating ?? 0;
    const reviewCount = reviewSummary?.reviewCount ?? 0;

    // Explore card: half screen minus padding and gap
    const exploreCardWidth = (width - 32 - 10) / 2;
    const exploreCardImageHeight = Math.round(exploreCardWidth * 1.35);

    // Recently viewed card: fixed 200px wide, portrait image
    const recentCardImageHeight = Math.round(200 * 1.2);

    const openReviewModal = () => {
      if (!auth.currentUser) {
        router.push("/Account");
        return;
      }
      setFormError("");
      setReviewModalVisible(true);
    };

    const submitReview = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.push("/Account");
        return;
      }
      if (!name.trim() || rating < 1 || body.trim().length < 10) {
        setFormError("Add your name, rating, and at least 10 characters of feedback.");
        return;
      }

      setSubmitting(true);
      setFormError("");
      try {
        const token = await user.getIdToken();
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/judgeme/reviews`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ productId, rating, name, title, body }),
          },
        );
        const responseText = await response.text();
        let data: { success?: boolean; error?: string; review?: Review; pending?: boolean };
        try {
          data = JSON.parse(responseText);
        } catch {
          throw new Error(
            "Review service is unavailable. Please update and restart the backend, then try again.",
          );
        }
        if (!response.ok || !data.success) {
          throw new Error(data.error || "We couldn't submit your review.");
        }
        if (!data.review) {
          throw new Error("Review submitted, but its response was incomplete. Please refresh the page.");
        }

        onReviewSubmitted(data.review);
        setReviewModalVisible(false);
        Alert.alert(
          "Review submitted",
          data.pending
            ? "Thanks! Your review is pending approval."
            : "Thanks for sharing your experience.",
        );
        setRating(0);
        setTitle("");
        setBody("");
      } catch (error) {
        setFormError(
          error instanceof Error ? error.message : "We couldn't submit your review.",
        );
      } finally {
        setSubmitting(false);
      }
    };

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
                  {avgRating.toFixed(1)}
                </Text>
                <View style={{ flexDirection: "row" }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Text
                      key={s}
                      style={{
                        fontSize: 15,
                        color: avgRating >= s ? "#FFB800" : "#e0e0e0",
                      }}
                    >
                      ★
                    </Text>
                  ))}
                </View>
                <Text style={{ fontSize: 13, color: "#aaa" }}>
                  ({reviewCount})
                </Text>
              </View>
            </View>
            <Pressable
              onPress={openReviewModal}
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

          {/* Empty state */}
          {reviewCount === 0 && (
            <View
              style={{
                paddingVertical: 20,
                alignItems: "center",
                gap: 6,
              }}
            >
              <Text style={{ fontSize: 14, color: "#999" }}>
                No reviews yet. Be the first to review this product!
              </Text>
            </View>
          )}

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
                      {review.reviewer?.name?.charAt(0)?.toUpperCase() || "?"}
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
                      {review.reviewer?.name || "Anonymous"}
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
              {!!review.title && (
                <Text
                  style={{ fontSize: 14, fontWeight: "700", color: "#111" }}
                >
                  {review.title}
                </Text>
              )}
              {!!review.body && (
                <Text style={{ fontSize: 14, color: "#666", lineHeight: 21 }}>
                  {review.body}
                </Text>
              )}
              <Text style={{ fontSize: 12, color: "#bbb" }}>
                {formatDate(review.created_at)}
              </Text>
            </View>
          ))}

          {!showAll && reviews.length > 2 && (
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
                View All {reviews.length} Reviews
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
        <Modal
          visible={reviewModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => !submitting && setReviewModalVisible(false)}
        >
          <KeyboardAvoidingView
            style={{
              flex: 1,
            }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View
              style={{
                flex: 1,
                justifyContent: "flex-end",
                backgroundColor: "rgba(17,17,17,0.42)",
              }}
            >
              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ justifyContent: "flex-end", flexGrow: 1 }}
              >
                <View
                  style={{
                    backgroundColor: "#fff",
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    padding: 20,
                    gap: 16,
                  }}
                >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View>
                  <Text style={{ fontSize: 19, fontWeight: "800", color: "#111" }}>Write a review</Text>
                  <Text numberOfLines={1} style={{ fontSize: 13, color: "#888", marginTop: 3 }}>{productTitle}</Text>
                </View>
                <Pressable disabled={submitting} onPress={() => setReviewModalVisible(false)} hitSlop={10}>
                  <Feather name="x" size={22} color="#444" />
                </Pressable>
              </View>

              <View style={{ alignItems: "center", gap: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#555" }}>How would you rate it?</Text>
                <View style={{ flexDirection: "row", gap: 9 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Pressable key={star} onPress={() => setRating(star)} hitSlop={6}>
                      <Text style={{ fontSize: 34, color: star <= rating ? "#FFB800" : "#e5e5e5" }}>★</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <TextInput value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor="#aaa" style={{ borderWidth: 1, borderColor: "#ececec", borderRadius: 10, paddingHorizontal: 14, height: 48, color: "#222" }} />
              <TextInput value={title} onChangeText={setTitle} placeholder="Review title (optional)" placeholderTextColor="#aaa" style={{ borderWidth: 1, borderColor: "#ececec", borderRadius: 10, paddingHorizontal: 14, height: 48, color: "#222" }} />
              <TextInput value={body} onChangeText={setBody} placeholder="Tell us what you loved..." placeholderTextColor="#aaa" multiline textAlignVertical="top" maxLength={2000} style={{ borderWidth: 1, borderColor: "#ececec", borderRadius: 10, padding: 14, minHeight: 105, color: "#222" }} />
              {!!formError && <Text style={{ color: "#d14343", fontSize: 12 }}>{formError}</Text>}
              <Text style={{ fontSize: 11, color: "#999", textAlign: "center" }}>Your review is submitted to Judge.me and may be moderated before appearing publicly.</Text>
                  <Pressable disabled={submitting} onPress={submitReview} style={{ height: 50, borderRadius: 12, backgroundColor: submitting ? "#f5a9b6" : "#F87387", alignItems: "center", justifyContent: "center" }}>
                    {submitting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontSize: 15, fontWeight: "800" }}>Submit review</Text>}
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    );
  },
);

export default ProductBottomSection;
