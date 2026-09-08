import { Pressable, Text, View } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { useUserStore } from "@/store/userStore";
export default function SessionNotice({ onRetry }: { onRetry: () => void }) {
  const user = useAuthStore(state => state.user);
  const error = useAuthStore(state => state.error);
  const profile = useUserStore(state => state.user);
  const pathname = usePathname();
  const router = useRouter();
  if (!user || pathname === "/PhoneAuth") return null;
  const incomplete = !profile || profile.onboardingState === "pending";
  if (!error && !incomplete && user.phoneNumber) return null;
  return <View style={{ padding: 12, backgroundColor: "#FFF7F8" }}>
    <Text accessibilityRole={error ? "alert" : undefined}>{error || (user.phoneNumber ? "Finish setting up your Cupid profile." : "Link your mobile number to keep using this account with OTP.")}</Text>
    <Pressable accessibilityRole="button" style={{ paddingVertical: 10 }} onPress={error ? onRetry : () => router.push({ pathname: "/PhoneAuth", params: { returnTo: pathname } })}>
      <Text style={{ color: "#A82D49", fontWeight: "600" }}>{error ? "Retry" : "Continue setup"}</Text>
    </Pressable>
  </View>;
}
