import { Feather, Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { useRef } from "react";
import {
  Animated,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
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
  const insets = useSafeAreaInsets();
  const bannerAnim = useRef(new Animated.Value(0)).current;

  // useFocusEffect(
  //   React.useCallback(() => {
  //     const loadCart = async () => {
  //       try {
  //         const user = auth.currentUser;
  //         if (user) {
  //           const snapshot = await getDocs(
  //             collection(db, "users", user.uid, "cart"),
  //           );
  //           const firebaseCart = snapshot.docs.map((doc) => ({
  //             ...(doc.data() as any),
  //           }));
  //           console.log("Firebase Header Count");
  //         } else {
  //           const data = await AsyncStorage.getItem("cartItems");
  //           if (data) {
  //             const parsed = JSON.parse(data);
  //             setCartItems(parsed);
  //           }
  //         }
  //       } catch (error) {
  //         console.log(error);
  //       }
  //     };
  //     loadCart();
  //   }, []),
  // );

  // useEffect(() => {
  //   Animated.loop(
  //     Animated.sequence([
  //       Animated.timing(bannerAnim, {
  //         toValue: 1,
  //         duration: 2000,
  //         easing: Easing.inOut(Easing.ease),
  //         useNativeDriver: false,
  //       }),
  //       Animated.timing(bannerAnim, {
  //         toValue: 0,
  //         duration: 2000,
  //         easing: Easing.inOut(Easing.ease),
  //         useNativeDriver: false,
  //       }),
  //     ]),
  //   ).start();
  // }, []);

  const bannerBg = bannerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#ff5c84", "#F87387"],
  });

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
      <View className="flex-row items-center justify-between px-[18px] py-3.5 gap-2.5">
        {/* LOGO */}
        <Pressable onPress={() => router.push("/")}>
          <View className="w-24 h-[38px] items-center justify-center">
            <Image
              source={require("../assets/images/Cupid.png")}
              className="w-full h-full"
            />
          </View>
        </Pressable>

        {/* SEARCH BAR */}
        <Pressable
          onPress={() => router.push("./Search")}
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "rgba(255,255,255,0.55)", // glass pill
            borderRadius: 30,
            borderWidth: 1.5,
            borderColor: "rgba(243,215,221,0.7)",
            height: 40,
            paddingHorizontal: 12,
            gap: 8,
            marginHorizontal: 8,
          }}
        >
          <Feather name="search" size={15} color="#ff5c84" />
          <Text style={{ flex: 1, fontSize: 13, color: "#c4a0a8" }}>
            Search styles, brands...
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
          flex: 1,
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
              className="items-center gap-1"
            >
              <Text
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
