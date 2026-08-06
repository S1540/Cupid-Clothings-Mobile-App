// components/product/RecommendedProductsSection.tsx
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";

// ─────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────
export interface ProductItem {
  id: string;
  title: string;
  handle: string;
  image: string;
  price: number;
  compareAtPrice?: number;
  rating?: number;
  reviewCount?: number;
  badge?: string;
}

interface Props {
  heading: string;
  subHeading: string;
  viewedProduct?: {
    title: string;
    image: string;
    subtitle?: string;
  };
  products: ProductItem[];
  onPressProduct: (item: ProductItem) => void;
  onAddToBag: (item: ProductItem) => void;
  onWishlist: (item: ProductItem) => void;
  onViewAll?: () => void;
}

// ─── App theme — only colors already used across the app ──────────────────
const PRIMARY = "#F0417D";
const BG = "#fff";
const SOFT_BG = "#FFF7F8";
const BORDER = "#F3F3F3";
const LIGHT_TEXT = "#8A8A8A";
const INK = "#1A1A1A";
const DISCOUNT_GREEN = "#22C55E";

const HeartDivider = React.memo(() => (
  <View style={styles.dividerRow}>
    <View style={styles.dividerLine} />
    <MaterialCommunityIcons
      name="heart"
      size={12}
      color={PRIMARY}
      style={{ marginHorizontal: 8 }}
    />
    <View style={styles.dividerLine} />
  </View>
));

// ─────────────────────────────────────────────────────────────────────────
// PRODUCT CARD
// ─────────────────────────────────────────────────────────────────────────
const ProductCard = React.memo(
  ({
    item,
    cardWidth,
    onPressProduct,
    onAddToBag,
    onWishlist,
  }: {
    item: ProductItem;
    cardWidth: number;
    onPressProduct: (item: ProductItem) => void;
    onAddToBag: (item: ProductItem) => void;
    onWishlist: (item: ProductItem) => void;
  }) => {
    const imageScale = useSharedValue(1);
    const cardScale = useSharedValue(1);
    const bagScale = useSharedValue(1);

    const handlePressIn = useCallback(() => {
      imageScale.value = withTiming(1.06, {
        duration: 220,
        easing: Easing.out(Easing.ease),
      });
      cardScale.value = withTiming(0.98, {
        duration: 220,
        easing: Easing.out(Easing.ease),
      });
    }, []);

    const handlePressOut = useCallback(() => {
      imageScale.value = withTiming(1, {
        duration: 220,
        easing: Easing.out(Easing.ease),
      });
      cardScale.value = withTiming(1, {
        duration: 220,
        easing: Easing.out(Easing.ease),
      });
    }, []);

    const handleBagPressIn = useCallback(() => {
      bagScale.value = withTiming(0.94, { duration: 120 });
    }, []);

    const handleBagPressOut = useCallback(() => {
      bagScale.value = withTiming(1, { duration: 120 });
    }, []);

    const imageAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: imageScale.value }],
    }));

    const cardAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: cardScale.value }],
    }));

    const bagAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: bagScale.value }],
    }));

    const discountPercent =
      item.compareAtPrice && item.compareAtPrice > item.price
        ? Math.round(
            ((item.compareAtPrice - item.price) / item.compareAtPrice) * 100,
          )
        : null;

    return (
      <Animated.View
        style={[styles.card, { width: cardWidth }, cardAnimatedStyle]}
      >
        <Pressable
          onPress={() => onPressProduct(item)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <View style={styles.imageWrap}>
            <Animated.View style={imageAnimatedStyle}>
              <Image
                source={{ uri: item.image }}
                style={styles.image}
                contentFit="cover"
                transition={150}
                placeholder={{ blurhash: "L5H2EC=PM+yV0g-mq.wG9c010J}I" }}
              />
            </Animated.View>

            {/* Wishlist button */}
            <Pressable
              onPress={() => onWishlist(item)}
              hitSlop={8}
              style={styles.wishlistBtn}
            >
              <Feather name="heart" size={14} color={INK} />
            </Pressable>

            {/* Badge */}
            {!!item.badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            )}

            {/* Rating pill — frosted glass look */}
            {!!item.rating && (
              <View style={styles.ratingPill}>
                <Feather name="star" size={10} color="#F59E0B" />
                <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                {!!item.reviewCount && (
                  <Text style={styles.reviewText}>
                    ({item.reviewCount.toLocaleString()})
                  </Text>
                )}
              </View>
            )}
          </View>

          <View style={styles.infoWrap}>
            {/* Title */}
            <Text numberOfLines={2} style={styles.productTitle}>
              {item.title}
            </Text>

            {/* Price row */}
            <View style={styles.priceRow}>
              <Text style={styles.price}>₹{item.price}</Text>
              {!!item.compareAtPrice && (
                <Text style={styles.comparePrice}>₹{item.compareAtPrice}</Text>
              )}
              {!!discountPercent && (
                <View style={styles.discountPill}>
                  <Text style={styles.discountPillText}>
                    {discountPercent}% OFF
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Pressable>

        {/* Add to Bag button */}
        {/* <View style={styles.addToBagWrap}>
          <Animated.View style={bagAnimatedStyle}>
            <Pressable
              onPress={() => onAddToBag(item)}
              onPressIn={handleBagPressIn}
              onPressOut={handleBagPressOut}
              style={styles.addToBagBtn}
            >
              <Feather name="shopping-bag" size={13} color={PRIMARY} />
              <Text style={styles.addToBagText}>Add to Bag</Text>
            </Pressable>
          </Animated.View>
        </View> */}
      </Animated.View>
    );
  },
);

// ─────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────
function RecommendedProductsSection({
  heading,
  subHeading,
  viewedProduct,
  products,
  onPressProduct,
  onAddToBag,
  onWishlist,
  onViewAll,
}: Props) {
  const [recommendations, setRecommendations] = useState<ProductItem[]>([]);
  const { width } = useWindowDimensions();
  const HORIZONTAL_PADDING = 16;
  const GAP = 6;
  const cardWidth = (width - HORIZONTAL_PADDING * 2 - GAP) / 2;
  const keyExtractor = useCallback((item: ProductItem) => item.id, []);

  const renderItem = useCallback(
    ({ item }: { item: ProductItem }) => (
      <ProductCard
        item={item}
        cardWidth={cardWidth}
        onPressProduct={onPressProduct}
        onAddToBag={onAddToBag}
        onWishlist={onWishlist}
      />
    ),
    [cardWidth, onPressProduct, onAddToBag, onWishlist],
  );
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log("products", products);
      setRecommendations(products);
    }, 1000);
    return () => clearTimeout(timer);
  }, [products]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <View style={styles.headingRow}>
            <Text style={styles.heading} numberOfLines={1}>
              {heading}
            </Text>
            <MaterialCommunityIcons
              name="heart-outline"
              size={16}
              color={PRIMARY}
              style={{ marginLeft: 4 }}
            />
          </View>
          <Text style={styles.subHeading}>{subHeading}</Text>
        </View>

        {/* {onViewAll && (
          <Pressable onPress={onViewAll} style={styles.viewAllBtn}>
            <Text style={styles.viewAllText}>View All</Text>
            <Feather name="chevron-right" size={16} color={PRIMARY} />
          </Pressable>
        )} */}
      </View>

      {/* Recently viewed card */}
      {/* {viewedProduct && (
        <View style={styles.viewedWrap}>
          <RecentlyViewedCard viewedProduct={viewedProduct} />
        </View>
      )} */}

      {/* You may also love + divider */}
      <View style={styles.sectionHeadingWrap}>
        <Text style={styles.sectionHeading}>YOU MAY ALSO LOVE</Text>
        <HeartDivider />
      </View>

      {/* 2-column products grid */}
      <FlatList
        data={products}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        numColumns={2}
        scrollEnabled={false}
        columnWrapperStyle={{
          gap: GAP,
          paddingHorizontal: HORIZONTAL_PADDING,
        }}
        contentContainerStyle={{ gap: 16, paddingTop: 4 }}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        removeClippedSubviews
      />
    </View>
  );
}

export default React.memo(RecommendedProductsSection);

// ─────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingVertical: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  heading: {
    fontSize: 19,
    fontWeight: "800",
    color: INK,
    letterSpacing: 0.2,
  },
  subHeading: {
    fontSize: 12.5,
    color: LIGHT_TEXT,
    marginTop: 2,
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingTop: 4,
  },
  viewAllText: {
    fontSize: 13.5,
    fontWeight: "700",
    color: PRIMARY,
  },

  // Recently viewed card
  viewedWrap: {
    paddingHorizontal: 16,
    marginTop: 14,
  },
  viewedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: SOFT_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 10,
  },
  viewedImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  viewedTextWrap: {
    flex: 1,
  },
  viewedPrefix: {
    fontSize: 11.5,
    color: LIGHT_TEXT,
  },
  viewedTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: INK,
    marginTop: 1,
  },
  viewedSuffix: {
    fontSize: 11.5,
    color: LIGHT_TEXT,
    marginTop: 1,
  },

  // Section heading + divider
  sectionHeadingWrap: {
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: "800",
    color: INK,
    letterSpacing: 0.6,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#F9D3E2",
  },

  // Product card — premium framed look: soft border, tiny shadow,
  // padded so the image reads as inset rather than edge-to-edge.
  card: {
    backgroundColor: BG,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
    padding: 4,
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 0.2,
  },
  imageWrap: {
    width: "100%",
    aspectRatio: 0.75,
    overflow: "hidden",
    position: "relative",
    backgroundColor: SOFT_BG,
    borderRadius: 4,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  wishlistBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  badge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: PRIMARY,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.4,
  },

  // Rating pill — frosted white, bottom-left over the image.
  ratingPill: {
    position: "absolute",
    bottom: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.88)",
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.04)",
  },
  ratingText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: INK,
  },
  reviewText: {
    fontSize: 10,
    color: LIGHT_TEXT,
  },

  infoWrap: {
    paddingTop: 10,
    paddingHorizontal: 2,
    gap: 5,
  },
  productTitle: {
    fontSize: 12,
    fontWeight: "500",
    color: INK,
    lineHeight: 18,
    letterSpacing: -0.1,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 1,
  },
  price: {
    fontSize: 16,
    fontWeight: "800",
    color: INK,
    letterSpacing: -0.2,
  },
  comparePrice: {
    fontSize: 12,
    color: LIGHT_TEXT,
    textDecorationLine: "line-through",
  },
  discountPill: {
    backgroundColor: "rgba(34,197,94,0.12)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: DISCOUNT_GREEN,
    letterSpacing: 0.2,
  },

  addToBagWrap: {
    marginTop: 10,
    paddingHorizontal: 2,
    paddingBottom: 2,
  },
  addToBagBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.3,
    borderColor: PRIMARY,
    backgroundColor: BG,
  },
  addToBagText: {
    fontSize: 12,
    fontWeight: "700",
    color: PRIMARY,
  },
});
