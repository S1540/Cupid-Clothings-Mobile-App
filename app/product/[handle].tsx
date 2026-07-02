// app/product/[handle].tsx
import Loader from "@/components/ui/Loader";
import { EvilIcons, Feather, Ionicons } from "@expo/vector-icons";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  LayoutChangeEvent, // FIX: needed to type the CTA bar's onLayout handler
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
// FIX (both platforms): was missing entirely — required to read real device
// safe-area insets (notch / Dynamic Island / home indicator / Android
// gesture-nav) instead of guessing with hardcoded numbers.
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "@/firebaseConfig";
import { useCartStore } from "@/store/cartStore";
import CircleLoader from "@/components/ui/CircleLoader";
import SuccessToast from "@/components/SuccessToast";

// ── Extracted components ──────────────────────────────────────────────────────
import ProductGallery from "../../components/product/ProductGallery";
import ProductInfo from "../../components/product/Productinfo";
import ProductDetailsSection from "../../components/product/Productdetailssection";
import ProductBottomSection from "../../components/product/Productbottomsection";

// ── Types ─────────────────────────────────────────────────────────────────────
type Variant = {
  id: string;
  title: string;
  available: boolean;
  price: string;
  selectedOptions: { name: string; value: string }[];
};

type Option = { name: string; values: string[] };

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
  options: Option[];
  variants: Variant[];
};

type Section = {
  type: "gallery" | "info" | "details" | "bottom";
};

const SECTIONS: Section[] = [
  { type: "gallery" },
  { type: "info" },
  { type: "details" },
  { type: "bottom" },
];

// Tablet breakpoint used only to cap/center the bottom CTA row on large
// screens. Phone layout is untouched.
const TABLET_BREAKPOINT = 768;
const TABLET_MAX_CONTENT_WIDTH = 600;

// ── Main screen ───────────────────────────────────────────────────────────────
export default function ProductPage() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth >= TABLET_BREAKPOINT; // FIX: previously captured but never used
  const insets = useSafeAreaInsets();
  const { handle } = useLocalSearchParams();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingCart, setLoadingCart] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [wishlist, setWishlist] = useState(false);
  const [viewedProducts, setViewedProducts] = useState<Product[]>([]);
  const [exploreProducts, setExploreProducts] = useState<Product[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});
  const [offersVisible, setOffersVisible] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastValue, setToastValue] = useState("");
  const [toastPathname, setToastPathname] = useState("");
  const [toastLinkText, setToastLinkText] = useState("");
  const [sizeModalVisible, setSizeModalVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<"cart" | "buy" | null>(
    null,
  );

  // FIX (both platforms): replaces the hardcoded `height: 100` footer spacer.
  // Measured from the real CTA bar via onLayout so the last list section is
  // never hidden behind the bar, and doesn't over/under-pad across devices.
  const [ctaBarHeight, setCtaBarHeight] = useState(0);
  const handleCtaBarLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    setCtaBarHeight((prev) => (prev !== h ? h : prev));
  }, []);

  const setCartItems = useCartStore((state) => state.setCartItems);
  const addCartItem = useCartStore((state) => state.addCartItem);

  // ── Wishlist ────────────────────────────────────────────────────────────────
  const checkWishlistStatus = async () => {
    try {
      const user = auth.currentUser;
      if (!user || !product) return;
      const cleanId = product.id.split("/").pop();
      const snap = await getDoc(
        doc(db, "users", user.uid, "wishlist", cleanId as string),
      );
      setWishlist(snap.exists());
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (product) {
      checkWishlistStatus();
    }
  }, [product]);

  const toggleWishlist = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setToastValue("Please login first");
        setToastPathname("/Account");
        setToastLinkText("Login");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 1500);
        return;
      }
      if (!product) return;
      const cleanId = product.id.split("/").pop();

      if (wishlist) {
        await deleteDoc(
          doc(db, "users", user.uid, "wishlist", cleanId as string),
        );
        setWishlist(false);
        setToastValue("Removed from wishlist");
      } else {
        setWishlist(true);
        await setDoc(
          doc(db, "users", user.uid, "wishlist", cleanId as string),
          {
            id: cleanId,
            handle: product.handle,
            title: product.title,
            image: product.images?.[0]?.url,
            price: Number(product.price),
            compareAtPrice: product.compareAtPrice
              ? Number(product.compareAtPrice)
              : null,
            discount: product.discountPercent || 0,
            stock: 999,
            variantId: "",
            size: null,
            addedAt: Date.now(),
          },
        );
        setToastValue("Added to wishlist");
        setToastPathname("/Wishlist");
        setToastLinkText("Go to wishlist");
      }
      setShowToast(true);
      setTimeout(() => setShowToast(false), 1500);
    } catch (error) {
      console.log(error);
    }
  };

  // ── Load cart on focus ──────────────────────────────────────────────────────
  useFocusEffect(
    React.useCallback(() => {
      const loadCart = async () => {
        try {
          const user = auth.currentUser;
          if (user) {
            const snapshot = await getDocs(
              collection(db, "users", user.uid, "cart"),
            );
            const firebaseCart = snapshot.docs.map((doc) => ({
              ...(doc.data() as any),
            }));
            setCartItems(firebaseCart);
          } else {
            const data = await AsyncStorage.getItem("cartItems");
            if (data) {
              setCartItems(JSON.parse(data));
            }
          }
        } catch (error) {
          console.log(error);
        }
      };
      loadCart();
    }, []),
  );

  // ── Add to cart ─────────────────────────────────────────────────────────────
  const addToCart = async (product: Product) => {
    try {
      const selectedSize = selectedOptions["Size"];
      const selectedVariant = product.variants.find((variant) =>
        variant.selectedOptions.some(
          (option) => option.name === "Size" && option.value === selectedSize,
        ),
      );
      if (!selectedSize) {
        setPendingAction("cart");
        setSizeModalVisible(true);
        return;
      }

      const user = auth.currentUser;
      if (!user) {
        setLoadingCart(true);
        const existing = await AsyncStorage.getItem("cartItems");
        let items = existing ? JSON.parse(existing) : [];
        const existingIndex = items.findIndex(
          (item: any) => item.id === product.id && item.size === selectedSize,
        );
        if (existingIndex > -1) {
          setToastValue("Item already in cart");
          setToastLinkText("Go to Bag");
          setToastPathname("/Cart");
          setShowToast(true);
          setTimeout(() => setShowToast(false), 1500);
        } else {
          items.unshift({
            id: product.id,
            handle: product.handle,
            title: product.title,
            image: product.images?.[0]?.url,
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            discountPercent: product.discountPercent,
            quantity: 1,
            size: selectedSize,
          });
        }
        await AsyncStorage.setItem("cartItems", JSON.stringify(items));
        setLoadingCart(false);
      } else {
        const cleanId = product.id.split("/").pop();
        await setDoc(doc(db, "users", user.uid, "cart", cleanId as string), {
          id: product.id,
          handle: product.handle,
          variantId: selectedVariant?.id,
          title: product.title,
          image: product.images?.[0]?.url,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          discountPercent: product.discountPercent,
          quantity: 1,
          size: selectedSize,
          createdAt: new Date(),
        });
      }

      addCartItem({
        id: product.id,
        title: product.title,
        variantId: selectedVariant!?.id,
        image: product.images?.[0]?.url,
        price: Number(product.price),
        compareAtPrice: product.compareAtPrice
          ? Number(product.compareAtPrice)
          : undefined,
        discountPercent: product.discountPercent || undefined,
        handle: product.handle,
        quantity: 1,
        size: selectedSize,
      });

      setLoadingCart(false);
      setToastValue("Item added to cart");
      setToastLinkText("Go to Bag");
      setToastPathname("/Cart");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 1500);
    } catch (error) {
      setLoadingCart(false);
      console.log(error);
    }
  };

  // ── Buy now ─────────────────────────────────────────────────────────────────
  const buyNow = async (product: Product) => {
    try {
      const selectedSize = selectedOptions["Size"];
      if (!selectedSize) {
        setPendingAction("buy");
        setSizeModalVisible(true);
        return;
      }
      setLoadingCart(true);
      const user = auth.currentUser;

      if (user) {
        const cleanId = product.id.split("/").pop();
        await setDoc(doc(db, "users", user.uid, "cart", cleanId as string), {
          id: product.id,
          handle: product.handle,
          title: product.title,
          image: product.images?.[0]?.url,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          discountPercent: product.discountPercent,
          quantity: 1,
          size: selectedSize,
          createdAt: new Date(),
        });
        setLoadingCart(false);
        console.log("Saved In Firebase");
      } else {
        const existing = await AsyncStorage.getItem("cartItems");
        let items = existing ? JSON.parse(existing) : [];
        const existingIndex = items.findIndex(
          (item: any) => item.id === product.id && item.size === selectedSize,
        );
        if (existingIndex > -1) {
          console.log("Already in cart");
        } else {
          items.unshift({
            id: product.id,
            handle: product.handle,
            title: product.title,
            image: product.images?.[0]?.url,
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            discountPercent: product.discountPercent,
            quantity: 1,
            size: selectedSize,
          });
        }
        await AsyncStorage.setItem("cartItems", JSON.stringify(items));
        console.log("Saved In LocalStorage");
      }
      router.push("/Cart");
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingCart(false);
    }
  };

  // ── Fetch product ───────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/products/product/${handle}`,
        );
        const data = await res.json();
        await saveRecentlyViewed(data);
        setProduct(data);

        const viewed = await viewRecentlyProducts();
        setViewedProducts(viewed);

        const category = handle?.toString().includes("women") ? "women" : "men";
        const exploreRes = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/products/${category}`,
        );
        const exploreData = await exploreRes.json();
        const filtered = exploreData.filter(
          (p: Product) => p.handle !== handle,
        );
        const shuffledExplore = filtered.sort(() => Math.random() - 0.5);
        setExploreProducts(shuffledExplore.slice(0, 10));
      } catch (e) {
        console.log("Product fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [handle]);

  const saveRecentlyViewed = async (product: Product) => {
    try {
      const existing = await AsyncStorage.getItem("recentlyViewed");
      let saved = existing ? JSON.parse(existing) : [];
      const items = saved.filter((p: Product) => p.handle !== product.handle);
      items.unshift({
        id: product.id,
        handle: product.handle,
        title: product.title,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        discountPercent: product.discountPercent,
        images: [product.images?.[0]],
      });
      items.splice(10);
      await AsyncStorage.setItem("recentlyViewed", JSON.stringify(items));
    } catch {
      console.log("Error saving recently viewed");
    }
  };

  const viewRecentlyProducts = async () => {
    try {
      const existing = await AsyncStorage.getItem("recentlyViewed");
      return existing ? JSON.parse(existing) : [];
    } catch {
      return [];
    }
  };

  // ── Variant availability ────────────────────────────────────────────────────
  const isVariantAvailable = (optionName: string, value: string) =>
    product!.variants.some(
      (v) =>
        v.selectedOptions.some(
          (o) => o.name === optionName && o.value === value,
        ) && v.available,
    );

  // ── Section renderer ────────────────────────────────────────────────────────
  const renderSection = useCallback(
    ({ item }: { item: Section }) => {
      if (!product) return null;

      if (item.type === "gallery") {
        return (
          <ProductGallery
            product={product}
            activeImage={activeImage}
            setActiveImage={setActiveImage}
            wishlist={wishlist}
            toggleWishlist={toggleWishlist}
          />
        );
      }

      if (item.type === "info") {
        return (
          <ProductInfo
            product={product}
            selectedOptions={selectedOptions}
            setSelectedOptions={setSelectedOptions}
            offersVisible={offersVisible}
            setOffersVisible={setOffersVisible}
          />
        );
      }

      if (item.type === "details") {
        return <ProductDetailsSection product={product} />;
      }

      if (item.type === "bottom") {
        return (
          <ProductBottomSection
            viewedProducts={viewedProducts}
            exploreProducts={exploreProducts}
          />
        );
      }

      return null;
    },
    [
      product,
      activeImage,
      wishlist,
      selectedOptions,
      offersVisible,
      viewedProducts,
      exploreProducts,
    ],
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () =>
            handle ? (
              <Text
                style={{ fontSize: 16, fontWeight: "600", color: "#1a1a1a" }}
              >
                Product Details
              </Text>
            ) : (
              "Product"
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
                <Ionicons name="heart-outline" size={26} />
              </Pressable>
            </View>
          ),
        }}
      />

      {loading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Loader />
        </View>
      ) : !product ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ color: "#999", fontSize: 15 }}>Product not found</Text>
        </View>
      ) : (
        <FlatList
          data={SECTIONS}
          style={{ backgroundColor: "#fff" }}
          keyExtractor={(item) => item.type}
          showsVerticalScrollIndicator={false}
          renderItem={renderSection}
          // FIX (both platforms): dynamic, measured CTA-bar height replaces
          // the old hardcoded `height: 100` guess. Guarantees the last
          // section (Explore / Recently Viewed) is never hidden behind the
          // fixed bar, and doesn't over-pad on devices with a smaller bar
          // (e.g. no home indicator on iPhone SE / Android 3-button nav).
          ListFooterComponent={<View style={{ height: ctaBarHeight }} />}
        />
      )}

      {/* ── Size selection modal ─────────────────────────────────────────────── */}
      <Modal
        visible={sizeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSizeModalVisible(false)}
      >
        <Pressable
          onPress={() => setSizeModalVisible(false)}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}
        />
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "#fff",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 24,
            paddingHorizontal: Math.max(24, insets.left, insets.right),
            // FIX (both platforms): replaces the old uniform `padding: 24`.
            // The confirm button now clears the iOS home indicator / Android
            // gesture-nav bar instead of sitting flush against it.
            paddingBottom: 24 + insets.bottom,
            gap: 16,
          }}
        >
          {/* Drag handle */}
          <View
            style={{
              width: 36,
              height: 4,
              backgroundColor: "#e0e0e0",
              borderRadius: 99,
              alignSelf: "center",
            }}
          />

          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#111" }}>
              Select Size
            </Text>
            <Pressable onPress={() => setSizeModalVisible(false)}>
              <Feather name="x" size={22} color="#444" />
            </Pressable>
          </View>

          {/* Size chips */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {product?.options
              ?.find((o) => o.name === "Size")
              ?.values?.map((value) => {
                const available = isVariantAvailable("Size", value);
                const selected = selectedOptions["Size"] === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => {
                      if (!available) return;
                      setSelectedOptions((prev) => ({ ...prev, Size: value }));
                    }}
                    style={{
                      minWidth: 52,
                      height: 48,
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      borderWidth: selected ? 2 : 1,
                      borderColor: selected
                        ? "#ff5c84"
                        : available
                          ? "#ddd"
                          : "#f0f0f0",
                      borderStyle: available ? "solid" : "dashed",
                      backgroundColor: selected
                        ? "#fff5f7"
                        : available
                          ? "#fff"
                          : "#fafafa",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: available ? 1 : 0.5,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "700",
                        color: selected
                          ? "#ff5c84"
                          : available
                            ? "#333"
                            : "#bbb",
                      }}
                    >
                      {value}
                    </Text>
                  </Pressable>
                );
              })}
          </View>

          {/* Size guide link */}
          <Pressable
            style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
          >
            <Feather name="info" size={13} color="#ff5c84" />
            <Text style={{ fontSize: 13, color: "#ff5c84", fontWeight: "600" }}>
              Size Guide
            </Text>
          </Pressable>

          <View style={{ height: 0.5, backgroundColor: "#f0f0f0" }} />

          {/* Confirm */}
          <Pressable
            disabled={!selectedOptions["Size"]}
            onPress={async () => {
              const selectedSize = selectedOptions["Size"];
              if (!selectedSize) {
                setToastValue("Please select a size");
                setShowToast(true);
                setTimeout(() => setShowToast(false), 1500);
                return;
              }
              setSizeModalVisible(false);
              if (product) {
                if (pendingAction === "cart") await addToCart(product);
                else if (pendingAction === "buy") await buyNow(product);
              }
              setPendingAction(null);
            }}
            style={{
              backgroundColor: selectedOptions["Size"] ? "#ff5c84" : "#ddd",
              borderRadius: 6,
              paddingVertical: 16,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
              {pendingAction === "buy" ? "Buy Now" : "Add to Cart"}
            </Text>
          </Pressable>

          <View style={{ height: 10 }} />
        </View>
      </Modal>

      {/* ── Toast ───────────────────────────────────────────────────────────── */}
      <SuccessToast
        visible={showToast}
        text={toastValue}
        pathname={toastPathname}
        linkText={toastLinkText}
      />

      {/* ── Bottom CTA bar ───────────────────────────────────────────────────── */}
      {product && (
        <View
          onLayout={handleCtaBarLayout}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "#fff",
            borderTopWidth: 0.5,
            borderTopColor: "#f0f0f0",
            alignItems: "center", // needed to center the capped tablet row below
            paddingTop: 14,
            // FIX (both platforms): replaces the old uniform `padding: 14`.
            // Horizontal padding now respects notch/Dynamic-Island/rounded-
            // corner insets in landscape; bottom padding clears the iOS home
            // indicator and Android gesture-nav bar instead of sitting flush
            // against them (previously buttons could be partially obscured
            // or hard to tap near the edge).
            paddingLeft: Math.max(14, insets.left),
            paddingRight: Math.max(14, insets.right),
            paddingBottom: 14 + insets.bottom,
          }}
        >
          <View
            style={[
              { flexDirection: "row", gap: 10, width: "100%" },
              // FIX (tablet responsiveness): caps and centers the button row
              // on large screens instead of letting two buttons stretch edge
              // to edge; no visual change on phones since width < cap.
              isTablet && { maxWidth: TABLET_MAX_CONTENT_WIDTH },
            ]}
          >
            <Pressable
              onPress={() => addToCart(product)}
              style={{
                flex: 1,
                paddingVertical: 15,
                borderRadius: 6,
                borderWidth: 1.5,
                borderColor: "#F87387",
                alignItems: "center",
              }}
            >
              <Text
                style={{ color: "#F87387", fontWeight: "700", fontSize: 15 }}
              >
                Add to Cart
              </Text>
            </Pressable>

            <Pressable
              onPress={() => buyNow(product)}
              style={{
                flex: 1,
                paddingVertical: 15,
                borderRadius: 6,
                backgroundColor: "#F87387",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
                Buy Now
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ── Cart loading overlay ─────────────────────────────────────────────── */}
      {loadingCart && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <CircleLoader />
        </View>
      )}
    </>
  );
}
