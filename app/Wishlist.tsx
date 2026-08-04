import { useCartStore } from "@/store/cartStore";
import { addCartLine } from "@/lib/cart";
import { createCartKey } from "@/store/cartStore";
import {
  EvilIcons,
  Feather,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { getAuth } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { db } from "../firebaseConfig";

// ─── Types ───────────────────────────────────────────────────────────────────

interface WishlistItem {
  id: string;
  title: string;
  image: string;
  price: number;
  compareAtPrice?: number;
  discount?: number;
  rating?: number;
  stock: number;
  addedAt: number;
  variantId: string;
  handle: string;
  size?: string;
}

// ─── Color tokens --------------------------------------

const C = {
  brand: "#F87387",
  softPink: "#FFF4F6",
  lightBorder: "#F8D7DE",
  bg: "#f4f4f4",
  card: "#FFFFFF",
  primary: "#1A1A1A",
  secondary: "#666666",
  muted: "#999999",
  success: "#22A55B",
  warning: "#F59E0B",
  error: "#EF4444",
  softGray: "#F5F5F5",
  borderGray: "#ECECEC",
};

// ─── Skeleton Card -------------------------------------------

const SkeletonCard: React.FC = () => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.75],
  });

  return (
    <Animated.View style={[styles.skeletonCard, { opacity }]}>
      <View style={styles.skeletonImage} />
      <View
        style={{
          flex: 1,
          paddingHorizontal: 12,
          paddingVertical: 10,
          gap: 7,
          justifyContent: "center",
        }}
      >
        <View style={[styles.skeletonLine, { width: "40%", height: 8 }]} />
        <View style={[styles.skeletonLine, { width: "85%" }]} />
        <View style={[styles.skeletonLine, { width: "60%" }]} />
        <View
          style={[
            styles.skeletonLine,
            { width: "45%", height: 8, marginTop: 2 },
          ]}
        />
        <View
          style={[
            styles.skeletonLine,
            { width: "100%", height: 26, borderRadius: 8, marginTop: 4 },
          ]}
        />
      </View>
    </Animated.View>
  );
};

// ─── Wishlist Product Card ────────────────────────────────────────────────────

interface ProductCardProps {
  item: WishlistItem;
  index: number;
  onRemove: (id: string) => void;
  onAddToCart: (item: WishlistItem) => void;
  onQuickView: (item: WishlistItem) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  item,
  index,
  onRemove,
  onAddToCart,
  onQuickView,
}) => {
  const entranceAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const removeAnim = useRef(new Animated.Value(1)).current;
  const heartScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(entranceAnim, {
      toValue: 1,
      delay: index * 70,
      tension: 55,
      friction: 9,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 30,
    }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
    }).start();
  };

  const handleRemove = () => {
    Animated.spring(heartScale, {
      toValue: 1.5,
      useNativeDriver: true,
      speed: 20,
    }).start(() => {
      Animated.timing(removeAnim, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }).start(() => onRemove(item.id));
    });
  };

  const translateX = entranceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 0],
  });
  const isLowStock = item.stock > 0 && item.stock <= 3;
  const isOutOfStock = item.stock === 0;

  return (
    <Animated.View
      style={{
        opacity: Animated.multiply(entranceAnim, removeAnim),
        transform: [{ translateX }, { scale: scaleAnim }],
        marginHorizontal: 16,
        marginBottom: 10,
      }}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onQuickView(item)}
        style={styles.card}
      >
        {/* Left — Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.image }}
            style={styles.productImage}
            resizeMode="cover"
          />

          {/* Discount badge */}
          {item.discount && item.discount > 0 ? (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                {item.discount}%{"\n"}OFF
              </Text>
            </View>
          ) : null}

          {/* Out of stock overlay */}
          {isOutOfStock && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>Out of{"\n"}Stock</Text>
            </View>
          )}
        </View>

        {/* Right — Info */}
        <View style={styles.cardInfo}>
          <View style={{ flex: 1 }}>
            {/* Brand tag */}
            <Text style={styles.brandTag}>CUPID</Text>

            {/* Title */}
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={styles.productTitle}
            >
              {item.title}
            </Text>

            {/* Size */}
            {item.size ? (
              <View style={styles.sizePill}>
                <Text style={styles.sizePillText}>{item.size}</Text>
              </View>
            ) : null}

            {/* Price row */}
            <View style={styles.priceRow}>
              <Text style={styles.price}>
                ₹{item.price.toLocaleString("en-IN")}
              </Text>
              {item.compareAtPrice && item.compareAtPrice > item.price ? (
                <Text style={styles.comparePrice}>
                  ₹{item.compareAtPrice.toLocaleString("en-IN")}
                </Text>
              ) : null}
            </View>

            {/* Low stock */}
            {isLowStock && !isOutOfStock && (
              <Text style={styles.lowStock}>⚡ Only {item.stock} left</Text>
            )}
          </View>

          {/* Bottom actions */}
          <View style={styles.actionsRow}>
            {/* Add to bag */}
            <TouchableOpacity
              style={[
                styles.addToCartBtn,
                isOutOfStock && styles.addToCartDisabled,
              ]}
              onPress={() => !isOutOfStock && onAddToCart(item)}
              disabled={isOutOfStock}
              activeOpacity={0.8}
            >
              <Feather
                name={isOutOfStock ? "slash" : "shopping-bag"}
                size={11}
                color={isOutOfStock ? C.muted : C.brand}
              />
              <Text
                style={[
                  styles.addToCartText,
                  isOutOfStock && { color: C.muted },
                ]}
              >
                {isOutOfStock ? "Unavailable" : "Add to Bag"}
              </Text>
            </TouchableOpacity>

            {/* Icon buttons */}
            <View style={styles.iconGroup}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => onQuickView(item)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Feather name="eye" size={13} color={C.secondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.heartBtn}
                onPress={handleRemove}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                  <Ionicons name="heart" size={14} color={C.brand} />
                </Animated.View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState: React.FC = () => {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1600,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <View
      style={{
        flexGrow: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 30,
        backgroundColor: "#fff",
      }}
    >
      {/* <Ionicons name="cloud-offline-outline" size={50} color="#F87387" /> */}
      <View
        style={{
          borderRadius: 44,
          width: 100,
          height: 100,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 8,
        }}
      >
        <Image
          source={require("../assets/icons/wish-list.png")}
          style={{ width: "100%", height: "100%" }}
          resizeMode="contain"
        />

        {/* <FontAwesome6 name="sad-tear" size={50} color="#F87387" /> */}
      </View>
      <Text
        style={{
          fontSize: 18,
          fontWeight: "700",
          marginTop: 16,
          color: "#222",
        }}
      >
        Your wishlist is feeling empty
      </Text>

      <Text
        style={{
          marginTop: 8,
          textAlign: "center",
          color: "#888",
        }}
      >
        Save pieces you love and come back {"\n"} to them anytime.
      </Text>

      {/* <TouchableOpacity
        onPress={() => router.push("/")}
        style={{
          marginTop: 24,
          backgroundColor: "#F87387",
          paddingHorizontal: 24,
          paddingVertical: 10,
          borderRadius: 4,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>
          Continue Shopping
        </Text>
      </TouchableOpacity> */}
    </View>
  );
};

// ─── Wishlist Summary Bar ─────────────────────────────────────────────────────

interface SummaryBarProps {
  count: number;
  totalValue: number;
}

const SummaryBar: React.FC<SummaryBarProps> = ({ count, totalValue }) => (
  <View style={styles.summaryBar}>
    <View style={styles.summaryItem}>
      <Text style={styles.summaryValue}>{count}</Text>
      <Text style={styles.summaryLabel}>Saved Items</Text>
    </View>
    <View style={styles.summaryDivider} />
    <View style={styles.summaryItem}>
      <Text style={styles.summaryValue}>
        ₹{totalValue.toLocaleString("en-IN")}
      </Text>
      <Text style={styles.summaryLabel}>Wishlist Value</Text>
    </View>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function WishlistScreen() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const setCartItems = useCartStore((s) => s.setCartItems);
  const insets = useSafeAreaInsets();
  const auth = getAuth();
  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "users", uid, "wishlist"),
      orderBy("addedAt", "desc"),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data: WishlistItem[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<WishlistItem, "id">),
        }));
        setItems(data);
        setLoading(false);
        setRefreshing(false);
      },
      (err) => {
        console.error("Wishlist listener error:", err);
        setLoading(false);
        setRefreshing(false);
      },
    );

    return () => unsub();
  }, [uid]);

  const handleRemove = useCallback(
    async (productId: string) => {
      if (!uid) return;
      try {
        await deleteDoc(doc(db, "users", uid, "wishlist", productId));
      } catch (e) {
        Alert.alert("Oops", "Couldn't remove item. Try again.");
      }
    },
    [uid],
  );

  const handleAddToCart = useCallback(
    async (item: WishlistItem) => {
      if (!item.variantId) {
        Alert.alert(
          "Choose a variant",
          "Please open this product and select its size or color before adding it to your bag.",
        );
        return;
      }

      try {
        const cart = await addCartLine(auth.currentUser, {
          cartKey: createCartKey(item.id, item.variantId),
          productId: item.id,
          title: item.title,
          image: item.image,
          price: item.price,
          compareAtPrice: item.compareAtPrice,
          discountPercent: item.discount,
          variantId: item.variantId,
          handle: item.handle,
          size: item.size ?? "One Size",
          quantity: 1,
        });
        setCartItems(cart);
        Alert.alert("Added to Bag", `${item.title} is in your bag.`);
      } catch (error) {
        console.error("Wishlist add to cart error:", error);
        Alert.alert("Couldn't add to Bag", "Please try again.");
      }
    },
    [auth.currentUser, setCartItems],
  );

  const handleQuickView = useCallback((item: WishlistItem) => {
    router.push({
      pathname: "/product/[handle]",
      params: { handle: item.handle },
    });
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const totalValue = items.reduce((sum, i) => sum + i.price, 0);

  if (loading) {
    return (
      <View
        style={{ flex: 1, backgroundColor: C.bg, paddingBottom: insets.bottom }}
      >
        <Stack.Screen
          options={{
            headerTitle: () => (
              <Text
                style={{ fontSize: 16, fontWeight: "600", color: "#1a1a1a" }}
              >
                Wishlist0
              </Text>
            ),
            headerShadowVisible: false,
            headerStyle: { backgroundColor: "#fff7f8" },
            headerLeft: () => (
              <Pressable onPress={() => router.back()}>
                <EvilIcons name="chevron-left" size={34} color="#1a1a1a" />
              </Pressable>
            ),
            headerRight: () => (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <Pressable
                  onPress={() => router.push("/Search")}
                  style={{ padding: 6 }}
                >
                  <Feather name="search" size={26} color="#555" />
                </Pressable>
                <Pressable
                  onPress={() => router.push("/Wishlist")}
                  style={{ padding: 6 }}
                >
                  <MaterialCommunityIcons name="cart-outline" size={26} />
                </Pressable>
              </View>
            ),
          }}
        />
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        <View style={styles.skeletonGrid}>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#1a1a1a" }}>
              Wishlist
            </Text>
          ),
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "#fff7f8" },
          headerLeft: () => (
            <Pressable onPress={() => router.back()}>
              <EvilIcons name="chevron-left" size={34} color="#1a1a1a" />
            </Pressable>
          ),
          headerRight: () => (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Pressable
                onPress={() => router.push("/Search")}
                style={{ padding: 6 }}
              >
                <Feather name="search" size={26} color="#555" />
              </Pressable>
              <Pressable
                onPress={() => router.push("/Cart")}
                style={{ padding: 6 }}
              >
                <Ionicons name="cart-outline" size={28} color="#555" />
              </Pressable>
            </View>
          ),
        }}
      />
      <View
        style={{ flex: 1, backgroundColor: C.bg, paddingBottom: insets.bottom }}
      >
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={
            items.length === 0
              ? styles.emptyListContainer
              : styles.listContainer
          }
          ListHeaderComponent={
            items.length > 0 ? (
              <SummaryBar count={items.length} totalValue={totalValue} />
            ) : null
          }
          ListEmptyComponent={<EmptyState />}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.brand}
              colors={[C.brand]}
            />
          }
          renderItem={({ item, index }) => (
            <ProductCard
              item={item}
              index={index}
              onRemove={handleRemove}
              onAddToCart={handleAddToCart}
              onQuickView={handleQuickView}
            />
          )}
        />
      </View>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Summary Bar
  summaryBar: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: C.softPink,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.lightBorder,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "space-around",
  },
  summaryItem: {
    alignItems: "center",
    flex: 1,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "700",
    color: C.primary,
    letterSpacing: -0.3,
  },
  summaryLabel: {
    fontSize: 11,
    color: C.muted,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: C.lightBorder,
  },

  // List
  listContainer: {
    paddingBottom: 40,
    paddingTop: 4,
  },
  emptyListContainer: {
    flexGrow: 1,
  },

  // Skeleton
  skeletonGrid: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  skeletonCard: {
    flexDirection: "row",
    height: 112,
    borderRadius: 6,
    backgroundColor: C.card,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.borderGray,
    marginBottom: 10,
  },
  skeletonImage: {
    width: 90,
    backgroundColor: C.softGray,
  },
  skeletonLine: {
    height: 11,
    borderRadius: 6,
    backgroundColor: C.softGray,
  },

  // ─── Product Card ───────────────────────────────────────────────────────────
  card: {
    flexDirection: "row",
    backgroundColor: C.card,
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.borderGray,
    height: 112,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  // Image — left side, fixed width
  imageContainer: {
    position: "relative",
    width: 90,
    height: "100%",
    backgroundColor: C.softGray,
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  discountBadge: {
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: C.brand,
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderBottomRightRadius: 10,
  },
  discountText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.2,
    textAlign: "center",
    lineHeight: 11,
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,247,248,0.82)",
    alignItems: "center",
    justifyContent: "center",
  },
  outOfStockText: {
    fontSize: 8,
    fontWeight: "600",
    color: C.secondary,
    textAlign: "center",
    letterSpacing: 0.3,
    lineHeight: 13,
  },

  // Info — right side
  cardInfo: {
    flex: 1,
    paddingLeft: 12,
    paddingRight: 10,
    paddingVertical: 10,
    justifyContent: "space-between",
  },
  brandTag: {
    fontSize: 9,
    fontWeight: "700",
    color: C.brand,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  productTitle: {
    fontSize: 12,
    fontWeight: "500",
    color: C.primary,
    lineHeight: 17,
    letterSpacing: 0.1,
    wordWrap: "break-word",
  },
  sizePill: {
    alignSelf: "flex-start",
    backgroundColor: C.softGray,
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
    borderWidth: 1,
    borderColor: C.borderGray,
  },
  sizePillText: {
    fontSize: 9,
    color: C.secondary,
    fontWeight: "500",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  price: {
    fontSize: 13,
    fontWeight: "700",
    color: C.primary,
  },
  comparePrice: {
    fontSize: 11,
    color: C.muted,
    textDecorationLine: "line-through",
  },
  lowStock: {
    fontSize: 9,
    color: C.warning,
    fontWeight: "600",
    marginTop: 2,
  },

  // Actions
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  addToCartBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: C.brand,
    backgroundColor: C.softPink,
  },
  addToCartDisabled: {
    borderColor: C.borderGray,
    backgroundColor: C.softGray,
  },
  addToCartText: {
    fontSize: 10,
    fontWeight: "600",
    color: C.brand,
    letterSpacing: 0.2,
  },
  iconGroup: {
    flexDirection: "row",
    gap: 5,
  },
  iconBtn: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: C.softGray,
    borderWidth: 1,
    borderColor: C.borderGray,
    alignItems: "center",
    justifyContent: "center",
  },
  heartBtn: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: C.softPink,
    borderWidth: 1,
    borderColor: C.lightBorder,
    alignItems: "center",
    justifyContent: "center",
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingTop: 40,
    backgroundColor: "#fff",
  },
  emptyIconRing: {
    width: 68,
    height: 68,
    borderRadius: 44,
    // backgroundColor: C.softPink,
    // borderWidth: 1.5,
    // borderColor: C.lightBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: C.primary,
    textAlign: "center",
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: C.muted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 28,
  },
  shopBtn: {
    backgroundColor: C.brand,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 6,
  },
  shopBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },
});
