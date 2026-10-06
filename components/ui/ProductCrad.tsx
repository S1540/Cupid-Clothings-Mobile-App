import { preloadProductImages } from "@/lib/productImagePreload";
import { swipeTarget } from "@/lib/productSwipe";
import { fetchCatalog, productPath } from "@/store/catalogStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { AppState, Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

type ProductImageSwiperProps = {
  images: { url: string; alt: string }[];
  height: number;
  onPress: () => void;
  onSimilarPress: () => void;
  onPrefetch: () => void;
  title: string;
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
const SNAP = {
  damping: 28,
  stiffness: 240,
  mass: 0.8,
  overshootClamping: true,
};
const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1610476650745-58700c3defa5?w=200&q=60";
// Cupid's coral pink, with a darker shade for readable small accents.
const BRAND = { pink: "#F87387", ink: "#A83F56", soft: "#FFF1F4" };

const FirstOrderOffer = memo(() => {
  const turn = useSharedValue(0);
  const reduceMotion = useReducedMotion();
  const isFocused = useIsFocused();

  useEffect(() => {
    const update = (state: string) => {
      cancelAnimation(turn);
      turn.value = 0;
      if (state !== "active" || !isFocused || reduceMotion) return;
      const timing = { duration: 400, easing: Easing.inOut(Easing.cubic) };
      turn.value = withRepeat(
        withSequence(
          withDelay(2600, withTiming(1, timing)),
          withDelay(2600, withTiming(0, timing)),
        ),
        -1,
      );
    };
    update(AppState.currentState);
    const subscription = AppState.addEventListener("change", update);
    return () => {
      subscription.remove();
      cancelAnimation(turn);
    };
  }, [isFocused, reduceMotion, turn]);

  const offerStyle = useAnimatedStyle(() => ({
    opacity: turn.value < 0.5 ? 1 : 0,
    transform: [{ perspective: 600 }, { rotateX: `${-180 * turn.value}deg` }],
  }));
  const codeStyle = useAnimatedStyle(() => ({
    opacity: turn.value >= 0.5 ? 1 : 0,
    transform: [
      { perspective: 600 },
      { rotateX: `${180 * (1 - turn.value)}deg` },
    ],
  }));

  return (
    <View
      style={styles.offerWrap}
      accessible
      accessibilityLabel="10% off on first order. Use code WELCUPID10."
    >
      {reduceMotion ? (
        <View style={styles.offerRow}>
          <Text style={styles.firstOrderOffer}>
            <Text style={styles.offerDiscount}>10% off</Text> · Use WELCUPID10
          </Text>
        </View>
      ) : (
        <View
          style={styles.offerStage}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <View style={[styles.offerRow, styles.offerSizer]}>
            <MaterialCommunityIcons
              name="tag-outline"
              size={11}
              color={BRAND.ink}
            />
            <Text style={styles.firstOrderOffer}>
              <Text style={styles.offerDiscount}>10% off</Text> on first order
            </Text>
          </View>
          <Animated.View
            style={[styles.offerRow, styles.offerFace, offerStyle]}
          >
            <MaterialCommunityIcons
              name="tag-outline"
              size={11}
              color="#26834A"
            />
            <Text style={styles.firstOrderOffer}>
              <Text style={styles.offerDiscount}>10% off</Text> on first order
            </Text>
          </Animated.View>
          <Animated.View style={[styles.offerRow, styles.offerFace, codeStyle]}>
            <MaterialCommunityIcons
              name="tag-outline"
              size={11}
              color={BRAND.ink}
            />
            <Text style={[styles.firstOrderOffer, styles.offerCode]}>
              Use WELCUPID10
            </Text>
          </Animated.View>
        </View>
      )}
    </View>
  );
});
FirstOrderOffer.displayName = "FirstOrderOffer";

const ImageDots = memo(
  ({ count, activeIndex }: { count: number; activeIndex: number }) => {
    if (count <= 1) return null;
    const visibleCount = Math.min(count, 5);
    const startIndex = Math.min(
      Math.max(activeIndex - 2, 0),
      count - visibleCount,
    );
    return (
      <View pointerEvents="none" style={styles.imageDots}>
        {Array.from(
          { length: visibleCount },
          (_, index) => startIndex + index,
        ).map((i) => (
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
  ({
    images,
    height,
    onPress,
    onSimilarPress,
    onPrefetch,
    title,
  }: ProductImageSwiperProps) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [width, setWidth] = useState(0);
    const offset = useSharedValue(0);
    const startOffset = useSharedValue(0);
    const page = useSharedValue(0);
    const totalImages = images.length;

    useEffect(() => {
      preloadProductImages(
        images.slice(Math.max(0, activeIndex - 1), activeIndex + 3),
      );
    }, [images, activeIndex]);
    useEffect(() => {
      cancelAnimation(offset);
      page.value = Math.min(page.value, totalImages - 1);
      offset.value = -page.value * width;
    }, [width, totalImages, offset, page]);
    const trackStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: offset.value }],
    }));

    const panGesture = useMemo(
      () =>
        Gesture.Pan()
          .enabled(totalImages > 1 && width > 0)
          .activeOffsetX([-10, 10])
          .failOffsetY([-VERTICAL_CANCEL_THRESHOLD, VERTICAL_CANCEL_THRESHOLD])
          .onStart(() => {
            cancelAnimation(offset);
            startOffset.value = offset.value;
          })
          .onUpdate((e) => {
            const next = Math.max(
              -(page.value + 1) * width,
              Math.min(
                -(page.value - 1) * width,
                startOffset.value + e.translationX,
              ),
            );
            const min = -(totalImages - 1) * width;
            offset.value =
              next > 0
                ? next * 0.2
                : next < min
                  ? min + (next - min) * 0.2
                  : next;
          })
          .onEnd((e) => {
            const next = swipeTarget(
              page.value,
              totalImages,
              width,
              e.translationX,
              e.velocityX,
            );
            page.value = next;
            runOnJS(setActiveIndex)(next);
            offset.value = withSpring(-next * width, SNAP);
          })
          .onFinalize((_e, success) => {
            if (!success) offset.value = withSpring(-page.value * width, SNAP);
          }),
      [totalImages, width, offset, startOffset, page],
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

    return (
      <View
        style={[styles.productImageWrap, { height }]}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      >
        <GestureDetector gesture={composedGesture}>
          <View style={StyleSheet.absoluteFillObject}>
            {width > 0 ? (
              <Animated.View
                style={[
                  { flexDirection: "row", width: width * totalImages, height },
                  trackStyle,
                ]}
              >
                {images.map((img, index) => (
                  <View key={`${img.url}-${index}`} style={{ width, height }}>
                    {Math.abs(index - activeIndex) <= 1 && (
                      <Image
                        source={{ uri: img.url }}
                        style={StyleSheet.absoluteFillObject}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        transition={0}
                        priority={index === activeIndex ? "high" : "normal"}
                        accessibilityLabel={img.alt || "Product image"}
                      />
                    )}
                  </View>
                ))}
              </Animated.View>
            ) : (
              <Image
                source={{ uri: images[0]?.url ?? DEFAULT_IMAGE }}
                style={StyleSheet.absoluteFillObject}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={0}
              />
            )}
          </View>
        </GestureDetector>
        <View pointerEvents="box-none" style={styles.imageControls}>
          <ImageDots count={totalImages} activeIndex={activeIndex} />
        </View>
        <View pointerEvents="box-none" style={styles.similarAnchor}>
          <Pressable
            onPress={onSimilarPress}
            onPressIn={onPrefetch}
            style={styles.similarBtn}
            accessibilityRole="button"
            accessibilityLabel={`Find styles similar to ${title}`}
            hitSlop={12}
          >
            {({ pressed }) => (
              <View
                style={[styles.similarIcon, pressed && styles.controlPressed]}
              >
                <MaterialCommunityIcons
                  name="cards-outline"
                  size={22}
                  color="#65444F"
                />
              </View>
            )}
          </Pressable>
        </View>
      </View>
    );
  },
);

const ProductCard = memo(
  ({ item, productImageHeight, reviewSummary, onPress }: ProductCardProps) => {
    const router = useRouter();
    const productId = item.id.split("/").pop();
    const review = productId && reviewSummary ? reviewSummary[productId] : null;
    const hasDiscount = Number(item.compareAtPrice) > Number(item.price);
    const discount = hasDiscount
      ? Math.round((1 - Number(item.price) / Number(item.compareAtPrice)) * 100)
      : 0;
    const formatPrice = (value: string) =>
      Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 });

    const handlePress = useCallback(() => {
      void fetchCatalog(productPath(item.handle)).catch(() => {});
      router.push({
        pathname: "/product/[handle]",
        params: { handle: item.handle },
      });
    }, [item.handle, router]);

    const handlePrefetch = useCallback(() => {
      void fetchCatalog(productPath(item.handle)).catch(() => {});
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
        <View style={{ height: productImageHeight, position: "relative" }}>
          <ProductImageSwiper
            key={`${item.id}:${images.map((image) => image.url).join("|")}`}
            images={images}
            height={productImageHeight}
            onPress={handlePress}
            onSimilarPress={onPress}
            onPrefetch={handlePrefetch}
            title={item.title}
          />

          {review && Number(review.reviewCount) > 0 && (
            <View pointerEvents="none" style={styles.ratingBadge}>
              <MaterialCommunityIcons name="star" size={12} color="#E9A817" />
              <Text style={styles.ratingText}>
                {Number(review.averageRating).toFixed(1)}
              </Text>
              <View style={styles.ratingDivider} />
              <Text style={styles.reviewCount}>{review.reviewCount}</Text>
            </View>
          )}
        </View>

        {/* Info section — separate Pressable so the whole card is tappable */}
        <Pressable
          onPress={handlePress}
          onPressIn={handlePrefetch}
          accessibilityRole="button"
          accessibilityLabel={`View ${item.title}`}
          style={({ pressed }) => [
            styles.infoSection,
            pressed && styles.infoPressed,
          ]}
        >
          <Text numberOfLines={2} style={styles.productTitle}>
            {item.title}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{formatPrice(item.price)}</Text>
            {hasDiscount && item.compareAtPrice && (
              <Text style={styles.comparePrice}>
                ₹{formatPrice(item.compareAtPrice)}
              </Text>
            )}
            {discount > 0 && (
              <Text style={styles.discount}>{discount}% off</Text>
            )}
          </View>
          <FirstOrderOffer />
        </Pressable>
      </View>
    );
  },
);
export default ProductCard;

ImageDots.displayName = "ImageDots";
ProductImageSwiper.displayName = "ProductImageSwiper";
ProductCard.displayName = "ProductCard";

const styles = StyleSheet.create({
  imageControls: {
    position: "absolute",
    bottom: 0,
    left: 6,
    right: 6,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  imageDots: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  imageDot: {
    width: 5,
    height: 5,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 0.5,
    borderColor: "rgba(70,40,48,0.3)",
  },
  imageDotActive: {
    width: 14,
    backgroundColor: BRAND.pink,
  },
  //   Product Card
  productImageWrap: {
    position: "relative",
    width: "100%",
    backgroundColor: "#F5F1EE",
    overflow: "hidden",
  },
  productCard: {
    width: "48.5%",
    marginBottom: 28,
  },
  ratingBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    flexDirection: "row",
    gap: 3,
    maxWidth: "65%",
    backgroundColor: "rgba(255,255,255,0.68)",
    alignItems: "center",
  },
  ratingText: { fontSize: 11, fontWeight: "600", color: "#30262A" },
  ratingDivider: {
    width: 1,
    height: 10,
    backgroundColor: "#DDD3D6",
    marginHorizontal: 1,
  },
  reviewCount: { fontSize: 10, color: "#766A70", flexShrink: 1 },
  similarAnchor: {
    position: "absolute",
    right: 6,
    bottom: 8,
    width: 30,
    height: 30,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.68)",
    zIndex: 10,
  },
  similarBtn: {
    width: "100%",
    height: "100%",
  },
  similarIcon: {
    flex: 1,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  controlPressed: { backgroundColor: "#F7DDE5", transform: [{ scale: 0.94 }] },
  infoSection: {
    paddingTop: 18,
    paddingHorizontal: 2,
    paddingBottom: 10,
    gap: 14,
  },
  infoPressed: { opacity: 0.7 },
  productTitle: {
    fontSize: 13.5,
    fontWeight: "400",
    color: "#686168",
    lineHeight: 22,
    letterSpacing: 0.1,
    minHeight: 44,
  },
  priceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    columnGap: 8,
    rowGap: 6,
  },
  price: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
    color: "#29242A",
    fontVariant: ["tabular-nums"],
  },
  comparePrice: {
    fontSize: 11,
    color: "#898389",
    lineHeight: 17,
    textDecorationLine: "line-through",
  },
  discount: {
    fontSize: 11,
    fontWeight: "500",
    color: "#287847",
    lineHeight: 17,
  },
  offerWrap: { alignSelf: "flex-start", maxWidth: "100%", marginTop: 0 },
  offerRow: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EFF7FA",
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  firstOrderOffer: {
    fontSize: 10.5,
    lineHeight: 16,
    fontWeight: "400",
    color: "#626A73",
    flexShrink: 1,
  },
  offerStage: { alignSelf: "flex-start", maxWidth: "100%" },
  offerSizer: { opacity: 0 },
  offerFace: {
    position: "absolute",
    top: 0,
    left: 0,
    backfaceVisibility: "hidden",
  },
  offerCode: { fontWeight: "500", color: BRAND.ink },
  offerDiscount: { color: "#26834A", fontWeight: "600" },
});
