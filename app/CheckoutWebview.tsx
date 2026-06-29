import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { View, Pressable, Text, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { Feather } from "@expo/vector-icons";
import { useState } from "react";

export default function CheckoutWebview() {
  const { url } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const handleNavigation = (currentUrl: string) => {
    console.log("WEBVIEW URL:", currentUrl);

    // Shopify Order Success
    if (
      currentUrl.includes("/thank_you") ||
      currentUrl.includes("/thank-you") ||
      currentUrl.includes("/orders/")
    ) {
      console.log("ORDER SUCCESS");

      router.dismissAll();
      router.replace("/");

      return;
    }

    // Continue Shopping Redirect
    if (
      currentUrl === "https://cupidclothings.com/" ||
      currentUrl === "https://cupidclothings.com"
    ) {
      console.log("CONTINUE SHOPPING");

      router.dismissAll();
      router.replace("/");

      return;
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        {/* Header */}
        <View
          style={{
            height: 90,
            paddingTop: 45,
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#fff7f8",
            borderBottomWidth: 0.5,
            borderBottomColor: "#eee",
          }}
        >
          <Pressable onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color="#222" />
          </Pressable>

          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: "#222",
            }}
          >
            Secure Checkout
          </Text>

          <View style={{ width: 22 }} />
        </View>

        {/* Loader */}
        {loading && (
          <View
            style={{
              position: "absolute",
              top: 90,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: "center",
              alignItems: "center",
              zIndex: 999,
              backgroundColor: "#fff",
            }}
          >
            <ActivityIndicator size="large" color="#F87387" />

            <Text
              style={{
                marginTop: 12,
                color: "#666",
                fontSize: 13,
                fontWeight: "500",
              }}
            >
              Preparing Secure Checkout...
            </Text>
          </View>
        )}

        {/* WebView */}
        <WebView
          source={{ uri: String(url) }}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState={false}
          onLoadEnd={() => setLoading(false)}
          onNavigationStateChange={(navState) => {
            handleNavigation(navState.url);
          }}
        />
      </View>
    </>
  );
}
