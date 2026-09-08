import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, Text, TextInput, View, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter, type Href } from "expo-router";
import { EmailAuthProvider, PhoneAuthProvider, linkWithCredential, reauthenticateWithCredential, signInWithCredential, signInWithEmailAndPassword, updatePhoneNumber, verifyPhoneNumber } from "@react-native-firebase/auth";
import { auth } from "@/firebaseConfig";
import { bootstrapProfile } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { authErrorCode, authErrorMessage } from "@/lib/authErrors";
import { Analytics } from "@/lib/analytics";
import { applyPhoneCredential, type PhonePurpose } from "@/lib/phoneCredential";
import PhoneOtpForm, { s } from "./PhoneOtpForm";
import ProfileOnboarding from "./ProfileOnboarding";

const destinations = new Set(["/", "/Account", "/Cart", "/Orders", "/EditProfile", "/Wishlist", "/Wallet", "/ReferAndEarn"]);
export default function PhoneAuthScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; returnTo?: string }>();
  const [stage, setStage] = useState<"phone" | "legacy" | "profile" | "finish">(params.mode === "reauth" && !auth.currentUser?.phoneNumber ? "legacy" : "phone");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [linkingUid, setLinkingUid] = useState(auth.currentUser?.uid ?? null);
  const [reauthenticated, setReauthenticated] = useState(false);
  const [initialProfile, setInitialProfile] = useState({ userName: "", email: "" });
  const verification = useRef("");
  const lastPhone = useRef("");
  const generation = useRef(0);
  const active = useRef(true);
  const lock = useRef(false);
  const sending = useRef(false);
  const nextRequestAt = useRef(0);
  const unsubscribe = useRef<(() => void) | undefined>(undefined);
  const mode: PhonePurpose = params.mode === "reauth" ? "reauth" : params.mode === "change" ? "change" : linkingUid ? "link" : "login";
  const modeRef = useRef<PhonePurpose>(mode); modeRef.current = mode;
  const uidRef = useRef(linkingUid); uidRef.current = linkingUid;
  const done = useCallback(() => {
    const target = params.returnTo && destinations.has(params.returnTo) ? params.returnTo : "/";
    router.replace(target as Href);
  }, [params.returnTo, router]);
  const cancelRequest = useCallback(() => {
    generation.current++;
    unsubscribe.current?.();
  }, []);

  const finish = useCallback(async () => {
    if (!active.current) return;
    setStage("finish"); setError("");
    try {
      if (modeRef.current === "reauth") { done(); return; }
      const result = await bootstrapProfile();
      if (!active.current) return;
      if (result.needsOnboarding) {
        setInitialProfile(result.profile ?? { userName: "", email: "" });
        setStage("profile");
      }
      else {
        if (modeRef.current === "login") void Analytics.login("phone");
        done();
      }
    } catch (reason) {
      if (active.current) setError(reason instanceof ApiError ? reason.message : "You're signed in. We couldn't finish loading your profile. Please retry.");
    }
  }, [done]);
  useEffect(() => {
    active.current = true;
    // Resume incomplete onboarding without trying to link an existing phone again.
    if (auth.currentUser?.phoneNumber && !params.mode) void finish();
    return () => { active.current = false; cancelRequest(); };
  }, [cancelRequest, finish, params.mode]);
  async function complete(code: string, requestGeneration = generation.current) {
    if (!active.current || requestGeneration !== generation.current || lock.current) return;
    if (!verification.current) throw { code: "auth/session-expired" };
    lock.current = true; setError("");
    try {
      const credential = PhoneAuthProvider.credential(verification.current, code);
      const user = auth.currentUser;
      const purpose = modeRef.current;
      await applyPhoneCredential({
        purpose: purpose === "change" && !reauthenticated ? "reauth" : purpose,
        credential, expectedUid: uidRef.current, currentUser: () => auth.currentUser,
        signIn: value => signInWithCredential(auth, value),
        link: value => linkWithCredential(user!, value),
        change: value => updatePhoneNumber(user!, value),
        reauthenticate: value => reauthenticateWithCredential(user!, value),
      });
      await auth.currentUser?.getIdToken(true);
      void Analytics.otp("phone_otp_verified", purpose);
      if (purpose === "login") void Analytics.otp("phone_login_success", purpose);
      verification.current = "";
      generation.current++;
      unsubscribe.current?.();
      if (purpose === "change" && !reauthenticated) {
        setReauthenticated(true);
        nextRequestAt.current = 0;
        return;
      }
      await finish();
    } catch (reason) {
      void Analytics.otp("phone_login_failed", modeRef.current, false, authErrorCode(reason));
      throw reason;
    } finally { lock.current = false; }
  }
  async function send(phone: string, resend = false) {
    if (sending.current || lock.current || Date.now() < nextRequestAt.current) throw { code: "auth/too-many-requests" };
    if ((modeRef.current === "reauth" || (modeRef.current === "change" && !reauthenticated)) && phone !== auth.currentUser?.phoneNumber) throw { code: "auth/user-mismatch" };
    sending.current = true;
    nextRequestAt.current = Date.now() + 30000;
    unsubscribe.current?.();
    verification.current = "";
    lastPhone.current = phone;
    const current = ++generation.current;
    setError("");
    try {
      await new Promise<void>((resolve, reject) => {
        let settled = false;
        const settle = (reason?: unknown) => { if (!settled) { settled = true; clearTimeout(timer); if (reason) reject(reason); else resolve(); } };
        const timer = setTimeout(() => {
          if (generation.current === current) { generation.current++; verification.current = ""; }
          settle({ code: "auth/network-request-failed" });
        }, 70000);
        const listener = verifyPhoneNumber(auth, phone, 60, resend);
        unsubscribe.current = () => settle();
        listener.on("state_changed", snapshot => {
          if (!active.current || generation.current !== current) { settle(); return; }
          if (snapshot.verificationId) verification.current = snapshot.verificationId;
          if (snapshot.state === "sent" || snapshot.state === "verified") {
            if (!settled) void Analytics.otp("phone_otp_requested", modeRef.current, resend);
            settle();
          }
          if (snapshot.state === "verified" && snapshot.code) {
            void complete(snapshot.code, current).catch(reason => { if (active.current) setError(authErrorMessage(reason)); });
          }
        }, reason => {
          if (active.current && current === generation.current) setError(authErrorMessage(reason));
          settle(reason);
        });
      });
    } finally { sending.current = false; }
  }
  async function legacyLogin() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try {
      if (auth.currentUser) await reauthenticateWithCredential(auth.currentUser, EmailAuthProvider.credential(email.trim(), password));
      else await signInWithEmailAndPassword(auth, email.trim(), password);
      setLinkingUid(auth.currentUser!.uid);
      if (params.mode === "reauth") { setPassword(""); done(); return; }
      if (auth.currentUser?.phoneNumber) { setPassword(""); await finish(); return; }
      setPassword(""); setStage("phone");
    } catch (reason) { setError(authErrorMessage(reason)); }
    finally { lock.current = false; setBusy(false); }
  }
  if (stage === "profile") return <><Stack.Screen options={{ headerShown: false }} /><ProfileOnboarding initialProfile={initialProfile} onDone={done} /></>;
  if (stage === "finish") return <SafeAreaView style={s.safe}><View style={s.page}><Text style={s.title}>Finishing sign-in</Text><Text style={s.body}>{error || "Loading your Cupid profile…"}</Text>{!!error && <Pressable style={s.button} onPress={() => void finish()}><Text style={s.buttonText}>Retry</Text></Pressable>}</View></SafeAreaView>;
  if (stage === "legacy") return <SafeAreaView style={s.safe}><Stack.Screen options={{ headerShown: false }} /><KeyboardAvoidingView style={s.safe} behavior={Platform.OS === "ios" ? "padding" : "height"}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.page}>
    <Text style={s.title}>Keep your existing account</Text><Text style={s.body}>Sign in with your existing email and password, then verify your phone. Your orders, coins and referral rewards stay on the same account. Email verification isn&apos;t required.</Text>
    <TextInput style={[s.row, { padding: 15 }]} accessibilityLabel="Existing account email" value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" autoCapitalize="none" editable={!busy} />
    <TextInput style={[s.row, { padding: 15, marginTop: 12 }]} accessibilityLabel="Existing account password" value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry autoComplete="current-password" editable={!busy} />
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    <Pressable disabled={busy || !email.trim() || !password} style={s.button} onPress={() => void legacyLogin()}><Text style={s.buttonText}>{busy ? "Signing in…" : "Sign in and link phone"}</Text></Pressable>
    <Pressable style={s.secondary} onPress={() => router.push("/Helpcenter")}><Text style={s.link}>Need help recovering your existing account?</Text></Pressable>
    <Pressable disabled={busy} onPress={() => { setPassword(""); setError(""); setStage("phone"); }}><Text style={s.link}>Back to phone sign-in</Text></Pressable>
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
  return <><Stack.Screen options={{ headerShown: false }} /><PhoneOtpForm key={`${mode}-${reauthenticated}`}
    title={mode === "link" ? "Link your mobile number" : mode === "reauth" ? "Verify it's you" : mode === "change" ? (reauthenticated ? "Verify your new number" : "Verify your current number") : undefined}
    fixedPhone={mode === "reauth" || (mode === "change" && !reauthenticated) ? auth.currentUser?.phoneNumber || undefined : undefined}
    error={error}
    onSendOTP={phone => send(phone)} onVerifyOTP={code => complete(code)} onResendOTP={() => send(lastPhone.current, true)}
    onChangeNumber={() => { generation.current++; unsubscribe.current?.(); verification.current = ""; }}
    onBack={() => router.back()}
    onExistingAccount={!linkingUid ? () => { setError(""); setStage("legacy"); } : undefined}
  /></>;
}
