// app/category/[handle].tsx
import CollectionFilterBar, {
  FilterEmptyState,
} from "@/components/catalog/CollectionFilterBar";
import { FilterIce } from "@/components/catalog/iceTheme";
import Similarproductsmodal from "@/components/modal/Similarproductsmodal";
import CatalogLoadingBoundary from "@/components/ui/CatalogLoadingBoundary";
import NoInternet from "@/components/ui/NoInternet";
import ProductCard from "@/components/ui/ProductCrad";
import { useAutoHideCollectionBar } from "@/hooks/useAutoHideCollectionBar";
import { useCatalogQuery } from "@/hooks/useCatalogQuery";
import { useCollectionFilters } from "@/hooks/useCollectionFilters";
import {
  emptyFilters,
  FilterableProduct,
  selectCatalog,
  SORT_OPTIONS,
  SortOrder,
} from "@/lib/catalogFilters";
import { preloadProductImages } from "@/lib/productImagePreload";
import {
  collectionPath,
  MENU_PATH,
  REVIEW_SUMMARY_PATH,
} from "@/store/catalogStore";
import { EvilIcons, Feather, Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
// RESPONSIVE: useSafeAreaInsets ensures nothing overlaps home indicator / notch
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Product = FilterableProduct & {
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

// Resolved location of `currentHandle` inside the menu tree.
type CategoryContext = {
  subHandle: string;
  subTitle: string;
  children: StripItem[];
};

const ALL_LABEL = "All";
const EMPTY_PRODUCTS: Product[] = [];
const EMPTY_MENU: MenuTopCategory[] = [];
const EMPTY_REVIEWS = {};

// Keep each card's callback stable when its position changes during sorting.
const CollectionCard = memo(function CollectionCard({
  item,
  onSelect,
  height,
  reviews,
}: {
  item: Product;
  onSelect: (product: Product) => void;
  height: number;
  reviews: any;
}) {
  const onPress = useCallback(() => onSelect(item), [item, onSelect]);
  return (
    <ProductCard
      item={item}
      onPress={onPress}
      productImageHeight={height}
      reviewSummary={reviews}
    />
  );
});
const productKey = (item: Product) => item.id;

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

const Handle = () => {
  const [wishlist, setWishlist] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [similarModal, setSimilarModal] = useState(false);
  const params = useLocalSearchParams<{ handle?: string | string[] }>();
  const router = useRouter();
  const currentHandle: string = Array.isArray(params.handle)
    ? params.handle[0]
    : (params.handle ?? "");

  const [selection, setSelection] = useState({
    route: currentHandle,
    handle: currentHandle,
  });
  const activeHandle =
    selection.route === currentHandle ? selection.handle : currentHandle;
  const {
    data: cachedProducts,
    loading,
    offline,
    error: productError,
    refresh: retryProducts,
  } = useCatalogQuery<Product[]>(
    activeHandle ? collectionPath(activeHandle) : null,
  );
  const products = cachedProducts ?? EMPTY_PRODUCTS;
  const { data: cachedMenu } = useCatalogQuery<MenuTopCategory[]>(MENU_PATH);
  const catalogMenu = cachedMenu ?? EMPTY_MENU;
  const filtering = useCollectionFilters(products, catalogMenu, activeHandle);
  const [filterBarHeight, setFilterBarHeight] = useState(82);
  const autoBar = useAutoHideCollectionBar(
    activeHandle,
    !loading && products.length > 0,
    filterBarHeight,
  );
  const productListRef = useRef<FlatList<Product>>(null);
  const previewSort = (sort: SortOrder) => {
    if (offline) return;
    const next = selectCatalog(filtering.index, filtering.filters, sort);
    preloadProductImages(
      next.slice(0, 8).flatMap((item) => item.images.slice(0, 1)),
      true,
    );
  };
  const prepareSortImages = () => {
    if (offline) return;
    // Only warm the first screen of each possible order, never the full catalog.
    const images = SORT_OPTIONS.filter(
      (option) =>
        option.value !== filtering.sort &&
        (option.value !== "newest" || filtering.index.hasDates),
    ).flatMap((option) =>
      selectCatalog(filtering.index, filtering.filters, option.value)
        .slice(0, 4)
        .flatMap((item) => item.images.slice(0, 1)),
    );
    preloadProductImages(images);
  };
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: { item: Product }[] }) => {
      viewableItems.forEach(({ item }) =>
        preloadProductImages(item.images ?? []),
      );
    },
  ).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 40 }).current;
  const { data: reviewData } = useCatalogQuery<{ products: any }>(
    REVIEW_SUMMARY_PATH,
  );
  const reviewSummery = reviewData?.products ?? EMPTY_REVIEWS;

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
  const openSimilarProduct = useCallback((item: Product) => {
    setSelectedProduct(item);
    setSimilarModal(true);
  }, []);
  const renderProduct = useCallback(
    ({ item }: { item: Product }) => (
      <CollectionCard
        item={item}
        onSelect={openSimilarProduct}
        height={productImageHeight}
        reviews={reviewSummery}
      />
    ),
    [openSimilarProduct, productImageHeight, reviewSummery],
  );

  useEffect(() => {
    filtering.results
      .slice(0, 8)
      .forEach((item) => preloadProductImages(item.images.slice(0, 1)));
  }, [filtering.results]);

  // ---- Reset in-page filter whenever the page itself changes (new route) ----
  useEffect(() => {
    setSelection({ route: currentHandle, handle: currentHandle });
  }, [currentHandle]);

  // ---- Menu resolution: runs once per page (per currentHandle), menu itself is cached ----
  useEffect(() => {
    if (!currentHandle) {
      setCategoryContext(null);
      return;
    }

    setCurrentCategoryTitle(formatHandleFallback(currentHandle));
    const topCategoryTitle = currentHandle.startsWith("men") ? "Men" : "Women";
    const topCategory = catalogMenu.find(
      (category) => category.title === topCategoryTitle,
    );
    const context = topCategory
      ? findCategoryContext([topCategory], currentHandle)
      : null;
    setCategoryContext(context);
    setCurrentCategoryTitle(
      context?.subTitle ?? formatHandleFallback(currentHandle),
    );
  }, [currentHandle, catalogMenu]);

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

  const handleSelectCategory = useCallback(
    (targetHandle: string) => {
      setSelection({ route: currentHandle, handle: targetHandle });
    },
    [currentHandle],
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
          headerStyle: { backgroundColor: FilterIce.header },
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

      <CatalogLoadingBoundary
        routeKey={activeHandle}
        loading={loading}
        variant="category"
        skipPreview={offline && !cachedProducts}
      >
        {offline && !cachedProducts ? (
          <NoInternet onRetry={retryProducts} />
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
              style={{
                width: 100,
                height: 100,
                marginBottom: 8,
                marginTop: 120,
              }}
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
              {productError || "No products available as of now"}
            </Text>
            {productError ? (
              <Pressable
                onPress={() => void retryProducts()}
                style={{ padding: 16 }}
              >
                <Text>Retry</Text>
              </Pressable>
            ) : (
              <Text style={{ fontSize: 13, color: "#999" }}>
                Try different keywords
              </Text>
            )}
          </View>
        ) : (
          <View
            style={{ flex: 1, overflow: "hidden", backgroundColor: "#fff" }}
          >
            <View
              pointerEvents={autoBar.hidden ? "none" : "box-none"}
              accessibilityElementsHidden={autoBar.hidden}
              importantForAccessibility={
                autoBar.hidden ? "no-hide-descendants" : "auto"
              }
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: filterBarHeight,
                overflow: "hidden",
                zIndex: 10,
              }}
              onTouchStart={autoBar.onScrollBeginDrag}
              onTouchEnd={autoBar.onScrollEndDrag}
            >
              <Animated.View
                onLayout={(event) =>
                  setFilterBarHeight(event.nativeEvent.layout.height)
                }
                style={[
                  { position: "absolute", top: 0, left: 0, right: 0 },
                  autoBar.slideStyle,
                ]}
              >
                <CollectionFilterBar
                  key={activeHandle}
                  onSheetChange={autoBar.onSheetChange}
                  styleOptions={stripItems}
                  activeStyle={activeHandle}
                  onStyle={handleSelectCategory}
                  filters={filtering.filters}
                  sort={filtering.sort}
                  facets={filtering.index.facets}
                  hasDates={filtering.index.hasDates}
                  count={filtering.results.length}
                  offline={offline}
                  onSortOpen={prepareSortImages}
                  onSortPreview={previewSort}
                  onApply={(next) => {
                    filtering.setFilters(next);
                    productListRef.current?.scrollToOffset({
                      offset: 0,
                      animated: false,
                    });
                  }}
                  onSort={(next) => {
                    previewSort(next);
                    filtering.setSort(next);
                    productListRef.current?.scrollToOffset({
                      offset: 0,
                      animated: false,
                    });
                  }}
                />
              </Animated.View>
            </View>
            <FlatList
              ref={productListRef}
              data={filtering.results}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              keyExtractor={productKey}
              numColumns={2}
              style={{ backgroundColor: "#fff" }}
              ListHeaderComponent={<View style={{ height: filterBarHeight }} />}
              renderItem={renderProduct}
              columnWrapperStyle={styles.columnWrapper}
              showsVerticalScrollIndicator={false}
              initialNumToRender={8}
              maxToRenderPerBatch={8}
              updateCellsBatchingPeriod={16}
              windowSize={5}
              onScroll={autoBar.onScroll}
              scrollEventThrottle={16}
              onScrollBeginDrag={autoBar.onScrollBeginDrag}
              onScrollEndDrag={autoBar.onScrollEndDrag}
              onMomentumScrollEnd={autoBar.onMomentumScrollEnd}
              onTouchStart={autoBar.onTouchStart}
              onTouchMove={autoBar.onTouchMove}
              onTouchEnd={autoBar.onTouchEnd}
              onTouchCancel={autoBar.onTouchEnd}
              ListEmptyComponent={
                <FilterEmptyState
                  onClear={() => filtering.setFilters(emptyFilters())}
                />
              }

              ListFooterComponent={
                <View style={{ height: 16 + insets.bottom }} />
              }
            />
          </View>
        )}
      </CatalogLoadingBoundary>
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
});
