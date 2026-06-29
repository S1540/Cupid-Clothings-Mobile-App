import { EvilIcons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SECTIONS = [
  {
    title: "Personal Information We Collect",
    body: `When you visit the app, we automatically collect certain information about your device, including information about your web browser, IP address, time zone, and some of the cookies that are installed on your device. Additionally, as you browse the app, we collect information about the individual pages or products that you view, what apps or search terms referred you to the app, and information about how you interact with the app. We refer to this automatically-collected information as "Device Information".

We collect Device Information using the following technologies:

· "Cookies" are data files that are placed on your device or computer and often include an anonymous unique identifier.

· "Log files" track actions occurring on the app, and collect data including your IP address, browser type, Internet service provider, referring/exit pages, and date/time stamps.

· "Web beacons", "tags", and "pixels" are electronic files used to record information about how you browse the app.

Additionally, when you make a purchase or attempt to make a purchase through the app, we collect certain information from you, including your name, billing address, shipping address, payment information (including credit card numbers), email address, and phone number. We refer to this information as "Order Information".

When we talk about "Personal Information" in this Privacy Policy, we are talking both about Device Information and Order Information.`,
  },
  {
    title: "How Do We Use Your Personal Information?",
    body: `We use the Order Information that we collect generally to fulfill any orders placed through the app (including processing your payment information, arranging for shipping, and providing you with invoices and/or order confirmations).

Additionally, we use this Order Information to:

· Communicate with you;

· Screen our orders for potential risk or fraud; and

· When in line with the preferences you have shared with us, provide you with information or advertising relating to our products or services.

We use the Device Information that we collect to help us screen for potential risk and fraud (in particular, your IP address), and more generally to improve and optimize our app (for example, by generating analytics about how our customers browse and interact with the app, and to assess the success of our marketing and advertising campaigns).`,
  },
  {
    title: "Sharing Your Personal Information",
    body: `We share your Personal Information with third parties to help us use your Personal Information, as described above.

For example, we use Shopify to power our online store — you can read more about how Shopify uses your Personal Information here: https://www.shopify.com/legal/privacy

We also use Google Analytics to help us understand how our customers use the app — you can read more about how Google uses your Personal Information here: https://www.google.com/intl/en/policies/privacy/

You can also opt-out of Google Analytics here: https://tools.google.com/dlpage/gaoptout

Finally, we may also share your Personal Information to comply with applicable laws and regulations, to respond to a subpoena, search warrant or other lawful request for information we receive, or to otherwise protect our rights.`,
  },
  {
    title: "Behavioural Advertising",
    body: `As described above, we use your Personal Information to provide you with targeted advertisements or marketing communications we believe may be of interest to you.

For more information about how targeted advertising works, you can visit the Network Advertising Initiative's ("NAI") educational page at http://www.networkadvertising.org/understanding-online-advertising/how-does-it-work

You can opt out of targeted advertising by using the links below:

· Facebook: https://www.facebook.com/settings/?tab=ads

· Google: https://www.google.com/settings/ads/anonymous

· Bing: https://advertise.bingads.microsoft.com/en-us/resources/policies/personalized-ads

Additionally, you can opt out of some of these services by visiting the Digital Advertising Alliance's opt-out portal at: http://optout.aboutads.info/`,
  },
  {
    title: "Do Not Track",
    body: `Please note that we do not alter our app's data collection and use practices when we see a Do Not Track signal from your browser.`,
  },
  {
    title: "Your Rights",
    body: `If you are a European resident, you have the right to access personal information we hold about you and to ask that your personal information be corrected, updated, or deleted. If you would like to exercise this right, please contact us through the contact information below.

Additionally, if you are a European resident we note that we are processing your information in order to fulfill contracts we might have with you (for example if you make an order through the app), or otherwise to pursue our legitimate business interests listed above.

Please note that your information will be transferred outside of Europe, including to Canada and the United States.`,
  },
  {
    title: "Data Retention",
    body: `When you place an order through the app, we will maintain your Order Information for our records unless and until you ask us to delete this information.`,
  },
  {
    title: "Minors",
    body: `The app is not intended for individuals under the age of 18. We do not knowingly collect personal information from children under 18. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.`,
  },
  {
    title: "Changes",
    body: `We may update this privacy policy from time to time in order to reflect, for example, changes to our practices or for other operational, legal or regulatory reasons.

We encourage you to review this Privacy Policy periodically to stay informed about how we are protecting your information. Your continued use of the app after any changes to this Privacy Policy will constitute your acknowledgment of the changes.`,
  },
  {
    title: "Contact Us",
    body: `For more information about our privacy practices, if you have questions, or if you would like to make a complaint, please contact us by e-mail at cupidclothings@gmail.com or by mail using the details provided below:

Cupid Clothings
[Re: Privacy Compliance Officer]
Ludhiana, 141001
Ludhiana PB, India`,
  },
];

export default function PrivacyPolicy() {
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
        {/* Hero */}
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
            Legal
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
            Privacy Policy
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
              borderRadius: 10,
              borderWidth: 0.5,
              borderColor: "#f2d7df",
              padding: 14,
            }}
          >
            <Text style={{ fontSize: 13, color: "#555", lineHeight: 20 }}>
              This Privacy Policy describes how your personal information is
              collected, used, and shared when you visit or make a purchase from
              the{" "}
              <Text style={{ fontWeight: "700", color: "#111" }}>
                Cupid Clothings app
              </Text>
              .
            </Text>
          </View>
        </View>

        {/* Sections */}
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

        {/* Footer */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 16,
            padding: 16,
            backgroundColor: "#fff5f7",
            borderRadius: 10,
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
            Questions?
          </Text>
          <Text style={{ fontSize: 13, color: "#555", lineHeight: 20 }}>
            Reach us at{" "}
            <Text style={{ color: "#F87387", fontWeight: "700" }}>
              cupidclothings@gmail.com
            </Text>
          </Text>
        </View>
      </ScrollView>
    </>
  );
}
