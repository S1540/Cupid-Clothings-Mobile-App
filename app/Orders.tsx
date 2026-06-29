// app/(tabs)/Orders.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  Pressable,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { EvilIcons, Ionicons } from "@expo/vector-icons";
import { db, auth } from "@/firebaseConfig";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { OrdersSkeleton } from "@/components/ui/OrderSkeleton";
import { Order, useOrderStore } from "@/store/orderStore";

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
  const cfg = STATUS_CONFIG.delivered;

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
            {cfg.label}
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
        width: 140,
        height: 140,
        borderRadius: 44,
        // backgroundColor: "#FFF0F4",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
      }}
    >
      {/* <Ionicons name="bag-outline" size={40} color="#F87387" /> */}
      <Text style={{ fontSize: 100, fontWeight: "700", color: "#F87387" }}>
        🛍️
      </Text>
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
      No orders yet
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
      Looks like you haven't placed any orders.{"\n"}Start exploring and shop
      your favorites.
    </Text>
    <Pressable
      onPress={onShopPress}
      style={{
        paddingHorizontal: 24,
        paddingVertical: 13,
        borderRadius: 6,
        backgroundColor: "#F87387",
      }}
    >
      <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>
        Start Shopping
      </Text>
    </Pressable>
  </View>
);

//-------------------------- Main Screen ---------------------------------------
export default function OrdersScreen() {
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const orders = useOrderStore((state) => state.orders);

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) return;

    const q = collection(db, "users", user.uid, "orders");
    const unsub = onSnapshot(q, (snapshot) => {
      const orders: Order[] = snapshot.docs.map((doc) => ({
        ...(doc.data() as Order),
        orderId: doc.id,
      }));
      useOrderStore.getState().setOrders(orders);
      setLoading(false);
    });

    return unsub;
  }, []);

  if (loading) return <OrdersSkeleton />;

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "My Orders",
          headerTitleStyle: {
            fontSize: 17,
            fontWeight: "700",
            color: "#1A1A1A",
          },
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "#fff7f8" },
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <EvilIcons name="chevron-left" size={34} color="#111" />
            </Pressable>
          ),
        }}
      />
      {orders.length === 0 ? (
        <EmptyOrdersState onShopPress={() => router.push("./")} />
      ) : (
        <View style={{ flex: 1, backgroundColor: "#fff" }}>
          <StatusBar barStyle="dark-content" backgroundColor="#fff" />
          {/* List */}
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
      )}
    </>
  );
}
