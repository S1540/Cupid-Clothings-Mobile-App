// app/category/[handle].tsx
import HomeSkeleton from "@/components/ui/HomeSkeleton";
import { useCartStore } from "@/store/cartStore";
import { EvilIcons, Feather, Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { memo, useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
// RESPONSIVE: useSafeAreaInsets ensures nothing overlaps home indicator / notch
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Category = {
  name: string;
  handle: string;
  image: string;
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

const CATEGORIES_IMAGES: Record<string, string> = {
  "women-plain-tshirts":
    "https://cupidclothings.com/cdn/shop/files/Frame_29343_8.png?v=1691580995&width=1000",
  "track-pants-m-to-7xl":
    "https://cupidclothings.com/cdn/shop/files/Frame_29343_3.png?v=1691580847&width=1000",
  "night-suits-sets-plus-sizes":
    "https://cupidclothings.com/cdn/shop/files/Frame_29343_5.png?v=1691580846&width=1000",
  combos:
    "https://cupidclothings.com/cdn/shop/files/Frame_29340.png?v=1691580847&width=1000",
  "women-winter-wear":
    "https://cupidclothings.com/cdn/shop/files/Frame_29343_4.png?v=1691580847&width=1000",
};

const CATEGORY_LABELS: Record<string, string> = {
  "women-plain-tshirts": "Plain Tshirts",
  "track-pants-m-to-7xl": "Track Pants",
  "night-suits-sets-plus-sizes": "Night Suits",
  combos: "Combos",
  "women-winter-wear": "Winter Wear",
};

const categories = Object.entries(CATEGORIES_IMAGES).map(([handle, image]) => ({
  handle,
  image,
  name: CATEGORY_LABELS[handle] ?? handle.replaceAll("-", " "),
}));

// RESPONSIVE: categorySize prop passed in so the chip scales with screen width
const CategoryChip = ({
  item,
  categorySize,
}: {
  item: Category;
  categorySize: number;
}) => (
  <Pressable style={{ alignItems: "center", marginRight: 14 }}>
    {/*
     * RESPONSIVE: was fixed 70×70.
     * Now driven by categorySize (≈18% of screen width) so it scales
     * proportionally on iPhone SE (320px) through large Android devices.
     */}
    <Image
      source={{ uri: item.image }}
      style={{ width: categorySize, height: categorySize }}
      resizeMode="contain"
    />
    <Text
      numberOfLines={1}
      style={{
        marginTop: 6,
        fontSize: 11,
        fontWeight: "600",
        color: "#2d1a22",
        textAlign: "center",
      }}
    >
      {item.name}
    </Text>
  </Pressable>
);

// RESPONSIVE: productImageHeight prop so card image scales with screen
const ProductCard = memo(
  ({
    item,
    productImageHeight,
  }: {
    item: Product;
    productImageHeight: number;
  }) => {
    const router = useRouter();

    return (
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/product/[handle]",
            params: { handle: item.handle },
          })
        }
        style={styles.productCard}
      >
        {/*
         * RESPONSIVE: was fixed height: 250.
         * Now uses productImageHeight computed from actual card width
         * so portrait cards look correct on every screen size.
         */}
        <View style={[styles.productImageWrap, { height: productImageHeight }]}>
          <Image
            source={{ uri: item.images?.[0]?.url || "" }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
            fadeDuration={0}
          />
          <Pressable style={styles.wishlistBtn}>
            <EvilIcons name="heart" size={24} color="black" />
          </Pressable>
        </View>

        <View style={{ padding: 10, gap: 4 }}>
          <Text numberOfLines={2} style={styles.productTitle}>
            {item.title}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{item.price}</Text>
            {item.compareAtPrice && (
              <Text style={styles.comparePrice}>₹{item.compareAtPrice}</Text>
            )}
            {item.discountPercent && (
              <Text style={styles.discount}>{item.discountPercent}% off</Text>
            )}
          </View>
          <Text style={styles.firstOrderOffer}>30% off on first order</Text>
        </View>
      </Pressable>
    );
  },
);

const Handle = () => {
  const [wishlist, setWishlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const { handle } = useLocalSearchParams();
  const router = useRouter();
  const cartCount = useCartStore((state) => state.cartItems.length);

  // RESPONSIVE: live screen dimensions — works on rotation and split-screen too
  const { width } = useWindowDimensions();

  // RESPONSIVE: safe area insets — protects content from home indicator and notch.
  // The Stack.Screen header already handles the top inset automatically,
  // so we only need bottom here for the FlatList footer.
  const insets = useSafeAreaInsets();

  // ─── RESPONSIVE CALCULATIONS ──────────────────────────────────────────────
  // Category chip image: ~18% of screen width, capped so it never looks oversized.
  // On iPhone SE (320px) → ~58px; on iPhone 14 (390px) → ~70px (matches original).
  const categorySize = Math.min(Math.round(width * 0.18), 72);

  // Product card image: each card is 49% of screen width minus horizontal padding.
  // 12px padding on each side of the FlatList = 24px total, 4px gap between cards.
  // Portrait ratio 1:1.35 matches the original 250px height on a ~185px-wide card.
  const cardWidth = (width - 24 - 4) * 0.49;
  const productImageHeight = Math.round(cardWidth * 1.35);

  // Banner strip: was fixed height: 50 with resizeMode: "stretch".
  // Keep it proportional — 50px on a 390px screen ≈ 12.8% of width.
  // This prevents it from being too tall on wide tablets or too thin on SE.
  const bannerHeight = Math.round(width * 0.128);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/products/${handle}`,
        );
        const data = await response.json();
        setProducts(data);
        console.log("Fetched products for category:", handle, data.products);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    if (handle) {
      fetchProducts();
    }
  }, [handle]);

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () =>
            handle ? (
              <Text
                style={{ fontSize: 16, fontWeight: "600", color: "#1a1a1a" }}
              >
                {CATEGORY_LABELS[handle.toString()] ||
                  handle.toString().replaceAll("-", " ")}
              </Text>
            ) : (
              ""
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
                onPress={() => setWishlist(!wishlist)}
                style={{ padding: 6 }}
              >
                <Ionicons
                  name={wishlist ? "heart" : "heart-outline"}
                  size={26}
                  color={wishlist ? "#ff5c84" : "#555"}
                />
              </Pressable>
            </View>
          ),
        }}
      />

      {loading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <HomeSkeleton />
        </View>
      ) : (
        <>
          {/*
           * RESPONSIVE: height was fixed at 50.
           * Now bannerHeight scales with screen width to stay visually identical
           * across SE, iPhone 14, and large Android screens.
           */}
          <Image
            source={{
              uri: "https://res.cloudinary.com/drsoj4c5q/image/upload/q_auto/f_auto/v1780990865/ChatGPT_Image_Jun_9_2026_12_48_16_PM_wblovf.png",
            }}
            style={{
              width: "100%",
              height: bannerHeight,
              resizeMode: "stretch",
            }}
          />

          <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            numColumns={2}
            style={{ backgroundColor: "#fff" }}
            renderItem={({ item }) => (
              // RESPONSIVE: productImageHeight passed down so card scales correctly
              <ProductCard
                item={item}
                productImageHeight={productImageHeight}
              />
            )}
            columnWrapperStyle={styles.columnWrapper}
            showsVerticalScrollIndicator={false}
            initialNumToRender={6}
            maxToRenderPerBatch={6}
            windowSize={5}
            ListHeaderComponent={
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                }}
              >
                {categories.map((cat) => (
                  // RESPONSIVE: categorySize passed so chips scale with screen
                  <CategoryChip
                    key={cat.handle}
                    item={cat}
                    categorySize={categorySize}
                  />
                ))}
              </ScrollView>
            }
            // RESPONSIVE: footer height accounts for iPhone home indicator so the
            // last row of product cards is never hidden behind the swipe bar
            ListFooterComponent={
              <View style={{ height: 16 + insets.bottom }} />
            }
          />
        </>
      )}
    </>
  );
};

export default Handle;

const styles = StyleSheet.create({
  productCard: {
    width: "49%",
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: "#f0f0f0",
  },
  // RESPONSIVE: height removed from here — passed as prop to ProductCard
  productImageWrap: {
    width: "100%",
    backgroundColor: "#fafafa",
  },
  wishlistBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.45)",
    borderRadius: 20,
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  productTitle: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#1a1a1a",
    lineHeight: 17,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  price: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1a1a1a",
  },
  comparePrice: {
    fontSize: 11,
    color: "#bbb",
    textDecorationLine: "line-through",
  },
  discount: {
    fontSize: 11,
    fontWeight: "700",
    color: "#22a55b",
  },
  firstOrderOffer: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "#22a55b",
    marginTop: 2,
  },
  columnWrapper: {
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
});
