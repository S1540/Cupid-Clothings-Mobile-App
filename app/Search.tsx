import { useState, useRef, useEffect } from "react";
import { useRouter, Stack } from "expo-router";
import { Audio } from "expo-av";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
  Animated,
  Modal,
} from "react-native";
import {
  EvilIcons,
  Ionicons,
  Feather,
  MaterialIcons,
} from "@expo/vector-icons";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";

type Product = {
  id: string;
  title: string;
  handle: string;
  images: { url: string; alt: string }[];
  price: string;
  compareAtPrice: string | null;
  discountPercent: number | null;
};

export default function SearchPage() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);

  // Pulse animation
  useEffect(() => {
    if (listening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [listening]);

  // Search debounce
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/products/search?q=${encodeURIComponent(query)}`,
        );
        const data: Product[] = await res.json();
        setResults(data);
      } catch (e) {
        console.log("Search error:", e);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const playMicSound = async () => {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
    });

    const { sound } = await Audio.Sound.createAsync(
      require("../assets/sounds/mic-open.mp3"),
      { shouldPlay: true },
    );

    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  };

  const startListening = async () => {
    try {
      setListening(true);
      playMicSound();
      const result =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!result.granted) {
        setListening(false);
        return;
      }
      ExpoSpeechRecognitionModule.start({
        lang: "en-US",
        interimResults: true,
        continuous: false,
      });
    } catch (error) {
      console.error("Mic error:", error);
      setListening(false);
    }
  };

  useSpeechRecognitionEvent("result", (event) => {
    const transcript = event.results[0]?.transcript || "";
    setQuery(transcript);
    setListening(false);
  });

  return (
    <>
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: "#fff7f8" },
          headerShadowVisible: false,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={{ marginRight: 8 }}>
              <EvilIcons name="chevron-left" size={34} color="#1a1a1a" />
            </Pressable>
          ),
          headerTitle: () => (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#fff",
                borderRadius: 30,
                borderWidth: 1.5,
                borderColor: "#ff5c84",
                height: 40,
                paddingHorizontal: 12,
                gap: 8,
                width: "100%",
              }}
            >
              <Feather name="search" size={15} color="#ff5c84" />
              <TextInput
                ref={inputRef}
                autoFocus
                placeholder="Search styles, brands..."
                placeholderTextColor="#c4a0a8"
                value={query}
                onChangeText={setQuery}
                returnKeyType="search"
                style={{ flex: 1, fontSize: 13, color: "#1a1a1a" }}
              />
              {query.length > 0 && (
                <Pressable onPress={() => setQuery("")}>
                  <Ionicons name="close-circle" size={17} color="#ff5c84" />
                </Pressable>
              )}
              <Pressable onPress={startListening}>
                <MaterialIcons name="mic-none" size={20} color="#ff5c84" />
              </Pressable>
            </View>
          ),
        }}
      />

      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        {loading && (
          <View style={{ padding: 20, alignItems: "center" }}>
            <ActivityIndicator color="#ff5c84" />
          </View>
        )}

        {!loading && query.length >= 2 && results.length === 0 && (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#1a1a1a" }}>
              No results for "{query}"
            </Text>
            <Text style={{ fontSize: 13, color: "#999" }}>
              Try different keywords
            </Text>
          </View>
        )}

        {query.length < 2 && (
          <View style={{ padding: 20, gap: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#1a1a1a" }}>
              Popular Searches
            </Text>
            {[
              "Track Pants",
              "Night Suits",
              "Polo T-shirts",
              "Combos",
              "Winter Wear",
            ].map((s) => (
              <Pressable
                key={s}
                onPress={() => setQuery(s)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  paddingVertical: 10,
                  borderBottomWidth: 0.5,
                  borderBottomColor: "#f5f5f5",
                }}
              >
                <Feather name="trending-up" size={14} color="#ff5c84" />
                <Text style={{ fontSize: 13, color: "#444" }}>{s}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/product/[handle]",
                  params: { handle: item.handle },
                })
              }
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#fff",
                borderRadius: 10,
                borderWidth: 0.5,
                borderColor: "#f0f0f0",
                padding: 10,
                gap: 12,
              }}
            >
              <Image
                source={{ uri: item.images?.[0]?.url }}
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 6,
                  backgroundColor: "#fafafa",
                }}
                resizeMode="cover"
              />
              <View style={{ flex: 1, gap: 4 }}>
                <Text
                  numberOfLines={2}
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: "#1a1a1a",
                    lineHeight: 18,
                  }}
                >
                  {item.title}
                </Text>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "800",
                      color: "#1a1a1a",
                    }}
                  >
                    ₹{item.price}
                  </Text>
                  {item.compareAtPrice && (
                    <Text
                      style={{
                        fontSize: 11,
                        color: "#bbb",
                        textDecorationLine: "line-through",
                      }}
                    >
                      ₹{item.compareAtPrice}
                    </Text>
                  )}
                  {item.discountPercent && (
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        color: "#22a55b",
                      }}
                    >
                      {item.discountPercent}% off
                    </Text>
                  )}
                </View>
              </View>
              <EvilIcons name="chevron-right" size={24} color="#ccc" />
            </Pressable>
          )}
        />
      </View>

      {/* MIC MODAL */}
      <Modal
        visible={listening}
        onRequestClose={() => setListening(false)}
        transparent
        animationType="fade"
      >
        <Pressable
          onPress={() => setListening(false)}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.75)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View style={{ alignItems: "center", justifyContent: "center" }}>
            <Animated.View
              style={{
                position: "absolute",
                width: 160,
                height: 160,
                borderRadius: 999,
                backgroundColor: "rgba(255, 92, 132, 0.3)",
                transform: [{ scale: pulseAnim }],
              }}
            />
            <Animated.View
              style={{
                width: 120,
                height: 120,
                borderRadius: 999,
                backgroundColor: "#ff5c84",
                justifyContent: "center",
                alignItems: "center",
                transform: [{ scale: pulseAnim }],
              }}
            >
              <MaterialIcons name="mic" size={50} color="#fff" />
            </Animated.View>
          </View>
          <Text
            style={{
              color: "#fff",
              fontSize: 18,
              fontWeight: "700",
              marginTop: 28,
            }}
          >
            Listening...
          </Text>
        </Pressable>
      </Modal>
    </>
  );
}
