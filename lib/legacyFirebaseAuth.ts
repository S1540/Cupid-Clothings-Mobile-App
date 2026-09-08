import { getApps, getApp, initializeApp } from "firebase/app";
import * as JSAuth from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Migration-only: preserve the original default app and persistence key.
export function getLegacyAuth() {
  const existing = getApps().length > 0;
  const app = existing ? getApp() : initializeApp({
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  });
  if (existing) return JSAuth.getAuth(app);
  const persistence = JSAuth as typeof JSAuth & {
    getReactNativePersistence: (storage: typeof AsyncStorage) => JSAuth.Persistence;
  };
  return JSAuth.initializeAuth(app, {
    persistence: persistence.getReactNativePersistence(AsyncStorage),
  });
}
