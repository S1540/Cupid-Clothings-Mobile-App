import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useMemo,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Modal,
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  BackHandler,
  Pressable,
  ListRenderItemInfo,
  Platform,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, Edge } from "react-native-safe-area-context";
/**
 * ------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------
 */
interface Product {
  id: string;
  title: string;
  handle: string;
  price: string;
  compareAtPrice: string | null;
  discountPercent: number | null;
  images: {
    url: string;
    alt: string;
  }[];
}

interface SimilarProductsModalProps {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
}

const CARD_SPACING = 12;
const LIST_HORIZONTAL_PADDING = 16; // matches styles.listContent.paddingHorizontal
const ANIMATION_DURATION = 300;
const SAFE_AREA_EDGES: Edge[] = ["bottom"];

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);
function getCardWidth(screenWidth: number) {
  const cardsFullyVisible =
    screenWidth >= 1024 ? 4 : screenWidth >= 768 ? 3 : 2;

  // Subtle edge peek on phones (~18-22% of a card), a bit more generous on
  // tablets where there's room to spare. Tune these to taste.
  const peekFraction =
    screenWidth >= 1024
      ? 0.5
      : screenWidth >= 768
        ? 0.4
        : screenWidth >= 400
          ? 0.22
          : 0.18;

  const availableWidth = screenWidth - LIST_HORIZONTAL_PADDING * 2;
  const totalGaps = cardsFullyVisible;
  const totalCardUnits = cardsFullyVisible + peekFraction;
  const rawWidth = (availableWidth - totalGaps * CARD_SPACING) / totalCardUnits;
  return clamp(rawWidth, 130, 220);
}
function getModalHeight(screenHeight: number) {
  return clamp(screenHeight * 0.47, 320, screenHeight * 0.85);
}

const fetchRecommendedProducts = async (productId: string) => {
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_URL}/api/products/recommendations/${encodeURIComponent(productId)}`,
    // `http://localhost:3000/api/products/recommendations/${encodeURIComponent(productId)}`,
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text);
  }
  return response.json();
};

// Prodcut memorization to avoid unnecessary re-renders
interface ProductCardProps {
  product: Product;
  isLast: boolean;
  cardWidth: number;
  onPress: () => void;
}

const ProductCard: React.FC<ProductCardProps> = React.memo(
  ({ product, isLast, cardWidth, onPress }) => {
    return (
      <Pressable
        onPress={onPress}
        style={[styles.card, { width: cardWidth }, isLast && styles.cardLast]}
      >
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: product.images[0]?.url }}
            style={styles.image}
            resizeMode="cover"
          />

          <TouchableOpacity
            style={styles.wishlistButton}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {/* <Text style={styles.wishlistIcon}>♡</Text> */}
            <Ionicons
              name="heart-outline"
              size={18}
              color="black"
              opacity={0.5}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.title} numberOfLines={2}>
            {product.title}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}> ₹{product.price}</Text>
            <Text style={styles.comparePrice}> ₹{product.compareAtPrice}</Text>
            <Text style={styles.discountBadgeText}>
              {product.discountPercent}% off
            </Text>
            {/* <View style={styles.discountBadge}></View> */}
          </View>
        </View>
      </Pressable>
    );
  },
);

ProductCard.displayName = "ProductCard";

/**
 * ------------------------------------------------------------------
 * SimilarProductsModal
 * ------------------------------------------------------------------
 */
const SimilarProductsModal: React.FC<SimilarProductsModalProps> = ({
  visible,
  product,
  onClose,
}) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const CARD_WIDTH = useMemo(() => getCardWidth(screenWidth), [screenWidth]);
  const MODAL_HEIGHT = useMemo(
    () => getModalHeight(screenHeight),
    [screenHeight],
  );

  const slideAnim = useRef(new Animated.Value(MODAL_HEIGHT)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [isRendered, setIsRendered] = React.useState(visible);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const router = useRouter();

  /**
   * Drive the open/close animation whenever `visible` changes.
   */
  useEffect(() => {
    if (visible) {
      setIsRendered(true);
      Animated.parallel([
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: MODAL_HEIGHT,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setIsRendered(false);
        }
      });
    }
  }, [visible, overlayAnim, slideAnim, MODAL_HEIGHT]);
  // fetch product data according product id or show in similar products modal //
  useEffect(() => {
    if (!visible || !product?.id) return;
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(false);
        const data = await fetchRecommendedProducts(product.id || "");

        if (mounted) {
          setRecommendedProducts(data);
        }
      } catch (e) {
        if (mounted) {
          setError(true);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [visible, product]);
  useEffect(() => {
    if (!visible) {
      setRecommendedProducts([]);
    }
  }, [visible]);

  // Hardware back button closes the modal (Android)//
  useEffect(() => {
    if (!visible) return;

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        onClose();
        return true;
      },
    );

    return () => backHandler.remove();
  }, [visible, onClose]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const keyExtractor = useCallback((item: Product) => item.id.toString(), []);

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Product>) => (
      <ProductCard
        product={item}
        isLast={index === recommendedProducts.length - 1}
        cardWidth={CARD_WIDTH}
        onPress={() => {
          setIsRendered(false);
          router.push(`/product/${item.handle}`);
          return;
        }}
      />
    ),
    [recommendedProducts.length, CARD_WIDTH],
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<Product> | null | undefined, index: number) => ({
      length: CARD_WIDTH + CARD_SPACING,
      offset: (CARD_WIDTH + CARD_SPACING) * index,
      index,
    }),
    [CARD_WIDTH],
  );

  const listData = recommendedProducts;

  if (!isRendered) {
    return null;
  }

  return (
    <Modal
      visible={isRendered}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      {/* Overlay */}
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: overlayAnim,
          },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheetContainer,
          // FIX: height is now applied inline from the live, clamped
          // MODAL_HEIGHT instead of a static value baked into the
          // module-level StyleSheet, so it responds to rotation/resizing.
          { height: MODAL_HEIGHT },
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <SafeAreaView edges={SAFE_AREA_EDGES} style={styles.sheetInner}>
          {/* Drag handle */}
          <View style={styles.handleWrapper}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Similar Products</Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Body */}
          <FlatList
            data={listData}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToAlignment="start"
            decelerationRate="fast"
            // FIX: snap interval now tracks the live CARD_WIDTH instead of a
            // frozen constant, so snapping stays accurate after a resize.
            snapToInterval={CARD_WIDTH + CARD_SPACING}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            getItemLayout={getItemLayout}
            contentContainerStyle={styles.listContent}
            initialNumToRender={4}
            maxToRenderPerBatch={4}
            windowSize={5}
            removeClippedSubviews={Platform.OS === "android"}
          />
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
};

export default React.memo(SimilarProductsModal);

/**
 * ------------------------------------------------------------------
 * Styles
 * ------------------------------------------------------------------
 */
const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheetContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  sheetInner: {
    flex: 1,
  },
  handleWrapper: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E0E0E0",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    letterSpacing: 0.2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: {
    fontSize: 15,
    color: "#333333",
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginBottom: 16,
  },
  listContent: {
    paddingHorizontal: LIST_HORIZONTAL_PADDING,
    paddingBottom: 20,
    alignItems: "flex-start",
  },
  card: {
    marginRight: CARD_SPACING,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 0.5,
      },
    }),
  },
  cardLast: {
    marginRight: 16,
  },
  imageWrapper: {
    width: "100%",
    aspectRatio: 4 / 5, // Scales proportionally with whatever width the card is given — no change needed here.
    position: "relative",
    backgroundColor: "#FAFAFA",
  },
  image: {
    width: "100%",
    height: "100%",
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  wishlistButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
      },
      android: {
        elevation: 0.5,
      },
    }),
  },
  wishlistIcon: {
    fontSize: 15,
    color: "#333333",
  },
  //   discountBadge: {
  //     position: "absolute",
  //     bottom: 8,
  //     left: 8,
  //     backgroundColor: "#E63946",
  //     paddingHorizontal: 6,
  //     paddingVertical: 3,
  //     borderRadius: 4,
  //   },
  //   discountBadgeText: {
  //     fontSize: 10,
  //     fontWeight: "700",
  //     color: "#FFFFFF",
  //   },
  ratingBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  ratingBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  cardBody: {
    paddingHorizontal: 10,
    paddingTop: 10,
    // FIX: a little extra breathing room at the bottom of the card, as
    // requested (was 12).
    paddingBottom: 18,
  },
  title: {
    fontSize: 13,
    fontWeight: "500",
    color: "#1A1A1A",
    lineHeight: 17,
    // NOTE: fixed `height: 34` removed on purpose — it forced every card's
    // title block to occupy 2 lines' worth of space even when the actual
    // title only wrapped to 1 line. `numberOfLines={2}` (set on the <Text>
    // in ProductCard) still caps it at a max of 2 lines; the box itself now
    // just takes however much height that real content needs.
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 6,
  },
  price: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  comparePrice: {
    fontSize: 12,
    color: "#9E9E9E",
    textDecorationLine: "line-through",
  },
  discountBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#16990c",
  },
});
