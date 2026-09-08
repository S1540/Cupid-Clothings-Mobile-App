import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiRequest, ApiError } from "@/lib/api";
import { Analytics } from "@/lib/analytics";
import { s } from "./PhoneOtpForm";
export default function ProfileOnboarding({ onDone, initialProfile }: { onDone: () => void; initialProfile: { userName: string; email: string } }) {
  const [userName, setName] = useState(initialProfile.userName);
  const [email, setEmail] = useState(initialProfile.email);
  const [referralCode, setReferral] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  async function save() {
    if (lock.current) return;
    if (!userName.trim()) { setError("Please add your name."); return; }
    lock.current = true; setBusy(true); setError("");
    try {
      const result = await apiRequest<{ emailAdded: boolean; completedSignup: boolean }>("/api/users/me/onboarding", { method: "POST", body: JSON.stringify({ profile: { userName, email }, referralCode: referralCode.trim() }) });
      if (result.emailAdded) void Analytics.emailAdded();
      if (result.completedSignup) void Analytics.signUp("phone");
      onDone();
    } catch (reason) { setError(reason instanceof ApiError ? reason.message : "Couldn't save your profile. Please retry."); }
    finally { lock.current = false; setBusy(false); }
  }
  return <SafeAreaView style={s.safe}><KeyboardAvoidingView style={s.safe} behavior={Platform.OS === "ios" ? "padding" : "height"}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.page}>
    <Text style={s.brand}>WELCOME TO CUPID</Text><Text style={s.title}>Make yourself at home</Text>
    <Text style={s.body}>Your phone is verified. Add a name to finish setting up your account.</Text>
    <TextInput accessibilityLabel="Your name" style={s.row} value={userName} onChangeText={setName} placeholder="Your name" maxLength={100} editable={!busy} autoComplete="name" />
    <TextInput accessibilityLabel="Contact email, optional" style={[s.row, { marginTop: 16, padding: 14 }]} value={email} onChangeText={setEmail} placeholder="Email (optional)" keyboardType="email-address" autoCapitalize="none" maxLength={254} editable={!busy} />
    <Text style={s.small}>Useful for receipts and help finding previous orders. No email verification is needed to sign in.</Text>
    <TextInput accessibilityLabel="Referral code, optional" style={[s.row, { marginTop: 16, padding: 14 }]} value={referralCode} onChangeText={setReferral} placeholder="Referral code (optional)" autoCapitalize="characters" maxLength={20} editable={!busy} />
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    <Pressable disabled={busy} onPress={() => void save()} style={s.button}><Text style={s.buttonText}>{busy ? "Saving…" : "Start shopping"}</Text></Pressable>
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
