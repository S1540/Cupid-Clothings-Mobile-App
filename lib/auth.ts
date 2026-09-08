import { auth } from "@/firebaseConfig";
import { signInWithCustomToken, signOut } from "@react-native-firebase/auth";
import { signOut as legacySignOut } from "firebase/auth";
import { getLegacyAuth } from "./legacyFirebaseAuth";
import { apiRequest } from "./api";

export async function recoverLegacySession() {
  await auth.authStateReady();
  const legacy = getLegacyAuth();
  await legacy.authStateReady();
  const original = legacy.currentUser;
  if (!original) return;
  if (auth.currentUser && auth.currentUser.uid !== original.uid) {
    throw new Error("Two different saved accounts were found. Sign out of saved accounts, then sign in to the account you want to use. No data has been moved.");
  }
  if (!auth.currentUser) {
    const result = await apiRequest<{ token: string }>("/api/users/session/native", { method: "POST" }, await original.getIdToken());
    const credential = await signInWithCustomToken(auth, result.token);
    if (credential.user.uid !== original.uid) {
      await signOut(auth);
      throw new Error("Saved account recovery could not be completed safely.");
    }
  }
  await legacySignOut(legacy);
}
export async function signOutAllSessions() {
  await legacySignOut(getLegacyAuth());
  await signOut(auth);
}
export type BootstrapResult = { needsOnboarding: boolean; created: boolean; profile?: { userName: string; email: string } };
export function bootstrapProfile() {
  return apiRequest<BootstrapResult>("/api/users/me/bootstrap", { method: "POST" });
}
