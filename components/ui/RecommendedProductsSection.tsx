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

// ─────────────────────────────────────────────────────────────────────────
// RECENTLY VIEWED CARD
// ─────────────────────────────────────────────────────────────────────────
const RecentlyViewedCard = React.memo(
  ({
    viewedProduct,
  }: {
    viewedProduct: NonNullable<Props["viewedProduct"]>;
  }) => (
    <View style={styles.viewedCard}>
      <Image
        source={{ uri: viewedProduct.image }}
        style={styles.viewedImage}
        contentFit="cover"
        transition={150}
      />
      <View style={styles.viewedTextWrap}>
        <Text style={styles.viewedPrefix}>Based on your interest in</Text>
        <Text style={styles.viewedTitle} numberOfLines={1}>
          {viewedProduct.title}
        </Text>
        <Text style={styles.viewedSuffix}>
          {viewedProduct.subtitle ?? "You viewed this recently"}
        </Text>
      </View>
    </View>
  ),
);

// ─────────────────────────────────────────────────────────────────────────
// CENTER DIVIDER WITH HEART
// ─────────────────────────────────────────────────────────────────────────
const HeartDivider = React.memo(() => (
  <View style={styles.dividerRow}>
    <View style={styles.dividerLine} />
    <MaterialCommunityIcons
      name="heart"
      size={12}
      color="#F0417D"
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
              <Feather name="heart" size={15} color="#1c1c1c" />
            </Pressable>

            {/* Badge */}
            {!!item.badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            )}
          </View>

          <View style={styles.infoWrap}>
            {/* Rating row */}
            {!!item.rating && (
              <View style={styles.ratingRow}>
                <Feather name="star" size={11} color="#F0417D" />
                <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                {!!item.reviewCount && (
                  <Text style={styles.reviewText}>
                    ({item.reviewCount.toLocaleString()})
                  </Text>
                )}
              </View>
            )}

            {/* Title */}
            <Text style={styles.productTitle} numberOfLines={1}>
              {item.title}
            </Text>

            {/* Price row */}
            <View style={styles.priceRow}>
              <Text style={styles.price}>₹{item.price}</Text>
              {!!item.compareAtPrice && (
                <Text style={styles.comparePrice}>₹{item.compareAtPrice}</Text>
              )}
            </View>
          </View>
        </Pressable>

        {/* Add to Bag button */}
        <Animated.View style={bagAnimatedStyle}>
          <Pressable
            onPress={() => onAddToBag(item)}
            onPressIn={handleBagPressIn}
            onPressOut={handleBagPressOut}
            style={styles.addToBagBtn}
          >
            <Feather name="shopping-bag" size={13} color="#F0417D" />
            <Text style={styles.addToBagText}>Add to Bag</Text>
          </Pressable>
        </Animated.View>
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
  const GAP = 12;
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
  }, []);

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
              color="#F0417D"
              style={{ marginLeft: 4 }}
            />
          </View>
          <Text style={styles.subHeading}>{subHeading}</Text>
        </View>

        {onViewAll && (
          <Pressable onPress={onViewAll} style={styles.viewAllBtn}>
            <Text style={styles.viewAllText}>View All</Text>
            <Feather name="chevron-right" size={16} color="#7C3FD6" />
          </Pressable>
        )}
      </View>

      {/* Recently viewed card */}
      {viewedProduct && (
        <View style={styles.viewedWrap}>
          <RecentlyViewedCard viewedProduct={viewedProduct} />
        </View>
      )}

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
    color: "#1c1c1c",
    letterSpacing: 0.2,
  },
  subHeading: {
    fontSize: 12.5,
    color: "#888",
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
    color: "#7C3FD6",
  },

  // Recently viewed card
  viewedWrap: {
    paddingHorizontal: 16,
    marginTop: 14,
  },
  viewedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FDEDF3",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F9D3E2",
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
    color: "#8a7a80",
  },
  viewedTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1c1c1c",
    marginTop: 1,
  },
  viewedSuffix: {
    fontSize: 11.5,
    color: "#8a7a80",
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
    color: "#1c1c1c",
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
    backgroundColor: "#F6C9DB",
  },

  // Product card
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
  },
  imageWrap: {
    width: "100%",
    aspectRatio: 0.85,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  wishlistBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  badge: {
    position: "absolute",
    bottom: 8,
    left: 0,
    backgroundColor: "#F0417D",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.4,
  },
  infoWrap: {
    paddingTop: 8,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ratingText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#1c1c1c",
  },
  reviewText: {
    fontSize: 11,
    color: "#999",
  },
  productTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1c1c1c",
    marginTop: 3,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 3,
  },
  price: {
    fontSize: 14.5,
    fontWeight: "800",
    color: "#F0417D",
  },
  comparePrice: {
    fontSize: 12,
    color: "#aaa",
    textDecorationLine: "line-through",
  },
  addToBagBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: "#F0417D",
    borderRadius: 20,
    paddingVertical: 8,
  },
  addToBagText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#F0417D",
  },
});
