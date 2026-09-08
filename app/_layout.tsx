import BottomBar from "@/components/BottomBar";
import CustomSplash from "@/components/ui/CustomSplash";
import { db } from "@/firebaseConfig";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Analytics } from "@/lib/analytics";
import { loadCart } from "@/lib/cart";
import { useCartStore } from "@/store/cartStore";
import { getAuth, onAuthStateChanged } from "@react-native-firebase/auth";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { doc, onSnapshot } from "@react-native-firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LogLevel, OneSignal } from "react-native-onesignal";
import "react-native-reanimated";
import "../global.css";
import { useUserStore } from "../store/userStore";
import { useAuthStore } from "@/store/authStore";
import { useOrderStore } from "@/store/orderStore";
import { useWishlistStore } from "@/store/wishliststore";
import { recoverLegacySession, signOutAllSessions, bootstrapProfile } from "@/lib/auth";
import { useOrderSubscription } from "@/hooks/useOrderSubscription";
import { setSessionScope } from "@/lib/sessionScope";
import { View, Text, Pressable } from "react-native";
import SessionNotice from "@/components/auth/SessionNotice";
import "./constants/mapbox";

// for splash screen
SplashScreen.preventAutoHideAsync().catch(() => {});
export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const [isAppReady, setIsAppReady] = useState(false);
  const oneSignalInitialized = useRef(false);
  const pendingOneSignalTags = useRef<{
    uid: string;
    tags: Record<string, string>;
  } | null>(null);
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const setUser = useUserStore((state) => state.setUser);
  const clearUser = useUserStore((state) => state.clearUser);
  const setCartItems = useCartStore((state) => state.setCartItems);
  const session = useAuthStore(state => state.user);
  const sessionError = useAuthStore(state => state.error);
  const sessionReady = useAuthStore(state => state.ready);
  const [recoveryAttempt, setRecoveryAttempt] = useState(0);
  useOrderSubscription(session?.uid ?? null);

  const flushOneSignalTags = useCallback(async () => {
    const pending = pendingOneSignalTags.current;
    if (!pending) return;

    const externalId = await OneSignal.User.getExternalId();
    if (pendingOneSignalTags.current !== pending || getAuth().currentUser?.uid !== pending.uid) return;
    if (externalId !== pending.uid) {
      console.info("OneSignal tags are waiting for the identified user.");
      return;
    }

    OneSignal.User.addTags(pending.tags);
    pendingOneSignalTags.current = null;

  }, []);

  const syncOneSignalProfile = useCallback(
    (uid: string, userData: Record<string, unknown>) => {
      const tagValues = {
        gender: userData.gender,
        city: userData.city,
        category: userData.preferredCategory,
        language: userData.language,
        phone: userData.phone ?? userData.number,
      };
      const tags = Object.fromEntries(
        Object.entries(tagValues)
          .filter(([, value]) => value !== null && value !== undefined)
          .map(([key, value]) => [key, String(value).trim()])
          .filter(([, value]) => value.length > 0),
      );

      pendingOneSignalTags.current = { uid, tags };
      if (!oneSignalInitialized.current) return;

      OneSignal.login(uid);
      void flushOneSignalTags();
    },
    [flushOneSignalTags],
  );

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
  // Start Analytics
  useEffect(() => {
    Analytics.appOpen();
  }, []);

  // For OneSignal Notifications Initialization
  useEffect(() => {
    OneSignal.Debug.setLogLevel(LogLevel.None);
    OneSignal.initialize(process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID!);
    oneSignalInitialized.current = true;
    const onUserChange = () => {
      void flushOneSignalTags();
    };
    OneSignal.User.addEventListener("change", onUserChange);
    OneSignal.Notifications.requestPermission(true);

    return () => {
      OneSignal.User.removeEventListener("change", onUserChange);
    };
  }, [flushOneSignalTags]);

  // Recover the original SDK session before opening any private listeners.
  useEffect(() => {
    let alive = true;
    let generation = 0;
    let unsubscribeUser: (() => void) | undefined;
    let unsubscribeAuth: (() => void) | undefined;
    useAuthStore.setState({ ready: false, error: null, user: null });
    void recoverLegacySession().then(() => {
      if (!alive) return;
      unsubscribeAuth = onAuthStateChanged(getAuth(), firebaseUser => {
        const current = ++generation;
        setSessionScope(firebaseUser?.uid ?? null);
        unsubscribeUser?.();
        clearUser();
        setCartItems([]);
        useWishlistStore.getState().clear();
        if (useOrderStore.getState().ownerUid !== (firebaseUser?.uid ?? null)) useOrderStore.getState().startSession(firebaseUser?.uid ?? null);
        pendingOneSignalTags.current = null;
        OneSignal.logout();
        useAuthStore.getState().setSession(firebaseUser);
        void loadCart(firebaseUser).then(items => {
          if (alive && current === generation) setCartItems(items);
        }).catch(() => {});
        if (!firebaseUser) return;
        unsubscribeUser = onSnapshot(doc(db, "users", firebaseUser.uid), snapshot => {
          if (!alive || current !== generation) return;
          if (!snapshot.exists()) { clearUser(); return; }
          const data = snapshot.data()!;
          useAuthStore.getState().setError(null);
          setUser({ ...(data as any), uid: firebaseUser.uid });
          syncOneSignalProfile(firebaseUser.uid, data);
        }, () => {
          if (alive && current === generation) useAuthStore.getState().setError("We couldn't load your profile. Check your connection and retry.");
        });
        void bootstrapProfile().catch(() => {
          if (alive && current === generation) useAuthStore.getState().setError("We couldn't finish loading your profile. Your account is still signed in. Please retry.");
        });
      });
    }).catch(() => {
      if (alive) useAuthStore.getState().setError("Your saved account couldn't be restored safely. Retry, or sign out of saved sessions and sign in again. No account data has been moved.");
    });
    return () => {
      alive = false;
      generation++;
      unsubscribeAuth?.();
      unsubscribeUser?.();
    };
  }, [clearUser, setUser, setCartItems, syncOneSignalProfile, recoveryAttempt]);

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
        {sessionReady ? <><SessionNotice onRetry={() => setRecoveryAttempt(value => value + 1)} /><Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack></> : <View style={{ flex: 1, justifyContent: "center", padding: 28, backgroundColor: "#fff7f8" }}>
          <Text accessibilityRole="alert">{sessionError || "Restoring your Cupid account…"}</Text>
          {sessionError && <>
            <Pressable onPress={() => setRecoveryAttempt(value => value + 1)} style={{ paddingVertical: 20 }}><Text>Retry</Text></Pressable>
            <Pressable onPress={() => { void signOutAllSessions().then(() => setRecoveryAttempt(value => value + 1)).catch(() => useAuthStore.getState().setError("Couldn't sign out. Please retry.")); }}><Text>Sign out of saved sessions</Text></Pressable>
          </>}
        </View>}

        {sessionReady && !hideBottomBar && !pathname.startsWith("/PhoneAuth") && !pathname.startsWith("/order-details/") && <BottomBar />}

        <StatusBar style="dark" />
      </ThemeProvider>

      {isAppReady === false && (
        <CustomSplash onFinish={() => setIsAppReady(true)} />
      )}
    </GestureHandlerRootView>
  );
}
