import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import * as SplashScreen from "expo-splash-screen";
import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useEffect, useState } from "react";
import "./constants/mapbox";
import "../global.css";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { auth, db } from "@/firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useUserStore } from "../store/userStore";
import { OneSignal, LogLevel } from "react-native-onesignal";
import BottomBar from "@/components/BottomBar";
import CustomSplash from "@/components/ui/CustomSplash";

// for splash screen
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
    pathname === "/Cart" ||
    pathname === "/CheckoutWebview" ||
    pathname === "/Addresses" ||
    pathname === "/Add-Address" ||
    pathname === "/Select-Location" ||
    pathname === "/Search" ||
    pathname === "/Orders" ||
    pathname === "/Order-Details" ||
    pathname === "/Wishlist";

  // For OneSignal Notifications Initialization
  useEffect(() => {
    OneSignal.Debug.setLogLevel(LogLevel.Verbose);
    OneSignal.initialize(process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID!);
    OneSignal.Notifications.requestPermission(true);
  }, []);

  // Auth Listner
  useEffect(() => {
    let unsubscribeUser: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (unsubscribeUser) {
        unsubscribeUser();
      }
      if (!firebaseUser) {
        OneSignal.logout();
        clearUser();
        return;
      }

      OneSignal.login(firebaseUser.uid);
      const userRef = doc(db, "users", firebaseUser.uid);
      unsubscribeUser = onSnapshot(userRef, async (snapshot) => {
        if (!snapshot.exists()) {
          OneSignal.logout();
          clearUser();
          return;
        }

        setUser({
          uid: firebaseUser.uid,
          ...(snapshot.data() as any),
        });
        const userData = snapshot.data();

        OneSignal.User.addTag("gender", userData.gender);
        OneSignal.User.addTag("city", userData.city);
        OneSignal.User.addTag("category", userData.preferredCategory);
        OneSignal.User.addTag("language", userData.language);
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) {
        unsubscribeUser();
      }
    };
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const frame = requestAnimationFrame(() => {
      SplashScreen.hideAsync().catch(() => {});
    });

    timer = setTimeout(() => {
      cancelAnimationFrame(frame);
    }, 3000);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>

        {!hideBottomBar && <BottomBar />}

        <StatusBar style="dark" />
      </ThemeProvider>

      {isAppReady === false && (
        <CustomSplash onFinish={() => setIsAppReady(true)} />
      )}
    </GestureHandlerRootView>
  );
}
