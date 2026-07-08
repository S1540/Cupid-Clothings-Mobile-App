import BottomBar from "@/components/BottomBar";
import { auth, db } from "@/firebaseConfig";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import "../global.css";
import { useUserStore } from "../store/userStore";
import "./constants/mapbox";
SplashScreen.preventAutoHideAsync().catch(() => {});
export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const [isAppReady, setIsAppReady] = useState(false);
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const setUser = useUserStore((state) => state.setUser);
  const clearUser = useUserStore((state) => state.clearUser);

  const hideBottomBar =
    pathname.startsWith("/product/") ||
    // pathname === "/Cart" ||
    pathname === "/CheckoutWebview" ||
    pathname === "/Addresses" ||
    pathname === "/Add-Address" ||
    pathname === "/Select-Location" ||
    pathname === "/Search" ||
    // pathname === "/Orders" ||
    pathname === "/Order-Details" ||
    pathname === "/Wishlist";
  useEffect(() => {
    let unsubscribeUser: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      // Remove previous listener
      if (unsubscribeUser) {
        unsubscribeUser();
      }

      if (!firebaseUser) {
        clearUser();
        return;
      }

      const userRef = doc(db, "users", firebaseUser.uid);

      unsubscribeUser = onSnapshot(
        userRef,
        (snapshot) => {
          if (!snapshot.exists()) {
            clearUser();
            return;
          }

          setUser({
            uid: firebaseUser.uid,
            ...(snapshot.data() as any),
          });
        },
        (error) => {
          console.error("User Snapshot Error:", error);
        },
      );
    });

    return () => {
      unsubscribeAuth();

      if (unsubscribeUser) {
        unsubscribeUser();
      }
    };
  }, []);

  useEffect(() => {
    async function prepare() {
      try {
        // Premium splash ke liye 2 sec wait
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } finally {
        setIsAppReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!isAppReady) {
    return null;
  }
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />
        </Stack>

        {!hideBottomBar && <BottomBar />}

        <StatusBar style="dark" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
