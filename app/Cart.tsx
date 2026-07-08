import CartSkeleton from "@/components/CartSkeleton";
import LoginModel from "@/components/modal/LoginModel";
import SignUpModel from "@/components/modal/SignUpModel";
import { auth, db } from "@/firebaseConfig";
import { createCheckoutCart } from "@/lib/shopify";
import { useCartStore } from "@/store/cartStore";
import { useLocationStore } from "@/store/useLocationStore";
import {
  EvilIcons,
  Feather,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter } from "expo-router";
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type CartItem = {
  id: string;
  handle: string;
  variantId: string;
  title: string;
  image: string;
  price: number;
  compareAtPrice?: number;
  discountPercent?: number;
  size: string;
  quantity: number;
};

const C = {
  pink: "#F87387",
  pinkDeep: "#F87395",
  black: "#111111",
  inkDark: "#333333",
  inkMid: "#666666",
  inkLight: "#999999",
  line: "#efefef",
  bg: "#f4f4f4",
  white: "#ffffff",
  green: "#198754",
  greenBg: "#f0faf4",
} as const;

// REMOVED: hardcoded `CHECKOUT_BAR_HEIGHT` constant based on Platform.OS.
// It never matched the bar's real rendered height across devices (iPhone SE vs
// Pro Max vs Android gesture-nav), causing content to be hidden behind the bar
// on some devices and extra dead space on others. The real height is now
// measured at runtime via onLayout (see `checkoutBarHeight` state below) and
// used to pad the FlatList instead.

// Minimum tablet breakpoint used only to cap/center the checkout bar's inner
// row on large screens. Phone layout is untouched.
const TABLET_BREAKPOINT = 768;
const TABLET_MAX_CONTENT_WIDTH = 600;

const S = StyleSheet.create({
  itemRow: {
    backgroundColor: C.white,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 0,
  },
  itemInner: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  itemThumb: {
    width: 100,
    height: 130,
    borderRadius: 4,
    backgroundColor: C.bg,
  },
  buyNow: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 6,
    marginTop: 10,
    overflow: "hidden",
    backgroundColor: C.white,
  },
  buyNowBtn: {
    flexDirection: "row",
    fontSize: 11.5,
    fontWeight: "600",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  discBadge: {
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: C.pink,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderTopLeftRadius: 4,
    borderBottomRightRadius: 6,
  },
  discBadgeTxt: { color: C.white, fontSize: 9, fontWeight: "800" },
  itemInfo: { flex: 1, paddingTop: 2 },
  itemTitle: {
    fontSize: 13.5,
    fontWeight: "600",
    color: C.black,
    lineHeight: 19,
    letterSpacing: -0.1,
  },
  sizePill: {
    alignSelf: "flex-start",
    marginTop: 6,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: C.bg,
  },
  sizeTxt: { fontSize: 11, fontWeight: "600", color: C.inkDark },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 6,
    gap: 7,
  },
  priceMain: {
    fontSize: 18,
    fontWeight: "800",
    color: C.black,
    letterSpacing: -0.4,
  },
  priceStrike: {
    fontSize: 12.5,
    color: C.inkLight,
    textDecorationLine: "line-through",
  },
  priceSave: { fontSize: 11.5, color: C.green, fontWeight: "700" },
  coinsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 5,
    backgroundColor: "#fffbeb",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: "#fde68a",
  },
  coinsTxt: {
    fontSize: 11,
    color: "#b45309",
    fontWeight: "600",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  actionBtns: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: C.white,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  actionBtnTxt: { fontSize: 11.5, fontWeight: "600", color: C.inkDark },
  actionDivider: {
    width: 1,
    height: 16,
    backgroundColor: C.line,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: C.white,
  },
  stepBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  stepMinus: {
    fontSize: 20,
    fontWeight: "300",
    color: C.inkDark,
    lineHeight: 24,
  },
  stepPlus: {
    fontSize: 17,
    fontWeight: "400",
    color: C.inkDark,
    lineHeight: 20,
  },
  stepDiv: { width: 1, height: 16, backgroundColor: C.line },
  stepVal: { width: 34, alignItems: "center" },
  stepValTxt: { fontSize: 13, fontWeight: "700", color: C.black },
  deliveryLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 12,
    paddingBottom: 14,
  },
  deliveryTxt: { fontSize: 11.5, color: C.inkLight },
  deliveryBold: { color: C.inkDark, fontWeight: "600" },
  headerBlock: { backgroundColor: C.white },
  deliverRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  deliverLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  deliverTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: C.black,
  },
  deliverBold: { color: C.inkDark, fontWeight: "700" },
  deliverSub: { fontSize: 11, color: C.inkLight, marginTop: 1 },
  gap8: { height: 8, backgroundColor: C.bg },
  bagRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  bagTitle: { fontSize: 13.5, fontWeight: "800", color: C.black },
  bagCount: { color: C.inkLight, fontWeight: "500" },
  priceSummary: {
    backgroundColor: C.white,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
  },
  priceSummaryTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: C.inkLight,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  priceLineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 11,
  },
  priceLbl: { fontSize: 13, color: C.inkMid },
  priceVal: { fontSize: 13, fontWeight: "600", color: C.black },
  priceDivider: { height: 1, backgroundColor: C.line, marginVertical: 4 },
  priceTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 7,
  },
  priceTotalLbl: { fontSize: 14, fontWeight: "800", color: C.black },
  priceTotalVal: { fontSize: 14, fontWeight: "800", color: C.black },
  savingsBanner: {
    backgroundColor: C.greenBg,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: C.green,
  },
  savingsBannerTxt: { fontSize: 12, color: C.green, fontWeight: "600" },
  // NOTE: paddingBottom / paddingHorizontal / bottom are now applied inline
  // per-instance (see CheckoutBar) because they depend on live safe-area
  // insets. Keeping the static, device-independent parts here only.
  checkoutBar: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: C.white,
    paddingTop: 12,
    // iOS shadow (ignored on Android by RN itself — no Platform.select needed)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.09,
    shadowRadius: 14,
    // Android shadow (ignored on iOS by RN itself)
    elevation: 24,
  },
  checkoutBarInner: {
    // FIX (tablet responsiveness): centers + caps width on large screens,
    // no-op on phones since width < TABLET_MAX_CONTENT_WIDTH.
    width: "100%",
    alignSelf: "center",
  },
  checkoutBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: C.greenBg,
    borderRadius: 6,
    paddingVertical: 8,
    marginBottom: 10,
  },
  checkoutBadgeTxt: { fontSize: 12, fontWeight: "600", color: C.green },
  checkoutBadgeDot: {
    width: 3,
    height: 3,
    borderRadius: 99,
    backgroundColor: C.green,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 36,
    backgroundColor: C.white,
  },
  emptyIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#fff0f4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: C.black,
    letterSpacing: -0.4,
    marginBottom: 10,
  },
  emptyBody: {
    fontSize: 13.5,
    color: C.inkLight,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 28,
  },
  emptyBtn: { paddingHorizontal: 32, paddingVertical: 13, borderRadius: 8 },
  emptyBtnTxt: { color: C.white, fontWeight: "700", fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.38)" },
  modalSheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 14,
    // paddingBottom applied inline with safe-area inset (see Modal usage below)
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: C.line,
    borderRadius: 99,
    alignSelf: "center",
    marginBottom: 22,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: C.black,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  modalSub: { fontSize: 12.5, color: C.inkLight, marginBottom: 18 },
  modalInput: {
    borderWidth: 1.5,
    borderColor: C.line,
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  modalInputTxt: { flex: 1, fontSize: 15, color: C.black, fontWeight: "600" },
  modalBtn: {
    height: 52,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.pink,
    marginBottom: 8,
  },
  modalBtnTxt: { color: C.white, fontSize: 15, fontWeight: "700" },
  modalClose: { alignItems: "center", paddingVertical: 10 },
  modalCloseTxt: { color: C.inkLight, fontWeight: "500", fontSize: 13 },
  headerIcons: { flexDirection: "row", alignItems: "center" },
  headerBtn: { padding: 8 },
  badge: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 15,
    height: 15,
    borderRadius: 99,
    backgroundColor: C.pink,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeTxt: { color: C.white, fontSize: 8, fontWeight: "800" },
});

// ─── QUANTITY STEPPER ---------------------
const QtyStepper = React.memo(
  ({
    qty,
    onIncrease,
    onDecrease,
  }: {
    qty: number;
    onIncrease: () => void;
    onDecrease: () => void;
  }) => (
    <View style={S.stepper}>
      <Pressable onPress={onDecrease} style={S.stepBtn} hitSlop={4}>
        <Text style={S.stepMinus}>−</Text>
      </Pressable>
      <View style={S.stepDiv} />
      <View style={S.stepVal}>
        <Text style={S.stepValTxt}>{qty}</Text>
      </View>
      <View style={S.stepDiv} />
      <Pressable onPress={onIncrease} style={S.stepBtn} hitSlop={4}>
        <Text style={S.stepPlus}>+</Text>
      </Pressable>
    </View>
  ),
);

// ─── CART ITEM ROW --------------------------
const CartItemRow = React.memo(
  ({
    item,
    onCheckout,
    onIncrease,
    onDecrease,
    onRemove,
    onNavigate,
    onWishlist,
  }: {
    item: CartItem;
    onIncrease: () => void;
    onCheckout: () => void;
    onDecrease: () => void;
    onRemove: () => void;
    onNavigate: () => void;
    onWishlist: () => void;
  }) => {
    const hasDiscount =
      !!item.compareAtPrice && item.compareAtPrice > item.price;
    const savedAmt = hasDiscount
      ? (item.compareAtPrice! - item.price) * item.quantity
      : 0;
    const coins = Math.floor(Number(item.price) * 0.04);

    return (
      <View style={S.itemRow}>
        <View style={S.itemInner}>
          {/* Image */}
          <Pressable onPress={onNavigate}>
            <Image
              source={{ uri: item.image }}
              style={S.itemThumb}
              resizeMode="cover"
              fadeDuration={0}
            />
            {!!item.discountPercent && (
              <View style={S.discBadge}>
                <Text style={S.discBadgeTxt}>{item.discountPercent}% OFF</Text>
              </View>
            )}
            <Pressable onPress={onCheckout} style={S.buyNow}>
              <Text style={S.buyNowBtn}>Buy This Now</Text>
            </Pressable>
          </Pressable>

          {/* Info */}
          <View style={S.itemInfo}>
            <Text style={S.itemTitle} numberOfLines={2}>
              {item.title}
            </Text>

            <View style={S.sizePill}>
              <Text style={S.sizeTxt}>Size: {item.size || "M"}</Text>
            </View>

            {/* Price */}
            <View style={S.priceRow}>
              <Text style={S.priceMain}>₹{item.price}</Text>
              {hasDiscount && (
                <>
                  <Text style={S.priceStrike}>₹{item.compareAtPrice}</Text>
                  {savedAmt > 0 && (
                    <Text style={S.priceSave}>−₹{savedAmt}</Text>
                  )}
                </>
              )}
            </View>

            {/* Cupid Coins */}
            <View style={S.coinsRow}>
              <MaterialCommunityIcons
                name="lightning-bolt"
                size={11}
                color="#b45309"
              />
              <Text style={S.coinsTxt}>Earn upto {coins} Cupid Coins</Text>
            </View>

            {/* Qty stepper */}
            <View style={S.actionsRow}>
              <QtyStepper
                qty={item.quantity}
                onIncrease={onIncrease}
                onDecrease={onDecrease}
              />

              {/* Action buttons row */}
              <View style={S.actionBtns}>
                {/* Wishlist */}
                <Pressable onPress={onWishlist} style={S.actionBtn}>
                  <Ionicons name="heart-outline" size={13} color={C.inkDark} />
                  <Text style={S.actionBtnTxt}>Wishlist</Text>
                </Pressable>

                <View style={S.actionDivider} />

                {/* Remove */}
                <Pressable onPress={onRemove} style={S.actionBtn}>
                  <MaterialCommunityIcons
                    name="delete-outline"
                    size={13}
                    color="#ef4444"
                  />
                  <Text style={[S.actionBtnTxt, { color: "#ef4444" }]}>
                    Remove
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Delivery */}
            <View style={S.deliveryLine}>
              <MaterialCommunityIcons
                name="truck-fast-outline"
                size={13}
                color={C.green}
              />
              <Text style={S.deliveryTxt}>
                Free delivery ·{" "}
                <Text style={S.deliveryBold}>Arrives Tomorrow</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: C.line }} />
      </View>
    );
  },
);

// ─── CHECKOUT BAR -------------------------------
// FIX (both platforms): now receives live safe-area insets + window width as
// props instead of relying on Platform.OS branching / hardcoded numbers, and
// reports its own rendered height back to the parent via onLayout so the
// FlatList can reserve exactly enough space — no more, no less.
const CheckoutBar = React.memo(
  ({
    count,
    total,
    shipping,
    onCheckout,
    insetBottom,
    insetLeft,
    insetRight,
    isTablet,
    onBarLayout,
  }: {
    count: number;
    total: number;
    shipping: number;
    onCheckout: () => void;
    insetBottom: number;
    insetLeft: number;
    insetRight: number;
    isTablet: boolean;
    onBarLayout: (e: LayoutChangeEvent) => void;
  }) => {
    if (count === 0) return null;
    const deliveryLabel =
      shipping === 0 ? "Free delivery" : `₹${shipping} delivery`;

    return (
      <View
        onLayout={onBarLayout}
        style={[
          S.checkoutBar,
          {
            // FIX (iOS): bottom sits flush with the screen edge (0, not the
            // previous magic "1") — safe area is handled entirely via
            // paddingBottom below, avoiding the double-safe-area gap.
            bottom: 0,
            // FIX (both): dynamic horizontal safe area for notch/Dynamic
            // Island/rounded-corner devices in landscape.
            paddingLeft: Math.max(16, insetLeft),
            paddingRight: Math.max(16, insetRight),
            // FIX (both): replaces the hardcoded
            // `Platform.OS === "ios" ? 28 : 14`. Scales correctly for iPhone
            // SE (insetBottom = 0) up to Pro Max (insetBottom ≈ 34), and for
            // Android 3-button vs gesture-nav bars.
            paddingBottom: 14 + insetBottom,
          },
        ]}
      >
        <View
          style={[
            S.checkoutBarInner,
            isTablet && { maxWidth: TABLET_MAX_CONTENT_WIDTH },
          ]}
        >
          <View style={S.checkoutBadge}>
            <Text style={S.checkoutBadgeTxt}>
              {count} item{count > 1 ? "s" : ""}
            </Text>
            <View style={S.checkoutBadgeDot} />
            <Text style={S.checkoutBadgeTxt}>{deliveryLabel}</Text>
          </View>

          <Pressable onPress={onCheckout}>
            {({ pressed }) => (
              <View
                style={{
                  height: 56,
                  borderRadius: 6,
                  backgroundColor: pressed ? C.pinkDeep : C.pink,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: 20,
                  shadowColor: "#ff5c84",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.22,
                  shadowRadius: 8,
                  elevation: 10,
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 15,
                    fontWeight: "800",
                    letterSpacing: -0.2,
                  }}
                >
                  Place Order
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 20,
                      fontWeight: "500",
                      letterSpacing: -0.6,
                      marginRight: 4,
                    }}
                  >
                    ₹ {total}
                  </Text>
                  <Feather
                    name="arrow-right"
                    size={18}
                    color="rgba(255,255,255,0.92)"
                  />
                </View>
              </View>
            )}
          </Pressable>
        </View>
      </View>
    );
  },
);

// ─── EMPTY STATE ──────────────────────────────────────────────
const EmptyCart = React.memo(({ onShop }: { onShop: () => void }) => (
  <View
    style={{
      flexGrow: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 30,
      backgroundColor: "#fff",
    }}
  >
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
        source={require("../assets/icons/empty-cart.png")}
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
      Your bag is empty
    </Text>

    <Text
      style={{
        marginTop: 8,
        textAlign: "center",
        color: "#888",
      }}
    >
      Looks like you haven't added anything yet.{"\n"}
      Explore styles made for you
    </Text>

    <TouchableOpacity
      onPress={onShop}
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
    </TouchableOpacity>
  </View>
));

// ─── MAIN SCREEN ──────────────────────────────────────────────
export default function Cart() {
  const router = useRouter();
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinCode, setPinCode] = useState("");
  const [wishlist, setWishlist] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openLogin, setOpenLogin] = useState(false);
  const [openSignup, setOpenSignup] = useState(false);
  const setCartItems = useCartStore((s) => s.setCartItems);
  const cartItems = useCartStore((s) => s.cartItems);
  const insets = useSafeAreaInsets();
  // FIX (tablet + rotation): reactive window size instead of static
  // Dimensions.get(), so rotating the device updates the layout correctly.
  const { width: windowWidth } = useWindowDimensions();
  const isTablet = windowWidth >= TABLET_BREAKPOINT;

  // FIX (both platforms): real, measured checkout-bar height replaces the
  // old hardcoded CHECKOUT_BAR_HEIGHT constant. Starts at 0 (no bar/no
  // padding) and updates once the bar lays out, or resets to 0 when the
  // cart is empty (bar unmounts).
  const [checkoutBarHeight, setCheckoutBarHeight] = useState(0);

  const handleBarLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    setCheckoutBarHeight((prev) => (prev !== h ? h : prev));
  }, []);

  useEffect(() => {
    // Cart just became empty → bar is unmounted, so no bottom padding needed.
    if (cartItems.length === 0 && checkoutBarHeight !== 0) {
      setCheckoutBarHeight(0);
    }
  }, [cartItems.length, checkoutBarHeight]);

  const { subtotal, saved, shipping, total } = useMemo(() => {
    const sub = cartItems.reduce(
      (a, i) => a + Number(i.price || 0) * Number(i.quantity || 1),
      0,
    );
    const sv = cartItems.reduce(
      (a, i) =>
        a +
        (Number(i.compareAtPrice || i.price || 0) - Number(i.price || 0)) *
          Number(i.quantity || 1),
      0,
    );
    const sh = sub > 499 ? 0 : sub === 0 ? 0 : 49;
    return { subtotal: sub, saved: sv, shipping: sh, total: sub + sh };
  }, [cartItems]);

  // Fetch items from firebase / local storage
  useEffect(() => {
    (async () => {
      try {
        await new Promise((r) => setTimeout(r, 0));
        const user = auth.currentUser;
        if (user) {
          const snap = await getDocs(collection(db, "users", user.uid, "cart"));
          const items: CartItem[] = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<CartItem, "id">),
          }));
          setCartItems(items);
          setLoading(false);
        } else {
          const raw = await AsyncStorage.getItem("cartItems");
          setCartItems(raw ? JSON.parse(raw) : []);
          setLoading(false);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const remove = useCallback(
    async (id: string) => {
      const updated = cartItems.filter((i) => i.id !== id);
      setCartItems(updated);
      try {
        const user = auth.currentUser;
        if (user)
          await deleteDoc(
            doc(db, "users", user.uid, "cart", id.split("/").pop()!),
          );
        else await AsyncStorage.setItem("cartItems", JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    },
    [cartItems, setCartItems],
  );

  const persist = useCallback(
    async (items: CartItem[]) => {
      setCartItems(items);
      if (!auth.currentUser)
        await AsyncStorage.setItem("cartItems", JSON.stringify(items));
    },
    [setCartItems],
  );

  const increase = useCallback(
    (id: string) =>
      persist(
        cartItems.map((i) =>
          i.id === id ? { ...i, quantity: i.quantity + 1 } : i,
        ),
      ),
    [cartItems, persist],
  );

  const decrease = useCallback(
    async (id: string) => {
      const item = cartItems.find((i) => i.id === id);

      if (!item) return;
      if (item.quantity <= 0) {
        await remove(id);
        return;
      }

      persist(
        cartItems.map((i) =>
          i.id === id ? { ...i, quantity: i.quantity - 1 } : i,
        ),
      );
    },
    [cartItems, persist, remove],
  );

  const keyExtractor = useCallback(
    (item: CartItem, i: number) => `${item.id}-${item.size ?? i}`,
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: CartItem }) => (
      <CartItemRow
        item={item}
        onCheckout={() => handleCheckoutSingleProduct(item)}
        onIncrease={() => increase(item.id)}
        onDecrease={() => decrease(item.id)}
        onRemove={() => remove(item.id)}
        onWishlist={() => console.log("wishlist", item.id)}
        onNavigate={() =>
          router.push({
            pathname: "/product/[handle]",
            params: { handle: item.handle },
          })
        }
      />
    ),
    [increase, decrease, remove, router],
  );

  // List header (Delivery Address)
  const locationName = useLocationStore((state) => state.location);
  const ListHeader = useCallback(
    () => (
      <View style={S.headerBlock}>
        <Pressable
          onPress={() => router.push("/Select-Location")}
          style={S.deliverRow}
        >
          <View style={S.deliverLeft}>
            <View>
              <Text
                style={{
                  fontSize: 13,
                  color: C.black,
                  lineHeight: 18,
                  flexShrink: 1,
                }}
              >
                <Text style={{ fontWeight: "800" }}>Deliver to:</Text>{" "}
                {locationName ? locationName : "Check date & availability"}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }} />
            </View>
          </View>
        </Pressable>

        <View style={S.gap8} />

        <View style={S.bagRow}>
          <Text style={S.bagTitle}>
            My Bag <Text style={S.bagCount}>({cartItems.length})</Text>
          </Text>
        </View>
      </View>
    ),
    // FIX: `locationName` was previously missing from the dependency array
    // (stale-closure bug — header text could go out of date), and the
    // unused `pinCode` dependency, which caused unnecessary re-renders, was
    // removed. Purely a correctness/perf fix — no UI/behavior change.
    [locationName, cartItems.length],
  );

  const ListFooter = useCallback(() => {
    if (!cartItems.length) return null;
    return (
      <View style={S.priceSummary}>
        <Text style={S.priceSummaryTitle}>Price Details</Text>

        <View style={S.priceLineRow}>
          <Text style={S.priceLbl}>
            MRP ({cartItems.length} item{cartItems.length > 1 ? "s" : ""})
          </Text>
          <Text style={S.priceVal}>₹{subtotal + saved}</Text>
        </View>

        {saved > 0 && (
          <View style={S.priceLineRow}>
            <Text style={S.priceLbl}>Discount</Text>
            <Text style={[S.priceVal, { color: C.green }]}>−₹{saved}</Text>
          </View>
        )}

        <View style={S.priceLineRow}>
          <Text style={S.priceLbl}>Delivery</Text>
          <Text style={[S.priceVal, shipping === 0 && { color: C.green }]}>
            {shipping === 0 ? "FREE" : `₹${shipping}`}
          </Text>
        </View>

        <View style={S.priceDivider} />

        <View style={S.priceTotalRow}>
          <Text style={S.priceTotalLbl}>Total Payable</Text>
          <Text style={S.priceTotalVal}>₹{total}</Text>
        </View>

        {saved > 0 && (
          <View style={S.savingsBanner}>
            <Text style={S.savingsBannerTxt}>
              🎉 You're saving ₹{saved} on this order
            </Text>
          </View>
        )}
      </View>
    );
  }, [cartItems.length, subtotal, saved, shipping, total]);

  const handleCheckoutSingleProduct = useCallback(
    async (product: CartItem) => {
      try {
        if (!auth.currentUser) {
          setOpenLogin(true);
          return;
        }

        const res = await createCheckoutCart(
          [product], // Only this product
          auth.currentUser,
        );

        const checkoutUrl = res?.data?.cartCreate?.cart?.checkoutUrl;

        if (!checkoutUrl) return;

        router.push({
          pathname: "/CheckoutWebview",
          params: { url: checkoutUrl },
        });
      } catch (e) {
        console.log(e);
      }
    },
    [router],
  );

  // FIX (perf): stable handler so CheckoutBar's React.memo isn't broken by a
  // freshly-created function reference on every parent render.
  const handleCheckout = useCallback(async () => {
    try {
      if (!auth.currentUser) {
        setOpenLogin(true);
        return;
      }
      const res = await createCheckoutCart(cartItems, auth.currentUser);
      const checkoutUrl = res?.data?.cartCreate?.cart?.checkoutUrl;
      if (!checkoutUrl) {
        console.log("NO CHECKOUT URL");
        return;
      }
      router.push({
        pathname: "/CheckoutWebview",
        params: { url: checkoutUrl },
      });
    } catch (error) {
      console.log("CHECKOUT ERROR", error);
    }
  }, [cartItems, router]);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      <Stack.Screen
        options={{
          headerTitle: () => (
            <Text style={{ fontSize: 16, fontWeight: "700", color: C.black }}>
              Bag
            </Text>
          ),
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "#fff7f8" },
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <EvilIcons name="chevron-left" size={32} color={C.black} />
            </Pressable>
          ),
          headerRight: () => (
            <View style={S.headerIcons}>
              <Pressable
                onPress={() => router.push("/Search")}
                style={S.headerBtn}
                hitSlop={4}
              >
                <Feather name="search" size={26} color="#555" />
              </Pressable>
              <Pressable
                onPress={() => setWishlist((w) => !w)}
                style={S.headerBtn}
                hitSlop={4}
              >
                <Ionicons
                  name={wishlist ? "heart" : "heart-outline"}
                  size={26}
                  color={wishlist ? C.pink : "#555"}
                />
              </Pressable>
            </View>
          ),
        }}
      />

      {/*
        FIX (iOS gap bug): removed `paddingBottom: insets.bottom` that used
        to live here. CheckoutBar is absolutely positioned inside this View,
        so that padding was pushing the bar up AND the bar was separately
        adding its own bottom inset padding — double-counting the safe area
        and leaving a visible white strip below the bar. The wrapper now
        simply fills the screen; CheckoutBar owns 100% of its own safe-area
        handling.
      */}
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        {loading ? (
          <CartSkeleton />
        ) : (
          <>
            <FlatList
              data={cartItems}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              ListHeaderComponent={ListHeader}
              ListEmptyComponent={<EmptyCart onShop={() => router.push("/")} />}
              ListFooterComponent={ListFooter}
              style={{ flex: 1 }}
              contentContainerStyle={{
                flexGrow: 1,
                backgroundColor: C.bg,
                // FIX (both): dynamic, measured bar height instead of the
                // old static CHECKOUT_BAR_HEIGHT guess. Guarantees the last
                // list item / price summary is never hidden behind the bar,
                // and doesn't over-pad when the bar is smaller (e.g. no
                // home indicator on iPhone SE) or absent (empty cart).
                paddingBottom: checkoutBarHeight,
              }}
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={Platform.OS === "android"}
              maxToRenderPerBatch={6}
              windowSize={8}
              initialNumToRender={5}
            />
            <CheckoutBar
              count={cartItems.length}
              total={total}
              shipping={shipping}
              onCheckout={handleCheckout}
              insetBottom={insets.bottom}
              insetLeft={insets.left}
              insetRight={insets.right}
              isTablet={isTablet}
              onBarLayout={handleBarLayout}
            />

            {/* Pincode modal */}
            <Modal
              visible={pinModalVisible}
              transparent
              animationType="slide"
              onRequestClose={() => setPinModalVisible(false)}
            >
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
              >
                <Pressable
                  onPress={() => setPinModalVisible(false)}
                  style={S.modalOverlay}
                />
                <View
                  style={[
                    S.modalSheet,
                    {
                      // FIX (both): replaces hardcoded
                      // `Platform.OS === "ios" ? 40 : 24` with a value that
                      // scales with the actual home-indicator / gesture-nav
                      // inset on the device, so the "Check Availability"
                      // button and Close row are never cramped against it.
                      paddingBottom: Math.max(20, insets.bottom + 20),
                    },
                  ]}
                >
                  <View style={S.modalHandle} />
                  <Text style={S.modalTitle}>Delivery Location</Text>
                  <Text style={S.modalSub}>
                    Enter pincode to check delivery date & options
                  </Text>
                  <View style={S.modalInput}>
                    <MaterialCommunityIcons
                      name="map-marker-outline"
                      size={18}
                      color={C.inkLight}
                    />
                    <TextInput
                      autoFocus
                      placeholder="Enter 6-digit pincode"
                      placeholderTextColor={C.line}
                      keyboardType="numeric"
                      maxLength={6}
                      value={pinCode}
                      onChangeText={setPinCode}
                      style={S.modalInputTxt}
                    />
                  </View>
                  <Pressable
                    onPress={() => setPinModalVisible(false)}
                    style={({ pressed }) => [
                      S.modalBtn,
                      { backgroundColor: pressed ? C.pinkDeep : C.pink },
                    ]}
                  >
                    <Text style={S.modalBtnTxt}>Check Availability</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setPinModalVisible(false)}
                    style={S.modalClose}
                  >
                    <Text style={S.modalCloseTxt}>Close</Text>
                  </Pressable>
                </View>
              </KeyboardAvoidingView>
            </Modal>
            <LoginModel
              openLogin={openLogin}
              setOpenLogin={setOpenLogin}
              openSignup={setOpenSignup}
            />
            <SignUpModel openModal={openSignup} setOpenModal={setOpenSignup} />
          </>
        )}
      </View>
    </>
  );
}
