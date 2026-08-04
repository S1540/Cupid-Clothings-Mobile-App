// app/HelpCenter.tsx
import {
  EvilIcons,
  Feather,
  Fontisto,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { memo, useCallback, useMemo, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  Pressable,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Linking,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type FAQItem = {
  id: string;
  question: string;
  answer: string;
};

// ─── DATA ─────────────────────────────────────────────────────────────────────

const FAQS: FAQItem[] = [
  {
    id: "faq1",
    question: "Where is my order?",
    answer:
      "You can track your order in real time from the 'My Orders' section in your account. Tap any order and hit 'Track Order' to see live delivery updates. Orders usually arrive within 3–5 business days.",
  },
  {
    id: "faq2",
    question: "How can I cancel my order?",
    answer:
      "Orders can be cancelled before they are shipped. Go to 'My Orders', select the order, and tap 'Cancel Order'. If the order is already shipped, please use the Return & Exchange option after delivery.",
  },
  {
    id: "faq3",
    question: "How do refunds work?",
    answer:
      "After we receive and verify your returned item, refunds are initiated within 24–48 hours. The amount is credited back to your original payment method or Cupid Wallet depending on your preference.",
  },
  {
    id: "faq4",
    question: "When will I receive my refund?",
    answer:
      "Bank account refunds take 5–7 business days after initiation. UPI and wallet refunds are instant. You will receive an email confirmation as soon as the refund is processed.",
  },
  {
    id: "faq5",
    question: "How can I contact support?",
    answer:
      "You can reach us via Live Chat, WhatsApp, Phone, or Email from the Contact Support section below. Our team is available Monday–Saturday from 9 AM to 7 PM IST.",
  },
  {
    id: "faq6",
    question: "Can I change my delivery address?",
    answer:
      "Yes, delivery addresses can be changed before the order is shipped. Go to 'My Orders', select your order, and tap 'Change Address'. Once shipped, address changes are not possible.",
  },
];

// UI: shared, softer ink tones (matches the Cart screen's lighter palette —
// pure near-black is reserved for CTA buttons / prices only, everything
// else uses one of these two grays).
const INK_DARK = "#333333";
const INK_MID = "#7A7A7A";

// ─── ICON RENDERER ────────────────────────────────────────────────────────────

const Icon = memo(
  ({
    family,
    name,
    size,
    color,
  }: {
    family: "Feather" | "Ionicons" | "MaterialCommunityIcons" | "MaterialIcons";
    name: string;
    size: number;
    color: string;
  }) => {
    if (family === "Ionicons")
      return <Ionicons name={name as any} size={size} color={color} />;
    if (family === "MaterialCommunityIcons")
      return (
        <MaterialCommunityIcons name={name as any} size={size} color={color} />
      );
    if (family === "MaterialIcons")
      return <MaterialIcons name={name as any} size={size} color={color} />;
    return <Feather name={name as any} size={size} color={color} />;
  },
);

// ─── SECTION TITLE ────────────────────────────────────────────────────────────

// UI: weight 700 → 600 and pure #1C1C1C → INK_DARK (#333) so section
// headers read as clean/confident instead of heavy-black, matching Cart.
const SectionTitle = memo(({ title }: { title: string }) => (
  <Text
    style={{
      fontSize: 16,
      fontWeight: "600",
      color: INK_DARK,
      letterSpacing: -0.1,
      marginBottom: 14,
      paddingHorizontal: 16,
    }}
  >
    {title}
  </Text>
));

// ─── SEARCH BAR ───────────────────────────────────────────────────────────────

const SearchBar = memo(
  ({
    value,
    onChangeText,
  }: {
    value: string;
    onChangeText: (t: string) => void;
  }) => {
    const focusAnim = useRef(new Animated.Value(0)).current;

    const onFocus = () =>
      Animated.timing(focusAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: false,
      }).start();

    const onBlur = () =>
      Animated.timing(focusAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: false,
      }).start();

    const borderColor = focusAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ["#EEEEEE", "#F87387"],
    });

    return (
      <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <Animated.View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#fff",
            borderRadius: 8,
            borderWidth: 1.5,
            borderColor,
            paddingHorizontal: 14,
            paddingVertical: 12,
            gap: 10,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.02,
            shadowRadius: 6,
            elevation: 0.5,
          }}
        >
          <Feather name="search" size={17} color="#aaa" />
          <TextInput
            value={value}
            onChangeText={onChangeText}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder="Search for help..."
            placeholderTextColor="#bbb"
            style={{
              flex: 1,
              fontSize: 14,
              color: INK_DARK,
              fontWeight: "400",
              padding: 0,
            }}
            returnKeyType="search"
          />
          {value.length > 0 && (
            <Pressable onPress={() => onChangeText("")} hitSlop={8}>
              <Feather name="x" size={16} color="#bbb" />
            </Pressable>
          )}
        </Animated.View>
      </View>
    );
  },
);

// ─── FAQ ACCORDION ────────────────────────────────────────────────────────────

const FAQAccordion = memo(
  ({
    item,
    isOpen,
    onToggle,
  }: {
    item: FAQItem;
    isOpen: boolean;
    onToggle: () => void;
  }) => {
    const heightAnim = useRef(new Animated.Value(0)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const [contentHeight, setContentHeight] = useState(0);

    React.useEffect(() => {
      Animated.parallel([
        Animated.timing(heightAnim, {
          toValue: isOpen ? contentHeight : 0,
          duration: 240,
          useNativeDriver: false,
        }),
        Animated.timing(rotateAnim, {
          toValue: isOpen ? 1 : 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }, [isOpen, contentHeight]);

    const rotate = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", "180deg"],
    });

    return (
      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 8,
          marginHorizontal: 16,
          marginBottom: 8,
          borderWidth: 1,
          borderColor: isOpen ? "#F8738720" : "#f0f0f0",
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.02,
          shadowRadius: 4,
          elevation: 0.5,
        }}
      >
        <TouchableOpacity
          onPress={onToggle}
          activeOpacity={0.7}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 16,
            gap: 12,
            // UI: 44dp minimum touch target height for the accordion header.
            minHeight: 44,
          }}
        >
          {/* UI: weight 600 → 500 and #1C1C1C → INK_DARK for the closed
              state, so questions read as clean regular text; the pink
              accent on open state is untouched — that's the one place bold
              color should stand out. */}
          <Text
            style={{
              flex: 1,
              fontSize: 13.5,
              fontWeight: isOpen ? "600" : "500",
              color: isOpen ? "#F87387" : INK_DARK,
              lineHeight: 19,
              letterSpacing: -0.1,
            }}
          >
            {item.question}
          </Text>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Feather
              name="chevron-down"
              size={16}
              color={isOpen ? "#F87387" : "#bbb"}
            />
          </Animated.View>
        </TouchableOpacity>

        <Animated.View style={{ height: heightAnim, overflow: "hidden" }}>
          <View
            onLayout={(e) => setContentHeight(e.nativeEvent.layout.height)}
            style={{
              position: "absolute",
              width: "100%",
              paddingHorizontal: 16,
              paddingBottom: 16,
            }}
          >
            <View
              style={{
                height: 1,
                backgroundColor: "#f5f5f5",
                marginBottom: 14,
              }}
            />
            <Text
              style={{
                fontSize: 13.5,
                fontWeight: "400",
                color: INK_MID,
                lineHeight: 21,
              }}
            >
              {item.answer}
            </Text>
          </View>
        </Animated.View>
      </View>
    );
  },
);

// ─── CONTACT SECTION ─────────────────────────────────────────────────────────

const ContactSection = memo(() => {
  const scale1 = useRef(new Animated.Value(1)).current;
  const scale2 = useRef(new Animated.Value(1)).current;

  const animateIn = (anim: Animated.Value) =>
    Animated.spring(anim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
    }).start();
  const animateOut = (anim: Animated.Value) =>
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();

  return (
    <View style={{ marginTop: 24, marginBottom: 8 }}>
      <SectionTitle title="Contact Support" />
      <View
        style={{
          marginHorizontal: 16,
          backgroundColor: "#fff",
          borderRadius: 8,
          borderWidth: 1,
          borderColor: "#f0f0f0",
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 0.5,
        }}
      >
        {/* Support agent illustration */}
        <View
          style={{
            alignItems: "center",
            paddingTop: 24,
            paddingBottom: 20,
            gap: 10,
          }}
        >
          <Image
            source={{
              uri: "https://res.cloudinary.com/drsoj4c5q/image/upload/v1782471968/icons8-headset_yvvsnc.gif",
            }}
            style={{
              width: 94,
              height: 94,
              borderRadius: 50,
              //   backgroundColor: "#fff5f7",
            }}
            resizeMode="contain"
          />
          <View style={{ alignItems: "center", gap: 4 }}>
            {/* UI: weight 700 → 600, #1C1C1C → INK_DARK — consistent with
                the rest of the lighter header treatment. */}
            <Text
              style={{ fontSize: 14.5, fontWeight: "600", color: INK_DARK }}
            >
              We're here for you
            </Text>
            <Text
              style={{
                fontSize: 12.5,
                color: INK_MID,
                textAlign: "center",
                lineHeight: 18,
                paddingHorizontal: 32,
              }}
            >
              Our support team is available Mon–Sat, 9 AM to 7 PM IST
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View
          style={{
            height: 1,
            backgroundColor: "#f5f5f5",
            marginHorizontal: 16,
          }}
        />

        {/* Buttons */}
        <View style={{ padding: 16, gap: 10 }}>
          {/* Request a Call — primary active button.
              UI: kept bold/700 — same as Cart's "Place Order" CTA, this is
              the one place on the screen that should stay strong. */}
          <Animated.View style={{ transform: [{ scale: scale1 }] }}>
            <TouchableOpacity
              onPress={() =>
                Linking.openURL(
                  "mailto:cupidclothings@gmail.com?subject=Support&body=Hello Cupid Team,",
                )
              }
              onPressIn={() => animateIn(scale1)}
              onPressOut={() => animateOut(scale1)}
              activeOpacity={1}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                // backgroundColor: "#F87387",
                backgroundColor: "#555",
                borderRadius: 2,
                paddingVertical: 14,
                minHeight: 44,
              }}
            >
              <Fontisto name="email" size={17} color="#fff" />
              <Text
                style={{ fontSize: 14.5, fontWeight: "700", color: "#fff" }}
              >
                E-mail Support
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* WhatsApp Support — secondary outlined button */}
          <Animated.View style={{ transform: [{ scale: scale2 }] }}>
            <TouchableOpacity
              onPress={() =>
                Linking.openURL(
                  "https://wa.me/7710477039?text=I%20need%20help%20with%20my%20order.",
                )
              }
              onPressIn={() => animateIn(scale2)}
              onPressOut={() => animateOut(scale2)}
              activeOpacity={1}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                backgroundColor: "#fff",
                borderRadius: 2,
                paddingVertical: 14,
                borderWidth: 1,
                borderColor: "#25D366",
                minHeight: 44,
              }}
            >
              <Ionicons name="logo-whatsapp" size={17} color="#25D366" />
              <Text
                style={{ fontSize: 14.5, fontWeight: "700", color: "#25D366" }}
              >
                WhatsApp Support
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Coming soon nudge */}
          {/* <Text
            style={{
              fontSize: 12,
              color: "#1C1C1C",
              textAlign: "center",
              opacity: 0.4,
              marginTop: 2,
            }}
          ></Text> */}
        </View>
      </View>
    </View>
  );
});

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────

type ScreenSection =
  | { type: "search" }
  | { type: "faqs" }
  | { type: "contact" }
  | { type: "cta" }
  | { type: "footer" };

const SCREEN_SECTIONS: ScreenSection[] = [
  { type: "search" },
  { type: "faqs" },
  { type: "contact" },
  { type: "cta" },
  { type: "footer" },
];

export default function HelpCenter() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState("");
  const [openFAQId, setOpenFAQId] = useState<string | null>(null);

  const filteredFAQs = useMemo(() => {
    if (!searchText.trim()) return FAQS;
    const q = searchText.toLowerCase();
    return FAQS.filter(
      (f) =>
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q),
    );
  }, [searchText]);

  const handleFAQToggle = useCallback((id: string) => {
    setOpenFAQId((prev) => (prev === id ? null : id));
  }, []);

  const renderSection = useCallback(
    ({ item }: { item: ScreenSection }) => {
      if (item.type === "search") {
        return (
          <View style={{ backgroundColor: "#fff", paddingBottom: 8 }}>
            <SearchBar value={searchText} onChangeText={setSearchText} />
          </View>
        );
      }

      if (item.type === "faqs") {
        if (filteredFAQs.length === 0) return null;
        return (
          <View style={{ marginTop: 24, marginBottom: 8 }}>
            <SectionTitle title="Frequently Asked" />
            {filteredFAQs.map((faq) => (
              <FAQAccordion
                key={faq.id}
                item={faq}
                isOpen={openFAQId === faq.id}
                onToggle={() => handleFAQToggle(faq.id)}
              />
            ))}
          </View>
        );
      }

      if (item.type === "contact") {
        return <ContactSection />;
      }

      return null;
    },
    [searchText, filteredFAQs, openFAQId, handleFAQToggle],
  );

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Stack.Screen
        options={{
          headerTitle: () => (
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#1a1a1a" }}>
              Help Center
            </Text>
          ),
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "#fff7f8" },
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={10}>
              <EvilIcons name="chevron-left" size={34} color="#1a1a1a" />
            </Pressable>
          ),
        }}
      />
      <FlatList
        data={SCREEN_SECTIONS}
        keyExtractor={(item) => item.type}
        renderItem={renderSection}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, backgroundColor: "#F6F6F6" }}
        stickyHeaderIndices={[0]}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={6}
        contentContainerStyle={{ paddingBottom: insets.bottom + 70 }}
      />
    </>
  );
}
