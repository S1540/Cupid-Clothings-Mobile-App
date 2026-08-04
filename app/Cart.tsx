import CartSkeleton from "@/components/CartSkeleton";
import LoginModel from "@/components/modal/LoginModel";
import SignUpModel from "@/components/modal/SignUpModel";
import SuccessToast from "@/components/SuccessToast";
import { auth, db } from "@/firebaseConfig";
import { loadCart, removeCartLine, setCartLineQuantity } from "@/lib/cart";
import { createCheckoutCart } from "@/lib/shopify";
import { type CartItem, useCartStore } from "@/store/cartStore";
import { useLocationStore } from "@/store/useLocationStore";
import {
  EvilIcons,
  Feather,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { collection, deleteDoc, doc, onSnapshot, setDoc } from "firebase/firestore";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
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

const TABLET_BREAKPOINT = 768;
const TABLET_MAX_CONTENT_WIDTH = 600;
const SMALL_SCREEN_BREAKPOINT = 340;
const FONT_SCALE_TIGHT = 1.3;
const FONT_SCALE_NORMAL = 1.6;

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
    // UI: consistent 8-radius across the screen (was 4) for a more premium,
    // unified look.
    borderRadius: 4,
    backgroundColor: C.bg,
  },
  buyNow: {
    borderWidth: 1,
    borderColor: C.line,
    // UI: consistent radius + slightly taller so it reads as a real
    // secondary button (min ~36-38dp) instead of a thin strip.
    borderRadius: 6,
    marginTop: 12,
    overflow: "hidden",
    backgroundColor: C.white,
    minHeight: 44,
  },
  buyNowBtn: {
    flexDirection: "row",
    fontSize: 11.5,
    fontWeight: "700",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    minHeight: 44,
  },
  discBadge: {
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: C.pink,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderTopLeftRadius: 6,
    borderBottomRightRadius: 8,
  },
  discBadgeTxt: { color: C.white, fontSize: 9, fontWeight: "800" },
  itemInfo: { flex: 1, paddingTop: 2, minWidth: 0 },
  // UI: lighter weight + softer ink (not pure black) so the product name
  // reads clean/regular like the reference design instead of bold-black.
  itemTitle: {
    fontSize: 13,
    fontWeight: "400",
    color: C.inkMid,
    lineHeight: 18,
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
  sizeTxt: { fontSize: 11, fontWeight: "500", color: C.inkMid },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 7,
    gap: 7,
    // RESPONSIVE: wraps instead of overflowing/clipping when the strike
    // price + savings tag can't fit next to the main price on very narrow
    // screens or with large font scale.
    flexWrap: "wrap",
  },
  priceMain: {
    fontSize: 16,
    fontWeight: "700",
    color: C.black,
    letterSpacing: -0.2,
  },
  priceStrike: {
    fontSize: 12.5,
    color: C.inkLight,
    textDecorationLine: "line-through",
  },
  priceSave: { fontSize: 11, color: C.green, fontWeight: "600" },
  coinsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
    backgroundColor: "#fffbeb",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: "#fde68a",
  },
  coinsTxt: {
    fontSize: 11,
    color: "#b45309",
    fontWeight: "500",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    // RESPONSIVE: rowGap/columnGap kick in only when the row wraps/stacks
    // (small-screen branch below), keeping normal-width layout unaffected.
    rowGap: 10,
    columnGap: 10,
  },
  actionBtns: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 0,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: C.white,
    minHeight: 44,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    // UI: each button now grows to share the row equally and never
    // compresses its label.
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  actionBtnTxt: {
    fontSize: 11.5,
    fontWeight: "600",
    color: C.inkDark,
    flexShrink: 1,
  },
  actionDivider: {
    width: 1,
    alignSelf: "stretch",
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
    // UI: 44dp minimum touch target height to match action buttons.
    minHeight: 44,
  },
  stepBtn: {
    width: 40,
    height: 44,
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
  stepDiv: { width: 1, height: 18, backgroundColor: C.line },
  stepVal: { width: 38, alignItems: "center" },
  stepValTxt: { fontSize: 13, fontWeight: "600", color: C.inkDark },
  deliveryLine: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 12,
    paddingBottom: 14,
  },
  deliveryTxt: { fontSize: 11.5, color: C.inkLight, flex: 1, lineHeight: 16 },
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
  bagTitle: { fontSize: 14, fontWeight: "700", color: C.black },
  bagCount: { color: C.inkLight, fontWeight: "500" },
  priceSummary: {
    backgroundColor: C.white,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    // UI: gentle "card" elevation so the price summary reads as a distinct,
    // premium module rather than a flat block.
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
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
  priceLbl: { fontSize: 13, color: C.inkMid, fontWeight: "400" },
  priceVal: { fontSize: 13, fontWeight: "500", color: C.inkDark },
  priceDivider: { height: 1, backgroundColor: C.line, marginVertical: 4 },
  priceTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 7,
  },
  priceTotalLbl: { fontSize: 14, fontWeight: "700", color: C.black },
  priceTotalVal: { fontSize: 14, fontWeight: "700", color: C.black },
  savingsBanner: {
    backgroundColor: C.greenBg,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: C.green,
  },
  savingsBannerTxt: { fontSize: 12, color: C.green, fontWeight: "500" },
  // UI: new trust-signal strip shown below the price summary — purely
  // additive, no layout dependency for anything above/below it.
  trustRow: {
    flexDirection: "row",
    backgroundColor: C.white,
    marginTop: 1,
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  trustItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 6,
    paddingHorizontal: 4,
  },
  trustText: {
    fontSize: 10.5,
    fontWeight: "500",
    color: C.inkMid,
    textAlign: "center",
    lineHeight: 13,
  },
  // NOTE: paddingBottom / paddingHorizontal / bottom are now applied inline
  // per-instance (see CheckoutBar) because they depend on live safe-area
  // insets. Keeping the static, device-independent parts here only.
  checkoutBar: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: C.white,
    paddingTop: 12,
    // UI: rounded top corners give the bar a modern "sheet docked to the
    // bottom" feel instead of a hard rectangular strip.
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
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
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 10,
  },
  checkoutBadgeTxt: {
    fontSize: 12,
    fontWeight: "500",
    color: C.green,
    flexShrink: 1,
  },
  checkoutBadgeDot: {
    width: 3,
    height: 3,
    borderRadius: 99,
    backgroundColor: C.green,
  },
  // UI: small trust microcopy under the CTA. Bar height is measured at
  // runtime (onLayout) so adding this line automatically adjusts the
  // FlatList's bottom padding — no manual offset needed.
  checkoutTrustTxt: {
    textAlign: "center",
    fontSize: 10.5,
    color: C.inkLight,
    fontWeight: "500",
    marginTop: 8,
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
    fontWeight: "700",
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
      {/* UI: hitSlop kept + larger stepBtn box (40x44) so the tap target
          comfortably clears the 44dp minimum without changing behavior. */}
      <Pressable onPress={onDecrease} style={S.stepBtn} hitSlop={4}>
        <Text style={S.stepMinus} maxFontSizeMultiplier={FONT_SCALE_TIGHT}>
          −
        </Text>
      </Pressable>
      <View style={S.stepDiv} />
      <View style={S.stepVal}>
        <Text style={S.stepValTxt} maxFontSizeMultiplier={FONT_SCALE_TIGHT}>
          {qty}
        </Text>
      </View>
      <View style={S.stepDiv} />
      <Pressable onPress={onIncrease} style={S.stepBtn} hitSlop={4}>
        <Text style={S.stepPlus} maxFontSizeMultiplier={FONT_SCALE_TIGHT}>
          +
        </Text>
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
    isWishlisted,
  }: {
    item: CartItem;
    onIncrease: () => void;
    onCheckout: () => void;
    onDecrease: () => void;
    onRemove: () => void;
    onNavigate: () => void;
    onWishlist: () => void;
    isWishlisted: boolean;
  }) => {
    const hasDiscount =
      !!item.compareAtPrice && item.compareAtPrice > item.price;
    const savedAmt = hasDiscount
      ? (item.compareAtPrice! - item.price) * item.quantity
      : 0;
    const coins = Math.floor(Number(item.price) * 0.04);
    const { width } = useWindowDimensions();
    const isSmallScreen = width <= SMALL_SCREEN_BREAKPOINT;
    // RESPONSIVE: caps the row's content width and centers it on tablets,
    // mirroring the same pattern already used for the checkout bar, so the
    // row doesn't stretch into an oversized, awkward layout on large screens.
    const isTablet = width >= TABLET_BREAKPOINT;

    return (
      <View style={S.itemRow}>
        <View
          style={[
            S.itemInner,
            isTablet && {
              maxWidth: TABLET_MAX_CONTENT_WIDTH,
              alignSelf: "center",
              width: "100%",
            },
          ]}
        >
          {/* Image */}
          <Pressable onPress={onNavigate}>
            <Image
              source={{ uri: item.image }}
              style={[S.itemThumb, isSmallScreen && { width: 80, height: 112 }]}
              resizeMode="cover"
              fadeDuration={0}
            />
            {!!item.discountPercent && (
              <View style={S.discBadge}>
                <Text
                  style={S.discBadgeTxt}
                  maxFontSizeMultiplier={FONT_SCALE_TIGHT}
                >
                  {item.discountPercent}% OFF
                </Text>
              </View>
            )}
            <Pressable onPress={onCheckout} style={S.buyNow} hitSlop={2}>
              <View style={S.buyNowBtn}>
                {/* <Feather name="zap" size={12} color={C.pink} /> */}
                <Text
                  style={{
                    fontSize: 11.5,
                    fontWeight: "700",
                    color: C.black,
                  }}
                  maxFontSizeMultiplier={FONT_SCALE_TIGHT}
                  numberOfLines={1}
                >
                  Buy This Now
                </Text>
              </View>
            </Pressable>
          </Pressable>

          {/* Info */}
          <View style={S.itemInfo}>
            <Text
              style={S.itemTitle}
              numberOfLines={2}
              maxFontSizeMultiplier={FONT_SCALE_NORMAL}
            >
              {item.title}
            </Text>

            <View style={S.sizePill}>
              <Text style={S.sizeTxt} maxFontSizeMultiplier={FONT_SCALE_NORMAL}>
                Size: {item.size || "M"}
              </Text>
            </View>

            {/* Price */}
            <View style={S.priceRow}>
              <Text
                style={S.priceMain}
                maxFontSizeMultiplier={FONT_SCALE_TIGHT}
              >
                ₹{item.price}
              </Text>
              {hasDiscount && (
                <>
                  <Text
                    style={S.priceStrike}
                    maxFontSizeMultiplier={FONT_SCALE_TIGHT}
                  >
                    ₹{item.compareAtPrice}
                  </Text>
                  {savedAmt > 0 && (
                    <Text
                      style={S.priceSave}
                      maxFontSizeMultiplier={FONT_SCALE_TIGHT}
                    >
                      −₹{savedAmt}
                    </Text>
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
              <Text
                style={S.coinsTxt}
                maxFontSizeMultiplier={FONT_SCALE_NORMAL}
              >
                Earn upto {coins} Cupid Coins
              </Text>
            </View>

            {/*
              RESPONSIVE: on narrow phones the qty-stepper and the
              wishlist/remove pill are stacked (column) instead of forced
              side-by-side, so neither element gets squeezed or clipped.
              Normal/tablet widths keep the original side-by-side row.
            */}
            <View
              style={[
                S.actionsRow,
                isSmallScreen && {
                  flexDirection: "column",
                  alignItems: "stretch",
                },
              ]}
            >
              <View
                style={isSmallScreen ? { alignSelf: "flex-start" } : undefined}
              >
                <QtyStepper
                  qty={item.quantity}
                  onIncrease={onIncrease}
                  onDecrease={onDecrease}
                />
              </View>

              {/* Action buttons row */}
              <View
                style={[
                  S.actionBtns,
                  isSmallScreen
                    ? { width: "100%" }
                    : { flex: 1, marginLeft: 8 },
                ]}
              >
                {/* Wishlist */}
                <Pressable onPress={onWishlist} style={S.actionBtn}>
                  <Ionicons
                    name={isWishlisted ? "heart" : "heart-outline"}
                    size={24}
                    color={isWishlisted ? C.pink : C.inkDark}
                  />
                  {/* <Text
                    style={S.actionBtnTxt}
                    numberOfLines={1}
                    maxFontSizeMultiplier={FONT_SCALE_TIGHT}
                  >
                    Wishlist
                  </Text> */}
                </Pressable>

                <View style={S.actionDivider} />

                {/* Remove */}
                <Pressable onPress={onRemove} style={S.actionBtn}>
                  <MaterialCommunityIcons
                    name="delete-outline"
                    size={24}
                    color="#ef4444"
                  />
                  {/* <Text
                    style={[S.actionBtnTxt, { color: "#ef4444" }]}
                    numberOfLines={1}
                    maxFontSizeMultiplier={FONT_SCALE_TIGHT}
                  >
                    Remove
                  </Text> */}
                </Pressable>
              </View>
            </View>

            {/* Delivery */}
            <View style={S.deliveryLine}>
              <MaterialCommunityIcons
                name="truck-fast-outline"
                size={13}
                color={C.green}
                style={{ marginTop: 1 }}
              />
              <Text
                style={S.deliveryTxt}
                maxFontSizeMultiplier={FONT_SCALE_NORMAL}
              >
                Free delivery ·{" "}
                <Text style={S.deliveryBold}>Arrives in 5-7 business days</Text>
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
            bottom: 0,
            paddingLeft: Math.max(16, insetLeft),
            paddingRight: Math.max(16, insetRight),
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
            <Text
              style={S.checkoutBadgeTxt}
              numberOfLines={1}
              maxFontSizeMultiplier={FONT_SCALE_TIGHT}
            >
              {count} item{count > 1 ? "s" : ""}
            </Text>
            <View style={S.checkoutBadgeDot} />
            <Text
              style={S.checkoutBadgeTxt}
              numberOfLines={1}
              maxFontSizeMultiplier={FONT_SCALE_TIGHT}
            >
              {deliveryLabel}
            </Text>
          </View>

          <Pressable onPress={onCheckout}>
            {({ pressed }) => (
              <View
                style={{
                  height: 56,
                  borderRadius: 4,
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
                  maxFontSizeMultiplier={FONT_SCALE_TIGHT}
                  numberOfLines={1}
                >
                  Place Order
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    flexShrink: 1,
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 20,
                      fontWeight: "500",
                      letterSpacing: -0.6,
                      marginRight: 4,
                    }}
                    maxFontSizeMultiplier={FONT_SCALE_TIGHT}
                    numberOfLines={1}
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

          <Text
            style={S.checkoutTrustTxt}
            maxFontSizeMultiplier={FONT_SCALE_NORMAL}
          >
            🔒 Secure checkout · Easy 7-day returns
          </Text>
        </View>
      </View>
    );
  },
);

// ─── TRUST BADGES ─────────────────────────────────────────────
const TrustBadges = React.memo(() => (
  <View style={S.trustRow}>
    <View style={S.trustItem}>
      <MaterialCommunityIcons
        name="shield-check-outline"
        size={20}
        color={C.pink}
      />
      <Text style={S.trustText} maxFontSizeMultiplier={FONT_SCALE_NORMAL}>
        100% Authentic
      </Text>
    </View>
    <View style={S.trustItem}>
      <MaterialCommunityIcons
        name="truck-fast-outline"
        size={20}
        color={C.pink}
      />
      <Text style={S.trustText} maxFontSizeMultiplier={FONT_SCALE_NORMAL}>
        Free Delivery
      </Text>
    </View>
    <View style={S.trustItem}>
      <MaterialCommunityIcons name="backup-restore" size={20} color={C.pink} />
      <Text style={S.trustText} maxFontSizeMultiplier={FONT_SCALE_NORMAL}>
        Easy 7-Day Returns
      </Text>
    </View>
    <View style={S.trustItem}>
      <MaterialCommunityIcons name="lock-outline" size={20} color={C.pink} />
      <Text style={S.trustText} maxFontSizeMultiplier={FONT_SCALE_NORMAL}>
        Secure Payments
      </Text>
    </View>
  </View>
));

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
    </View>
    <Text
      style={{
        fontSize: 18,
        fontWeight: "700",
        marginTop: 16,
        color: "#222",
      }}
      maxFontSizeMultiplier={FONT_SCALE_NORMAL}
    >
      Your bag is empty
    </Text>

    <Text
      style={{
        marginTop: 8,
        textAlign: "center",
        color: "#888",
      }}
      maxFontSizeMultiplier={FONT_SCALE_NORMAL}
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
        paddingVertical: 12,
        borderRadius: 8,
        minHeight: 44,
        justifyContent: "center",
      }}
    >
      <Text
        style={{ color: "#fff", fontWeight: "700" }}
        maxFontSizeMultiplier={FONT_SCALE_TIGHT}
      >
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
  const [wishlistProductIds, setWishlistProductIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [loading, setLoading] = useState(true);
  const [openLogin, setOpenLogin] = useState(false);
  const [openSignup, setOpenSignup] = useState(false);
  const [showWishlistToast, setShowWishlistToast] = useState(false);
  const setCartItems = useCartStore((s) => s.setCartItems);
  const cartItems = useCartStore((s) => s.cartItems);
  const cartCount = useCartStore((s) => s.cartCount);
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const isTablet = windowWidth >= TABLET_BREAKPOINT;

  const [checkoutBarHeight, setCheckoutBarHeight] = useState(0);

  const handleBarLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    setCheckoutBarHeight((prev) => (prev !== h ? h : prev));
  }, []);

  useEffect(() => {
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

  useEffect(() => {
    (async () => {
      try {
        await new Promise((r) => setTimeout(r, 0));
        const items = await loadCart(auth.currentUser);
        setCartItems(items);
        setLoading(false);
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setWishlistProductIds(new Set());
      return;
    }

    return onSnapshot(collection(db, "users", user.uid, "wishlist"), (snapshot) => {
      setWishlistProductIds(new Set(snapshot.docs.map((wishlistItem) => wishlistItem.id)));
    });
  }, []);

  const remove = useCallback(
    async (cartKey: string) => {
      try {
        const updated = await removeCartLine(auth.currentUser, cartKey);
        setCartItems(updated);
      } catch (e) {
        console.error(e);
      }
    },
    [setCartItems],
  );

  const increase = useCallback(
    async (cartKey: string) => {
      const item = cartItems.find((current) => current.cartKey === cartKey);
      if (!item) return;

      try {
        const updated = await setCartLineQuantity(
          auth.currentUser,
          cartKey,
          item.quantity + 1,
        );
        setCartItems(updated);
      } catch (error) {
        console.error(error);
      }
    },
    [cartItems, setCartItems],
  );

  const decrease = useCallback(
    async (cartKey: string) => {
      const item = cartItems.find((current) => current.cartKey === cartKey);

      if (!item) return;
      if (item.quantity <= 1) {
        await remove(cartKey);
        return;
      }

      try {
        const updated = await setCartLineQuantity(
          auth.currentUser,
          cartKey,
          item.quantity - 1,
        );
        setCartItems(updated);
      } catch (error) {
        console.error(error);
      }
    },
    [cartItems, remove, setCartItems],
  );

  const addToWishlist = useCallback(async (item: CartItem) => {
    const user = auth.currentUser;
    if (!user) {
      setOpenLogin(true);
      return;
    }

    const productId = item.productId.split("/").pop();
    if (!productId) {
      Alert.alert("Couldn't save item", "This product has an invalid ID.");
      return;
    }

    const isWishlisted = wishlistProductIds.has(productId);

    try {
      if (isWishlisted) {
        await deleteDoc(doc(db, "users", user.uid, "wishlist", productId));
        setWishlistProductIds((currentIds) => {
          const nextIds = new Set(currentIds);
          nextIds.delete(productId);
          return nextIds;
        });
        return;
      }

      await setDoc(doc(db, "users", user.uid, "wishlist", productId), {
        id: productId,
        handle: item.handle,
        title: item.title,
        image: item.image,
        price: Number(item.price),
        compareAtPrice: item.compareAtPrice
          ? Number(item.compareAtPrice)
          : null,
        discount: item.discountPercent || 0,
        stock: 999,
        variantId: item.variantId,
        size: item.size,
        addedAt: Date.now(),
      });
      setWishlistProductIds((currentIds) => new Set(currentIds).add(productId));
      setShowWishlistToast(true);
      setTimeout(() => setShowWishlistToast(false), 1500);
    } catch (error) {
      console.error("Cart wishlist save error:", error);
      Alert.alert("Couldn't save item", "Please try again.");
    }
  }, [wishlistProductIds]);

  const keyExtractor = useCallback((item: CartItem) => item.cartKey, []);

  const renderItem = useCallback(
    ({ item }: { item: CartItem }) => (
      <CartItemRow
        item={item}
        onCheckout={() => handleCheckoutSingleProduct(item)}
        onIncrease={() => increase(item.cartKey)}
        onDecrease={() => decrease(item.cartKey)}
        onRemove={() => remove(item.cartKey)}
        onWishlist={() => addToWishlist(item)}
        isWishlisted={wishlistProductIds.has(item.productId.split("/").pop() || "")}
        onNavigate={() =>
          router.push({
            pathname: "/product/[handle]",
            params: { handle: item.handle },
          })
        }
      />
    ),
    [increase, decrease, remove, addToWishlist, router, wishlistProductIds],
  );

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
                maxFontSizeMultiplier={FONT_SCALE_NORMAL}
              >
                <Text style={{ fontWeight: "600", color: C.inkDark }}>
                  Deliver to:
                </Text>{" "}
                {locationName ? locationName : "Check date & availability"}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }} />
            </View>
          </View>
        </Pressable>

        <View style={S.gap8} />

        <View style={S.bagRow}>
          <Text style={S.bagTitle} maxFontSizeMultiplier={FONT_SCALE_NORMAL}>
            My Bag <Text style={S.bagCount}>({cartCount})</Text>
          </Text>
        </View>
      </View>
    ),
    [locationName, cartCount],
  );

  const ListFooter = useCallback(() => {
    if (!cartItems.length) return null;
    return (
      <>
        <View style={S.priceSummary}>
          <Text
            style={S.priceSummaryTitle}
            maxFontSizeMultiplier={FONT_SCALE_NORMAL}
          >
            Price Details
          </Text>

          <View style={S.priceLineRow}>
            <Text style={S.priceLbl} maxFontSizeMultiplier={FONT_SCALE_NORMAL}>
              MRP ({cartCount} item{cartCount > 1 ? "s" : ""})
            </Text>
            <Text style={S.priceVal} maxFontSizeMultiplier={FONT_SCALE_TIGHT}>
              ₹{subtotal + saved}
            </Text>
          </View>

          {saved > 0 && (
            <View style={S.priceLineRow}>
              <Text
                style={S.priceLbl}
                maxFontSizeMultiplier={FONT_SCALE_NORMAL}
              >
                Discount
              </Text>
              <Text
                style={[S.priceVal, { color: C.green }]}
                maxFontSizeMultiplier={FONT_SCALE_TIGHT}
              >
                −₹{saved}
              </Text>
            </View>
          )}

          <View style={S.priceLineRow}>
            <Text style={S.priceLbl} maxFontSizeMultiplier={FONT_SCALE_NORMAL}>
              Delivery
            </Text>
            <Text
              style={[S.priceVal, shipping === 0 && { color: C.green }]}
              maxFontSizeMultiplier={FONT_SCALE_TIGHT}
            >
              {shipping === 0 ? "FREE" : `₹${shipping}`}
            </Text>
          </View>

          <View style={S.priceDivider} />

          <View style={S.priceTotalRow}>
            <Text
              style={S.priceTotalLbl}
              maxFontSizeMultiplier={FONT_SCALE_NORMAL}
            >
              Total Payable
            </Text>
            <Text
              style={S.priceTotalVal}
              maxFontSizeMultiplier={FONT_SCALE_TIGHT}
            >
              ₹{total}
            </Text>
          </View>

          {saved > 0 && (
            <View style={S.savingsBanner}>
              <Text
                style={S.savingsBannerTxt}
                maxFontSizeMultiplier={FONT_SCALE_NORMAL}
              >
                🎉 You're saving ₹{saved} on this order
              </Text>
            </View>
          )}
        </View>

        <TrustBadges />
      </>
    );
  }, [cartCount, cartItems.length, subtotal, saved, shipping, total]);

  const handleCheckoutSingleProduct = useCallback(
    async (product: CartItem) => {
      try {
        const res = await createCheckoutCart([product], auth.currentUser);

        const checkoutUrl = res?.data?.cartCreate?.cart?.checkoutUrl;

        if (!checkoutUrl) return;

        router.push({
          pathname: "/CheckoutWebview",
          params: { url: checkoutUrl },
        });
      } catch (error) {
        Alert.alert(
          "Checkout unavailable",
          error instanceof Error
            ? error.message
            : "We couldn't start checkout. Please try again.",
        );
      }
    },
    [router],
  );

  const handleCheckout = useCallback(async () => {
    try {
      const res = await createCheckoutCart(cartItems, auth.currentUser);
      const checkoutUrl = res?.data?.cartCreate?.cart?.checkoutUrl;
      if (!checkoutUrl)
        throw new Error("Shopify did not return a checkout URL.");
      router.push({
        pathname: "/CheckoutWebview",
        params: { url: checkoutUrl },
      });
    } catch (error) {
      Alert.alert(
        "Checkout unavailable",
        error instanceof Error
          ? error.message
          : "We couldn't start checkout. Please try again.",
      );
    }
  }, [cartItems, router]);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      <Stack.Screen
        options={{
          headerTitle: () => (
            <Text
              style={{ fontSize: 16, fontWeight: "700", color: C.black }}
              maxFontSizeMultiplier={FONT_SCALE_NORMAL}
            >
              Bag
            </Text>
          ),
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "#fff7f8" },
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={10}>
              <EvilIcons name="chevron-left" size={32} color={C.black} />
            </Pressable>
          ),
          headerRight: () => (
            <View style={S.headerIcons}>
              <Pressable
                onPress={() => router.push("/Search")}
                style={S.headerBtn}
                hitSlop={8}
              >
                <Feather name="search" size={26} color="#555" />
              </Pressable>
              <Pressable
                onPress={() => router.push("/Wishlist")}
                style={S.headerBtn}
                hitSlop={8}
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
                paddingBottom: checkoutBarHeight,
              }}
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={Platform.OS === "android"}
              maxToRenderPerBatch={6}
              windowSize={8}
              initialNumToRender={5}
            />
            <CheckoutBar
              count={cartCount}
              total={total}
              shipping={shipping}
              onCheckout={handleCheckout}
              insetBottom={insets.bottom}
              insetLeft={insets.left}
              insetRight={insets.right}
              isTablet={isTablet}
              onBarLayout={handleBarLayout}
            />

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
                      paddingBottom: Math.max(20, insets.bottom + 20),
                    },
                  ]}
                >
                  <View style={S.modalHandle} />
                  <Text
                    style={S.modalTitle}
                    maxFontSizeMultiplier={FONT_SCALE_NORMAL}
                  >
                    Delivery Location
                  </Text>
                  <Text
                    style={S.modalSub}
                    maxFontSizeMultiplier={FONT_SCALE_NORMAL}
                  >
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
                    <Text
                      style={S.modalBtnTxt}
                      maxFontSizeMultiplier={FONT_SCALE_TIGHT}
                    >
                      Check Availability
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setPinModalVisible(false)}
                    style={S.modalClose}
                  >
                    <Text
                      style={S.modalCloseTxt}
                      maxFontSizeMultiplier={FONT_SCALE_NORMAL}
                    >
                      Close
                    </Text>
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
            <SuccessToast
              visible={showWishlistToast}
              text="Added to wishlist"
              pathname="/Wishlist"
              linkText="Go to wishlist"
            />
          </>
        )}
      </View>
    </>
  );
}
