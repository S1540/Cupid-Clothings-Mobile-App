// app/category/[handle].tsx
import HomeSkeleton from "@/components/ui/HomeSkeleton";
import { useCartStore } from "@/store/cartStore";
import { EvilIcons, Feather, Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { memo, useCallback, useEffect, useState } from "react";
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

// ---- Menu types (mirrors GET /api/products/menu/:handle response) ----
type MenuChild = {
  title: string;
  handle: string;
};

type MenuSubcategory = {
  title: string;
  handle: string;
  children?: MenuChild[];
};

type MenuTopCategory = {
  title: string;
  handle: string;
  subcategories?: MenuSubcategory[];
};

type StripItem = {
  title: string;
  handle: string;
};

type Gender = "new-menu-07-12-2024";

const GENDER_HANDLES: Gender[] = ["new-menu-07-12-2024"];

// Module-level cache: remembers which parent menu (women/men) resolved last
// time so we don't re-try both endpoints on every category navigation.
let cachedGenderHandle: Gender | null = null;

const formatHandleFallback = (rawHandle: string): string =>
  rawHandle
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

// Locates targetHandle inside a menu tree. A match can be either:
//  - a subcategory itself (e.g. "women-plain-tshirts")
//  - one of a subcategory's children (e.g. "longline-tops")
// In both cases the "strip" is the subcategory + all its children.
const findCategoryContext = (
  menu: MenuTopCategory[],
  targetHandle: string,
): { title: string; strip: StripItem[] } | null => {
  for (const topCategory of menu) {
    const subcategories = topCategory.subcategories;
    if (!Array.isArray(subcategories)) continue;

    for (const sub of subcategories) {
      const children = Array.isArray(sub.children) ? sub.children : [];

      if (sub.handle === targetHandle) {
        return {
          title: sub.title,
          strip: [{ title: sub.title, handle: sub.handle }, ...children],
        };
      }

      const matchedChild = children.find(
        (child) => child.handle === targetHandle,
      );
      if (matchedChild) {
        return {
          title: matchedChild.title,
          strip: [{ title: sub.title, handle: sub.handle }, ...children],
        };
      }
    }
  }
  return null;
};

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

// Premium horizontal text strip — subcategory + its children, active item
// in pink/bold with a bottom indicator, everything else gray.
const CategoryStrip = memo(
  ({
    items,
    currentHandle,
    onSelect,
  }: {
    items: StripItem[];
    currentHandle: string;
    onSelect: (targetHandle: string) => void;
  }) => {
    if (items.length === 0) return null;

    return (
      <View style={styles.stripWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stripContent}
        >
          {items.map((item) => {
            const isActive = item.handle === currentHandle;
            return (
              <Pressable
                key={item.handle}
                onPress={() => onSelect(item.handle)}
                style={styles.stripItem}
                hitSlop={8}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.stripItemText,
                    isActive && styles.stripItemTextActive,
                  ]}
                >
                  {item.title}
                </Text>
                {isActive && <View style={styles.stripIndicator} />}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  },
);

const Handle = () => {
  const [wishlist, setWishlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const params = useLocalSearchParams<{ handle?: string | string[] }>();
  const router = useRouter();
  const cartCount = useCartStore((state) => state.cartItems.length);

  // REQUIREMENT 8: single normalized handle used everywhere below
  const currentHandle: string = Array.isArray(params.handle)
    ? params.handle[0]
    : (params.handle ?? "");

  const [stripItems, setStripItems] = useState<StripItem[]>([]);
  const [stripLoading, setStripLoading] = useState(false);
  const [currentCategoryTitle, setCurrentCategoryTitle] = useState<string>(() =>
    formatHandleFallback(currentHandle),
  );

  // RESPONSIVE: live screen dimensions — works on rotation and split-screen too
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const cardWidth = (width - 24 - 4) * 0.49;
  const productImageHeight = Math.round(cardWidth * 1.35);
  const bannerHeight = Math.round(width * 0.128);

  // ---- Product fetching (unchanged API, now keyed off currentHandle) ----
  useEffect(() => {
    if (!currentHandle) return;

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/products/${currentHandle}`,
        );
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentHandle]);

  // ---- Menu resolution: find currentHandle inside women/men menu tree ----
  const loadCategoryContext = useCallback(async (targetHandle: string) => {
    if (!targetHandle) {
      setStripItems([]);
      return;
    }

    setCurrentCategoryTitle(formatHandleFallback(targetHandle));
    setStripLoading(true);

    const orderedGenders = cachedGenderHandle
      ? [
          cachedGenderHandle,
          ...GENDER_HANDLES.filter((g) => g !== cachedGenderHandle),
        ]
      : GENDER_HANDLES;

    try {
      for (const gender of orderedGenders) {
        try {
          const response = await fetch(
            `${process.env.EXPO_PUBLIC_API_URL}/api/products/menu/${gender}`,
          );
          const data = (await response.json()) as unknown;

          const menu: MenuTopCategory[] = Array.isArray(data)
            ? (data as MenuTopCategory[])
            : Array.isArray((data as { menu?: unknown })?.menu)
              ? (data as { menu: MenuTopCategory[] }).menu
              : [];
          console.log("Current Handle:", currentHandle);
          console.log("Menu Response:", JSON.stringify(menu, null, 2));

          const context = findCategoryContext(menu, targetHandle);
          if (context) {
            cachedGenderHandle = gender;
            setStripItems(context.strip);
            setCurrentCategoryTitle(context.title);
            return;
          }
        } catch (err) {
          // Try the next gender rather than crashing
          console.error(`Error fetching ${gender} menu:`, err);
        }
      }

      // Not found in either menu — fail gracefully with an empty strip
      setStripItems([]);
    } finally {
      setStripLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategoryContext(currentHandle);
  }, [currentHandle, loadCategoryContext]);

  const handleSelectCategory = useCallback(
    (targetHandle: string) => {
      if (targetHandle === currentHandle) return;
      router.replace({
        pathname: "/category/[handle]",
        params: { handle: targetHandle },
      });
    },
    [currentHandle, router],
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#1a1a1a" }}>
              {currentCategoryTitle}
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
            // REQUIREMENT 4: sticky category strip pinned to top of the FlatList
            stickyHeaderIndices={[0]}
            ListHeaderComponent={
              <CategoryStrip
                items={stripItems}
                currentHandle={currentHandle}
                onSelect={handleSelectCategory}
              />
            }
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
  // ---- Category strip ----
  stripWrap: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f2eaec",
  },
  stripContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  stripItem: {
    marginRight: 22,
    alignItems: "center",
  },
  stripItemText: {
    fontSize: 13.5,
    fontWeight: "500",
    color: "#8a8a8a",
  },
  stripItemTextActive: {
    color: "#ff5c84",
    fontWeight: "700",
  },
  stripIndicator: {
    marginTop: 5,
    height: 3,
    width: 18,
    borderRadius: 2,
    backgroundColor: "#ff5c84",
  },
});
