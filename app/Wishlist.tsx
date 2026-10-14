import { FilterIce, IceSheen } from "@/components/catalog/iceTheme";
import { addCartLine } from "@/lib/cart";
import { createCartKey, useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, Stack } from "expo-router";
import { getAuth } from "@react-native-firebase/auth";
import { collection, deleteDoc, doc, onSnapshot, orderBy, query } from "@react-native-firebase/firestore";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, Pressable, RefreshControl, StatusBar, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { db } from "../firebaseConfig";

interface WishlistItem {
  id: string;
  title: string;
  image: string;
  price: number;
  compareAtPrice?: number;
  discount?: number;
  stock: number;
  variantId: string;
  handle: string;
  size?: string;
}

const money = (value: number) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

function ProductCard({ item, onRemove, onAddToCart }: {
  item: WishlistItem;
  onRemove: (id: string) => Promise<void>;
  onAddToCart: (item: WishlistItem) => Promise<void>;
}) {
  const { width, fontScale } = useWindowDimensions();
  const [busy, setBusy] = useState<"add" | "remove" | null>(null);
  const pending = useRef(false);
  const compact = width < 360 || fontScale > 1.3;
  const outOfStock = item.stock === 0;
  const open = () => router.push({ pathname: "/product/[handle]", params: { handle: item.handle } });
  const act = async (action: "add" | "remove") => {
    if (pending.current) return;
    pending.current = true;
    setBusy(action);
    try { await (action === "add" ? onAddToCart(item) : onRemove(item.id)); }
    finally { pending.current = false; setBusy(null); }
  };
  return (
    <View style={styles.card}>
      <View pointerEvents="none" style={styles.cardFinish}>
        <LinearGradient colors={["#EDF2FC", "#F8F9FD", "#FFFFFF"]} locations={[0, 0.45, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={styles.cardAccent} />
      </View>
      <View style={styles.productRow}>
        <Pressable accessibilityRole="button" accessibilityLabel={`View ${item.title}`} onPress={open} style={[styles.imageBox, compact && styles.compactImage]}>
          {item.image ? <Image source={{ uri: item.image }} resizeMode="cover" style={StyleSheet.absoluteFill} /> : <Feather name="image" size={24} color={FilterIce.accent} />}
        </Pressable>
        <View style={styles.info}>
          <Pressable accessibilityRole="button" accessibilityLabel={`View ${item.title}`} onPress={open}>
            <View style={styles.brandRow}><Text style={styles.brand}>CUPID</Text><Feather name="heart" size={12} color="#8B99AD" /></View>
            <Text numberOfLines={2} style={styles.title}>{item.title}</Text>
            {!!item.size && <Text style={styles.size}>Size: {item.size}</Text>}
            <View style={styles.prices}>
              <Text style={styles.price}>{money(item.price)}</Text>
              {!!item.compareAtPrice && item.compareAtPrice > item.price && <Text style={styles.compare}>{money(item.compareAtPrice)}</Text>}
              {!!item.discount && item.discount > 0 && <View style={styles.discountBadge}><Text style={styles.discount}>{item.discount}% OFF</Text></View>}
            </View>
            {outOfStock ? <Text style={styles.stock}>Currently unavailable</Text> : item.stock > 0 && item.stock <= 3 ? <Text style={styles.stock}>Only {item.stock} left</Text> : null}
          </Pressable>
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" accessibilityLabel={outOfStock ? "Currently unavailable" : item.variantId ? `Add ${item.title} to cart` : `Choose options to add ${item.title} to cart`} accessibilityState={{ disabled: outOfStock || !!busy }} disabled={outOfStock || !!busy} onPress={() => item.variantId ? void act("add") : open()} android_ripple={{ color: "#E7EBF0" }} style={[styles.textButton, styles.primaryAction, (outOfStock || !!busy) && { opacity: 0.5 }]}>
              <Feather name={outOfStock ? "slash" : "shopping-bag"} size={13} color="#39475B" />
              <Text style={styles.actionText}>{busy === "add" ? "Adding..." : outOfStock ? "Unavailable" : "Add to cart"}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${item.title} from wishlist`} disabled={!!busy} onPress={() => void act("remove")} android_ripple={{ color: "#EFF1F4" }} style={styles.textButton}>
              <Feather name="trash-2" size={12} color="#7D858F" />
              <Text style={[styles.actionText, styles.removeText]}>{busy === "remove" ? "Removing..." : "Remove"}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function WishlistScreen() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);
  const setCartItems = useCartStore((state) => state.setCartItems);
  const cartCount = useCartStore((state) => state.cartCount);
  const uid = useAuthStore((state) => state.user?.uid);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let active = true;
    setItems([]);
    setError(false);
    setLoading(Boolean(uid));
    if (!uid) { setRefreshing(false); return; }
    const unsubscribe = onSnapshot(query(collection(db, "users", uid, "wishlist"), orderBy("addedAt", "desc")), (snapshot) => {
      if (!active || getAuth().currentUser?.uid !== uid) return;
      setItems(snapshot.docs.map((entry) => ({ ...entry.data(), id: entry.id }) as WishlistItem));
      setLoading(false);
      setRefreshing(false);
    }, () => {
      if (!active || getAuth().currentUser?.uid !== uid) return;
      setError(true);
      setLoading(false);
      setRefreshing(false);
    });
    return () => { active = false; unsubscribe(); };
  }, [uid, reload]);

  const remove = useCallback(async (id: string) => {
    if (!uid || getAuth().currentUser?.uid !== uid) return;
    try { await deleteDoc(doc(db, "users", uid, "wishlist", id)); }
    catch { Alert.alert("Couldn't remove item", "Please try again."); }
  }, [uid]);

  const add = useCallback(async (item: WishlistItem) => {
    const user = getAuth().currentUser;
    if (!user || user.uid !== uid || !item.variantId) return;
    try {
      const cart = await addCartLine(user, {
        cartKey: createCartKey(item.id, item.variantId), productId: item.id,
        title: item.title, image: item.image, price: item.price,
        compareAtPrice: item.compareAtPrice, discountPercent: item.discount,
        variantId: item.variantId, handle: item.handle, size: item.size ?? "One Size", quantity: 1,
      });
      if (getAuth().currentUser?.uid !== user.uid) return;
      setCartItems(cart);
      Alert.alert("Added to bag", `${item.title} is in your bag.`);
    } catch { Alert.alert("Couldn't add to bag", "Please try again."); }
  }, [uid, setCartItems]);

  return (
    <>
      <Stack.Screen options={{
        headerTitle: "Wishlist", headerTitleStyle: { fontSize: 17, fontWeight: "600", color: "#293447" },
        headerShadowVisible: false, headerStyle: { backgroundColor: FilterIce.header },
        headerLeft: () => <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.headerButton}><Feather name="chevron-left" size={24} color={FilterIce.accent} /></Pressable>,
        headerRight: () => <View style={styles.headerActions}>
          <Pressable accessibilityRole="button" accessibilityLabel="Search products" onPress={() => router.push("/Search")} style={styles.headerButton}><Feather name="search" size={21} color={FilterIce.accent} /></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={`Open cart, ${cartCount} items`} onPress={() => router.push("/Cart")} style={styles.headerButton}>
            <Ionicons name="bag-outline" size={26} color="#555" />
            {cartCount > 0 && <View pointerEvents="none" style={styles.cartBadge}><Text maxFontSizeMultiplier={1.2} style={styles.cartBadgeText}>{cartCount > 99 ? "99+" : cartCount}</Text></View>}
          </Pressable>
        </View>,
      }} />
      <StatusBar barStyle="dark-content" backgroundColor={FilterIce.header} />
      <View style={[styles.screen, { paddingLeft: insets.left, paddingRight: insets.right }]}>
        <FlatList
          style={styles.list}
          data={loading || error ? [] : items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom, 16) + 16 }, (loading || error || items.length === 0) && styles.grow]}
          ListHeaderComponent={!loading && !error && items.length > 0 ? <View style={styles.summary}>
            <IceSheen />
            <View style={styles.summaryIcon}><Feather name="heart" size={22} color={FilterIce.accent} /></View>
            <View style={styles.info}><Text style={styles.summaryTitle}>Your saved favourites</Text><Text style={styles.summarySubtitle}>{items.length} {items.length === 1 ? "piece" : "pieces"} to come back to</Text></View>
          </View> : null}
          ListEmptyComponent={loading ? <View style={styles.loading}><ActivityIndicator color={FilterIce.accent} /><Text style={styles.summarySubtitle}>Loading your favourites...</Text></View> : <View style={styles.empty}>
            <View style={styles.emptyIcon}><IceSheen /><Feather name={error ? "wifi-off" : "heart"} size={34} color={FilterIce.accent} /></View>
            <Text style={styles.emptyTitle}>{error ? "Couldn't load your wishlist" : "Keep your favourites close"}</Text>
            <Text style={styles.emptyText}>{error ? "Check your connection and try again." : "Tap the heart on a piece you love.\nYou'll find it right here."}</Text>
            <Pressable accessibilityRole="button" onPress={() => error ? setReload((value) => value + 1) : router.push("/")} style={styles.emptyButton}><IceSheen /><Text style={styles.actionText}>{error ? "Try again" : "Explore collection"}</Text><Feather name="arrow-right" size={16} color={FilterIce.accent} /></Pressable>
          </View>}
          renderItem={({ item }) => <ProductCard item={item} onRemove={remove} onAddToCart={add} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setReload((value) => value + 1); }} tintColor={FilterIce.accent} colors={[FilterIce.accent]} />}
          showsVerticalScrollIndicator={false}
          initialNumToRender={6}
          windowSize={5}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F7F8FA" },
  headerActions: { flexDirection: "row" },
  headerButton: { width: 44, height: 44, justifyContent: "center", alignItems: "center" },
  cartBadge: { position: "absolute", top: 0, right: 0, minWidth: 18, minHeight: 18, paddingHorizontal: 4, borderRadius: 10, backgroundColor: "#F87387", borderWidth: 1.5, borderColor: FilterIce.header, alignItems: "center", justifyContent: "center" },
  cartBadgeText: { fontSize: 10, lineHeight: 13, fontWeight: "700", color: "#FFFFFF" },
  list: { flex: 1, width: "100%", maxWidth: 640, alignSelf: "center" },
  listContent: { padding: 16, gap: 12 },
  grow: { flexGrow: 1 },
  summary: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 6, borderWidth: 1, borderColor: FilterIce.border, overflow: "hidden", marginBottom: 4 },
  summaryIcon: { width: 42, height: 42, borderRadius: 6, backgroundColor: "#FFFFFF99", alignItems: "center", justifyContent: "center" },
  summaryTitle: { fontSize: 16, fontWeight: "600", color: "#293447", lineHeight: 23 },
  summarySubtitle: { fontSize: 12, color: FilterIce.accent, lineHeight: 18, marginTop: 3 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 6, borderWidth: 1, borderColor: "#DCE3EE", padding: 12, shadowColor: "#667997", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.09, shadowRadius: 7, elevation: 2 },
  cardFinish: { ...StyleSheet.absoluteFillObject, borderRadius: 6, overflow: "hidden" },
  cardAccent: { position: "absolute", top: 0, left: 0, bottom: 0, width: 2, backgroundColor: "#BDCBDF" },
  productRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  imageBox: { width: 82, height: 108, borderRadius: 5, borderWidth: 1, borderColor: "#DCE3EE", overflow: "hidden", backgroundColor: "#F1F3F6", justifyContent: "center", alignItems: "center" },
  compactImage: { width: 68, height: 90 },
  info: { flex: 1, minWidth: 0 },
  brandRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 8 },
  brand: { fontSize: 9, fontWeight: "700", color: FilterIce.accent, letterSpacing: 2 },
  title: { fontSize: 12, lineHeight: 18, fontWeight: "600", color: "#293447" },
  size: { fontSize: 11, lineHeight: 17, color: "#77808C", marginTop: 6 },
  prices: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 6 },
  price: { fontSize: 15, fontWeight: "700", color: "#293447" },
  compare: { fontSize: 12, color: "#959EAA", textDecorationLine: "line-through" },
  discountBadge: { borderRadius: 4, backgroundColor: "#EDF5F0", paddingHorizontal: 5, paddingVertical: 2 },
  discount: { fontSize: 9, fontWeight: "600", lineHeight: 13, color: "#46745B", letterSpacing: 0.2 },
  stock: { fontSize: 11, lineHeight: 16, color: "#886B46", marginTop: 5 },
  actions: { flexDirection: "row", flexWrap: "wrap", columnGap: 20, rowGap: 8, marginTop: 10 },
  textButton: { minHeight: 36, maxWidth: "100%", flexDirection: "row", gap: 6, paddingHorizontal: 10, paddingVertical: 8, overflow: "hidden", justifyContent: "center", alignItems: "center", borderRadius: 4, borderWidth: 1, borderColor: "#DDE1E6" },
  primaryAction: { borderColor: "#8C99AA", borderWidth: 1, borderRadius: 5 },
  actionText: { fontSize: 11, fontWeight: "600", color: "#39475B", flexShrink: 1 },
  removeText: { color: "#7D858F", fontWeight: "400" },
  loading: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, paddingVertical: 40 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 40, paddingHorizontal: 16 },
  emptyIcon: { width: 88, height: 88, borderRadius: 6, alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 24 },
  emptyTitle: { fontSize: 20, fontWeight: "600", lineHeight: 28, textAlign: "center", color: "#293447" },
  emptyText: { fontSize: 13, lineHeight: 21, textAlign: "center", color: "#78818F", marginTop: 10 },
  emptyButton: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, padding: 14, paddingHorizontal: 24, borderRadius: 6, borderWidth: 1, borderColor: FilterIce.border, overflow: "hidden", marginTop: 24 },
});
