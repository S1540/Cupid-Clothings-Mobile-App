// app/CupidCoins.tsx
import { EvilIcons, Feather, Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Easing,
  FlatList,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Transaction = {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  time: string;
  coins: number;
  icon: string;
  iconFamily: "Feather" | "Ionicons";
  balance: number;
};

type ScreenRow =
  | { type: "hero" }
  | { type: "summary" }
  | { type: "history_header" }
  | { type: "transaction"; data: Transaction }
  | { type: "empty" }
  | { type: "footer" };

// ─── DATA ─────────────────────────────────────────────────────────────────────

const TRANSACTIONS: Transaction[] = [
  {
    id: "t1",
    title: "Signup Bonus",
    subtitle: "Welcome reward on first login",
    date: "27 Jun 2025",
    time: "10:22 AM",
    coins: 500,
    icon: "gift",
    iconFamily: "Feather",
    balance: 500,
  },
  {
    id: "t2",
    title: "Referral Reward",
    subtitle: "Your friend Priya joined Cupid",
    date: "2 Jun 2025",
    time: "4:15 PM",
    coins: 1000,
    icon: "users",
    iconFamily: "Feather",
    balance: 1500,
  },
  {
    id: "t3",
    title: "Order Cashback",
    subtitle: "Order #CPC-00234 delivered",
    date: "18 May 2025",
    time: "1:40 PM",
    coins: 320,
    icon: "shopping-bag",
    iconFamily: "Feather",
    balance: 1820,
  },
  {
    id: "t4",
    title: "Coins Redeemed",
    subtitle: "Applied on Order #CPC-00198",
    date: "10 May 2025",
    time: "11:05 AM",
    coins: -800,
    icon: "minus-circle",
    iconFamily: "Feather",
    balance: 1020,
  },
  {
    id: "t5",
    title: "Festival Reward",
    subtitle: "Holi Special Bonus",
    date: "25 Mar 2025",
    time: "9:00 AM",
    coins: 250,
    icon: "star",
    iconFamily: "Feather",
    balance: 1270,
  },
  {
    id: "t6",
    title: "Order Cashback",
    subtitle: "Order #CPC-00145 delivered",
    date: "12 Mar 2025",
    time: "3:30 PM",
    coins: 180,
    icon: "shopping-bag",
    iconFamily: "Feather",
    balance: 1450,
  },
  {
    id: "t7",
    title: "Coins Redeemed",
    subtitle: "Applied on Order #CPC-00120",
    date: "1 Feb 2025",
    time: "6:20 PM",
    coins: -300,
    icon: "minus-circle",
    iconFamily: "Feather",
    balance: 1150,
  },
  {
    id: "t8",
    title: "Order Cashback",
    subtitle: "Order #CPC-00092 delivered",
    date: "14 Jan 2025",
    time: "2:10 PM",
    coins: 430,
    icon: "shopping-bag",
    iconFamily: "Feather",
    balance: 1580,
  },
];

const COINS_BALANCE = 12580;
const LIFETIME_EARNED = 25480;
const COINS_REDEEMED = 12900;

function formatCoins(n: number): string {
  return Math.abs(n).toLocaleString("en-IN");
}

// ─── ICON ─────────────────────────────────────────────────────────────────────

const Icon = memo(
  ({
    family,
    name,
    size,
    color,
  }: {
    family: "Feather" | "Ionicons";
    name: string;
    size: number;
    color: string;
  }) => {
    if (family === "Ionicons")
      return <Ionicons name={name as any} size={size} color={color} />;
    return <Feather name={name as any} size={size} color={color} />;
  },
);

// ─── COIN FLOATING EMOJI ──────────────────────────────────────────────────────

const CoinEmoji = memo(() => {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <Animated.Text
      style={[styles.coinEmoji, { transform: [{ translateY: floatAnim }] }]}
    >
      🪙
    </Animated.Text>
  );
});

// ─── HERO ─────────────────────────────────────────────────────────────────────

const HeroSection = memo(() => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.hero}>
      {/* Decorative bubbles */}
      <View style={[styles.bubble, styles.bubble1]} />
      <View style={[styles.bubble, styles.bubble2]} />
      <View style={[styles.bubble, styles.bubble3]} />

      <Animated.View
        style={[
          styles.heroInner,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Top row */}
        <View style={styles.heroRow}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroLabel}>Available Coins</Text>
            <Text style={styles.heroBalance}>{formatCoins(COINS_BALANCE)}</Text>
            <View style={styles.heroPill}>
              <Feather name="award" size={10} color="#F87387" />
              <Text style={styles.heroPillText}>
                Cupid Coins · Never expires
              </Text>
            </View>
          </View>
          <CoinEmoji />
        </View>

        {/* Stats row inside hero — no extra card */}
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>
              {formatCoins(LIFETIME_EARNED)}
            </Text>
            <Text style={styles.heroStatLabel}>Earned</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>
              {formatCoins(COINS_REDEEMED)}
            </Text>
            <Text style={styles.heroStatLabel}>Redeemed</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={[styles.heroStatValue, { color: "#7c3aed" }]}>
              {formatCoins(COINS_BALANCE)}
            </Text>
            <Text style={styles.heroStatLabel}>Balance</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
});

// ─── HISTORY HEADER ───────────────────────────────────────────────────────────

const HistoryHeader = memo(() => (
  <View style={styles.historyHeader}>
    <Text style={styles.historyTitle}>Transactions</Text>
    <TouchableOpacity activeOpacity={0.6} style={styles.filterBtn}>
      <Feather name="sliders" size={13} color="#7A7A7A" />
      <Text style={styles.filterText}>Filter</Text>
    </TouchableOpacity>
  </View>
));

// ─── TRANSACTION ROW ──────────────────────────────────────────────────────────

const TransactionCard = memo(
  ({ item, index }: { item: Transaction; index: number }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(12)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 340,
          delay: index * 45,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          delay: index * 45,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }, []);

    const pressIn = () =>
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
        speed: 80,
      }).start();
    const pressOut = () =>
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 80,
      }).start();

    const isEarned = item.coins > 0;
    const amountText = isEarned
      ? `+${formatCoins(item.coins)}`
      : `-${formatCoins(item.coins)}`;
    const amountColor = isEarned ? "#10b981" : "#F87387";
    const iconBg = isEarned ? "#ecfdf5" : "#fff5f7";
    const iconColor = isEarned ? "#10b981" : "#F87387";

    // Show separator line between rows (not a card border)
    const showDivider = index < TRANSACTIONS.length - 1;

    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        }}
      >
        <TouchableOpacity
          onPressIn={pressIn}
          onPressOut={pressOut}
          activeOpacity={1}
          style={styles.txRow}
        >
          {/* Icon */}
          <View style={[styles.txIcon, { backgroundColor: iconBg }]}>
            <Icon
              family={item.iconFamily}
              name={item.icon}
              size={17}
              color={iconColor}
            />
          </View>

          {/* Text */}
          <View style={styles.txBody}>
            <Text style={styles.txTitle}>{item.title}</Text>
            <Text style={styles.txMeta}>
              {item.date} · {item.time}
            </Text>
          </View>

          {/* Amount */}
          <View style={styles.txAmount}>
            <Text style={[styles.txCoins, { color: amountColor }]}>
              {amountText}
            </Text>
            <Text style={styles.txBalance}>
              Bal {formatCoins(item.balance)}
            </Text>
          </View>
        </TouchableOpacity>

        {showDivider && <View style={styles.txDivider} />}
      </Animated.View>
    );
  },
);

// ─── TRANSACTION LIST WRAPPER ─────────────────────────────────────────────────
// All rows sit inside a single white card — no per-row border/shadow

const TransactionListCard = memo(
  ({ transactions }: { transactions: Transaction[] }) => (
    <View style={styles.txCard}>
      {transactions.map((t, i) => (
        <TransactionCard key={t.id} item={t} index={i} />
      ))}
    </View>
  ),
);

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────

const EmptyState = memo(() => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.emptyWrap, { opacity: fadeAnim }]}>
      <Animated.Text
        style={[styles.emptyEmoji, { transform: [{ translateY: floatAnim }] }]}
      >
        🪙
      </Animated.Text>
      <Text style={styles.emptyTitle}>No Transactions Yet</Text>
      <Text style={styles.emptySub}>
        Shop to earn Cupid Coins and unlock exclusive rewards.
      </Text>
    </Animated.View>
  );
});

// ─── SCREEN ───────────────────────────────────────────────────────────────────

export default function CupidCoins() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const transactions = TRANSACTIONS;

  const rows = useMemo<ScreenRow[]>(() => {
    const base: ScreenRow[] = [{ type: "hero" }, { type: "history_header" }];
    if (transactions.length === 0) {
      base.push({ type: "empty" });
    } else {
      base.push({ type: "transaction", data: transactions[0] }); // sentinel for list
    }
    base.push({ type: "footer" });
    return base;
  }, [transactions]);

  const keyExtractor = useCallback((_: ScreenRow, i: number) => String(i), []);

  const renderRow = useCallback(
    ({ item }: { item: ScreenRow }) => {
      if (item.type === "hero") return <HeroSection />;
      if (item.type === "history_header") return <HistoryHeader />;
      if (item.type === "transaction")
        return <TransactionListCard transactions={transactions} />;
      if (item.type === "empty") return <EmptyState />;
      if (item.type === "footer")
        return <View style={{ height: 32 + insets.bottom }} />;
      return null;
    },
    [transactions, insets.bottom],
  );

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF7F8" />
      <Stack.Screen
        options={{
          headerTitle: () => (
            <Text style={styles.headerTitle}>Cupid Coins</Text>
          ),
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "#FFF7F8" },
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <EvilIcons name="chevron-left" size={34} color="#1a1a1a" />
            </Pressable>
          ),
          headerRight: () => (
            <TouchableOpacity activeOpacity={0.7} hitSlop={8}>
              <Feather name="info" size={18} color="#aaa" />
            </TouchableOpacity>
          ),
        }}
      />
      <FlatList
        data={rows}
        keyExtractor={keyExtractor}
        renderItem={renderRow}
        showsVerticalScrollIndicator={false}
        style={styles.screen}
        contentContainerStyle={{ paddingBottom: 16 }}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
        removeClippedSubviews={Platform.OS === "android"}
      />
    </>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F6F6F6",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    letterSpacing: -0.2,
  },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    backgroundColor: "#FFF7F8",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    marginBottom: 16,
    overflow: "hidden",
  },
  bubble: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "#F87387",
  },
  bubble1: { width: 200, height: 200, top: -70, right: -50, opacity: 0.06 },
  bubble2: { width: 120, height: 120, bottom: -30, left: -30, opacity: 0.05 },
  bubble3: { width: 70, height: 70, top: 20, left: 50, opacity: 0.04 },
  heroInner: {
    gap: 20,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroLeft: {
    gap: 6,
    flex: 1,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#aaa",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  heroBalance: {
    fontSize: 42,
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: -1.5,
    lineHeight: 48,
  },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    backgroundColor: "#fff0f3",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#F87387",
  },
  coinEmoji: {
    fontSize: 56,
    lineHeight: 64,
  },

  // Stats inside hero — no card, just a row
  heroStats: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 6,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  heroStat: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  heroStatValue: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: -0.3,
  },
  heroStatLabel: {
    fontSize: 10.5,
    fontWeight: "500",
    color: "#aaa",
  },
  heroStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#ebebeb",
    alignSelf: "center",
  },

  // ── History header ────────────────────────────────────────────────────────
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
    letterSpacing: -0.2,
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#7A7A7A",
  },

  // ── Single white card wrapping all rows ───────────────────────────────────
  txCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 0.5,
  },

  // ── Transaction row (inside the card) ─────────────────────────────────────
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  txDivider: {
    height: 1,
    backgroundColor: "#f7f7f7",
    marginLeft: 72, // aligns with text, not icon
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  txBody: {
    flex: 1,
    gap: 3,
  },
  txTitle: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "#1a1a1a",
    letterSpacing: -0.1,
  },
  txMeta: {
    fontSize: 11,
    fontWeight: "400",
    color: "#bbb",
  },
  txAmount: {
    alignItems: "flex-end",
    gap: 3,
    flexShrink: 0,
  },
  txCoins: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  txBalance: {
    fontSize: 10,
    fontWeight: "400",
    color: "#ccc",
  },

  // ── Empty ─────────────────────────────────────────────────────────────────
  emptyWrap: {
    alignItems: "center",
    paddingTop: 56,
    paddingBottom: 32,
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyEmoji: {
    fontSize: 52,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    textAlign: "center",
  },
  emptySub: {
    fontSize: 13,
    color: "#aaa",
    textAlign: "center",
    lineHeight: 20,
  },
});
