import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { useState } from "react";
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Promotional amounts supplied by the store owner on 2026-10-13.
// Provider eligibility and reward terms apply; these are not checkout discounts.
const rewards = [
  {
    id: "navi",
    name: "Navi UPI",
    logo: require("@/assets/images/payment-offers/navi.svg"),
    title: "Get up to 1,000 coins",
    preview: "Pay with Navi UPI · Eligible orders",
    terms:
      "Pay with Navi UPI to get up to 1,000 Navi coins on eligible orders. The reward amount and eligibility depend on the offer in your Navi app. Coins are credited by Navi and are not an instant discount on your Cupid order. Check the current terms before paying.",
    url: "https://navi.com/navi-upi",
  },
  {
    id: "pop",
    name: "POP UPI",
    logo: require("@/assets/images/payment-offers/pop.png"),
    title: "Get up to ₹300 cashback",
    preview: "Pay with POP UPI · Eligible orders",
    terms:
      "Pay with POP UPI to get up to ₹300 cashback on eligible orders. The reward amount, form of cashback, credit timing and eligibility depend on the offer in your POP app. The reward is issued by POP after payment, not deducted from your Cupid order total. Check the current terms before paying.",
    url: "https://popclub.co/",
  },
];

const coupons = [
  {
    code: "WELCUPID10",
    title: "Extra 10% off",
    detail: "On your first order. Apply at checkout to check eligibility.",
  },
];

export default function PaymentOffers() {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState("");
  const insets = useSafeAreaInsets();
  const open = () => {
    setCopied(null);
    setError("");
    setVisible(true);
  };
  const copy = async (code: string) => {
    try {
      await Clipboard.setStringAsync(code);
      setCopied(code);
      setError("");
    } catch {
      setError("Could not copy. Enter the code at checkout.");
    }
  };
  const openTerms = async (url: string) => {
    try {
      await Linking.openURL(url);
      setError("");
    } catch {
      setError("Could not open the page. Please try again.");
    }
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="View all offers and payment rewards"
        onPress={open}
        style={({ pressed }) => [styles.preview, pressed && styles.pressed]}
      >
        <View style={styles.headingRow}>
          <View style={styles.headingLabel}>
            <Feather name="tag" size={16} color="#278052" />
            <Text style={styles.heading}>Offers & rewards</Text>
          </View>
          <View style={styles.headingLabel}>
            <Text style={styles.viewAll}>View all</Text>
            <Feather name="chevron-right" size={16} color="#278052" />
          </View>
        </View>
        {rewards.map((reward) => (
          <View
            key={reward.id}
            style={[styles.rewardRow, styles.previewRewardRow]}
          >
            <View style={styles.logoBox}>
              <Image
                source={reward.logo}
                contentFit="contain"
                style={styles.logo}
                accessibilityLabel={`${reward.name} logo`}
              />
            </View>
            <View style={styles.copy}>
              <Text style={styles.rewardTitle}>{reward.title}</Text>
              <Text style={styles.subtitle}>{reward.preview}</Text>
            </View>
          </View>
        ))}
        <View style={styles.previewFooter}>
          <Text style={styles.footerText}>+ First-order coupon</Text>
          <Text style={styles.footerHint}>Eligibility & terms apply</Text>
        </View>
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.overlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            accessibilityRole="button"
            accessibilityLabel="Close offers"
            onPress={() => setVisible(false)}
          />
          <View
            accessibilityViewIsModal
            style={[
              styles.sheet,
              {
                paddingBottom: Math.max(insets.bottom, 16),
                marginTop: insets.top + 20,
              },
            ]}
          >
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <View style={styles.copy}>
                <Text accessibilityRole="header" style={styles.sheetTitle}>
                  A little extra, for you
                </Text>
                <Text style={styles.subtitle}>Offers & payment rewards</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close offers"
                onPress={() => setVisible(false)}
                style={styles.close}
              >
                <Feather name="x" size={21} color="#252525" />
              </Pressable>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sheetContent}
            >
              <Text style={styles.sectionLabel}>PAYMENT REWARDS</Text>
              {rewards.map((reward) => (
                <View key={reward.id} style={styles.card}>
                  <View style={styles.rewardRow}>
                    <View style={styles.logoBox}>
                      <Image
                        source={reward.logo}
                        contentFit="contain"
                        style={styles.logo}
                        accessibilityLabel={`${reward.name} logo`}
                      />
                    </View>
                    <View style={styles.copy}>
                      <Text style={styles.provider}>{reward.name}</Text>
                      <Text style={styles.rewardTitle}>{reward.title}</Text>
                    </View>
                  </View>
                  <Text style={styles.terms}>{reward.terms}</Text>
                  <Pressable
                    accessibilityRole="link"
                    accessibilityLabel={`View ${reward.name} rewards details`}
                    onPress={() => openTerms(reward.url)}
                    style={styles.link}
                  >
                    <Text style={styles.viewAll}>View provider details</Text>
                    <Feather name="arrow-up-right" size={14} color="#278052" />
                  </Pressable>
                </View>
              ))}
              <Text style={[styles.sectionLabel, { marginTop: 12 }]}>
                CUPID COUPONS
              </Text>
              {coupons.map((coupon) => (
                <View key={coupon.code} style={styles.card}>
                  <View style={styles.rewardRow}>
                    <View style={styles.logoBox}>
                      <Image
                        source={require("@/assets/images/Cupid.png")}
                        contentFit="contain"
                        style={styles.logo}
                        accessibilityLabel="Cupid logo"
                      />
                    </View>
                    <View style={styles.copy}>
                      <Text style={styles.provider}>CUPID</Text>
                      <Text style={styles.rewardTitle}>{coupon.title}</Text>
                    </View>
                  </View>
                  <Text style={styles.terms}>{coupon.detail}</Text>
                  <View style={styles.couponFooter}>
                    <Text selectable style={styles.code}>
                      {coupon.code}
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Copy coupon ${coupon.code}`}
                      onPress={() => copy(coupon.code)}
                      style={styles.copyButton}
                    >
                      <Text style={styles.viewAll}>
                        {copied === coupon.code ? "Copied" : "Copy code"}
                      </Text>
                      <Feather
                        name={copied === coupon.code ? "check" : "copy"}
                        size={14}
                        color="#278052"
                      />
                    </Pressable>
                  </View>
                </View>
              ))}
              {!!error && (
                <Text accessibilityLiveRegion="polite" style={styles.error}>
                  {error}
                </Text>
              )}
              <Text style={styles.note}>
                Payment rewards are issued by the payment app. Check its current
                terms before paying. Coupon acceptance and final savings are
                confirmed at checkout.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  preview: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#E2EAE4",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  pressed: { opacity: 0.75 },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    backgroundColor: "#F5F9F5",
    gap: 8,
  },
  headingLabel: { flexDirection: "row", alignItems: "center", gap: 6 },
  heading: { fontSize: 14, fontWeight: "600", color: "#202923" },
  viewAll: { fontSize: 12, fontWeight: "600", color: "#278052" },
  rewardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  previewRewardRow: { paddingLeft: 10, gap: 8 },
  logoBox: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logo: { width: 34, height: 34 },
  copy: { flex: 1, minWidth: 0 },
  rewardTitle: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19,
    color: "#222724",
  },
  subtitle: { fontSize: 11, lineHeight: 16, color: "#777D78", marginTop: 3 },
  previewFooter: {
    borderTopWidth: 1,
    borderTopColor: "#F0F2F0",
    padding: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 6,
  },
  footerText: { fontSize: 11, fontWeight: "500", color: "#4D6153" },
  footerHint: { fontSize: 10, color: "#858B86" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.38)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "88%",
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#FFFFFF",
  },
  handle: {
    width: 34,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#DDE1DD",
    alignSelf: "center",
    marginTop: 10,
  },
  sheetHeader: {
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sheetTitle: {
    fontSize: 21,
    fontWeight: "600",
    color: "#202923",
    letterSpacing: -0.5,
  },
  close: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F4F5F4",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetContent: { paddingHorizontal: 20, paddingBottom: 12, gap: 12 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1.4,
    color: "#828982",
  },
  card: {
    borderWidth: 1,
    borderColor: "#E9ECE9",
    borderRadius: 14,
    overflow: "hidden",
  },
  provider: {
    fontSize: 10,
    fontWeight: "500",
    color: "#7A817B",
    marginBottom: 3,
  },
  terms: {
    fontSize: 12,
    lineHeight: 19,
    color: "#6F756F",
    paddingHorizontal: 14,
  },
  link: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    padding: 14,
    minHeight: 44,
    alignSelf: "flex-start",
  },
  couponFooter: {
    marginTop: 12,
    paddingLeft: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAF8",
  },
  code: {
    fontSize: 12,
    fontWeight: "600",
    color: "#444D45",
    letterSpacing: 0.8,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 14,
    minHeight: 44,
  },
  note: { fontSize: 11, lineHeight: 17, color: "#858B86", marginTop: 2 },
  error: { fontSize: 12, color: "#AE3744" },
});
