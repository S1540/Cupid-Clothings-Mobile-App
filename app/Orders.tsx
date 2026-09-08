// app/(tabs)/Orders.tsx
import { OrdersSkeleton } from "@/components/ui/OrderSkeleton";
import { useAuthStore } from "@/store/authStore";
import { Order, useOrderStore } from "@/store/orderStore";
import { useUserStore } from "@/store/userStore";
import { EvilIcons, Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// -------- Types for status--------
type OrderStatus = "delivered" | "shipped" | "processing" | "cancelled";

const STATUS_CONFIG: Record<
  OrderStatus,
  { color: string; bg: string; label: string }
> = {
  delivered: { color: "#27AE60", bg: "#EAF7F1", label: "Delivered" },
  shipped: { color: "#378ADD", bg: "#EAF2FC", label: "Shipped" },
  processing: { color: "#EF9F27", bg: "#FFF6E9", label: "Order Accepted" },
  cancelled: { color: "#E24B4A", bg: "#FCEDED", label: "Cancelled" },
};

// ----------- Order Row (Order Card Ui)-------------------
const OrderRow = ({ order, onPress }: { order: any; onPress: () => void }) => {
  const getOrderStatus = (order: Order): OrderStatus => {
    const tracking = order.trackingStatus?.toUpperCase() || "";
    const status = order.status?.toUpperCase() || "";

    if (tracking.trim() === "DELIVERED") return "delivered";
    if (
      tracking.includes("OUT FOR DELIVERY") ||
      tracking.includes("SHIPPED") ||
      tracking.includes("IN TRANSIT")
    ) {
      return "shipped";
    }

    if (status.includes("CANCELLED") || tracking.includes("CANCELLED")) {
      return "cancelled";
    }

    return "processing";
  };

  const cfg = STATUS_CONFIG[getOrderStatus(order)];

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        gap: 14,
        paddingHorizontal: 20,
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: "#F4F4F4",
      }}
    >
      {/* Product thumbnail */}
      <View
        style={{
          width: 64,
          height: 72,
          borderRadius: 6,
          backgroundColor: "#FFF7F8",
          borderWidth: 1,
          borderColor: "#F5EAEC",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {order.products?.[0]?.image ? (
          <Image
            source={{ uri: order.products[0].image }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        ) : (
          <Ionicons name="shirt-outline" size={22} color="#F2B8C2" />
        )}
      </View>

      {/* Info */}
      <View style={{ flex: 1, minWidth: 0, justifyContent: "center" }}>
        <Text
          numberOfLines={1}
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: "#1A1A1A",
            marginBottom: 6,
            letterSpacing: 0.1,
          }}
        >
          {order.products?.[0]?.title || "Product"}
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: cfg.color,
            }}
          />
          <Text style={{ fontSize: 12.5, fontWeight: "600", color: cfg.color }}>
            {order.trackingStatus || cfg.label}
          </Text>
          <Text style={{ fontSize: 11.5, color: "#aaa" }}>
            {order.createdAt?.toDate?.()?.toDateString?.() || ""}
          </Text>
        </View>
      </View>

      {/* Chevron */}
      <View style={{ justifyContent: "center" }}>
        <Ionicons name="chevron-forward" size={18} color="#D8D8D8" />
      </View>
    </Pressable>
  );
};

// ---------- Empty State -----------------------------
const EmptyOrdersState = ({ onShopPress }: { onShopPress: () => void }) => (
  <View
    style={{
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 40,
      backgroundColor: "#FFF",
    }}
  >
    <View
      style={{
        borderRadius: 44,
        width: 100,
        height: 100,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
      }}
    >
      <Image
        source={require("../assets/icons/no-order.png")}
        style={{ width: "100%", height: "100%" }}
        resizeMode="contain"
      />

      {/* <FontAwesome6 name="sad-tear" size={50} color="#F87387" /> */}
    </View>
    <Text
      style={{
        fontSize: 17,
        fontWeight: "700",
        color: "#1A1A1A",
        marginBottom: 8,
        textAlign: "center",
      }}
    >
      Order not found
    </Text>
    <Text
      style={{
        fontSize: 13,
        color: "#999",
        textAlign: "center",
        lineHeight: 19,
        marginBottom: 24,
      }}
    >
      Looks like you haven't placed any orders.
    </Text>
  </View>
);

// ──────────────────────────── SHARED HEADER CONFIG ─────────────────────────────
// Extracted so it can be passed to Stack.Screen in every render path without
// duplicating JSX. Stack.Screen is always rendered first (never inside a
// conditional) so the header is always visible regardless of which body
// state (loading / logged-out / orders list) is active below it.
const useHeaderOptions = (router: ReturnType<typeof useRouter>) => ({
  headerTitle: "My Orders",
  headerTitleStyle: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: "#1A1A1A",
  },
  headerShadowVisible: false,
  headerStyle: { backgroundColor: "#fff7f8" },
  headerLeft: () => (
    <Pressable onPress={() => router.back()} hitSlop={8}>
      <EvilIcons name="chevron-left" size={34} color="#111" />
    </Pressable>
  ),
});

//-------------------------- Main Screen ---------------------------------------
export default function OrdersScreen() {
  const { checkoutReturned } = useLocalSearchParams<{ checkoutReturned?: string }>();
  const loading = useOrderStore((state) => !state.ordersLoaded);
  const orderError = useOrderStore((state) => state.error);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const orders = useOrderStore((state) => state.orders);
  const user = useAuthStore((state) => state.user);
  const contactEmail = useUserStore((state) => state.user?.email);
  const headerOptions = useHeaderOptions(router);

  // ─── Body ─────────────────────────────────────────────────────────────────
  // Determined separately so Stack.Screen is always rendered at the top of
  // the return statement without duplication.
  const renderBody = () => {
    if (orderError)
      return (
        <View style={{ padding: 24 }}>
          <Text accessibilityRole="alert">{orderError}</Text>
          <Pressable accessibilityRole="button" style={{ paddingVertical: 16 }} onPress={() => useOrderStore.getState().retry()}><Text style={{ color: "#A82D49" }}>Retry</Text></Pressable>
        </View>
      );
    // Loading state — skeleton fills the body below the fixed header
    if (loading) {
      return (
        <View style={{ flex: 1 }}>
          <OrdersSkeleton />
        </View>
      );
    }

    // Logged-out state — prompt sits below the fixed header
    if (!user) {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 30,
            backgroundColor: "#fff",
            paddingBottom: insets.bottom,
          }}
        >
          <Ionicons name="cloud-offline-outline" size={50} color="#F87387" />

          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              marginTop: 16,
              color: "#222",
            }}
          >
            You are not logged in
          </Text>

          <Text
            style={{
              marginTop: 8,
              textAlign: "center",
              color: "#888",
            }}
          >
            Please log in to view your orders.
          </Text>

          <TouchableOpacity
            onPress={() => router.push("/PhoneAuth")}
            style={{
              marginTop: 24,
              backgroundColor: "#F87387",
              paddingHorizontal: 24,
              paddingVertical: 8,
              borderRadius: 4,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>Log In</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Empty orders state
    if (orders.length === 0) {
      return (
        <View style={{ flex: 1 }}>
          <EmptyOrdersState onShopPress={() => router.push("./")} />
          <View style={{ padding: 24 }}>
            <Text>
              {contactEmail
                ? "Missing an earlier order? Contact support to securely connect your existing account."
                : "Orders placed through this app appear here without an email. You can add an optional email for receipts."}
            </Text>
            <Pressable
              style={{ paddingVertical: 16 }}
              onPress={() =>
                router.push(contactEmail ? "/Helpcenter" : "/EditProfile")
              }
            >
              <Text style={{ color: "#A82D49" }}>
                {contactEmail ? "Get order help" : "Add contact email"}
              </Text>
            </Pressable>
          </View>
        </View>
      );
    }

    // Orders list
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#fff",
        }}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        >
          {orders.map((order) => (
            <OrderRow
              key={order.orderId}
              order={order}
              onPress={() => router.push(`./order-details/${order.orderId}`)}
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen options={headerOptions} />
      {user && checkoutReturned === "1" && <View style={{ padding: 16, backgroundColor: "#FFF7F8" }}>
        <Text>Your order may take a moment to appear after checkout. This page updates automatically when it arrives.</Text>
      </View>}
      {renderBody()}
    </>
  );
}
