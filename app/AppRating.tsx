import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  ScrollView,
  StatusBar,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";

// ─── Config ───────────────────────────────────────────────
const MOOD_DATA: Record<
  number,
  { text: string; emoji: string; tags: string[] }
> = {
  1: {
    text: "That's really unfortunate",
    emoji: "😔",
    tags: ["App crashes", "Slow loading", "Bad UI", "Hard to navigate"],
  },
  2: {
    text: "We can do better",
    emoji: "😕",
    tags: [
      "More styles needed",
      "Slow delivery",
      "Confusing filters",
      "Payment issues",
    ],
  },
  3: {
    text: "Thanks, we'll improve!",
    emoji: "🙂",
    tags: [
      "Good products",
      "Okay experience",
      "Average speed",
      "More offers needed",
    ],
  },
  4: {
    text: "Glad you like it!",
    emoji: "😊",
    tags: ["Easy to use", "Great products", "Fast delivery", "Nice UI"],
  },
  5: {
    text: "You made our day! 🎉",
    emoji: "🥰",
    tags: [
      "Love the app",
      "Amazing products",
      "Super fast",
      "Best fashion app",
    ],
  },
};

// ─── Main Screen ──────────────────────────────────────────
export default function RateAppScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Animated scale per star
  const scales = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(1)),
  ).current;

  // Hero emoji animated opacity
  const emojiOpacity = useRef(new Animated.Value(1)).current;

  const handleStar = (val: number) => {
    setRating(val);
    setSelectedTags([]);

    // Pop animation on tapped star
    Animated.sequence([
      Animated.timing(scales[val - 1], {
        toValue: 1.4,
        duration: 110,
        useNativeDriver: true,
      }),
      Animated.spring(scales[val - 1], {
        toValue: 1,
        friction: 4,
        tension: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Fade emoji swap
    Animated.sequence([
      Animated.timing(emojiOpacity, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(emojiOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleSubmit = () => {
    // TODO: send { rating, selectedTags } to Firebase / Analytics
    router.back();
  };

  const mood = rating > 0 ? MOOD_DATA[rating] : null;
  const heroEmoji = mood ? mood.emoji : "🛍️";

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: "#1a1a1a",
                paddingLeft: 8,
              }}
            >
              Rate App
            </Text>
          ),
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "#fff7f8" },
          headerLeft: () => (
            <Pressable hitSlop={8} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color="#111111" />
            </Pressable>
          ),
        }}
      />
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={{
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 24,
            flexGrow: 1,
          }}
        >
          {/* Hero */}
          <View
            style={{
              alignItems: "center",
              paddingHorizontal: 28,
              paddingTop: 32,
              paddingBottom: 28,
            }}
          >
            <Animated.Text
              style={{
                fontSize: 72,
                lineHeight: 80,
                marginBottom: 20,
                opacity: emojiOpacity,
              }}
            >
              {heroEmoji}
            </Animated.Text>

            <Text
              style={{
                fontSize: 22,
                fontWeight: "700",
                color: "#1A1A1A",
                textAlign: "center",
                letterSpacing: -0.3,
                marginBottom: 10,
              }}
            >
              How's your Cupid{"\n"}experience?
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: "#888",
                textAlign: "center",
                lineHeight: 22,
                maxWidth: 260,
              }}
            >
              Tap the stars to rate us. Your honest feedback means a lot to us.
            </Text>
          </View>

          {/* Divider */}
          <View
            style={{
              height: 1,
              backgroundColor: "#F2F2F2",
              marginHorizontal: 20,
            }}
          />

          {/* Rating block */}
          <View
            style={{
              alignItems: "center",
              paddingHorizontal: 28,
              paddingTop: 28,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: "#bbb",
                letterSpacing: 0.8,
                marginBottom: 20,
              }}
            >
              TAP TO RATE
            </Text>

            {/* Stars */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
              }}
            >
              {[1, 2, 3, 4, 5].map((val) => (
                <Animated.View
                  key={val}
                  style={{ transform: [{ scale: scales[val - 1] }] }}
                >
                  <TouchableOpacity
                    onPress={() => handleStar(val)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={{
                        fontSize: 40,
                        opacity: val <= rating ? 1 : 0.42,
                      }}
                    >
                      ⭐
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>

            {/* Mood text */}
            <View
              style={{
                height: 22,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginBottom: 24,
              }}
            >
              {mood && (
                <>
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: "#F87387",
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 13,
                      color: "#F87387",
                      fontWeight: "600",
                    }}
                  >
                    {mood.text}
                  </Text>
                </>
              )}
            </View>

            {/* Quick tags */}
            {mood && (
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                  justifyContent: "center",
                  marginBottom: 8,
                }}
              >
                {mood.tags.map((tag: any) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <TouchableOpacity
                      key={tag}
                      onPress={() => toggleTag(tag)}
                      activeOpacity={0.7}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 7,
                        borderRadius: 99,
                        borderWidth: 1.5,
                        borderColor: isSelected ? "#F87387" : "#EFEFEF",
                        backgroundColor: isSelected ? "#FFF0F4" : "#fff",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          color: isSelected ? "#E85D75" : "#555",
                          fontWeight: isSelected ? "600" : "400",
                        }}
                      >
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* CTA */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 32,
              marginTop: "auto",
            }}
          >
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={rating === 0}
              activeOpacity={0.85}
              style={{
                width: "100%",
                paddingVertical: 16,
                borderRadius: 8,
                backgroundColor: "#F87387",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
                opacity: rating === 0 ? 0.4 : 1,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>
                Submit Rating
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.6}
              style={{
                width: "100%",
                paddingVertical: 10,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 14, color: "#bbb" }}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </>
  );
}
