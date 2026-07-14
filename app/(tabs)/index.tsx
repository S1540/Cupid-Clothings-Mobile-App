// app/(tabs)/index.tsx
import Header from "@/components/Header";
import LoginRewardModal from "@/components/modal/Loginrewardmodal";
import Similarproductsmodal from "@/components/modal/Similarproductsmodal";
import CircleLoader from "@/components/ui/CircleLoader";
import HomeSkeleton from "@/components/ui/HomeSkeleton";
import { auth } from "@/firebaseConfig";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useRouter } from "expo-router";
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
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import Carousel from "react-native-reanimated-carousel";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import "../../global.css";
import ProductCard from "@/components/ui/ProductCrad";

// ─── TYPES ────────────────────────────────────────────────────────────────────
type Subcategory = { title: string; handle: string; image: string | null };
type MenuItem = { title: string; handle: string; subcategories: Subcategory[] };
type Category = { name: string; handle: string; image: string };
type BannerItem = { id: number; image: string };
type Offer = { id: number; image: string };
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

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const CATEGORY_IMAGES: Record<string, string> = {
  "women-plain-tshirts":
    "https://res.cloudinary.com/drsoj4c5q/image/upload/v1782547891/20260627_115155_0000_enekpj.png",
  "track-pants-m-to-7xl":
    "https://res.cloudinary.com/drsoj4c5q/image/upload/v1782548293/20260627_115155_0001_viekpp.png",
  "night-suits-sets-plus-sizes":
    "https://res.cloudinary.com/drsoj4c5q/image/upload/v1782548293/20260627_115155_0002_t63hza.png",
  combos:
    "https://res.cloudinary.com/drsoj4c5q/image/upload/v1782548292/20260627_115155_0003_fikdxd.png",
  "women-winter-wear":
    "https://res.cloudinary.com/drsoj4c5q/image/upload/v1782548291/20260627_115155_0004_bq7mc2.png",
  "men-track-pants":
    "https://res.cloudinary.com/drsoj4c5q/image/upload/v1782726953/Bottomwear_Men_kj3q9n.png",
  "men-tracksuits":
    "https://res.cloudinary.com/drsoj4c5q/image/upload/v1782726953/Loungewear_Men_lpb9ja.png",
  "men-polo-tshirts":
    "https://res.cloudinary.com/drsoj4c5q/image/upload/v1782726953/Tshirts_Men_xw7hdn.png",
  "men-combo-sets":
    "https://res.cloudinary.com/drsoj4c5q/image/upload/v1782726953/combo_Men_xvzqis.png",
};

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1610476650745-58700c3defa5?w=200&q=60";

// ── Swipe tuning ──────────────────────────────────────────────────────────────
// Pixels of horizontal movement required to advance the image.
const SWIPE_THRESHOLD = 38;
// Pixels of vertical movement that cancels a horizontal swipe.
// Keeps FlatList vertical scroll completely unaffected.
const VERTICAL_CANCEL_THRESHOLD = 12;

const BANNERS: Record<string, BannerItem[]> = {
  Women: [
    {
      id: 1,
      image:
        "https://res.cloudinary.com/drsoj4c5q/image/upload/q_auto/f_auto/v1782198145/Curves_Deserve_1_porp0e.png",
    },
    {
      id: 2,
      image:
        "https://res.cloudinary.com/drsoj4c5q/image/upload/q_auto/f_auto/v1782218557/WhatsApp_Image_2026-06-23_at_6.06.38_PM_xzbbbn.jpg",
    },
  ],
  Men: [
    {
      id: 1,
      image:
        "https://res.cloudinary.com/drsoj4c5q/image/upload/q_auto/f_auto/v1782200518/10_20260623_130917_0004_ippqsj.png",
    },
    {
      id: 2,
      image:
        "https://res.cloudinary.com/drsoj4c5q/image/upload/q_auto/f_auto/v1782218560/WhatsApp_Image_2026-06-23_at_6.06.36_PM_ty9fte.jpg",
    },
  ],
  "Plus-Size": [
    {
      id: 1,
      image:
        "https://res.cloudinary.com/drsoj4c5q/image/upload/q_auto/f_auto/v1782200515/plus_size_20260623_130917_0003_y9nwys.png",
    },
    {
      id: 2,
      image:
        "https://res.cloudinary.com/drsoj4c5q/image/upload/q_auto/f_auto/v1782218557/WhatsApp_Image_2026-06-23_at_6.06.37_PM_2_ny6bfq.jpg",
    },
  ],
  "Deal's & Offers": [
    {
      id: 1,
      image:
        "https://res.cloudinary.com/drsoj4c5q/image/upload/q_auto/f_auto/v1782218558/WhatsApp_Image_2026-06-23_at_6.06.37_PM_1_r5athx.jpg",
    },
    {
      id: 2,
      image:
        "https://res.cloudinary.com/drsoj4c5q/image/upload/q_auto/f_auto/v1782200513/Deals_and_offers_20260623_130917_0002_aupz6t.png",
    },
  ],
  "New-Arrivals": [
    {
      id: 1,
      image:
        "https://res.cloudinary.com/drsoj4c5q/image/upload/q_auto/f_auto/v1782218558/WhatsApp_Image_2026-06-23_at_6.06.37_PM_d4b4vf.jpg",
    },
    {
      id: 2,
      image:
        "https://res.cloudinary.com/drsoj4c5q/image/upload/q_auto/f_auto/v1782200508/New_arrivals_20260623_130917_0001_vxvfxn.png",
    },
  ],
};

const OFFERS: Offer[] = [
  {
    id: 1,
    image:
      "https://res.cloudinary.com/drsoj4c5q/image/upload/v1782893616/2_jm4lib.png",
  },
  {
    id: 2,
    image:
      "https://res.cloudinary.com/drsoj4c5q/image/upload/v1782893616/1_uwz60k.png",
  },
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
  bannerHeight: number;
  offerHeight: number;
  onSnapRef: React.MutableRefObject<((index: number) => void) | null>;
  renderCategory: ListRenderItem<Category>;
  offers?: Offer[];
};

const HomeListHeader = React.memo(
  ({
    banners,
    categories,
    carouselWidth,
    bannerHeight,
    offerHeight,
    onSnapRef,
    renderCategory,
    offers,
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

        <View style={styles.trendingHeader}>
          <Text style={styles.sectionTitle}>Trending Now</Text>
        </View>
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

// ─── IMAGE DOTS ───────────────────────────────────────────────────────────────
// Isolated memo so only dots re-render when activeIndex changes,
// never the entire card.
const ImageDots = memo(
  ({ count, activeIndex }: { count: number; activeIndex: number }) => {
    if (count <= 1) return null;
    return (
      <View style={styles.imageDots}>
        {Array.from({ length: count }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.imageDot,
              i === activeIndex && styles.imageDotActive,
            ]}
          />
        ))}
      </View>
    );
  },
);

// ─── PRODUCT IMAGE SWIPER ─────────────────────────────────────────────────────
//
// Gesture API implementation (react-native-gesture-handler v2+).
//
// Pan gesture:
//   - activeOffsetX: only activates once horizontal movement crosses a small
//     threshold, so it doesn't eat vertical touches meant for FlatList.
//   - failOffsetY: if the finger moves vertically past this threshold first,
//     the gesture FAILS and hands the touch back to the native responder
//     chain — FlatList scrolls exactly as if this view weren't here.
//
// Tap gesture:
//   - maxDistance keeps it a "true tap" (no drag), so a swipe never
//     accidentally triggers navigation.
//
// Gesture.Exclusive(panGesture, tapGesture):
//   - Only one of the two can ever win per touch. If Pan activates
//     (clear horizontal movement), Tap is cancelled, and vice versa.
//
// This is the same pattern used by production apps like Myntra/Zara/Ajio:
// declarative gesture arbitration instead of manual responder negotiation.

// type ProductImageSwiperProps = {
//   images: { url: string; alt: string }[];
//   height: number;
//   onPress: () => void;
// };

// const ProductImageSwiper = memo(
//   ({ images, height, onPress }: ProductImageSwiperProps) => {
//     const [activeIndex, setActiveIndex] = useState(0);
//     const totalImages = images.length;

//     const goNext = useCallback(() => {
//       setActiveIndex((prev) => (prev < totalImages - 1 ? prev + 1 : prev));
//     }, [totalImages]);

//     const goPrev = useCallback(() => {
//       setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
//     }, []);

//     const panGesture = useMemo(
//       () =>
//         Gesture.Pan()
//           .activeOffsetX([-10, 10])
//           .failOffsetY([-VERTICAL_CANCEL_THRESHOLD, VERTICAL_CANCEL_THRESHOLD])
//           .onEnd((e) => {
//             "worklet";
//             if (totalImages <= 1) return;
//             if (e.translationX < -SWIPE_THRESHOLD) {
//               runOnJS(goNext)();
//             } else if (e.translationX > SWIPE_THRESHOLD) {
//               runOnJS(goPrev)();
//             }
//           }),
//       [totalImages, goNext, goPrev],
//     );

//     const tapGesture = useMemo(
//       () =>
//         Gesture.Tap()
//           .maxDistance(10)
//           .onEnd((_e, success) => {
//             "worklet";
//             if (success) {
//               runOnJS(onPress)();
//             }
//           }),
//       [onPress],
//     );

//     const composedGesture = useMemo(
//       () => Gesture.Exclusive(panGesture, tapGesture),
//       [panGesture, tapGesture],
//     );

//     const currentImageUrl = images[activeIndex]?.url ?? DEFAULT_IMAGE;

//     return (
//       <GestureDetector gesture={composedGesture}>
//         <View style={[styles.productImageWrap, { height }]}>
//           <Image
//             source={{ uri: currentImageUrl }}
//             style={StyleSheet.absoluteFillObject}
//             contentFit="cover"
//             cachePolicy="memory-disk"
//             transition={120}
//           />
//           <ImageDots count={totalImages} activeIndex={activeIndex} />
//         </View>
//       </GestureDetector>
//     );
//   },
// );

// // ─── ProductCard ──────────────────────────────────────────────────────────────
// const ProductCard = memo(
//   ({
//     item,
//     productImageHeight,
//     reviewSummary,
//     onPress,
//   }: {
//     item: Product;
//     productImageHeight: number;
//     reviewSummary: any;
//     onPress: () => void;
//   }) => {
//     const router = useRouter();
//     const productId = item.id.split("/").pop();
//     const review = productId && reviewSummary ? reviewSummary[productId] : null;
//     // console.log(review);

//     const handlePress = useCallback(() => {
//       router.push({
//         pathname: "/product/[handle]",
//         params: { handle: item.handle },
//       });
//     }, [item.handle]);

//     const handlePrefetch = useCallback(() => {
//       router.prefetch(`/product/${item.handle}`);
//     }, [item.handle]);
//     const images = useMemo(
//       () =>
//         item.images?.length ? item.images : [{ url: DEFAULT_IMAGE, alt: "" }],
//       [item.images],
//     );

//     return (
//       <View style={styles.productCard}>
//         {/* Swipeable image — tap also handled inside */}
//         <View>
//           <ProductImageSwiper
//             images={images}
//             height={productImageHeight}
//             onPress={handlePress}
//           />

//           <Pressable
//             onPressIn={handlePrefetch}
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
//           <Pressable
//             onPress={onPress}
//             onPressIn={handlePrefetch}
//             style={styles.similerBtn}
//             hitSlop={8}
//           >
//             <MaterialCommunityIcons
//               name="cards-outline"
//               size={24}
//               color="black"
//               opacity={0.7}
//             />
//           </Pressable>
//         </View>

//         {/* Info section — separate Pressable so the whole card is tappable */}
//         <Pressable onPress={handlePress} style={{ padding: 10, gap: 4 }}>
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
//         </Pressable>
//       </View>
//     );
//   },
// );

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
  const [reviewSummary, setReviewSummary] = useState<any>(null);
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    priceRange: null,
    sizes: [],
    discount: null,
    sort: null,
  });

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
          `${process.env.EXPO_PUBLIC_API_URL}/api/products/${activeNav.toLowerCase()}`,
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
  }, [activeNav]);

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

  const onRefresh = async () => {
    setPullToRefresh(true);
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/products/${activeNav.toLowerCase()}`,
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
        bannerHeight={bannerHeight}
        offerHeight={offerHeight}
        onSnapRef={snapRef}
        renderCategory={renderCategory}
        offers={OFFERS}
      />
    ),
    [banners, categories, width, bannerHeight, offerHeight, renderCategory],
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
                top: insets.top + 110,
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
            renderItem={renderProduct}
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
              <View style={{ height: 80 + insets.bottom }} />
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
