import { EvilIcons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SECTIONS = [
  {
    title: "Overview",
    body: `This app is operated by Cupid Clothings. Throughout the app, the terms "we", "us" and "our" refer to Cupid Clothings. Cupid Clothings offers this app, including all information, tools and services available from this app to you, the user, conditioned upon your acceptance of all terms, conditions, policies and notices stated here.

By visiting our app and/or purchasing something from us, you engage in our "Service" and agree to be bound by the following terms and conditions ("Terms of Service", "Terms"), including those additional terms and conditions and policies referenced herein. These Terms of Service apply to all users of the app, including without limitation users who are browsers, vendors, customers, merchants, and/or contributors of content.

Please read these Terms of Service carefully before accessing or using our app. By accessing or using any part of the app, you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions of this agreement, then you may not access the app or use any services.

Any new features or tools which are added to the current app shall also be subject to the Terms of Service. We reserve the right to update, change or replace any part of these Terms of Service at any time. It is your responsibility to check this page periodically for changes.

Our store is hosted on Shopify Inc. They provide us with the online e-commerce platform that allows us to sell our products and services to you.`,
  },
  {
    title: "Section 1 — Online Store Terms",
    body: `By agreeing to these Terms of Service, you represent that you are at least the age of majority in your state or province of residence, or that you have given us your consent to allow any of your minor dependents to use this app.

You may not use our products for any illegal or unauthorized purpose nor may you, in the use of the Service, violate any laws in your jurisdiction (including but not limited to copyright laws).

You must not transmit any worms or viruses or any code of a destructive nature.

A breach or violation of any of the Terms will result in an immediate termination of your Services.`,
  },
  {
    title: "Section 2 — General Conditions",
    body: `We reserve the right to refuse service to anyone for any reason at any time.

You understand that your content (not including credit card information), may be transferred unencrypted and involve (a) transmissions over various networks; and (b) changes to conform and adapt to technical requirements of connecting networks or devices. Credit card information is always encrypted during transfer over networks.

You agree not to reproduce, duplicate, copy, sell, resell or exploit any portion of the Service, without express written permission by us.

The headings used in this agreement are included for convenience only and will not limit or otherwise affect these Terms.`,
  },
  {
    title: "Section 3 — Accuracy, Completeness & Timeliness",
    body: `We are not responsible if information made available on this app is not accurate, complete or current. The material on this app is provided for general information only and should not be relied upon as the sole basis for making decisions without consulting primary, more accurate or more timely sources of information. Any reliance on the material on this app is at your own risk.

This app may contain certain historical information. Historical information, necessarily, is not current and is provided for your reference only. We reserve the right to modify the contents of this app at any time, but we have no obligation to update any information. You agree that it is your responsibility to monitor changes to our app.`,
  },
  {
    title: "Section 4 — Modifications to the Service & Prices",
    body: `Prices for our products are subject to change without notice.

We reserve the right at any time to modify or discontinue the Service (or any part or content thereof) without notice at any time.

We shall not be liable to you or to any third-party for any modification, price change, suspension or discontinuance of the Service.`,
  },
  {
    title: "Section 5 — Products or Services",
    body: `Certain products or services may be available exclusively through the app. These products or services may have limited quantities and are subject to return or exchange only according to our Return Policy.

We have made every effort to display as accurately as possible the colors and images of our products that appear on the app. We cannot guarantee that your device display of any color will be accurate.

We reserve the right to limit the sales of our products or Services to any person, geographic region or jurisdiction. All descriptions of products or product pricing are subject to change at any time without notice, at the sole discretion of us. We reserve the right to discontinue any product at any time.

We do not warrant that the quality of any products, services, information, or other material purchased or obtained by you will meet your expectations, or that any errors in the Service will be corrected.`,
  },
  {
    title: "Section 6 — Accuracy of Billing & Account Information",
    body: `We reserve the right to refuse any order you place with us. We may, in our sole discretion, limit or cancel quantities purchased per person, per household or per order. These restrictions may include orders placed by or under the same customer account, the same credit card, and/or orders that use the same billing and/or shipping address.

In the event that we make a change to or cancel an order, we may attempt to notify you by contacting the e-mail and/or billing address/phone number provided at the time the order was made.

You agree to provide current, complete and accurate purchase and account information for all purchases made at our app. You agree to promptly update your account and other information, including your email address and credit card numbers and expiration dates, so that we can complete your transactions and contact you as needed.`,
  },
  {
    title: "Section 7 — Optional Tools",
    body: `We may provide you with access to third-party tools over which we neither monitor nor have any control nor input.

You acknowledge and agree that we provide access to such tools "as is" and "as available" without any warranties, representations or conditions of any kind and without any endorsement. We shall have no liability whatsoever arising from or relating to your use of optional third-party tools.

Any use by you of optional tools offered through the app is entirely at your own risk and discretion and you should ensure that you are familiar with and approve of the terms on which tools are provided by the relevant third-party provider(s).`,
  },
  {
    title: "Section 8 — Third-Party Links",
    body: `Certain content, products and services available via our Service may include materials from third-parties.

Third-party links on this app may direct you to third-party websites or services that are not affiliated with us. We are not responsible for examining or evaluating the content or accuracy and we do not warrant and will not have any liability or responsibility for any third-party materials or websites, or for any other materials, products, or services of third-parties.

We are not liable for any harm or damages related to the purchase or use of goods, services, resources, content, or any other transactions made in connection with any third-party services. Please review carefully the third-party's policies and practices and make sure you understand them before you engage in any transaction.`,
  },
  {
    title: "Section 9 — User Comments, Feedback & Submissions",
    body: `If, at our request, you send certain specific submissions or without a request from us you send creative ideas, suggestions, proposals, plans, or other materials (collectively, 'comments'), you agree that we may, at any time, without restriction, edit, copy, publish, distribute, translate and otherwise use in any medium any comments that you forward to us. We are and shall be under no obligation (1) to maintain any comments in confidence; (2) to pay compensation for any comments; or (3) to respond to any comments.

We may, but have no obligation to, monitor, edit or remove content that we determine in our sole discretion are unlawful, offensive, threatening, libelous, defamatory, pornographic, obscene or otherwise objectionable or violates any party's intellectual property or these Terms of Service.

You agree that your comments will not violate any right of any third-party, including copyright, trademark, privacy, personality or other personal or proprietary right. You are solely responsible for any comments you make and their accuracy.`,
  },
  {
    title: "Section 10 — Personal Information",
    body: `Your submission of personal information through the app is governed by our Privacy Policy. To view our Privacy Policy, please visit the relevant section within the app.`,
  },
  {
    title: "Section 11 — Errors, Inaccuracies & Omissions",
    body: `Occasionally there may be information on our app or in the Service that contains typographical errors, inaccuracies or omissions that may relate to product descriptions, pricing, promotions, offers, product shipping charges, transit times and availability. We reserve the right to correct any errors, inaccuracies or omissions, and to change or update information or cancel orders if any information in the Service or on any related service is inaccurate at any time without prior notice (including after you have submitted your order).`,
  },
  {
    title: "Section 12 — Prohibited Uses",
    body: `In addition to other prohibitions as set forth in the Terms of Service, you are prohibited from using the app or its content:

(a) for any unlawful purpose
(b) to solicit others to perform or participate in any unlawful acts
(c) to violate any international, federal, provincial or state regulations, rules, laws, or local ordinances
(d) to infringe upon or violate our intellectual property rights or the intellectual property rights of others
(e) to harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate based on gender, sexual orientation, religion, ethnicity, race, age, national origin, or disability
(f) to submit false or misleading information
(g) to upload or transmit viruses or any other type of malicious code
(h) to collect or track the personal information of others
(i) to spam, phish, pharm, pretext, spider, crawl, or scrape
(j) for any obscene or immoral purpose
(k) to interfere with or circumvent the security features of the Service

We reserve the right to terminate your use of the Service for violating any of the prohibited uses.`,
  },
  {
    title: "Section 13 — Disclaimer of Warranties; Limitation of Liability",
    body: `We do not guarantee, represent or warrant that your use of our service will be uninterrupted, timely, secure or error-free.

We do not warrant that the results that may be obtained from the use of the service will be accurate or reliable.

You expressly agree that your use of, or inability to use, the service is at your sole risk. The service and all products and services delivered to you through the service are (except as expressly stated by us) provided 'as is' and 'as available' for your use, without any representation, warranties or conditions of any kind.

In no case shall Cupid Clothings, our directors, officers, employees, affiliates, agents, contractors, interns, suppliers, service providers or licensors be liable for any injury, loss, claim, or any direct, indirect, incidental, punitive, special, or consequential damages of any kind, including, without limitation lost profits, lost revenue, lost savings, loss of data, replacement costs, or any similar damages, arising from your use of any of the service or any products procured using the service.`,
  },
  {
    title: "Section 14 — Indemnification",
    body: `You agree to indemnify, defend and hold harmless Cupid Clothings and our parent, subsidiaries, affiliates, partners, officers, directors, agents, contractors, licensors, service providers, subcontractors, suppliers, interns and employees, harmless from any claim or demand, including reasonable attorneys' fees, made by any third-party due to or arising out of your breach of these Terms of Service or your violation of any law or the rights of a third-party.`,
  },
  {
    title: "Section 15 — Severability",
    body: `In the event that any provision of these Terms of Service is determined to be unlawful, void or unenforceable, such provision shall nonetheless be enforceable to the fullest extent permitted by applicable law, and the unenforceable portion shall be deemed to be severed from these Terms of Service, such determination shall not affect the validity and enforceability of any other remaining provisions.`,
  },
  {
    title: "Section 16 — Termination",
    body: `The obligations and liabilities of the parties incurred prior to the termination date shall survive the termination of this agreement for all purposes.

These Terms of Service are effective unless and until terminated by either you or us. You may terminate these Terms of Service at any time by notifying us that you no longer wish to use our Services, or when you cease using our app.

If in our sole judgment you fail, or we suspect that you have failed, to comply with any term or provision of these Terms of Service, we also may terminate this agreement at any time without notice and you will remain liable for all amounts due up to and including the date of termination.`,
  },
  {
    title: "Section 17 — Entire Agreement",
    body: `The failure of us to exercise or enforce any right or provision of these Terms of Service shall not constitute a waiver of such right or provision.

These Terms of Service and any policies or operating rules posted by us on this app or in respect to The Service constitutes the entire agreement and understanding between you and us and govern your use of the Service, superseding any prior or contemporaneous agreements, communications and proposals, whether oral or written, between you and us.`,
  },
  {
    title: "Section 18 — Governing Law",
    body: `These Terms of Service and any separate agreements whereby we provide you Services shall be governed by and construed in accordance with the laws of India.`,
  },
  {
    title: "Section 19 — Changes to Terms of Service",
    body: `You can review the most current version of the Terms of Service at any time on this page within the app.

We reserve the right, at our sole discretion, to update, change or replace any part of these Terms of Service. It is your responsibility to check our app periodically for changes. Your continued use of or access to our app or the Service following the posting of any changes to these Terms of Service constitutes acceptance of those changes.`,
  },
  {
    title: "Section 20 — Contact Information",
    body: `Questions about the Terms of Service should be sent to us at:\n\ncupidclothings@gmail.com`,
  },
];

export default function TermsPage() {
  const router = useRouter();

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
        contentContainerStyle={{
          paddingBottom: 60 + useSafeAreaInsets().bottom,
        }}
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
            Terms of Service
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
