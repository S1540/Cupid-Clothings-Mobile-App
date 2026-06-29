import { Feather, Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "@/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Clipboard,
  FlatList,
  Platform,
  Pressable,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

//------- PALETTE ------------------------------------------
const C = {
  pink: "#F87387",
  pinkDark: "#F87395",
  pinkDeep: "#e05570",
  pinkSoft: "#fff0f4",
  pinkFaint: "#fff7f8",
  pinkBorder: "#f2d7df",
  black: "#111111",
  inkDark: "#333333",
  inkMid: "#666666",
  inkLight: "#999999",
  line: "#efefef",
  bg: "#f4f4f4",
  white: "#ffffff",
  green: "#198754",
  greenBg: "#f0faf4",
} as const;

const BOTTOM_BTN_HEIGHT = Platform.OS === "ios" ? 70 : 40;

const STEPS = [
  {
    icon: "share-social-outline" as const,
    title: "Share your code",
    desc: "Send your unique referral code to friends via WhatsApp, Instagram or SMS.",
  },
  {
    icon: "person-add-outline" as const,
    title: "Friend signs up",
    desc: "Your friend downloads Cupid and creates an account using your code.",
  },
  {
    icon: "bag-handle-outline" as const,
    title: "First purchase",
    desc: "Your friend places their very first order on the Cupid app.",
  },
  {
    icon: "gift-outline" as const,
    title: "Both earn rewards",
    desc: "You both receive Rs.171 in Cupid wallet.",
  },
];

// ─── STYLESHEET ──────────────────────────────────────────────
const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },

  // ── Hero ──────────────────────────────────────────────────
  hero: {
    backgroundColor: C.pinkFaint,
    paddingTop: 28,
    paddingBottom: 10,
    paddingHorizontal: 24,
    overflow: "hidden",
    position: "relative",
  },
  heroCircle1: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: C.pinkBorder,
    opacity: 0.45,
  },
  heroCircle2: {
    position: "absolute",
    bottom: -20,
    right: 40,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: C.pinkBorder,
    opacity: 0.3,
  },
  heroCircle3: {
    position: "absolute",
    top: 20,
    right: 80,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.pink,
    opacity: 0.12,
  },
  heroIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    shadowColor: C.pink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: C.black,
    letterSpacing: -0.4,
    lineHeight: 28,
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 13.5,
    color: C.inkMid,
    lineHeight: 20,
    maxWidth: "85%",
  },
  heroBadge: {
    marginTop: 18,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.white,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: C.pink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 4,
  },
  heroBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.green,
  },
  heroBadgeTxt: { fontSize: 12, fontWeight: "600", color: C.inkDark },

  // ── Section wrapper ───────────────────────────────────────
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: C.inkLight,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    marginBottom: 14,
  },

  // ── Referral Code Card ────────────────────────────────────
  codeCard: {
    backgroundColor: C.white,
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 6,
    shadowColor: C.pink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 6,
    overflow: "visible",
  },
  codeCardTop: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    alignItems: "center",
  },
  codeCardLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: C.inkLight,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  codeBlock: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: C.pinkBorder,
    borderStyle: "dashed",
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 18,
    backgroundColor: C.pinkSoft,
    gap: 12,
  },
  codeText: {
    fontSize: 22,
    fontWeight: "900",
    color: C.pink,
    letterSpacing: 2.5,
    flex: 1,
    textAlign: "center",
  },
  codeDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 0,
  },
  notchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 0,
  },
  notchLine: {
    flex: 1,
    height: 1,
    borderWidth: 0,
    borderTopWidth: 1,
    borderColor: C.line,
    borderStyle: "dashed",
  },
  notchCircleLeft: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.bg,
    marginLeft: -10,
    borderWidth: 1,
    borderColor: C.line,
  },
  notchCircleRight: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.bg,
    marginRight: -10,
    borderWidth: 1,
    borderColor: C.line,
  },
  codeCardBottom: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  codeBtn: {
    flex: 1,
    height: 44,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  codeBtnCopy: {
    backgroundColor: C.pinkSoft,
    borderWidth: 1,
    borderColor: C.pinkBorder,
  },
  codeBtnShare: { backgroundColor: C.pink },
  codeBtnTxtPink: { fontSize: 13, fontWeight: "700", color: C.pink },
  codeBtnTxtWhite: { fontSize: 13, fontWeight: "700", color: C.white },

  // --- How It Works -----------------------------------------
  stepsBlock: { paddingLeft: 16, paddingRight: 16 },
  stepRow: { flexDirection: "row", gap: 14 },
  stepLeft: { alignItems: "center", width: 36 },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.pinkSoft,
    borderWidth: 1.5,
    borderColor: C.pinkBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircleActive: { backgroundColor: C.pink, borderColor: C.pink },
  stepConnector: {
    width: 2,
    flex: 1,
    minHeight: 24,
    backgroundColor: C.pinkBorder,
    marginVertical: 4,
  },
  stepContent: {
    flex: 1,
    paddingBottom: 24,
    paddingTop: 6,
  },
  stepTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: C.black,
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 12.5,
    color: C.inkMid,
    lineHeight: 18,
  },

  // ── Empty state ───────────────────────────────────────────
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.pinkSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.pinkBorder,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: C.black,
    letterSpacing: -0.3,
    marginBottom: 7,
  },
  emptyBody: {
    fontSize: 13,
    color: C.inkMid,
    textAlign: "center",
    lineHeight: 19,
  },
  //---- Header --------------------------------------------
  headerIcons: { flexDirection: "row", alignItems: "center" },
  headerBtn: { padding: 8 },
});

// ----- ANIMATED FADE-IN WRAPPER --------------------------
const FadeIn = ({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 380,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 380,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
};

// ─── REFERRAL HERO ───────────────────────────────────────────
const ReferralHero = React.memo(() => {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.06,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <View style={S.hero}>
      <View style={S.heroCircle1} />
      <View style={S.heroCircle2} />
      <View style={S.heroCircle3} />
      <Animated.View
        style={[S.heroIconWrap, { transform: [{ scale: pulse }] }]}
      >
        <Text style={{ fontSize: 24 }}>🎁</Text>
      </Animated.View>

      <Text style={S.heroTitle}>Refer Friends &{"\n"}Earn Rewards</Text>
      <Text style={S.heroSubtitle}>
        Invite your friends to Cupid and earn exciting rewards on every
        successful referral.
      </Text>

      <View style={S.heroBadge}>
        <View style={S.heroBadgeDot} />
        <Text style={S.heroBadgeTxt}>0 Cupid Coins earned this month</Text>
      </View>
    </View>
  );
});

// ─── REFERRAL CODE CARD --------------------------------------
type ReferralCodeCardProps = {
  referralCode: string;
};
const ReferralCodeCard = React.memo(
  ({ referralCode }: ReferralCodeCardProps) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(() => {
      Clipboard.setString(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }, []);

    const handleShare = useCallback(async () => {
      try {
        await Share.share({
          message: `Hey! Use my Cupid referral code ${referralCode} and get ₹80 off on your first order 🎀 Download now: https://cupidclothings.com`,
          title: "Cupid Referral Code",
        });
      } catch (_) {}
    }, []);

    return (
      <View style={S.codeCard}>
        <View style={S.codeCardTop}>
          <Text style={S.codeCardLabel}>Your Referral Code</Text>
          <View style={S.codeBlock}>
            <Text style={S.codeText}>{referralCode}</Text>
          </View>
        </View>

        {/* Coupon notch divider */}
        <View style={S.notchRow}>
          <View style={S.notchCircleLeft} />
          <View style={S.notchLine} />
          <View style={S.notchCircleRight} />
        </View>

        <View style={S.codeCardBottom}>
          <Pressable onPress={handleCopy} style={[S.codeBtn, S.codeBtnCopy]}>
            <Feather
              name={copied ? "check" : "copy"}
              size={14}
              color={copied ? C.green : C.pink}
            />
            <Text style={[S.codeBtnTxtPink, copied && { color: C.green }]}>
              {copied ? "Copied!" : "Copy Code"}
            </Text>
          </Pressable>

          <Pressable onPress={handleShare} style={[S.codeBtn, S.codeBtnShare]}>
            <Feather name="share-2" size={14} color={C.white} />
            <Text style={S.codeBtnTxtWhite}>Share</Text>
          </Pressable>
        </View>
      </View>
    );
  },
);
// ─── HOW IT WORKS ─────────────────────────────────────────────
const HowItWorks = React.memo(() => (
  <View style={S.section}>
    <Text style={S.sectionTitle}>How It Works</Text>
    <View style={S.stepsBlock}>
      {STEPS.map((step, i) => {
        const isLast = i === STEPS.length - 1;
        return (
          <View key={step.title} style={S.stepRow}>
            <View style={S.stepLeft}>
              <View style={[S.stepCircle, i === 0 && S.stepCircleActive]}>
                <Ionicons
                  name={step.icon}
                  size={16}
                  color={i === 0 ? C.white : C.pink}
                />
              </View>
              {!isLast && <View style={S.stepConnector} />}
            </View>
            <View style={[S.stepContent, isLast && { paddingBottom: 4 }]}>
              <Text style={S.stepTitle}>{step.title}</Text>
              <Text style={S.stepDesc}>{step.desc}</Text>
            </View>
          </View>
        );
      })}
    </View>
  </View>
));

// ─── MAIN SCREEN ─────────────────────────────────────────────
export default function ReferEarn() {
  const [referralCode, setReferralCode] = useState("");
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (userSnap.exists()) {
        setReferralCode(userSnap.data().referralCode);
        console.log("REFERRAL CODE:", userSnap.data().referralCode);
      }
    });

    return unsubscribe;
  }, []);

  const handleInvite = useCallback(async () => {
    try {
      await Share.share({
        message: `Hey! Use my Cupid referral code ${referralCode} and get ₹121 off on your first order 🎀 Download now: https://cupidclothings.com`,
        title: "Invite to Cupid",
      });
    } catch (_) {}
  }, []);

  // Render all content as FlatList sections for smooth scroll
  const sections = useMemo(
    () => [{ key: "hero" }, { key: "code" }, { key: "how" }, { key: "spacer" }],
    [],
  );

  const renderSection = useCallback(
    ({ item }: { item: { key: string } }) => {
      switch (item.key) {
        case "hero":
          return (
            <FadeIn delay={0}>
              <ReferralHero />
            </FadeIn>
          );
        case "code":
          return (
            <FadeIn delay={60}>
              <ReferralCodeCard referralCode={referralCode} />
            </FadeIn>
          );

        case "how":
          return (
            <FadeIn delay={180}>
              <HowItWorks />
            </FadeIn>
          );
        case "spacer":
          return <View style={{ height: BOTTOM_BTN_HEIGHT }} />;
        default:
          return null;
      }
    },
    [referralCode],
  );

  const keyExtractor = useCallback((item: { key: string }) => item.key, []);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={C.pinkFaint} />

      <Stack.Screen
        options={{
          headerTitle: "Refer & Earn",
          headerTitleStyle: {
            fontSize: 16,
            fontWeight: "800",
            color: C.black,
          },
          headerShadowVisible: false,
          headerStyle: { backgroundColor: C.pinkFaint },
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              style={S.headerBtn}
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={24} color={C.black} />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable onPress={handleInvite} style={S.headerBtn} hitSlop={4}>
              <Ionicons name="share-social-outline" size={21} color={C.pink} />
            </Pressable>
          ),
        }}
      />

      <View style={S.screen}>
        <FlatList
          data={sections}
          keyExtractor={keyExtractor}
          renderItem={renderSection}
          style={{ flex: 1 }}
          ListFooterComponent={() => (
            <View style={{ height: 50 + insets.bottom }} />
          )}
          contentContainerStyle={{
            flexGrow: 1,
            backgroundColor: C.bg,
          }}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={Platform.OS === "android"}
          maxToRenderPerBatch={4}
          windowSize={6}
          initialNumToRender={4}
        />
      </View>
    </>
  );
}
