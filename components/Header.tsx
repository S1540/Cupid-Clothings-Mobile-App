import { useSearchPlaceholder } from "@/hooks/useSearchPlaceholder";
import { Feather, Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const NAV_ITEMS = [
  "Women",
  "Men",
  "Best Sellers",
  "Plus-Size",
  // "Deal's & Offers",
  // "New-Arrivals",
];

export default function Header({
  activeNav,
  setActiveNav,
}: {
  activeNav: string;
  setActiveNav: (value: string) => void;
}) {
  const router = useRouter();
  const searchPlaceholder = useSearchPlaceholder();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  return (
    // ─── FIX 1: position absolute so it floats over the carousel ───
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        backgroundColor: "transparent",
        paddingTop: insets.top,
      }}
    >
      <BlurView
        intensity={Platform.OS === "ios" ? 70 : 50}
        tint={Platform.OS === "ios" ? "systemUltraThinMaterialLight" : "light"}
        experimentalBlurMethod="dimezisBlurView"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor:
            Platform.OS === "android"
              ? "rgba(255,247,253,0.55)"
              : "rgba(255,247,253,0.08)",
        }}
      />

      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {/* BANNER */}
      {/* <Animated.View
        style={{
          backgroundColor: bannerBg,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 8,
          gap: 6,
        }}
      >
        <Feather name="truck" size={13} color="#fff" />
        <Text className="text-white text-xs font-semibold tracking-wide">  
          Free Shipping On All Prepaid Orders
        </Text>
      </Animated.View> */}

      {/* HEADER ROW */}
      <View className="flex-row items-center justify-between px-4 py-3.5 gap-2">
        {/* LOGO */}
        <Pressable onPress={() => router.push("/")}>
          <View
            style={{
              width: Math.min(88, width * 0.21),
              height: 38,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Image
              source={require("../assets/images/Cupid.png")}
              resizeMode="contain"
              className="w-full h-full"
            />
          </View>
        </Pressable>

        {/* SEARCH BAR */}
        <Pressable
          onPress={() => router.push("./Search")}
          accessibilityRole="button"
          accessibilityLabel="Search products"
          hitSlop={{ top: 3, bottom: 3 }}
          style={{
            flex: 1,
            minWidth: 0,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "rgba(255,255,255,0.55)", // glass pill
            borderRadius: 30,
            borderWidth: 1.5,
            borderColor: "rgba(243,215,221,0.7)",
            minHeight: 38,
            paddingVertical: 5,
            paddingHorizontal: 10,
            gap: 6,
          }}
        >
          <Feather name="search" size={15} color="#ff5c84" />
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
            style={{ flex: 1, minWidth: 0, fontSize: 13, color: "#927185" }}
          >
            {searchPlaceholder}
          </Text>
        </Pressable>

        {/* ICONS */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Pressable onPress={() => router.push("./Wishlist")} className="p-2">
            <Ionicons name="heart-outline" size={30} color="black" />
          </Pressable>
          {/* <Pressable
            onPress={() => router.push("./Cart")}
            className="p-2 relative"
          >
            <Feather name="shopping-bag" size={22} color="#1a1a1a" />
            {cartCount > 0 && (
              <View className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#ff5c84] items-center justify-center">
                <Text
                  className="text-white font-extrabold"
                  style={{ fontSize: 9 }}
                >
                  {cartCount || 0}
                </Text>
              </View>
            )}
          </Pressable> */}
        </View>
      </View>

      {/* NAV */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-1"
        contentContainerStyle={{
          paddingHorizontal: 18,
          paddingBottom: 4,
          gap: 28,
          flexGrow: 1,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeNav === item;
          return (
            <Pressable
              key={item}
              onPress={() => setActiveNav(item)}
              hitSlop={20}
              className="items-center gap-1"
              style={{ flexShrink: 0 }}
            >
              <Text
                numberOfLines={1}
                className={`text-sm tracking-wide ${isActive ? "text-[#ff5c84] font-bold" : "text-[#555] font-medium"}`}
              >
                {item}
              </Text>
              {isActive && (
                <View className="h-[2.5px] w-full rounded-sm bg-[#ff5c84]" />
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Bottom divider — subtle glass edge */}
      <View
        style={{
          height: 1,
          backgroundColor: "rgba(243,215,221,0.4)",
        }}
      />
    </View>
  );
}
