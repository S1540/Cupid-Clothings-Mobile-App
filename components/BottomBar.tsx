import { AntDesign, Entypo, Ionicons } from "@expo/vector-icons";
import { Href, usePathname, useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { useCartStore } from "@/store/cartStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ACTIVE = "#F87387";
const INACTIVE = "#8A8A8A";

export default function BottomBar() {
  const router = useRouter();
  const pathname = usePathname();
  const cartCount = useCartStore((state) => state.cartCount);
  const insets = useSafeAreaInsets();

  const TabItem = ({ route, icon }: { route: Href; icon: React.ReactNode }) => {
    const active = pathname === route;

    return (
      <Pressable
        onPress={() => router.push(route)}
        android_ripple={{ color: "#f3f3f3" }}
        style={({ pressed }) => ({
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.7 : 1,
          transform: [{ scale: pressed ? 0.92 : 1 }],
        })}
      >
        <View
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: active ? "#FFF0F4" : "transparent",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </View>
      </Pressable>
    );
  };

  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#EFEFEF",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        height: 60 + Math.max(insets.bottom, 12),
        paddingBottom: Math.max(insets.bottom, 12),
        elevation: 30,
        zIndex: 9999,
      }}
    >
      {/* Home */}
      <TabItem
        route="/"
        icon={
          <AntDesign
            name="home"
            size={30}
            color={pathname === "/" ? ACTIVE : INACTIVE}
          />
        }
      />

      {/* Account */}
      <TabItem
        route="/Account"
        icon={
          <Ionicons
            name="person-outline"
            size={30}
            color={pathname === "/Account" ? ACTIVE : INACTIVE}
          />
        }
      />

      {/* Studio */}
      <Pressable
        onPress={() => router.push("/Studio")}
        android_ripple={{ color: "#f3f3f3" }}
        style={({ pressed }) => ({
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.7 : 1,
          transform: [{ scale: pressed ? 0.9 : 1 }],
        })}
      >
        <View
          style={{
            width: 62,
            height: 62,
            borderRadius: 31,
            backgroundColor: ACTIVE,
            alignItems: "center",
            justifyContent: "center",
            marginTop: -28,
            borderWidth: 4,
            borderColor: "#fff",
            elevation: 15,
          }}
        >
          <Entypo name="video" size={30} color="#fff" />
        </View>
      </Pressable>

      {/* Wallet */}
      <TabItem
        route="/Wallet"
        icon={
          <Ionicons
            name="wallet-outline"
            size={30}
            color={pathname === "/Wallet" ? ACTIVE : INACTIVE}
          />
        }
      />

      {/* Cart */}
      <Pressable
        onPress={() => router.push("/Cart")}
        android_ripple={{ color: "#f3f3f3" }}
        style={({ pressed }) => ({
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.7 : 1,
          transform: [{ scale: pressed ? 0.92 : 1 }],
        })}
      >
        <View
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: pathname === "/Cart" ? "#FFF0F4" : "transparent",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name="cart-outline"
            size={30}
            color={pathname === "/Cart" ? ACTIVE : INACTIVE}
          />

          {cartCount > 0 && (
            <View
              style={{
                position: "absolute",
                top: 4,
                right: 2,
                minWidth: 18,
                height: 18,
                borderRadius: 20,
                backgroundColor: ACTIVE,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 4,
                borderWidth: 1.5,
                borderColor: "#fff",
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 9,
                  fontWeight: "800",
                }}
              >
                {cartCount > 99 ? "99+" : cartCount}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    </View>
  );
}
