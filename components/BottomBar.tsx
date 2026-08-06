import { Entypo, Ionicons } from "@expo/vector-icons";
import { Href, usePathname, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useCartStore } from "@/store/cartStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";

const ACTIVE = "#81A6F0";
const INACTIVE = "#8A8A8A";
const ACTIVE_BG = "#EEF3FE";

type TabItemProps = {
  route: Href;
  label: string;
  icon: (color: string) => React.ReactNode;
  active: boolean;
  onPress: () => void;
  badge?: number;
};

function TabItem({ label, icon, active, onPress, badge }: TabItemProps) {
  const pressScale = useSharedValue(1);
  const activeProgress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    activeProgress.value = withTiming(active ? 1 : 0, { duration: 220 });
  }, [active]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const pillStyle = useAnimatedStyle(() => ({
    opacity: activeProgress.value,
    transform: [{ scale: 0.85 + activeProgress.value * 0.15 }],
    backgroundColor: "Transparent",
  }));

  const inactiveIconStyle = useAnimatedStyle(() => ({
    opacity: 1 - activeProgress.value,
  }));

  const activeIconStyle = useAnimatedStyle(() => ({
    opacity: activeProgress.value,
    transform: [
      { scale: 0.7 + activeProgress.value * 0.3 },
      { translateY: (1 - activeProgress.value) * 4 },
    ],
    position: "absolute",
  }));

  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(activeProgress.value, [0, 1], [INACTIVE, ACTIVE]),
    fontWeight: active ? "700" : "500",
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        pressScale.value = withSpring(0.88, { damping: 12, stiffness: 250 });
      }}
      onPressOut={() => {
        pressScale.value = withSpring(1, { damping: 10, stiffness: 200 });
      }}
      android_ripple={{ color: "#f3f3f3", borderless: true }}
      hitSlop={8}
      style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
    >
      <Animated.View
        style={[
          {
            alignItems: "center",
            justifyContent: "center",
          },
          containerStyle,
        ]}
      >
        <Animated.View
          style={[
            {
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 14,
              paddingVertical: 22,
              borderRadius: 16,
            },
            pillStyle,
          ]}
        />
        <View
          style={{
            position: "absolute",
            top: 0,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View>
            <Animated.View style={inactiveIconStyle}>
              {icon(INACTIVE)}
            </Animated.View>
            <Animated.View style={activeIconStyle}>
              {icon(ACTIVE)}
            </Animated.View>

            {!!badge && badge > 0 && (
              <View
                style={{
                  position: "absolute",
                  top: -4,
                  right: -8,
                  minWidth: 16,
                  height: 16,
                  borderRadius: 10,
                  backgroundColor: ACTIVE,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 3,
                  borderWidth: 1.5,
                  borderColor: "#fff",
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 8,
                    fontWeight: "800",
                  }}
                >
                  {badge > 99 ? "99+" : badge}
                </Text>
              </View>
            )}
          </View>

          <Animated.Text
            numberOfLines={1}
            style={[{ marginTop: 3, fontSize: 11 }, labelStyle]}
          >
            {label}
          </Animated.Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export default function BottomBar() {
  const router = useRouter();
  const pathname = usePathname();
  const cartCount = useCartStore((state) => state.cartCount);
  const insets = useSafeAreaInsets();

  const barHeight = 58 + Math.max(insets.bottom, 10);

  const isActive = (route: Href) => pathname === route;
  const homeActive = isActive("/");

  // animated dim/scale for the Home logo — no native SVG/color-matrix dependency,
  // pure opacity + scale so it can never throw a "view manager" error
  const homeProgress = useSharedValue(homeActive ? 1 : 0);
  useEffect(() => {
    homeProgress.value = withTiming(homeActive ? 1 : 0, { duration: 220 });
  }, [homeActive]);

  const homeLogoStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + homeProgress.value * 0.5,
    transform: [{ scale: 0.92 + homeProgress.value * 0.08 }],
  }));

  const homeLabelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(homeProgress.value, [0, 1], [INACTIVE, ACTIVE]),
    fontWeight: homeActive ? "700" : "500",
  }));

  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#F0F0F0",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        height: barHeight,
        paddingBottom: Math.max(insets.bottom, 10),
        paddingTop: 6,
        zIndex: 9999,
        ...Platform.select({
          ios: {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.06,
            shadowRadius: 6,
          },
          android: {
            elevation: 20,
          },
        }),
      }}
    >
      {/* Home - logo dims/brightens with opacity + scale, no native deps */}
      <Pressable
        onPress={() => router.push("/")}
        android_ripple={{ color: "#f3f3f3", borderless: true }}
        hitSlop={8}
        style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
      >
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 14,
            paddingVertical: 4,
          }}
        >
          <Animated.View style={homeLogoStyle}>
            <Image
              source={require("../assets/images/notification-icon.png")}
              style={{ width: 30, height: 30 }}
              contentFit="contain"
            />
          </Animated.View>
          <Animated.Text
            numberOfLines={1}
            style={[{ marginTop: 3, fontSize: 11 }, homeLabelStyle]}
          >
            Home
          </Animated.Text>
        </View>
      </Pressable>

      {/* Account - animated */}
      <TabItem
        route="/Account"
        label="Account"
        active={isActive("/Account")}
        onPress={() => router.push("/Account")}
        icon={(color) => (
          <Ionicons name="person-outline" size={24} color={color} />
        )}
      />

      {/* Studio - animated */}
      <TabItem
        route="/Studio"
        label="Studio"
        active={isActive("/MaintenanceScreen")}
        onPress={() => router.push("/MaintenanceScreen")}
        icon={(color) => <Entypo name="camera" size={24} color={color} />}
      />

      {/* Cart - animated, with badge */}
      <TabItem
        route="/Cart"
        label="Cart"
        active={isActive("/Cart")}
        onPress={() => router.push("/Cart")}
        badge={cartCount}
        icon={(color) => (
          <Ionicons name="cart-outline" size={26} color={color} />
        )}
      />
    </View>
  );
}
