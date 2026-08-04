import { Image } from "expo-image";
import React, { memo, useCallback, useMemo, useState } from "react";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

type ProductImageSwiperProps = {
  images: { url: string; alt: string }[];
  height: number;
  onPress: () => void;
};
type ProductCardProps = {
  item: Product;
  productImageHeight: number;
  reviewSummary: any;
  onPress: () => void;
};
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

const VERTICAL_CANCEL_THRESHOLD = 12;
const SWIPE_THRESHOLD = 38;
const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1610476650745-58700c3defa5?w=200&q=60";

const ImageDots = memo(
  ({ count, activeIndex }: { count: number; activeIndex: number }) => {
    if (count <= 1) return null;
    return (
      <View style={styles.imageDots}>
        {Array.from({ length: count }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.imageDot,
              i === activeIndex && styles.imageDotActive,
            ]}
          />
        ))}
      </View>
    );
  },
);

const ProductImageSwiper = memo(
  ({ images, height, onPress }: ProductImageSwiperProps) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const totalImages = images.length;

    const goNext = useCallback(() => {
      setActiveIndex((prev) => (prev < totalImages - 1 ? prev + 1 : prev));
    }, [totalImages]);

    const goPrev = useCallback(() => {
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
    }, []);

    const panGesture = useMemo(
      () =>
        Gesture.Pan()
          .activeOffsetX([-10, 10])
          .failOffsetY([-VERTICAL_CANCEL_THRESHOLD, VERTICAL_CANCEL_THRESHOLD])
          .onEnd((e) => {
            "worklet";
            if (totalImages <= 1) return;
            if (e.translationX < -SWIPE_THRESHOLD) {
              runOnJS(goNext)();
            } else if (e.translationX > SWIPE_THRESHOLD) {
              runOnJS(goPrev)();
            }
          }),
      [totalImages, goNext, goPrev],
    );

    const tapGesture = useMemo(
      () =>
        Gesture.Tap()
          .maxDistance(10)
          .onEnd((_e, success) => {
            "worklet";
            if (success) {
              runOnJS(onPress)();
            }
          }),
      [onPress],
    );

    const composedGesture = useMemo(
      () => Gesture.Exclusive(panGesture, tapGesture),
      [panGesture, tapGesture],
    );

    const currentImageUrl = images[activeIndex]?.url ?? DEFAULT_IMAGE;

    return (
      <GestureDetector gesture={composedGesture}>
        <View style={[styles.productImageWrap, { height }]}>
          <Image
            source={{ uri: currentImageUrl }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={120}
          />
          <ImageDots count={totalImages} activeIndex={activeIndex} />
        </View>
      </GestureDetector>
    );
  },
);

const ProductCard = memo(
  ({ item, productImageHeight, reviewSummary, onPress }: ProductCardProps) => {
    const router = useRouter();
    const productId = item.id.split("/").pop();
    const review = productId && reviewSummary ? reviewSummary[productId] : null;
    // console.log(review);

    const handlePress = useCallback(() => {
      router.push({
        pathname: "/product/[handle]",
        params: { handle: item.handle },
      });
    }, [item.handle, router]);

    const handlePrefetch = useCallback(() => {
      router.prefetch(`/product/${item.handle}`);
    }, [item.handle, router]);
    const images = useMemo(
      () =>
        item.images?.length ? item.images : [{ url: DEFAULT_IMAGE, alt: "" }],
      [item.images],
    );

    return (
      <View style={styles.productCard}>
        {/* Swipeable image — tap also handled inside */}
        <View>
          <ProductImageSwiper
            images={images}
            height={productImageHeight}
            onPress={handlePress}
          />

          <Pressable
            onPressIn={handlePrefetch}
            style={styles.wishlistBtn}
            hitSlop={8}
          >
            {review && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 4,
                  opacity: 0.9,
                  paddingVertical: 1,
                  paddingHorizontal: 2,
                  borderRadius: 2,
                  backgroundColor: "rgba(255,255,255,0.88)",
                }}
              >
                <MaterialCommunityIcons name="star" size={13} color="#F59E0B" />

                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    marginLeft: 3,
                  }}
                >
                  {review.averageRating} ({review.reviewCount})
                </Text>
              </View>
            )}
          </Pressable>
          <Pressable
            onPress={onPress}
            onPressIn={handlePrefetch}
            style={styles.similerBtn}
            hitSlop={8}
          >
            <MaterialCommunityIcons
              name="cards-outline"
              size={24}
              color="black"
              opacity={0.7}
            />
          </Pressable>
        </View>

        {/* Info section — separate Pressable so the whole card is tappable */}
        <Pressable onPress={handlePress} style={{ padding: 10, gap: 4 }}>
          <Text numberOfLines={2} style={styles.productTitle}>
            {item.title}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{item.price}</Text>
            {item.compareAtPrice && (
              <Text style={styles.comparePrice}>₹{item.compareAtPrice}</Text>
            )}
            {item.discountPercent && (
              <Text style={styles.discount}>{item.discountPercent}% off</Text>
            )}
          </View>
          <Text style={styles.firstOrderOffer}>30% off on first order</Text>
        </Pressable>
      </View>
    );
  },
);

export default ProductCard;

const styles = StyleSheet.create({
  imageDots: {
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  imageDot: {
    width: 5,
    height: 5,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  imageDotActive: {
    width: 14,
    backgroundColor: "#fff",
  },
  //   Product Card
  productImageWrap: {
    width: "100%",
    backgroundColor: "#fafafa",
    overflow: "hidden",
  },
  productCard: {
    width: "49%",
    backgroundColor: "#fff",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: "#f0f0f0",
  },
  wishlistBtn: {
    position: "absolute",
    bottom: 8,
    left: 8,
    borderRadius: 20,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  similerBtn: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 20,
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    opacity: 0.9,
  },
  productTitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#1a1a1a",
    lineHeight: 17,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  price: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  comparePrice: {
    fontSize: 11,
    color: "#bbb",
    textDecorationLine: "line-through",
  },
  discount: {
    fontSize: 11,
    fontWeight: "600",
    color: "#22a55b",
  },
  firstOrderOffer: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "#22a55b",
    marginTop: 2,
  },
});
