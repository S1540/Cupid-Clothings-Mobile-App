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
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

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
import CircleLoader from "@/components/CircleLoader";
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

// ── Main screen ───────────────────────────────────────────────────────────────
export default function ProductPage() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
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
  const [sizeModalVisible, setSizeModalVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<"cart" | "buy" | null>(
    null,
  );

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

      setLoadingCart(true);
      const user = auth.currentUser;
      if (!user) {
        setToastValue("Please login first");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 1500);
        setLoadingCart(false);
        return;
      }

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
    }
  };

  // ── Fetch product ───────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(
          `http://${process.env.EXPO_PUBLIC_NETWORK_ADDRESS}:3000/api/products/product/${handle}`,
        );
        const data = await res.json();

        await saveRecentlyViewed(data);
        setProduct(data);

        const viewed = await viewRecentlyProducts();
        setViewedProducts(viewed);

        const category = handle?.toString().includes("women") ? "women" : "men";
        const exploreRes = await fetch(
          `http://${process.env.EXPO_PUBLIC_NETWORK_ADDRESS}:3000/api/products/${category}`,
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
          // Bottom padding so last section clears the fixed CTA bar (14+14+48 ≈ 90)
          ListFooterComponent={<View style={{ height: 100 }} />}
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
            padding: 24,
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
      <SuccessToast visible={showToast} text={toastValue} />

      {/* ── Bottom CTA bar ───────────────────────────────────────────────────── */}
      {product && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            flexDirection: "row",
            gap: 10,
            padding: 14,
            backgroundColor: "#fff",
            borderTopWidth: 0.5,
            borderTopColor: "#f0f0f0",
          }}
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
            <Text style={{ color: "#F87387", fontWeight: "700", fontSize: 15 }}>
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
