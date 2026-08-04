// app/(tabs)/index.tsx
import Header from "@/components/Header";
import LoginRewardModal from "@/components/modal/Loginrewardmodal";
import Similarproductsmodal from "@/components/modal/Similarproductsmodal";
import CircleLoader from "@/components/ui/CircleLoader";
import HomeSkeleton from "@/components/ui/HomeSkeleton";
import ProductCard from "@/components/ui/ProductCrad";
import PromoHotDeals from "@/components/ui/PromoHotDeals";
import KidsCollections from "@/components/ui/KidsCollection";
import RecommendedProductsSection from "@/components/ui/RecommendedProductsSection";
import ComfortCategoryGrid from "@/components/ui/ComfortCategoryGrid";
import { auth } from "@/firebaseConfig";
import { Image } from "expo-image";
import { router, useFocusEffect, useRouter } from "expo-router";
import { Marquee } from "@animatereactnative/marquee";
import { LinearGradient } from "expo-linear-gradient";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FlatList,
  ListRenderItem,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import Carousel from "react-native-reanimated-carousel";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import "../../global.css";
import {
  CATEGORY_IMAGES,
  BANNERS,
  type BannerItem,
  OFFERS,
  type Offer,
  offerCollections,
  offerCollections2,
  type offerCollectionsType,
  kidsImages,
  type ComfortableItem,
  COMFORTABLE,
} from "../../localData/localData";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import WarrningLable from "@/components/WarrningLable";

// ─── TYPES ────────────────────────────────────────────────────────────────────
type Subcategory = { title: string; handle: string; image: string | null };
type MenuItem = { title: string; handle: string; subcategories: Subcategory[] };
type Category = { name: string; handle: string; image: string };

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
type FilterState = {
  priceRange: string | null;
  sizes: string[];
  discount: string | null;
  sort: string | null;
};

const DEFAULT_IMAGE = "";

// Kidss Scroller Data
const ANNOUNCEMENTS = [
  "🔥 Just Launched Kids Wear",
  "💖 More Collections Coming Soon",
];

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────

const BannerSlide = memo(({ item }: { item: BannerItem }) => (
  <View style={styles.bannerSlide}>
    <Image
      source={{ uri: item.image }}
      style={StyleSheet.absoluteFillObject}
      contentFit="cover"
      cachePolicy="memory-disk"
      transition={120}
    />
  </View>
));

const OfferSlide = memo(({ item }: { item: Offer }) => (
  <View style={styles.offerSlide}>
    <Image
      source={{ uri: item.image }}
      style={StyleSheet.absoluteFillObject}
      contentFit="cover"
      cachePolicy="memory-disk"
      transition={120}
    />
  </View>
));

// ─── HomeListHeader ───────────────────────────────────────────────────────────
type HomeListHeaderProps = {
  banners: BannerItem[];
  categories: Category[];
  carouselWidth: number;
  activeNav: string;
  bannerHeight: number;
  offerHeight: number;
  onSnapRef: React.MutableRefObject<((index: number) => void) | null>;
  renderCategory: ListRenderItem<Category>;
  renderProduct: ListRenderItem<Product>;
  offers?: Offer[];
  offersData?: offerCollectionsType[];
  onPress?: () => void;
  recommendedProducts?: Product[];
  interestedProducts?: Product[];
  kidsProducts?: Product[];
  comfortableItems?: ComfortableItem[];
};

const HomeListHeader = React.memo(
  ({
    banners,
    categories,
    carouselWidth,
    activeNav,
    bannerHeight,
    offerHeight,
    onSnapRef,
    onPress,
    renderCategory,
    offers,
    recommendedProducts,
    kidsProducts,
    renderProduct,
  }: HomeListHeaderProps) => {
    const [activeSlide, setActiveSlide] = useState(0);
    useEffect(() => {
      onSnapRef.current = setActiveSlide;
    }, []);

    const renderBannerItem = useCallback(
      ({ item }: { item: BannerItem }) => <BannerSlide item={item} />,
      [],
    );
    const renderOfferItem = useCallback(
      ({ item }: { item: Offer }) => <OfferSlide item={item} />,
      [],
    );
    const gender = activeNav.toLowerCase();
    const filteredOfferCollections = offerCollections.filter(
      (item) => item.gender.toLowerCase() === gender,
    );
    const filteredOfferCollections2 = offerCollections2.filter(
      (item) => item.gender.toLowerCase() === gender,
    );
    const filteredComfortable = COMFORTABLE.filter(
      (item) => item.gender.toLowerCase() === activeNav.toLowerCase(),
    );
    const showHomeSections = activeNav === "Women" || activeNav === "Men";

    const recommendedItems = (recommendedProducts ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      handle: item.handle,
      image: item.images?.[0]?.url ?? "",
      price: Number(item.price),
      compareAtPrice: item.compareAtPrice
        ? Number(item.compareAtPrice)
        : undefined,
      rating: 4.8,
      reviewCount: 76,
      badge: undefined,
    }));

    return (
      <>
        <Carousel
          loop
          width={carouselWidth}
          height={bannerHeight}
          autoPlay
          autoPlayInterval={3000}
          onSnapToItem={setActiveSlide}
          data={banners}
          scrollAnimationDuration={700}
          renderItem={renderBannerItem}
        />
        <View style={styles.dotsRow}>
          {banners.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === activeSlide ? 18 : 8,
                height: 3,
                borderRadius: 99,
                backgroundColor: i === activeSlide ? "#F87387" : "#d8d8d8",
              }}
            />
          ))}
        </View>
        <View style={{ marginTop: 20, marginBottom: 8 }}>
          <FlatList
            data={categories}
            keyExtractor={(item) => item.handle}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
            renderItem={renderCategory}
            initialNumToRender={5}
            maxToRenderPerBatch={5}
          />
        </View>
        {offers && offers.length > 0 && (
          <View style={{ marginBottom: 20, paddingLeft: 10, paddingRight: 10 }}>
            <Carousel
              loop
              width={carouselWidth - 20}
              height={offerHeight}
              autoPlay
              autoPlayInterval={4000}
              data={offers}
              scrollAnimationDuration={700}
              renderItem={renderOfferItem}
            />
          </View>
        )}
        {/* // Collections Bg inside card */}
        {showHomeSections && (
          <PromoHotDeals
            heading="HOT DEALS "
            backgroundImage={""}
            data={filteredOfferCollections.map((c) => ({
              id: c.id,
              title: c.title,
              handle: c.handle,
              image: c.bg,
            }))}
          >
            <View style={{ paddingLeft: 16, marginTop: 8 }}>
              <FlatList
                horizontal
                data={filteredOfferCollections2.map((c) => ({
                  id: c.id,
                  title: c.title,
                  handle: c.handle,
                  image: c.bg,
                }))}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => router.push(`/category/${item.handle}`)}
                  >
                    <Image
                      source={{ uri: item.image }}
                      style={{
                        width: 180,
                        height: 280,
                        borderRadius: 0,
                        marginRight: 6,
                      }}
                    />
                  </Pressable>
                )}
              />
            </View>
          </PromoHotDeals>
        )}
        {/* Comfort Zone deal */}
        {showHomeSections && (
          <ComfortCategoryGrid
            title="PICK YOUR COMFORT"
            subtitle="Styles for every mood & every moment."
            onPressViewAll={() => router.push("/")}
            onPress={(item) => router.push(`/category/${item.handle}`)}
            data={filteredComfortable.map((c) => ({
              id: c.id,
              title: c.title,
              subtitle: c.subtitle,
              handle: c.handle,
              image: c.image,
              icon: c.icon,
            }))}
          />
        )}
        {/* Recomended Section */}
        {showHomeSections && (
          <RecommendedProductsSection
            heading="PICK YOUR INTERESTS"
            subHeading="More styles we think you'll love"
            products={recommendedItems}
            onPressProduct={(item: any) =>
              router.push(`/product/${item.handle}`)
            }
            onAddToBag={(item) => null}
            onWishlist={(item) => null}
            onViewAll={() => router.push("/")}
          />
        )}
        {/* Just Lunched Kids Wear */}
        {activeNav === "Women" && (
          <>
            <LinearGradient
              colors={["#F87387", "#B85CC9", "#759EF0DB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flexDirection: "row", height: 40 }}
            >
              <View
                style={{
                  width: 140,
                  justifyContent: "center",
                  paddingLeft: 14,
                  backgroundColor: "rgba(0,0,0,0.12)",
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 12.5,
                    fontWeight: "800",
                    letterSpacing: 0.8,
                  }}
                >
                  JUST LAUNCHED
                </Text>
              </View>

              <View
                style={{
                  flex: 1,
                  overflow: "hidden",
                  justifyContent: "center",
                }}
              >
                <Marquee>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    {ANNOUNCEMENTS.map((item, i) => (
                      <View
                        key={i}
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <Text
                          style={{
                            color: "#fff",
                            fontSize: 12.5,
                            fontWeight: "600",
                            opacity: 0.96,
                            letterSpacing: 0.2,
                          }}
                        >
                          {item}
                        </Text>
                        <Text
                          style={{
                            color: "#ffffffaa",
                            fontSize: 13,
                            fontWeight: "700",
                            marginHorizontal: 14,
                          }}
                        >
                          •
                        </Text>
                      </View>
                    ))}
                  </View>
                </Marquee>
              </View>
            </LinearGradient>
            <KidsCollections
              backgroundImage={""}
              data={kidsProducts!.map((item) => ({
                id: item.id,
                title: item.title,
                handle: item.handle,
                image: kidsImages[item.handle] ?? item.images[0]?.url,
              }))}
            />
          </>
        )}
        {/* Warrrning Label */}
        {showHomeSections && <WarrningLable />}
      </>
    );
  },
  (prev, next) =>
    prev.banners === next.banners &&
    prev.categories === next.categories &&
    prev.carouselWidth === next.carouselWidth &&
    prev.bannerHeight === next.bannerHeight &&
    prev.offerHeight === next.offerHeight &&
    prev.renderCategory === next.renderCategory,
);

// ─── CategoryItem ---------------------------------------------
const CategoryItem = memo(
  ({
    item,
    onPress,
    categorySize,
  }: {
    item: Category;
    onPress: () => void;
    categorySize: number;
  }) => (
    <Pressable
      onPress={onPress}
      style={{ width: categorySize + 2, alignItems: "center", marginRight: 5 }}
    >
      <View
        style={[
          styles.categoryCircle,
          { width: categorySize, height: categorySize },
        ]}
      >
        <Image
          source={{ uri: item.image }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
      </View>
      <Text style={styles.categoryLabel} numberOfLines={2}>
        {item.name}
      </Text>
    </Pressable>
  ),
);

// ─── FilterModal --------------------------------------------------
const FilterModal = memo(
  ({
    visible,
    onClose,
    onApply,
  }: {
    visible: boolean;
    onClose: () => void;
    onApply: (filters: FilterState) => void;
  }) => {
    const insets = useSafeAreaInsets();

    const [selected, setSelected] = useState<FilterState>({
      priceRange: null,
      sizes: [],
      discount: null,
      sort: null,
    });

    const toggle = (key: keyof FilterState, value: string) => {
      if (key === "sizes") {
        setSelected((prev) => ({
          ...prev,
          sizes: prev.sizes.includes(value)
            ? prev.sizes.filter((s) => s !== value)
            : [...prev.sizes, value],
        }));
      } else {
        setSelected((prev) => ({
          ...prev,
          [key]: prev[key] === value ? null : value,
        }));
      }
    };

    const clear = () =>
      setSelected({ priceRange: null, sizes: [], discount: null, sort: null });

    const Chip = ({
      label,
      active,
      onPress,
    }: {
      label: string;
      active: boolean;
      onPress: () => void;
    }) => (
      <Pressable
        onPress={onPress}
        style={[styles.chip, active && styles.chipActive]}
      >
        <Text style={[styles.chipText, active && styles.chipTextActive]}>
          {label}
        </Text>
      </Pressable>
    );

    const Section = ({
      title,
      children,
    }: {
      title: string;
      children: React.ReactNode;
    }) => (
      <View style={{ marginBottom: 24 }}>
        <Text style={styles.filterSectionTitle}>{title}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {children}
        </View>
      </View>
    );

    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={onClose}
      >
        <Pressable
          onPress={onClose}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }}
        />
        <View style={styles.filterSheet}>
          <View style={styles.filterHandle} />
          <View style={styles.filterTopRow}>
            <Text style={styles.filterTitle}>Sort & Filter</Text>
            <Pressable onPress={clear}>
              <Text style={styles.clearText}>Clear All</Text>
            </Pressable>
          </View>

          <ScrollView
            style={{ paddingHorizontal: 20, paddingTop: 20 }}
            showsVerticalScrollIndicator={false}
          >
            <Section title="SORT BY">
              {[
                "Recommended",
                "Newest First",
                "Price: Low to High",
                "Price: High to Low",
                "Discount",
              ].map((s) => (
                <Chip
                  key={s}
                  label={s}
                  active={selected.sort === s}
                  onPress={() => toggle("sort", s)}
                />
              ))}
            </Section>
            <Section title="PRICE RANGE">
              {["Under ₹299", "₹300 – ₹599", "₹600 – ₹999", "Above ₹1000"].map(
                (p) => (
                  <Chip
                    key={p}
                    label={p}
                    active={selected.priceRange === p}
                    onPress={() => toggle("priceRange", p)}
                  />
                ),
              )}
            </Section>
            <Section title="DISCOUNT">
              {["10% & above", "20% & above", "30% & above", "50% & above"].map(
                (d) => (
                  <Chip
                    key={d}
                    label={d}
                    active={selected.discount === d}
                    onPress={() => toggle("discount", d)}
                  />
                ),
              )}
            </Section>
            <Section title="SIZE">
              {[
                "XS",
                "S",
                "M",
                "L",
                "XL",
                "XXL",
                "3XL",
                "4XL",
                "5XL",
                "6XL",
                "7XL",
              ].map((sz) => (
                <Chip
                  key={sz}
                  label={sz}
                  active={selected.sizes.includes(sz)}
                  onPress={() => toggle("sizes", sz)}
                />
              ))}
            </Section>
            <View style={{ height: 100 }} />
          </ScrollView>

          <View
            style={[
              styles.filterFooter,
              { paddingBottom: Math.max(insets.bottom, 16) },
            ]}
          >
            <Pressable
              onPress={() => {
                onApply(selected);
                onClose();
              }}
              style={styles.applyBtn}
            >
              <Text style={styles.applyBtnText}>Apply Filters</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  },
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Index() {
  const [loginRewardModal, setLoginRewardModal] = useState(false);
  // const [showSignup, setShowSignup] = useState(false);
  const [claimedOffer, setClaimedOffer] = useState<number | null>(null);
  const [activeNav, setActiveNav] = useState("Women");
  const [searchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pullToRefresh, setPullToRefresh] = useState(false);
  const [menuData, setMenuData] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filterVisible, setFilterVisible] = useState(false);
  const [similarModal, setSimilarModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [interestedProducts, setInterestedProducts] = useState<Product[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [reviewSummary, setReviewSummary] = useState<any>(null);
  const [kidsProducts, setKidsProducts] = useState<Product[]>([]);
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    priceRange: null,
    sizes: [],
    discount: null,
    sort: null,
  });
  const showHomeLayout = activeNav === "Women" || activeNav === "Men";
  const collectionHandle =
    activeNav === "Best Sellers" ? "bestseller" : activeNav.toLowerCase();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const snapRef = useRef<((index: number) => void) | null>(null);
  const isFirstLoad = useRef(true);
  const prefetchedImages = useRef<Set<string>>(new Set());
  const banners = BANNERS[activeNav] ?? [];
  const BANNER_RATIO = 1345 / 895;
  const bannerHeight = Math.round(width * BANNER_RATIO);
  const offerHeight = Math.round(width * 0.24);
  const categorySize = Math.round(width * 0.24);
  const cardWidth = (width - 32 - 8) / 2;
  const productImageHeight = Math.round(cardWidth * 1.35);
  const prefetched = useRef(new Set<string>());
  const offerPercentage = 15;

  useEffect(() => {
    if (!auth.currentUser) {
      setTimeout(() => setLoginRewardModal(true), 5000);
    }
  }, []);

  const handleClaim = () => {
    setClaimedOffer(offerPercentage);
    setLoginRewardModal(false);
  };

  const handleClose = () => {
    setLoginRewardModal(false);
  };

  // prefetch images who show on screen
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    viewableItems.forEach(({ item }: any) => {
      item.images?.forEach((img: any) => {
        if (!prefetched.current.has(img.url)) {
          prefetched.current.add(img.url);
          Image.prefetch(img.url);
        }
      });
    });
  }).current;

  useEffect(() => {
    banners.forEach((b) => {
      if (!prefetchedImages.current.has(b.image)) {
        prefetchedImages.current.add(b.image);
        Image.prefetch(b.image).catch(() => {});
      }
    });
  }, [activeNav]);

  const filteredProducts = useMemo(
    () =>
      allProducts.filter((p) =>
        p.title.toLowerCase().includes(searchText.toLowerCase()),
      ),
    [allProducts, searchText],
  );
  // Fetching review from Firebse db
  useEffect(() => {
    const fetchReviewSummary = async () => {
      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/judgeme/review-summary`,
        );

        const data = await response.json();
        if (data.success) {
          setReviewSummary(data.products);
        }
      } catch (error) {
        console.log("Review summary error:", error);
      }
    };

    fetchReviewSummary();
  }, []);

  // Fetching Productss data
  useEffect(() => {
    const fetchProduct = async () => {
      if (!isFirstLoad.current) setRefreshing(true);
      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/products/${collectionHandle}`,
        );
        const data: Product[] = await response.json();
        setAllProducts(shuffleArray(data));
      } catch (error) {
        console.log("Product fetch error:", error);
      } finally {
        if (isFirstLoad.current) {
          setLoading(false);
          isFirstLoad.current = false;
        }
        setRefreshing(false);
      }
    };
    fetchProduct();
  }, [collectionHandle]);
  // fetch kids Productss data
  useEffect(() => {
    const fetchKids = async () => {
      try {
        if (activeNav === "Women") {
          const response = await fetch(
            `${process.env.EXPO_PUBLIC_API_URL}/api/products/girls-top-pajama-set`,
          );
          const data: Product[] = await response.json();
          setKidsProducts(data);
        }
      } catch (error) {
        console.log("Kids Product fetch error:", error);
      }
    };
    fetchKids();
  }, [activeNav]);

  // fetch Menuu Items
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/products/menu/new-menu-07-12-2024`,
        );
        const data: MenuItem[] = await response.json();
        setMenuData(data);
      } catch (error) {
        console.log("Menu fetch error:", error);
      }
    };
    fetchMenu();
  }, []);

  useEffect(() => {
    if (menuData.length === 0) return;
    const activeMenu = menuData.find((item) => item.title === activeNav);
    if (activeMenu && activeMenu.subcategories.length > 0) {
      setCategories(
        activeMenu.subcategories.map((sub) => ({
          name: sub.title,
          handle: sub.handle,
          image: CATEGORY_IMAGES[sub.handle] ?? DEFAULT_IMAGE,
        })),
      );
    } else {
      setCategories([]);
    }
  }, [activeNav, menuData]);
  // Read AsyncStorage For Intrested PRoduct
  useFocusEffect(
    useCallback(() => {
      const getInterestedProducts = async () => {
        try {
          const data = await AsyncStorage.getItem("saveIntrestedProduct");
          if (data) {
            setInterestedProducts(JSON.parse(data));
          } else {
            setInterestedProducts([]);
          }
        } catch (err) {
          console.log(err);
        }
      };

      getInterestedProducts();
    }, []),
  );

  // Recommendation apis Call
  const fetchRecommendedProducts = async (products: Product[]) => {
    try {
      const handles = products.map((p) => p.handle);
      // console.log("handles", handles);
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/products/recommendations/home`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ handles }),
        },
      );
      const data = await response.json();
      setRecommendedProducts(data);
    } catch (err) {
      console.log(err);
    }
  };
  // save Data in State
  useEffect(() => {
    if (interestedProducts.length === 0) return;
    fetchRecommendedProducts(interestedProducts);
  }, [interestedProducts]);

  const onRefresh = async () => {
    setPullToRefresh(true);
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/products/${collectionHandle}`,
      );
      const data: Product[] = await response.json();
      setAllProducts(shuffleArray(data));
    } catch (error) {
      console.log(error);
    } finally {
      setPullToRefresh(false);
    }
  };

  const renderCategory = useCallback(
    ({ item }: { item: Category }) => (
      <CategoryItem
        item={item}
        categorySize={categorySize}
        onPress={() =>
          router.push({
            pathname: "/category/[handle]",
            params: { handle: item.handle },
          })
        }
      />
    ),
    [categorySize],
  );

  const openSimilarModal = useCallback((product: Product) => {
    setSimilarModal(true);
    setSelectedProduct(product);
  }, []);
  const renderProduct = useCallback(
    ({ item }: { item: Product }) => (
      <ProductCard
        item={item}
        reviewSummary={reviewSummary}
        productImageHeight={productImageHeight}
        onPress={() => openSimilarModal(item)}
      />
    ),
    [productImageHeight, reviewSummary, openSimilarModal],
  );

  // Stable string-based keyExtractor avoids object allocation per render
  const keyExtractor = useCallback((item: Product) => item.id, []);

  const listHeaderElement = useMemo(
    () => (
      <HomeListHeader
        banners={banners}
        categories={categories}
        carouselWidth={width}
        activeNav={activeNav}
        bannerHeight={bannerHeight}
        offerHeight={offerHeight}
        onSnapRef={snapRef}
        renderCategory={renderCategory}
        offers={OFFERS}
        recommendedProducts={recommendedProducts}
        interestedProducts={interestedProducts}
        kidsProducts={kidsProducts}
        renderProduct={renderProduct}
      />
    ),
    [
      banners,
      categories,
      width,
      bannerHeight,
      offerHeight,
      renderCategory,
      recommendedProducts,
      interestedProducts,
    ],
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#f6f6f6" }}>
      {loading ? (
        <HomeSkeleton />
      ) : (
        <>
          <Header activeNav={activeNav} setActiveNav={setActiveNav} />

          {refreshing && (
            <View
              style={{
                position: "absolute",
                top: insets.top + 100,
                left: 0,
                right: 0,
                bottom: 0,
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
                backgroundColor: "#f6f6f6",
              }}
            >
              <CircleLoader />
            </View>
          )}

          <FlatList
            data={filteredProducts}
            keyExtractor={keyExtractor}
            numColumns={2}
            // renderItem={renderProduct}
            renderItem={showHomeLayout ? null : renderProduct}
            ListHeaderComponent={listHeaderElement}
            columnWrapperStyle={styles.columnWrapper}
            showsVerticalScrollIndicator={false}
            initialNumToRender={6}
            maxToRenderPerBatch={4}
            updateCellsBatchingPeriod={50}
            windowSize={7}
            removeClippedSubviews={true}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{
              itemVisiblePercentThreshold: 40,
            }}
            ListFooterComponent={
              <View>
                {!showHomeLayout && <WarrningLable />}
                <View style={{ height: 10 + insets.bottom }} />
              </View>
            }
            contentInsetAdjustmentBehavior="never"
            refreshControl={
              <RefreshControl
                refreshing={pullToRefresh}
                onRefresh={onRefresh}
                colors={["#F87387"]}
                tintColor="#F87387"
                progressViewOffset={insets.top + 90}
              />
            }
          />

          <FilterModal
            visible={filterVisible}
            onClose={() => setFilterVisible(false)}
            onApply={(filters) => setActiveFilters(filters)}
          />
        </>
      )}

      {/* Similar products modal */}

      <Similarproductsmodal
        visible={similarModal}
        product={selectedProduct}
        onClose={() => setSimilarModal(false)}
      />

      <LoginRewardModal
        visible={loginRewardModal}
        onClose={handleClose}
        onClaim={handleClaim}
        offerPercentage={offerPercentage}
      />
    </View>
  );
}

// ─── STABLE SHUFFLE ───────────────────────────────────────────────────────────
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  bannerSlide: {
    height: "100%",
    overflow: "hidden",
  },
  offerSlide: {
    height: "100%",
    overflow: "hidden",
    borderRadius: 6,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1c1c1c",
  },
  categoryList: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  trendingHeader: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  categoryCircle: {
    borderRadius: 50,
    borderColor: "#f0f0f0",
    borderWidth: 1,
    // alignItems: "center",
    overflow: "hidden",
  },
  categoryLabel: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#1c1c1c",
    textAlign: "center",
    marginTop: 1,
    width: 72,
    lineHeight: 15,
  },
  productCard: {
    width: "49%",
    backgroundColor: "#fff",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: "#f0f0f0",
  },
  productImageWrap: {
    width: "100%",
    backgroundColor: "#fafafa",
    overflow: "hidden",
  },
  // Wishlist sits outside the swiper at absolute position
  wishlistBtn: {
    position: "absolute",
    bottom: 8,
    left: 8,
    borderRadius: 20,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  similerBtn: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.45)",
    borderRadius: 20,
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  // Image dots
  imageDots: {
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  imageDot: {
    width: 5,
    height: 5,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  imageDotActive: {
    width: 14,
    backgroundColor: "#fff",
  },
  productTitle: {
    fontSize: 12,
    fontWeight: "500",
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
    fontWeight: "600",
    color: "#1a1a1a",
  },
  comparePrice: {
    fontSize: 11,
    color: "#bbb",
    textDecorationLine: "line-through",
  },
  discount: {
    fontSize: 11,
    fontWeight: "600",
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
    paddingHorizontal: 16,
  },
  filterSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  filterHandle: {
    width: 36,
    height: 4,
    backgroundColor: "#e0e0e0",
    borderRadius: 99,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  filterTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1a1a1a",
  },
  clearText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#F87387",
  },
  filterSectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    backgroundColor: "#fff",
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    borderColor: "#F87387",
    backgroundColor: "#fff0f4",
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#555",
  },
  chipTextActive: {
    color: "#F87387",
  },
  filterFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 0.5,
    borderTopColor: "#f0f0f0",
  },
  applyBtn: {
    backgroundColor: "#F87387",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  applyBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
});
