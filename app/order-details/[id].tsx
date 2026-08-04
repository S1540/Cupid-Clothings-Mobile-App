// app/order-tracking/[id].tsx
import React, { useEffect, useRef, useState, useCallback, memo } from "react";
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  Pressable,
  Image,
  Animated,
  Easing,
  TouchableOpacity,
  Alert,
  Clipboard,
  StyleSheet,
  Platform,
  UIManager,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { EvilIcons, Ionicons, Feather } from "@expo/vector-icons";
import {
  Order,
  OrderProduct,
  TrackingHistoryItem,
  useOrderStore,
} from "@/store/orderStore";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ----------------------------------- Colors -------------------------------------------------
const C = {
  brand: "#F87387",
  // Semantic alias — used ONLY for genuinely "happening right now" states
  // (out-for-delivery banner, the active timeline step, the newest
  // tracking-history entry, and the one primary action button). Everything
  // else in this screen is neutral so the brand color still reads as
  // meaningful when it does show up.
  active: "#F87387",
  softPink: "#FFF4F6",
  lightBorder: "#F8D7DE",
  bg: "#FFF7F8",
  card: "#FFFFFF",
  pageBg: "#F5F5F7",
  primary: "#1A1A1A",
  secondary: "#666666",
  muted: "#999999",
  success: "#22A55B",
  successBg: "#EAF7F1",
  successBorder: "#BBE8D3",
  warning: "#F59E0B",
  warningBg: "#FFF8EC",
  warningBorder: "#FDE8B4",
  error: "#EF4444",
  errorBg: "#FEF2F2",
  errorBorder: "#FCA5A5",
  border: "#ECECEC",
  softGray: "#F5F5F5",
};

// ─── Timeline config ------------------------------
const TIMELINE_STEPS = [
  { key: "ORDER CONFIRMED", label: "Order Confirmed" },
  { key: "READY TO SHIP", label: "Ready to Ship" },
  { key: "OUT FOR PICKUP", label: "Out for Pickup" },
  { key: "PICKED UP", label: "Picked Up" },
  { key: "SHIPPED", label: "Shipped" },
  { key: "IN TRANSIT", label: "In Transit" },
  { key: "OUT FOR DELIVERY", label: "Out for Delivery" },
  { key: "DELIVERED", label: "Delivered" },
];

const EXCEPTION_STATUSES = new Set(["PICKUP RESCHEDULED", "PICKUP EXCEPTION"]);

const getStepIndex = (status?: string): number => {
  if (!status) return 0;
  const s = status.toUpperCase().trim();
  const idx = TIMELINE_STEPS.findIndex((step) => step.key === s);
  // "ORDER CONFIRMED" is always done if we have any tracking status
  return idx >= 0 ? idx : 1;
};

// ─── Helpers ------------------------------
const formatDate = (val: any, opts?: Intl.DateTimeFormatOptions): string => {
  if (!val) return "—";
  try {
    const date =
      val?.toDate?.() ?? (typeof val === "string" ? new Date(val) : null);
    if (!date) return "—";
    return date.toLocaleDateString(
      "en-IN",
      opts ?? { day: "numeric", month: "long", year: "numeric" },
    );
  } catch {
    return "—";
  }
};

const formatDateTime = (val: any): string => {
  if (!val) return "—";
  try {
    const date =
      val?.toDate?.() ?? (typeof val === "string" ? new Date(val) : null);
    if (!date) return "—";
    return date.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

// ─── Shimmer ------------------------------
const Shimmer = memo(({ style }: { style: any }) => {
  const opacity = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <Animated.View
      style={[
        { backgroundColor: "#E8E8E8", borderRadius: 8 },
        style,
        { opacity },
      ]}
    />
  );
});

const SkeletonScreen = memo(() => (
  <View style={styles.skeletonWrap}>
    {[96, 110, 200, 240, 110].map((h, i) => (
      <View
        key={i}
        style={[styles.card, { height: h, justifyContent: "center", gap: 10 }]}
      >
        <Shimmer style={{ width: "50%", height: 14 }} />
        <Shimmer style={{ width: "75%", height: 11 }} />
        <Shimmer style={{ width: "40%", height: 11 }} />
      </View>
    ))}
  </View>
));

// ─── Section card ------------------------------
const Section = memo(
  ({
    title,
    icon,
    children,
  }: {
    title?: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <View style={styles.card}>
      {title ? (
        <View style={styles.sectionHeader}>
          {icon}
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
      ) : null}
      {children}
    </View>
  ),
);

const Divider = () => <View style={styles.divider} />;

// ─── Status banner ------------------------------──
const StatusBanner = memo(({ order }: { order: Order }) => {
  const s = order.trackingStatus?.toUpperCase().trim() || "";
  if (!s) return null;

  let icon: string = "checkmark-circle";
  let iconColor = C.success;
  let bg = C.successBg;
  let border = C.successBorder;
  let title = "";
  let sub = "";

  if (s === "DELIVERED") {
    title = "Order Delivered Successfully";
    sub = "Your order has been delivered. Enjoy your purchase! 🎉";
    icon = "checkmark-circle";
    iconColor = C.success;
    bg = C.successBg;
    border = C.successBorder;
  } else if (s === "OUT FOR DELIVERY") {
    // The one true "happening right now" banner — kept on-brand.
    title = "Out for Delivery Today!";
    sub = "Your order is on its way. Please be available to receive it.";
    icon = "bicycle-outline";
    iconColor = C.active;
    bg = C.softPink;
    border = C.lightBorder;
  } else if (s === "PICKUP RESCHEDULED") {
    title = "Pickup Rescheduled";
    sub =
      order.pickupExceptionReason ||
      "Courier pickup has been rescheduled. We are coordinating with the logistics partner.";
    icon = "time-outline";
    iconColor = C.warning;
    bg = C.warningBg;
    border = C.warningBorder;
  } else if (s === "PICKUP EXCEPTION") {
    title = "Pickup Exception";
    sub =
      order.pickupExceptionReason ||
      "There was an issue with your pickup. Our team is working to resolve this.";
    icon = "alert-circle-outline";
    iconColor = C.error;
    bg = C.errorBg;
    border = C.errorBorder;
  } else {
    return null;
  }

  return (
    <View style={[styles.banner, { backgroundColor: bg, borderColor: border }]}>
      <Ionicons name={icon as any} size={22} color={iconColor} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.bannerTitle, { color: iconColor }]}>{title}</Text>
        <Text style={styles.bannerSub}>{sub}</Text>
      </View>
    </View>
  );
});

// ─── Product card ------------------------------───
const ProductCard = memo(({ product }: { product: OrderProduct }) => (
  <View style={styles.productRow}>
    <View style={styles.productImgBox}>
      {product.image ? (
        <Image
          source={{ uri: product.image }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
      ) : (
        <Ionicons name="shirt-outline" size={24} color="#F2B8C2" />
      )}
    </View>
    <View style={{ flex: 1, minWidth: 0 }}>
      <Text style={styles.productName} numberOfLines={2}>
        {product.title}
      </Text>
      {product.variant_title ? (
        <View style={styles.variantPill}>
          <Text style={styles.variantText}>{product.variant_title}</Text>
        </View>
      ) : null}
      <View style={styles.productBottom}>
        <Text style={styles.productQty}>Qty: {product.quantity}</Text>
        <Text style={styles.productPrice}>₹{product.price}</Text>
      </View>
    </View>
  </View>
));

// ─── Live "active step" dot — pulsing ring so the current status reads as
// something happening right now, not just a static marker. ──────────────
const ActiveDot = memo(() => {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1100,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.4],
  });
  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 0],
  });

  return (
    <View style={styles.dotActiveWrap}>
      <Animated.View
        style={[styles.dotPulseRing, { transform: [{ scale }], opacity }]}
      />
      <View style={styles.dotActive}>
        <View style={styles.dotPulse} />
      </View>
    </View>
  );
});

// ─── Timeline ------------------------------───────
const Timeline = memo(({ trackingStatus }: { trackingStatus?: string }) => {
  const currentIdx = getStepIndex(trackingStatus);
  // "Order Confirmed" always done if any status exists
  const effectiveIdx = trackingStatus ? Math.max(currentIdx, 1) : 0;

  return (
    <View>
      {TIMELINE_STEPS.map((step, idx) => {
        const isDone = idx < effectiveIdx;
        const isActive = idx === effectiveIdx;
        const isLast = idx === TIMELINE_STEPS.length - 1;

        return (
          <View key={step.key} style={styles.timelineRow}>
            {/* Vertical connector */}
            {!isLast && (
              <View
                style={[
                  styles.timelineLine,
                  { backgroundColor: isDone ? `${C.success}` : "#EBEBEB" },
                ]}
              />
            )}

            {/* Dot */}
            <View style={styles.dotCol}>
              {isDone ? (
                <View style={styles.dotDone}>
                  <Ionicons name="checkmark" size={11} color="#fff" />
                </View>
              ) : isActive ? (
                <ActiveDot />
              ) : (
                <View style={styles.dotFuture} />
              )}
            </View>

            {/* Label */}
            <View
              style={[styles.timelineLabelCol, isLast && { paddingBottom: 0 }]}
            >
              <Text
                style={[
                  styles.timelineLabel,
                  isDone && { color: C.primary, fontWeight: "500" },
                  isActive && { color: C.active, fontWeight: "700" },
                  !isDone && !isActive && { color: C.muted },
                ]}
              >
                {step.label}
              </Text>
              {isActive && (
                <Text style={styles.timelineNote}>Current Status</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
});

// ----------------------------- Tracking history feed --------------------------------------
const HistoryItem = memo(
  ({ item, isFirst }: { item: TrackingHistoryItem; isFirst: boolean }) => (
    <View style={[styles.historyRow, isFirst && styles.historyRowFirst]}>
      <View style={styles.historyDotCol}>
        <View style={[styles.historyDot, isFirst && styles.historyDotActive]} />
      </View>
      <View style={styles.historyContent}>
        <Text style={styles.historyDate}>{item.date}</Text>
        {item.location ? (
          <Text style={styles.historyLocation}>
            {item.location.toUpperCase()}
          </Text>
        ) : null}
        <Text
          style={[
            styles.historyActivity,
            isFirst && { color: C.primary, fontWeight: "600" },
          ]}
        >
          {item.activity}
        </Text>
        {item["sr-status-label"] ? (
          <View style={styles.historyStatusPill}>
            <Text style={styles.historyStatusText}>
              {item["sr-status-label"]}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  ),
);

const TrackingHistory = memo(
  ({ history }: { history: TrackingHistoryItem[] }) => {
    const [expanded, setExpanded] = useState(false);
    const sorted = [...history].reverse(); // latest first
    const visible = expanded ? sorted : sorted.slice(0, 3);

    return (
      <View>
        {visible.map((item, idx) => (
          <HistoryItem
            key={`${item.date}-${idx}`}
            item={item}
            isFirst={idx === 0}
          />
        ))}
        {sorted.length > 3 && (
          <TouchableOpacity
            style={styles.expandBtn}
            onPress={() => setExpanded((p) => !p)}
            activeOpacity={0.7}
          >
            <Text style={styles.expandBtnText}>
              {expanded ? "Show Less" : `View All ${sorted.length} Activities`}
            </Text>
            <Ionicons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={13}
              color={C.secondary}
            />
          </TouchableOpacity>
        )}
      </View>
    );
  },
);

// ─── Stack options ------------------------------──
const makeStackOptions = (router: any) => ({
  headerTitle: "Track Order",
  headerShown: true,
  headerTitleStyle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: C.primary,
  },
  headerShadowVisible: false,
  headerStyle: { backgroundColor: C.bg },
  headerLeft: () => (
    <Pressable onPress={() => router.back()} hitSlop={8}>
      <EvilIcons name="chevron-left" size={34} color="#111" />
    </Pressable>
  ),
});

// ─── Main screen ------------------------------────
export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const orders = useOrderStore((state) => state.orders);
  const ordersLoaded = useOrderStore((state) => state.ordersLoaded);
  const order = orders.find((item) => item.orderId === String(id));

  // Per-section entrance animations
  const NUM_SECTIONS = 7;
  const fadeAnims = useRef(
    Array.from({ length: NUM_SECTIONS }, () => new Animated.Value(0)),
  ).current;
  const slideAnims = useRef(
    Array.from({ length: NUM_SECTIONS }, () => new Animated.Value(18)),
  ).current;

  const runEntranceAnims = useCallback(() => {
    Animated.stagger(
      55,
      fadeAnims.map((anim, i) =>
        Animated.parallel([
          Animated.timing(anim, {
            toValue: 1,
            duration: 340,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnims[i], {
            toValue: 0,
            duration: 340,
            useNativeDriver: true,
          }),
        ]),
      ),
    ).start();
  }, []);

  useEffect(() => {
    if (order) {
      runEntranceAnims();
    }
  }, [order]);

  const copyAWB = useCallback(() => {
    if (!order?.awb) return;
    Clipboard.setString(order.awb);
    Alert.alert("Copied", "AWB number copied to clipboard.");
  }, [order?.awb]);

  const Anim = useCallback(
    ({ idx, children }: { idx: number; children: React.ReactNode }) => (
      <Animated.View
        style={{
          opacity: fadeAnims[idx],
          transform: [{ translateY: slideAnims[idx] }],
        }}
      >
        {children}
      </Animated.View>
    ),
    [],
  );

  // ── Loading ──
  if (!ordersLoaded) {
    return (
      <>
        <Stack.Screen options={makeStackOptions(router)} />
        <View style={styles.safe}>
          <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
          <SkeletonScreen />
        </View>
      </>
    );
  }

  // ── Not found ──
  if (!order) {
    return (
      <>
        <Stack.Screen options={makeStackOptions(router)} />
        <View style={[styles.safe, styles.emptyCenter]}>
          <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
          <View style={styles.emptyIconRing}>
            <Feather name="package" size={30} color={C.brand} />
          </View>
          <Text style={styles.emptyTitle}>Order Not Found</Text>
          <Text style={styles.emptySub}>
            We couldn't load this order. Please try again.
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.emptyBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  // ── Derived ──
  const addr = order.shippingAddress;
  const addrLines = [addr?.address1, addr?.address2].filter(Boolean).join(", ");
  const cityLine = [addr?.city, addr?.province, addr?.zip]
    .filter(Boolean)
    .join(", ");
  const hasHistory =
    Array.isArray(order.trackingHistory) && order.trackingHistory.length > 0;
  const isException = EXCEPTION_STATUSES.has(
    order.trackingStatus?.toUpperCase().trim() || "",
  );

  return (
    <>
      <Stack.Screen options={makeStackOptions(router)} />
      <View style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: 8,
            paddingBottom: insets.bottom + 80,
          }}
        >
          {/* ── Status Banner ── */}
          {order.trackingStatus && (
            <Anim idx={0}>
              <View style={{ marginHorizontal: 16, marginBottom: 4 }}>
                <StatusBanner order={order} />
              </View>
            </Anim>
          )}

          {/* ── 1. Order Header ── */}
          <Anim idx={0}>
            <Section>
              <View style={styles.orderHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderNum}>
                    Order{" "}
                    {order.shopifyName
                      ? order.shopifyName
                      : `#${order.orderNumber}`}
                  </Text>
                  <Text style={styles.orderDateText}>
                    Placed on {formatDate(order.createdAt)}
                  </Text>
                  {order.estimatedDeliveryDate && (
                    <View style={styles.etaRow}>
                      <Feather name="truck" size={11} color={C.success} />
                      <Text style={styles.etaText}>
                        Expected by{" "}
                        {formatDate(order.estimatedDeliveryDate, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.totalPill}>
                  <Text style={styles.totalPillText}>
                    ₹{order.total.toLocaleString("en-IN")}
                  </Text>
                </View>
              </View>

              <Divider />

              {/* Products */}
              {order.products.map((p, idx) => (
                <View key={idx}>
                  <ProductCard product={p} />
                  {idx < order.products.length - 1 && <Divider />}
                </View>
              ))}
            </Section>
          </Anim>

          {/* ── 2. Delivery Progress Timeline ── */}
          <Anim idx={2}>
            <Section
              title="Delivery Progress"
              icon={
                <Ionicons
                  name="git-branch-outline"
                  size={14}
                  color={C.secondary}
                  style={{ marginRight: 6 }}
                />
              }
            >
              {isException && (
                <View style={styles.exceptionBanner}>
                  <Feather name="alert-triangle" size={12} color={C.warning} />
                  <Text style={styles.exceptionText}>
                    Tracking paused —{" "}
                    <Text style={{ fontWeight: "700" }}>
                      {order.trackingStatus}
                    </Text>
                    {order.pickupExceptionReason
                      ? `: ${order.pickupExceptionReason}`
                      : ""}
                  </Text>
                </View>
              )}
              <Timeline trackingStatus={order.trackingStatus} />
            </Section>
          </Anim>
          {/* ── 3. Shipment Tracking ── */}
          <Anim idx={1}>
            <Section
              title="Shipment Info"
              icon={
                <Feather
                  name="package"
                  size={13}
                  color={C.secondary}
                  style={{ marginRight: 6 }}
                />
              }
            >
              <View style={styles.metaGrid}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Courier</Text>
                  <Text style={styles.metaValue}>{order.courier || "—"}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>AWB Number</Text>
                  <View style={styles.awbRow}>
                    <Text style={styles.metaValue} numberOfLines={1}>
                      {order.awb || "—"}
                    </Text>
                    {order.awb && (
                      <TouchableOpacity
                        style={styles.copyBtn}
                        onPress={copyAWB}
                        activeOpacity={0.7}
                      >
                        <Feather name="copy" size={11} color={C.secondary} />
                        <Text style={styles.copyText}>Copy</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                {/* <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Tracking Status</Text>
                  <StatusChip status={order.trackingStatus} />
                </View> */}
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Last Updated</Text>
                  <Text style={styles.metaValue}>
                    {formatDateTime(order.trackingUpdatedAt)}
                  </Text>
                </View>
              </View>
            </Section>
          </Anim>

          {/* ── 4. Live Activity Feed ── */}
          {hasHistory && (
            <Anim idx={3}>
              <Section
                title="Tracking Activity"
                icon={
                  <Ionicons
                    name="pulse-outline"
                    size={14}
                    color={C.secondary}
                    style={{ marginRight: 6 }}
                  />
                }
              >
                <TrackingHistory history={order.trackingHistory!} />
              </Section>
            </Anim>
          )}

          {/* ── 5. Delivery Address ── */}
          <Anim idx={4}>
            <Section
              title="Delivery Address"
              icon={
                <Ionicons
                  name="location-outline"
                  size={14}
                  color={C.secondary}
                  style={{ marginRight: 6 }}
                />
              }
            >
              {addr?.name || addr?.address1 ? (
                <View style={styles.addressRow}>
                  <View style={styles.addrIconCircle}>
                    <Ionicons
                      name="home-outline"
                      size={15}
                      color={C.secondary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    {addr?.name && (
                      <Text style={styles.addrName}>{addr.name}</Text>
                    )}
                    {addr?.phone && (
                      <Text style={styles.addrPhone}>{addr.phone}</Text>
                    )}
                    {addrLines ? (
                      <Text style={styles.addrLine}>{addrLines}</Text>
                    ) : null}
                    {cityLine ? (
                      <Text style={styles.addrLine}>{cityLine}</Text>
                    ) : null}
                    {addr?.country && (
                      <Text style={styles.addrLine}>{addr.country}</Text>
                    )}
                  </View>
                </View>
              ) : (
                <Text style={{ fontSize: 13, color: C.muted }}>
                  No delivery address available
                </Text>
              )}
            </Section>
          </Anim>

          {/* ── 6. Actions ── */}
          <Anim idx={5}>
            <View style={styles.actionRow}>
              <Pressable style={styles.actionBtn}>
                <Ionicons
                  name="download-outline"
                  size={15}
                  color={C.secondary}
                />
                <Text style={styles.actionBtnText}>Invoice</Text>
              </Pressable>
              <Pressable style={styles.actionBtn}>
                <Feather name="headphones" size={14} color={C.secondary} />
                <Text style={styles.actionBtnText}>Support</Text>
              </Pressable>
              <Pressable style={[styles.actionBtn, styles.actionBtnPrimary]}>
                <Ionicons name="refresh-outline" size={15} color={C.brand} />
                <Text style={[styles.actionBtnText, { color: C.brand }]}>
                  Refresh
                </Text>
              </Pressable>
            </View>
          </Anim>
        </ScrollView>
      </View>
    </>
  );
}

// ─── Styles ------------------------------─────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.pageBg },

  // Skeleton
  skeletonWrap: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },

  // Card
  card: {
    backgroundColor: C.card,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 6,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: C.primary,
    letterSpacing: 0.2,
  },
  divider: { height: 1, backgroundColor: "#F2F2F2", marginVertical: 14 },

  // Banner
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 6,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  bannerTitle: { fontSize: 13, fontWeight: "700", marginBottom: 2 },
  bannerSub: { fontSize: 12, color: C.secondary, lineHeight: 18 },

  // Order header
  orderHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  orderNum: {
    fontSize: 15,
    fontWeight: "700",
    color: C.primary,
    letterSpacing: -0.2,
  },
  orderDateText: { fontSize: 12, color: C.muted, marginTop: 3 },
  etaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  etaText: { fontSize: 12, color: C.success, fontWeight: "600" },
  // Neutral now — a plain, confident price tag instead of a pink badge.
  totalPill: {
    backgroundColor: C.softGray,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  totalPillText: { fontSize: 14, fontWeight: "700", color: C.primary },

  // Product
  productRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  productImgBox: {
    width: 68,
    height: 80,
    borderRadius: 6,
    backgroundColor: "#FFF0F4",
    borderWidth: 1,
    borderColor: "#F5EAEC",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  productName: {
    fontSize: 13,
    fontWeight: "600",
    color: C.primary,
    lineHeight: 19,
    marginBottom: 5,
  },
  variantPill: {
    alignSelf: "flex-start",
    backgroundColor: C.softGray,
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  variantText: { fontSize: 11, color: C.secondary, fontWeight: "500" },
  productBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  productQty: { fontSize: 12, color: C.muted },
  productPrice: { fontSize: 14, fontWeight: "700", color: C.primary },

  // Tracking meta
  metaGrid: { gap: 14 },
  metaItem: { gap: 4 },
  metaLabel: {
    fontSize: 11,
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontWeight: "600",
  },
  metaValue: { fontSize: 13.5, fontWeight: "600", color: C.primary },
  awbRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  // Neutral utility button now, instead of a pink chip.
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.softGray,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: C.border,
  },
  copyText: { fontSize: 11, fontWeight: "600", color: C.secondary },

  // Chip
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipText: { fontSize: 12, fontWeight: "700", letterSpacing: 0.2 },

  // Exception
  exceptionBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: C.warningBg,
    borderRadius: 6,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.warningBorder,
  },
  exceptionText: { fontSize: 12, color: "#92400E", flex: 1, lineHeight: 18 },

  // Timeline
  timelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingBottom: 22,
    position: "relative",
  },
  timelineLine: {
    position: "absolute",
    left: 9,
    top: 20,
    bottom: 0,
    width: 2,
    zIndex: 0,
  },
  dotCol: { width: 20, alignItems: "center", zIndex: 1, marginRight: 14 },
  dotDone: {
    width: 16,
    height: 16,
    borderRadius: 10,
    backgroundColor: C.success,
    alignItems: "center",
    justifyContent: "center",
  },
  // Active step — now the "live" pink instead of blue, matched by the
  // pulsing ring rendered in <ActiveDot />.
  dotActiveWrap: {
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dotPulseRing: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.active,
  },
  dotActive: {
    width: 16,
    height: 16,
    borderRadius: 10,
    backgroundColor: C.active,
    borderWidth: 2,
    borderColor: C.active,
    alignItems: "center",
    justifyContent: "center",
  },
  dotPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  dotFuture: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#DCDCDC",
  },
  timelineLabelCol: { flex: 1, paddingTop: 1, paddingBottom: 0 },
  timelineLabel: { fontSize: 13.5, lineHeight: 20 },
  timelineNote: {
    fontSize: 11,
    color: C.active,
    fontWeight: "500",
    marginTop: 1,
  },

  // Tracking history
  historyRow: {
    flexDirection: "row",
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
    marginBottom: 16,
  },
  historyRowFirst: { paddingBottom: 16 },
  historyDotCol: { alignItems: "center", paddingTop: 3 },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.muted,
  },
  // The most-recent entry shares the same "live" pink as the active
  // timeline dot — same semantic meaning (this is current), same color.
  historyDotActive: {
    backgroundColor: C.active,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  historyContent: { flex: 1, gap: 3 },
  historyDate: { fontSize: 11, color: C.muted, fontWeight: "500" },
  historyLocation: {
    fontSize: 10,
    color: C.secondary,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  historyActivity: { fontSize: 13, color: C.secondary, lineHeight: 19 },
  historyStatusPill: {
    alignSelf: "flex-start",
    marginTop: 2,
    backgroundColor: C.softGray,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  historyStatusText: { fontSize: 10, color: C.secondary, fontWeight: "500" },
  expandBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
  },
  expandBtnText: { fontSize: 12, fontWeight: "600", color: C.secondary },

  // Address
  addressRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  // Neutral icon circle now.
  addrIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.softGray,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  addrName: {
    fontSize: 14,
    fontWeight: "700",
    color: C.primary,
    marginBottom: 2,
  },
  addrPhone: { fontSize: 12.5, color: C.muted, marginBottom: 6 },
  addrLine: { fontSize: 13, color: C.secondary, lineHeight: 20 },

  // Actions
  actionRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: 6,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  // Refresh stays the single primary accent in this row — deliberate,
  // everything else here is neutral.
  actionBtnPrimary: { backgroundColor: C.softPink, borderColor: C.lightBorder },
  actionBtnText: { fontSize: 12, fontWeight: "600", color: C.secondary },

  // Empty
  emptyCenter: { alignItems: "center", justifyContent: "center", gap: 12 },
  emptyIconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.softPink,
    borderWidth: 1.5,
    borderColor: C.lightBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: C.primary },
  emptySub: {
    fontSize: 13,
    color: C.muted,
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  emptyBtn: {
    backgroundColor: C.brand,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  emptyBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
});
