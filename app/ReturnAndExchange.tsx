import { EvilIcons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SECTIONS = [
  {
    title: "Terms of Replacement & Exchange",
    body: `Cupid Clothings allows the Replacement & Exchange of items within 7 days from the day of delivery. Replacement & exchange requests after this period will not be entertained.

· All items received at our courier address will undergo a quality check. If the item does not pass the quality check and is found to be used, washed, altered, and/or tampered, we will not initiate a return/exchange/refund.

· The returned item must be in original condition and must be unused, unwashed, undamaged, and unaltered. We accept items with original tags, invoices, & proper packaging intact. If you fail any of these terms, a return or exchange will not be possible at all.

· We do not accept any return & exchange requests for an altered item available on our app.

· Once your replacement & exchange request is approved, we will arrange for Reverse Pickup of the order. We will dispatch the exchange order as soon as we receive the return order at our address and it passes the quality check.

· Reverse shipping in case of exchange and replacement will only be applied if the weight of the order exceeds 1 kg.

· Please note that the exchange of the item is subject to stock availability.`,
  },
  {
    title: "Terms of Return & Refund",
    body: `In case of return and refund only, please dispatch the order back to our registered address. Once received, the order amount will be processed within 48–72 working hours.

You will be eligible for a return request only if you receive a defective, damaged, or wrong item.

· Refund will not be initiated in certain circumstances. We accept items with original tags, invoices, & proper packaging intact. A returned product without these conditions will not be considered for a refund.

· All items received at our courier address will undergo a quality check. If the item does not pass the quality check, we will not initiate a refund.

· If the returned item is not received in the appropriate condition, or is damaged or defective in any way, or if the received item is different from what was ordered and shipped to you, we will not initiate any refund.

· If you have made the payment through any online channel or bank account, the refund will be made to the original payment mode only.

· The refund amount will be processed within 48–72 working hours of the refund request approval.

· The refund for COD orders will be made to the bank account based on the details you submitted during the return initiation. Make sure to send accurate and complete bank account details. The refund amount will be credited to your bank account within 2–3 working days from the day the refund request is approved and processed.`,
  },
  {
    title: "How to Request a Return or Exchange",
    body: `To request a return or exchange, drop an email at info@cupidclothings.com with the following information:

· Your Order number

· Exact size and the product you require in exchange or replacement

· The genuine reason for the return & exchange request

· If you have received a defective or wrong product, please attach clear images of the product. We will not accept your return & exchange request without appropriate images.`,
  },
  {
    title: "Other Important Information",
    body: `· We request you select the refund mode carefully when you raise a return request. The refund mode once selected will not be changed in any way.

· In case of return & exchange, we will generate a new order number and inform you of the same through an email.

· We request you pack the item properly and carefully to prevent any damage during transit.`,
  },
  {
    title: "Terms of Cancellation",
    body: `· The buyer is eligible to cancel a full or partial order prior to its dispatch from the Cupid Clothings app. You will receive a unique tracking identity number to track the delivery status of your order.

· Cancellation requests will not be accepted once your order has been dispatched.

· In case of a refund, we will initiate the refund amount within 48–72 working hours of the refund request approval.`,
  },
  {
    title: "Grievance Redressal",
    body: `For any grievances related to Return, Exchange, Replacement, Refund, & Cancellation Policy, you can contact us at:

info@cupidclothings.com

In case of self-shipping, please courier the product(s) to the address below:

Tanya Enterprises
41/14, First Floor, Atam Nagar,
Near Atam Public School,
Ludhiana, Punjab, India – 141003`,
  },
];

const HIGHLIGHTS = [
  { emoji: "🔄", label: "7-Day Exchange Window" },
  { emoji: "✅", label: "Quality Check on All Returns" },
  { emoji: "⚡", label: "Refund in 48–72 Hours" },
  { emoji: "📦", label: "Reverse Pickup Arranged" },
];

export default function ReturnPolicy() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "#fff" },
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <EvilIcons name="chevron-left" size={34} color="#111" />
            </Pressable>
          ),
        }}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: "#fff" }}
        contentContainerStyle={{ paddingBottom: 60 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ─────────────────────────────────────────── */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 24,
            paddingBottom: 20,
            borderBottomWidth: 1,
            borderBottomColor: "#f0f0f0",
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: "#F87387",
              letterSpacing: 1.2,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Policies
          </Text>
          <Text
            style={{
              fontSize: 26,
              fontWeight: "900",
              color: "#111",
              letterSpacing: -0.5,
              lineHeight: 32,
            }}
          >
            Return & Exchange{"\n"}Policy
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: "#888",
              marginTop: 8,
              lineHeight: 20,
            }}
          >
            Last updated: May 2025 · Cupid Clothings
          </Text>

          {/* Intro blurb */}
          <View
            style={{
              marginTop: 16,
              backgroundColor: "#fff5f7",
              borderRadius: 6,
              borderWidth: 0.5,
              borderColor: "#f2d7df",
              padding: 14,
            }}
          >
            <Text style={{ fontSize: 13, color: "#555", lineHeight: 20 }}>
              Cupid Clothings is accountable for what we sell. In case you are
              not satisfied with your purchase due to unsuitable size, or a
              defective/wrong item, we offer a Replacement & Exchange Policy.
            </Text>
          </View>
        </View>

        {/* ── Quick Highlights ─────────────────────────────── */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 4,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: "#999",
              letterSpacing: 0.7,
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            At a Glance
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            {HIGHLIGHTS.map((h) => (
              <View
                key={h.label}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 7,
                  backgroundColor: "#fff5f7",
                  borderRadius: 6,
                  borderWidth: 0.5,
                  borderColor: "#f2d7df",
                  paddingHorizontal: 11,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ fontSize: 15 }}>{h.emoji}</Text>
                <Text
                  style={{ fontSize: 12, fontWeight: "600", color: "#333" }}
                >
                  {h.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Sections ─────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          {SECTIONS.map((section, index) => (
            <View
              key={index}
              style={{
                paddingVertical: 20,
                borderBottomWidth: index < SECTIONS.length - 1 ? 1 : 0,
                borderBottomColor: "#f5f5f5",
              }}
            >
              {/* Section title */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                <View
                  style={{
                    width: 4,
                    height: 16,
                    borderRadius: 2,
                    backgroundColor: "#F87387",
                  }}
                />
                <Text
                  style={{
                    fontSize: 13.5,
                    fontWeight: "800",
                    color: "#111",
                    letterSpacing: -0.2,
                    flex: 1,
                  }}
                >
                  {section.title}
                </Text>
              </View>

              {/* Body */}
              <Text
                style={{
                  fontSize: 13.5,
                  color: "#555",
                  lineHeight: 22,
                  fontWeight: "400",
                }}
              >
                {section.body}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Footer ───────────────────────────────────────── */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 16,
            padding: 16,
            backgroundColor: "#fff5f7",
            borderRadius: 6,
            borderWidth: 0.5,
            borderColor: "#ffd6de",
          }}
        >
          <Text
            style={{
              fontSize: 12,
              color: "#F87387",
              fontWeight: "700",
              marginBottom: 4,
            }}
          >
            Need Help?
          </Text>
          <Text style={{ fontSize: 13, color: "#555", lineHeight: 20 }}>
            Reach us at{" "}
            <Text style={{ color: "#F87387", fontWeight: "700" }}>
              info@cupidclothings.com
            </Text>{" "}
            for any return, exchange, or refund related queries.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}
