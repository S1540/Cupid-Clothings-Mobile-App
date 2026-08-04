import { EvilIcons, Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Clipboard,
  ScrollView,
  Share,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Pressable } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { auth, db } from "../firebaseConfig";

// ─── Types ───────────────────────────────────────────────────────────────────

interface WalletData {
  walletBalance: number;
  totalEarnings: number;
  referralEarnings: number;
  totalReferrals: number;
  referralCode: string;
  cupidCoins: number;
}

const DEFAULT_WALLET: WalletData = {
  walletBalance: 0,
  totalEarnings: 0,
  referralEarnings: 0,
  totalReferrals: 0,
  referralCode: "",
  cupidCoins: 0,
};

// ─── Theme ───────────────────────────────────────────────────────────────────
// Brand pink (#F87387 / its deeper variant) is now used in exactly ONE
// place — the referral code pill, since that's the one true "brand
// moment" CTA. Everywhere else uses neutral ink/gray, plus the requested
// blue touch (#759EF0 family) for the referral/rewards accents.
const PRIMARY = "#F87387";
const BLUE = "#759EF0";
const BLUE_TINT = "#759EF047"; // 8-digit hex = #759EF0 @ ~28% opacity
const INK = "#1A1A1A";
const MUTED = "#9a9a9a";
const BORDER = "#EFEFEF";
const GREEN = "#2eab6f";
const GREEN_BG = "#EAF7F1";
const REDEEM_MIN_COINS = 50;

function formatINR(val: number): string {
  return val.toLocaleString("en-IN");
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Bone({ w, h, r = 6 }: { w: number | string; h: number; r?: number }) {
  return (
    <View
      style={{
        width: w as number,
        height: h,
        borderRadius: r,
        backgroundColor: "#EAEAEA",
        opacity: 0.6,
      }}
    />
  );
}

function WalletSkeleton() {
  return (
    <View style={{ paddingHorizontal: 16, gap: 10, paddingTop: 4 }}>
      <View
        style={{
          backgroundColor: "#F5F5F5",
          borderRadius: 14,
          padding: 22,
          gap: 14,
        }}
      >
        <Bone w={90} h={11} r={4} />
        <Bone w={180} h={52} r={8} />
        <View style={{ flexDirection: "row", gap: 20, marginTop: 4 }}>
          <Bone w={100} h={36} r={8} />
          <Bone w={100} h={36} r={8} />
        </View>
      </View>
      <Bone w="100%" h={80} r={12} />
      <Bone w="100%" h={100} r={12} />
    </View>
  );
}

// ─── Main Screen --------------------------------------------

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [wallet, setWallet] = useState<WalletData>(DEFAULT_WALLET);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchWallet = useCallback(async () => {
    try {
      setError(null);
      const user = auth.currentUser;
      if (!user) {
        setError("Please log in to view your wallet.");
        return;
      }
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const d = snap.data();
        setWallet({
          walletBalance: d.walletBalance ?? 0,
          totalEarnings: d.totalEarnings ?? 0,
          referralEarnings: d.referralEarnings ?? 0,
          totalReferrals: d.totalReferrals ?? 0,
          referralCode: d.referralCode ?? "",
          cupidCoins: d.cupidCoins ?? 0,
        });
      }
    } catch {
      setError("Failed to load wallet. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const handleCopy = () => {
    if (!wallet.referralCode) return;
    Clipboard.setString(wallet.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!wallet.referralCode) return;
    try {
      await Share.share({
        message: `Shop on Cupid Clothings and get ₹71 off your first order! Use my referral code: ${wallet.referralCode}\nhttps://cupidclothings.in`,
      });
    } catch {
      /* ignore */
    }
  };

  // Placeholder — wire this up to your real redeem flow/screen.
  const handleRedeem = () => {
    Alert.alert(
      "Redeem Cupid Coins",
      `You have ${formatINR(wallet.cupidCoins)} coins available to redeem.`,
    );
  };

  const canRedeem = wallet.cupidCoins >= REDEEM_MIN_COINS;

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#1a1a1a" }}>
              My Wallet
            </Text>
          ),
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "#FFF7F8" },
          headerLeft: () => (
            <Pressable onPress={() => router.back()}>
              <EvilIcons name="chevron-left" size={34} color="#1a1a1a" />
            </Pressable>
          ),
        }}
      />

      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF7F8" />
        {loading ? (
          <WalletSkeleton />
        ) : error ? (
          <View
            style={{
              flexGrow: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 30,
              backgroundColor: "#fff",
            }}
          >
            <Ionicons name="cloud-offline-outline" size={50} color={INK} />

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
              onPress={() => router.push("/Account")}
              style={{
                marginTop: 24,
                backgroundColor: PRIMARY,
                paddingHorizontal: 24,
                paddingVertical: 8,
                borderRadius: 4,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>Log In</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingTop: 8,
              paddingBottom: insets.bottom + 110,
            }}
          >
            <View style={{ paddingHorizontal: 16, gap: 10 }}>
              {/* ── 1. Balance Card ── */}
              <View
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 8,
                  padding: 22,
                  paddingBottom: 18,
                  borderWidth: 1,
                  borderColor: BORDER,
                }}
              >
                {/* Label row + Redeem chip */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "500",
                      color: MUTED,
                      letterSpacing: 0.6,
                      textTransform: "uppercase",
                    }}
                  >
                    Available Cupid Coins
                  </Text>

                  {/* NEW — Redeem shortcut, only shows once the user has
                      enough coins to actually redeem. */}
                  {canRedeem && (
                    <TouchableOpacity
                      onPress={handleRedeem}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        backgroundColor: BLUE_TINT,
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 20,
                      }}
                    >
                      <Ionicons name="gift-outline" size={12} color={BLUE} />
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "700",
                          color: BLUE,
                        }}
                      >
                        Redeem
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Big balance */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 2,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 52,
                      fontWeight: "800",
                      color: "#1A1A1A",
                      letterSpacing: -2.5,
                      lineHeight: 58,
                    }}
                  >
                    {formatINR(wallet.cupidCoins)}
                  </Text>
                </View>

                {/* Secured badge — now the blue touch instead of pink */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    marginTop: 6,
                    marginBottom: 18,
                  }}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={11}
                    color={BLUE}
                  />
                  <Text
                    style={{
                      fontSize: 11,
                      color: BLUE,
                      fontWeight: "600",
                    }}
                  >
                    Secured Wallet
                  </Text>
                </View>

                {/* Divider */}
                <View
                  style={{
                    height: 1,
                    backgroundColor: BORDER,
                    marginBottom: 16,
                  }}
                />

                {/* Stats row */}
                <View style={{ flexDirection: "row" }}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "700",
                        color: "#1A1A1A",
                        letterSpacing: -0.4,
                      }}
                    >
                      ₹{formatINR(wallet.totalEarnings)}
                    </Text>
                    <Text style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
                      Total Earnings
                    </Text>
                  </View>

                  <View
                    style={{
                      width: 1,
                      backgroundColor: BORDER,
                      marginHorizontal: 16,
                    }}
                  />

                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "700",
                        color: "#1A1A1A",
                        letterSpacing: -0.4,
                      }}
                    >
                      ₹{formatINR(wallet.referralEarnings)}
                    </Text>
                    <Text style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
                      Referral Earnings
                    </Text>
                  </View>
                </View>
              </View>

              {/* ── 2. Referral Stats — the blue touch you asked for ── */}
              <View
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 8,
                  paddingVertical: 16,
                  paddingHorizontal: 18,
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: BORDER,
                }}
              >
                {/* Icon */}
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    backgroundColor: BLUE_TINT,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14,
                  }}
                >
                  <Ionicons name="people-outline" size={18} color={BLUE} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: "#1A1A1A",
                    }}
                  >
                    Referral Rewards
                  </Text>
                  <Text style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
                    {wallet.totalReferrals} friend
                    {wallet.totalReferrals !== 1 ? "s" : ""} referred
                  </Text>
                </View>

                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: "800",
                    color: "#1A1A1A",
                    letterSpacing: -0.5,
                  }}
                >
                  ₹{formatINR(wallet.referralEarnings)}
                </Text>
              </View>

              {/* ── 3. Referral Code — the ONE deliberate brand-pink moment ── */}
              {!!wallet.referralCode && (
                <View
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 8,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: BORDER,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "600",
                      color: MUTED,
                      letterSpacing: 0.7,
                      textTransform: "uppercase",
                      marginBottom: 10,
                    }}
                  >
                    Your Referral Code
                  </Text>

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {/* Code pill — brand pink lives here, and only here */}
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: "#FFF7F8",
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: PRIMARY,
                        borderStyle: "dashed",
                        paddingVertical: 10,
                        paddingHorizontal: 14,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 17,
                          fontWeight: "800",
                          color: PRIMARY,
                          letterSpacing: 2.5,
                        }}
                      >
                        {wallet.referralCode}
                      </Text>
                    </View>

                    {/* Copy */}
                    <TouchableOpacity
                      onPress={handleCopy}
                      style={{
                        paddingVertical: 10,
                        paddingHorizontal: 14,
                        backgroundColor: copied ? GREEN_BG : "#F5F5F5",
                        borderRadius: 6,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <Ionicons
                        name={copied ? "checkmark-outline" : "copy-outline"}
                        size={15}
                        color={copied ? GREEN : "#666"}
                      />
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color: copied ? GREEN : "#666",
                        }}
                      >
                        {copied ? "Copied" : "Copy"}
                      </Text>
                    </TouchableOpacity>

                    {/* Share */}
                    <TouchableOpacity
                      onPress={handleShare}
                      style={{
                        paddingVertical: 10,
                        paddingHorizontal: 14,
                        backgroundColor: "#1A1A1A",
                        borderRadius: 6,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <Ionicons
                        name="share-social-outline"
                        size={15}
                        color="#fff"
                      />
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color: "#fff",
                        }}
                      >
                        Share
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* ── 4. Refer & Earn — neutral ink card now, not solid pink ── */}
              <View
                style={{
                  backgroundColor: "#1A1A1A",
                  borderRadius: 8,
                  padding: 16,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: "#fff",
                    marginBottom: 10,
                  }}
                >
                  Refer & Earn
                </Text>

                <View style={{ gap: 7 }}>
                  {[
                    "You earn ₹79 when your friend's first order is delivered.",
                    "Your friend gets ₹79 off on their first order.",
                  ].map((txt, i) => (
                    <View
                      key={i}
                      style={{
                        flexDirection: "row",
                        alignItems: "flex-start",
                        gap: 7,
                      }}
                    >
                      <View
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: 2,
                          backgroundColor: PRIMARY,
                          marginTop: 5,
                        }}
                      />
                      <Text
                        style={{
                          fontSize: 12,
                          color: "rgba(255,255,255,0.75)",
                          lineHeight: 17,
                          flex: 1,
                        }}
                      >
                        {txt}
                      </Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  onPress={handleShare}
                  style={{
                    marginTop: 14,
                    backgroundColor: PRIMARY,
                    borderRadius: 6,
                    paddingVertical: 11,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: "#fff",
                    }}
                  >
                    Invite Friends
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}
      </View>
    </>
  );
}
