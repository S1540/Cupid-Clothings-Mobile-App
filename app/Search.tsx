import { rankSearchProducts } from "@/backend/lib/searchRelevance";
import { FilterIce } from "@/components/catalog/iceTheme";
import { useSearchPlaceholder } from "@/hooks/useSearchPlaceholder";
import { buildSearchSuggestions } from "@/lib/searchSuggestions";
import {
  EvilIcons,
  Feather,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
import { Audio } from "expo-av";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Keyboard,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Product = {
  id: string;
  title: string;
  handle: string;
  images: { url: string; alt: string }[];
  price: string;
  compareAtPrice: string | null;
  discountPercent: number | null;
  productType?: string;
};

export default function SearchPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ q?: string }>();
  const micStarting = useRef(false);
  const inputRef = useRef<TextInput>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const requestIdRef = useRef(0);

  const [query, setQuery] = useState(params.q ?? "");
  const searchPlaceholder = useSearchPlaceholder(query.length === 0);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [listening, setListening] = useState(false);

  // Pulse animation
  useEffect(() => {
    if (listening) {
      const animation = Animated.loop(
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
      );
      animation.start();
      return () => animation.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [listening, pulseAnim]);

  // Search debounce
  useEffect(() => {
    const requestId = ++requestIdRef.current;
    setResults([]);
    if (query.trim().length < 2) {
      setLoading(false);
      setResults([]);
      setSearchError("");
      return;
    }
    setLoading(true);
    setSearchError("");
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setSearchError("");
        const res = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/products/search?q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal },
        );
        const responseText = await res.text();
        let data: Product[] | { error?: string };
        try {
          data = JSON.parse(responseText);
        } catch {
          throw new Error("Search service returned an invalid response.");
        }
        if (requestId !== requestIdRef.current) return;
        if (!res.ok || !Array.isArray(data)) {
          throw new Error(
            (data as { error?: string }).error ||
              "Search is temporarily unavailable.",
          );
        }
        setResults(rankSearchProducts(data, query));
      } catch (e) {
        if (controller.signal.aborted || requestId !== requestIdRef.current)
          return;
        setResults([]);
        setSearchError(
          e instanceof Error ? e.message : "Search is temporarily unavailable.",
        );
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
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
    if (micStarting.current || listening) return;
    micStarting.current = true;
    Keyboard.dismiss();
    try {
      const result =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!result.granted) {
        setListening(false);
        setSearchError("Allow microphone access to use voice search.");
        return;
      }
      setListening(true);
      setSearchError("");
      void playMicSound().catch(() => {});
      ExpoSpeechRecognitionModule.start({
        lang: "en-IN",
        interimResults: true,
        continuous: false,
      });
    } catch {
      setSearchError("Could not start voice search. Please try again.");
      setListening(false);
    } finally {
      micStarting.current = false;
    }
  };

  useSpeechRecognitionEvent("result", (event) => {
    const transcript = event.results[0]?.transcript || "";
    setQuery(transcript);
    if (event.isFinal) {
      setListening(false);
      ExpoSpeechRecognitionModule.stop();
    }
  });
  useSpeechRecognitionEvent("end", () => setListening(false));
  useSpeechRecognitionEvent("error", (event) => {
    setListening(false);
    if (event.error !== "aborted")
      setSearchError("Couldn't hear that. Try again or type your search.");
  });
  useEffect(() => () => ExpoSpeechRecognitionModule.abort(), []);
  const stopListening = () => {
    ExpoSpeechRecognitionModule.abort();
    setListening(false);
  };
  const openResults = (value: string) => {
    const term = value.trim();
    if (term.length < 2) return;
    stopListening();
    Keyboard.dismiss();
    router.push({ pathname: "/SearchResults", params: { q: term } });
  };
  const suggestions = buildSearchSuggestions(results, query);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View
        style={{
          paddingTop: insets.top,
          paddingLeft: Math.max(insets.left, 12),
          paddingRight: Math.max(insets.right, 12),
          paddingBottom: 8,
          backgroundColor: FilterIce.header,
        }}
      >
        <View
          style={{
            minHeight: 60,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 48,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <EvilIcons name="chevron-left" size={34} color="#1a1a1a" />
          </Pressable>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#fff",
              borderRadius: 30,
              borderWidth: 1,
              borderColor: FilterIce.border,
              height: 52,
              paddingLeft: 12,
              paddingRight: 4,
              gap: 4,
              flex: 1,
            }}
          >
            <Feather name="search" size={22} color="#ff5c84" />
            <TextInput
              ref={inputRef}
              autoFocus
              placeholder={searchPlaceholder}
              accessibilityLabel="Search products"
              placeholderTextColor="#c4a0a8"
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              onSubmitEditing={() => openResults(query)}
              style={{ flex: 1, fontSize: 13, color: "#1a1a1a" }}
            />
            {query.length > 0 && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                onPress={() => setQuery("")}
                style={{
                  width: 36,
                  height: 48,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="close-circle" size={17} color="#ff5c84" />
              </Pressable>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Search by voice"
              hitSlop={{ top: 8, bottom: 8, right: 8, left: 0 }}
              pressRetentionOffset={20}
              onPress={startListening}
              style={{
                width: 38,
                height: 38,
                borderRadius: 24,
                backgroundColor: FilterIce.frost,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialIcons name="mic-none" size={24} color="#ff5c84" />
            </Pressable>
          </View>
        </View>
      </View>

      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        {loading && (
          <View style={{ padding: 20, alignItems: "center" }}>
            <ActivityIndicator color="#ff5c84" />
          </View>
        )}

        {!loading && searchError && (
          <View style={{ padding: 24, alignItems: "center", gap: 8 }}>
            <Feather name="wifi-off" size={28} color="#ff5c84" />
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: "#1a1a1a",
                textAlign: "center",
              }}
            >
              {searchError}
            </Text>
          </View>
        )}

        {!loading &&
          !searchError &&
          query.length >= 2 &&
          results.length === 0 && (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Image
                style={{ width: 80, height: 80, marginBottom: 8 }}
                source={require("../assets/icons/no-results.png")}
              />

              <Text
                style={{ fontSize: 16, fontWeight: "700", color: "#1a1a1a" }}
              >
                {`No results for "${query}"`}
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
                onPress={() => openResults(s)}
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
          data={query.trim().length >= 2 ? suggestions : []}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          ListHeaderComponent={
            query.trim().length >= 2 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`See all results for ${query}`}
                onPress={() => openResults(query)}
                style={{
                  minHeight: 64,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: FilterIce.border,
                }}
              >
                <Feather name="search" size={20} color={FilterIce.accent} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: "#1c1c1c",
                    }}
                  >
                    {query.trim()}
                  </Text>
                  <Text style={{ fontSize: 12, color: "#666" }}>
                    View all matching styles
                  </Text>
                </View>
                <Feather
                  name="arrow-right"
                  size={18}
                  color={FilterIce.accent}
                />
              </Pressable>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Search ${item.label}`}
              onPress={() => openResults(item.query)}
              style={{
                minHeight: 76,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                borderBottomWidth: 0.5,
                borderBottomColor: FilterIce.border,
              }}
            >
              {item.image ? (
                <Image
                  source={{ uri: item.image }}
                  style={{
                    width: 44,
                    height: 52,
                    borderRadius: 8,
                    backgroundColor: FilterIce.frost,
                  }}
                />
              ) : (
                <Feather name="search" size={20} color={FilterIce.accent} />
              )}
              <View style={{ flex: 1, gap: 4 }}>
                <Text
                  numberOfLines={2}
                  style={{ fontSize: 14, fontWeight: "600", color: "#1c1c1c" }}
                >
                  {item.label}
                </Text>
                <Text style={{ fontSize: 12, color: "#666" }}>
                  Explore related styles
                </Text>
              </View>
              <Feather
                name="arrow-up-left"
                size={18}
                color={FilterIce.accent}
              />
            </Pressable>
          )}
        />
      </View>

      {/* MIC MODAL */}
      <Modal
        visible={listening}
        onRequestClose={stopListening}
        transparent
        animationType="fade"
      >
        <Pressable
          onPress={stopListening}
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
