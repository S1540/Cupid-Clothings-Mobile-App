// app/category/[handle].tsx
import Similarproductsmodal from "@/components/modal/Similarproductsmodal";
import HomeSkeleton from "@/components/ui/HomeSkeleton";
import ProductCard from "@/components/ui/ProductCrad";
import { useCartStore } from "@/store/cartStore";
import {
  EvilIcons,
  Feather,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  LayoutChangeEvent,
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

type MenuApiResponse = MenuTopCategory[] | { menu: MenuTopCategory[] };

type StripItem = {
  title: string;
  handle: string;
};

// Resolved location of `currentHandle` inside the menu tree.
type CategoryContext = {
  subHandle: string;
  subTitle: string;
  children: StripItem[];
};

const MENU_HANDLE = "new-menu-07-12-2024";
const ALL_LABEL = "ALL";

const formatHandleFallback = (rawHandle: string): string =>
  rawHandle
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

// Keeps first occurrence of each handle — prevents duplicate React keys when
// a subcategory and one of its children (or the injected ALL pill) collide.
const dedupeByHandle = <T extends { handle: string }>(items: T[]): T[] => {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (seen.has(item.handle)) continue;
    seen.add(item.handle);
    result.push(item);
  }
  return result;
};

// Locates targetHandle inside a menu tree. A match can be either:
//  - a subcategory itself (e.g. "women-plain-tshirts")
//  - one of a subcategory's children (e.g. "longline-tops")
// Either way, the resolved context is the same: the parent subcategory
// (used as the "ALL" handle/title) plus its full child list.
const findCategoryContext = (
  menu: MenuTopCategory[],
  targetHandle: string,
): CategoryContext | null => {
  for (const topCategory of menu) {
    const subcategories = topCategory.subcategories;
    if (!Array.isArray(subcategories)) continue;

    for (const sub of subcategories) {
      const children = Array.isArray(sub.children) ? sub.children : [];
      const isDirectMatch = sub.handle === targetHandle;
      const isChildMatch = children.some(
        (child) => child.handle === targetHandle,
      );

      if (isDirectMatch || isChildMatch) {
        return { subHandle: sub.handle, subTitle: sub.title, children };
      }
    }
  }
  return null;
};

// Module-level cache: the menu tree rarely changes and is identical for
// every category screen, so fetch it once per app session and reuse it.
let cachedMenuPromise: Promise<MenuTopCategory[]> | null = null;

const getMenu = (): Promise<MenuTopCategory[]> => {
  if (!cachedMenuPromise) {
    cachedMenuPromise = fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/api/products/menu/${MENU_HANDLE}`,
    )
      .then((res) => res.json())
      .then((data: MenuApiResponse) => {
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.menu)) return data.menu;
        return [];
      })
      .catch((err) => {
        cachedMenuPromise = null;
        throw err;
      });
  }
  return cachedMenuPromise;
};

// RESPONSIVE: productImageHeight prop so card image scales with screen
// const ProductCard = memo(
//   ({
//     item,
//     reviewSummery,
//     productImageHeight,
//   }: {
//     item: Product;
//     reviewSummery: any;
//     productImageHeight: number;
//   }) => {
//     const router = useRouter();
//     const productId = item.id.split("/").pop();
//     const review = productId && reviewSummery ? reviewSummery[productId] : null;

//     return (
//       <Pressable
//         onPress={() =>
//           router.push({
//             pathname: "/product/[handle]",
//             params: { handle: item.handle },
//           })
//         }
//         style={styles.productCard}
//       >
//         <View style={[styles.productImageWrap, { height: productImageHeight }]}>
//           <Image
//             source={{ uri: item.images?.[0]?.url || "" }}
//             style={{ width: "100%", height: "100%" }}
//             resizeMode="cover"
//             fadeDuration={0}
//           />
//           <Pressable
//             //  onPressIn={handlePrefetch}
//             style={styles.wishlistBtn}
//             hitSlop={8}
//           >
//             {review && (
//               <View
//                 style={{
//                   flexDirection: "row",
//                   alignItems: "center",
//                   marginTop: 4,
//                   // marginBottom: 2,
//                   paddingVertical: 1,
//                   paddingHorizontal: 2,
//                   borderRadius: 2,
//                   backgroundColor: "rgba(255,255,255,0.55)",
//                 }}
//               >
//                 <MaterialCommunityIcons name="star" size={13} color="#F59E0B" />

//                 <Text
//                   style={{
//                     fontSize: 11,
//                     fontWeight: "600",
//                     marginLeft: 3,
//                   }}
//                 >
//                   {review.averageRating} ({review.reviewCount})
//                 </Text>
//               </View>
//             )}
//           </Pressable>
//         </View>

//         <View style={{ padding: 10, gap: 4 }}>
//           <Text numberOfLines={2} style={styles.productTitle}>
//             {item.title}
//           </Text>
//           <View style={styles.priceRow}>
//             <Text style={styles.price}>₹{item.price}</Text>
//             {item.compareAtPrice && (
//               <Text style={styles.comparePrice}>₹{item.compareAtPrice}</Text>
//             )}
//             {item.discountPercent && (
//               <Text style={styles.discount}>{item.discountPercent}% off</Text>
//             )}
//           </View>
//           <Text style={styles.firstOrderOffer}>30% off on first order</Text>
//         </View>
//       </Pressable>
//     );
//   },
// );
// ProductCard.displayName = "ProductCard";

// ---- Premium pill: press-scale animation via native driver ----
const CategoryPill = memo(
  ({
    item,
    isActive,
    onPress,
    onLayout,
  }: {
    item: StripItem;
    isActive: boolean;
    onPress: (handle: string) => void;
    onLayout: (event: LayoutChangeEvent) => void;
  }) => {
    const scale = useRef(new Animated.Value(1)).current;

    const animateTo = useCallback(
      (toValue: number) => {
        Animated.spring(scale, {
          toValue,
          useNativeDriver: true,
          speed: 40,
          bounciness: 6,
        }).start();
      },
      [scale],
    );

    return (
      <Pressable
        onPress={() => onPress(item.handle)}
        onPressIn={() => animateTo(0.94)}
        onPressOut={() => animateTo(1)}
        onLayout={onLayout}
        hitSlop={6}
      >
        <Animated.View
          style={[
            styles.pill,
            isActive ? styles.pillActive : styles.pillInactive,
            { transform: [{ scale }] },
          ]}
        >
          <Text
            numberOfLines={1}
            style={[styles.pillText, isActive && styles.pillTextActive]}
          >
            {item.title}
          </Text>
        </Animated.View>
      </Pressable>
    );
  },
);
CategoryPill.displayName = "CategoryPill";

// Premium horizontal pill strip. Auto-centers the active pill whenever it
// changes or first mounts, using measured pill layouts (no magic numbers).
const CategoryStrip = memo(
  ({
    items,
    activeHandle,
    onSelect,
  }: {
    items: StripItem[];
    activeHandle: string;
    onSelect: (targetHandle: string) => void;
  }) => {
    const scrollViewRef = useRef<ScrollView>(null);
    const itemLayouts = useRef<Record<string, { x: number; width: number }>>(
      {},
    );
    const [containerWidth, setContainerWidth] = useState(0);

    // Reset measured layouts whenever the set of items changes (new category).
    useEffect(() => {
      itemLayouts.current = {};
    }, [items]);

    const centerPill = useCallback(
      (x: number, width: number) => {
        if (!scrollViewRef.current || containerWidth === 0) return;
        const targetX = Math.max(0, x - containerWidth / 2 + width / 2);
        scrollViewRef.current.scrollTo({ x: targetX, animated: true });
      },
      [containerWidth],
    );

    // Re-center whenever the active handle changes and we already know its layout.
    useEffect(() => {
      const layout = itemLayouts.current[activeHandle];
      if (layout) centerPill(layout.x, layout.width);
    }, [activeHandle, centerPill]);

    const handlePillLayout = useCallback(
      (handle: string) => (event: LayoutChangeEvent) => {
        const { x, width } = event.nativeEvent.layout;
        itemLayouts.current[handle] = { x, width };
        if (handle === activeHandle) centerPill(x, width);
      },
      [activeHandle, centerPill],
    );

    const handleContainerLayout = useCallback((event: LayoutChangeEvent) => {
      setContainerWidth(event.nativeEvent.layout.width);
    }, []);

    if (items.length === 0) return null;

    return (
      <View style={styles.stripWrap} onLayout={handleContainerLayout}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          contentContainerStyle={styles.stripContent}
        >
          {items.map((item) => (
            <CategoryPill
              key={item.handle}
              item={item}
              isActive={item.handle === activeHandle}
              onPress={onSelect}
              onLayout={handlePillLayout(item.handle)}
            />
          ))}
        </ScrollView>
      </View>
    );
  },
);
CategoryStrip.displayName = "CategoryStrip";

const Handle = () => {
  const [wishlist, setWishlist] = useState(false);
  const [reviewSummery, setReviewSummery] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [similarModal, setSimilarModal] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const params = useLocalSearchParams<{ handle?: string | string[] }>();
  const router = useRouter();
  const currentHandle: string = Array.isArray(params.handle)
    ? params.handle[0]
    : (params.handle ?? "");

  const [activeHandle, setActiveHandle] = useState(currentHandle);

  const [categoryContext, setCategoryContext] =
    useState<CategoryContext | null>(null);
  const [currentCategoryTitle, setCurrentCategoryTitle] = useState<string>(() =>
    formatHandleFallback(currentHandle),
  );

  // RESPONSIVE: live screen dimensions — works on rotation and split-screen too
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const cardWidth = (width - 24 - 4) * 0.49;
  const productImageHeight = Math.round(cardWidth * 1.35);

  // ---- Reset in-page filter whenever the page itself changes (new route) ----
  useEffect(() => {
    setActiveHandle(currentHandle);
  }, [currentHandle]);

  // ---- Menu resolution: runs once per page (per currentHandle), menu itself is cached ----
  useEffect(() => {
    if (!currentHandle) {
      setCategoryContext(null);
      return;
    }

    let ignore = false;
    setCurrentCategoryTitle(formatHandleFallback(currentHandle));

    const resolveContext = async () => {
      try {
        const menu = await getMenu();
        const topCategoryTitle = currentHandle.startsWith("men")
          ? "Men"
          : "Women";
        const topCategory = menu.find(
          (category) => category.title === topCategoryTitle,
        );
        const context = topCategory
          ? findCategoryContext([topCategory], currentHandle)
          : null;

        if (ignore) return;
        setCategoryContext(context);
        setCurrentCategoryTitle(
          context?.subTitle ?? formatHandleFallback(currentHandle),
        );
      } catch (error) {
        console.error("Error fetching category menu:", error);
        if (!ignore) setCategoryContext(null);
      }
    };

    resolveContext();
    return () => {
      ignore = true;
    };
  }, [currentHandle]);

  // ---- Product fetching: refetches ONLY when the in-page filter changes ----
  useEffect(() => {
    if (!activeHandle) return;

    let ignore = false;
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/products/${activeHandle}`,
        );
        const data = await response.json();
        if (!ignore) setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchProducts();
    return () => {
      ignore = true;
    };
  }, [activeHandle]);
  // fetch review from db(firebasse)
  useEffect(() => {
    const fetchReviewSummery = async () => {
      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/judgeme/review-summary`,
        );

        const data = await response.json();
        if (data.success) {
          setReviewSummery(data.products);
        }
      } catch (error) {
        console.log("Review summary error:", error);
      }
    };
    fetchReviewSummery();
  }, []);

  // Strip is [ALL, ...children] — ALL reuses the subcategory's own handle,
  // so selecting it re-fetches the exact same list the page opened with.
  // Only rendered when the resolved subcategory actually has children.
  const stripItems: StripItem[] = useMemo(() => {
    if (!categoryContext || categoryContext.children.length === 0) return [];
    const allPill: StripItem = {
      title: ALL_LABEL,
      handle: categoryContext.subHandle,
    };
    return dedupeByHandle([allPill, ...categoryContext.children]);
  }, [categoryContext]);

  const handleSelectCategory = useCallback((targetHandle: string) => {
    setActiveHandle((prev) => (prev === targetHandle ? prev : targetHandle));
  }, []);

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
                onPress={() => router.push("/Wishlist")}
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
      ) : products.length === 0 ? (
        <View
          style={{
            flex: 1,
            // justifyContent: "center",

            alignItems: "center",
            paddingHorizontal: 30,
            backgroundColor: "#fff",
          }}
        >
          <Image
            style={{ width: 100, height: 100, marginBottom: 8, marginTop: 120 }}
            source={require("../../assets/icons/empty.png")}
          />
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: "#1a1a1a",
              marginBottom: 4,
            }}
          >
            No products available as of now
          </Text>
          <Text style={{ fontSize: 13, color: "#999" }}>
            Try different keywords
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          style={{ backgroundColor: "#fff" }}
          renderItem={({ item }) => (
            <ProductCard
              item={item}
              onPress={() => {
                setSelectedProduct(item);
                setSimilarModal(true);
              }}

              productImageHeight={productImageHeight}
              reviewSummary={reviewSummery}
            />
          )}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={5}
          stickyHeaderIndices={[0]}
          ListHeaderComponent={
            <CategoryStrip
              items={stripItems}
              activeHandle={activeHandle}
              onSelect={handleSelectCategory}
            />
          }

          ListFooterComponent={<View style={{ height: 16 + insets.bottom }} />}
        />
      )}
      <Similarproductsmodal
        visible={similarModal}
        product={selectedProduct}
        onClose={() => setSimilarModal(false)}
      />
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
    marginTop: 8,
    borderWidth: 0.5,
    borderColor: "#f0f0f0",
  },
  productImageWrap: {
    width: "100%",
    backgroundColor: "#fafafa",
  },
  wishlistBtn: {
    position: "absolute",
    bottom: 4,
    left: 8,
    borderRadius: 20,
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
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: "center",
    gap: 10,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 6,
  },
  pillActive: {
    backgroundColor: "#F87387",
    shadowColor: "#ff4f81",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  pillInactive: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f4f2f8",
  },
  pillText: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "#4a4a4a",
  },
  pillTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },
});
