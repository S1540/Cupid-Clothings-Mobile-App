import { ApiError } from "@/lib/api";
import { authErrorMessage } from "@/lib/authErrors";
import { normalizePhone, resendSeconds } from "@/lib/phone";
import { EvilIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export type PhoneAuthProps = {
  onSendOTP: (phone: string) => Promise<void>;
  onVerifyOTP: (code: string) => Promise<void>;
  onResendOTP: () => Promise<void>;
  onChangeNumber: () => void;
  onBack: () => void;
  onExistingAccount?: () => void;
  fixedPhone?: string;
  error?: string;
  title?: string;
};
export default function PhoneOtpForm(props: PhoneAuthProps) {
  const router = useRouter();
  const [phone, setPhone] = useState(props.fixedPhone || "");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [deadline, setDeadline] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const locked = useRef(false);
  const mounted = useRef(true);
  const input = useRef<TextInput>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    const update = () => setSeconds(resendSeconds(deadline));
    update();
    const timer = setInterval(update, 500);
    const subscription = AppState.addEventListener("change", update);
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [deadline]);
  useEffect(() => {
    if (step !== "otp") return;
    const timer = setTimeout(() => input.current?.focus(), 150);
    return () => clearTimeout(timer);
  }, [step]);
  const run = async (action: () => Promise<void>) => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (reason) {
      if (mounted.current)
        setError(
          reason instanceof ApiError
            ? reason.message
            : authErrorMessage(reason),
        );
    } finally {
      locked.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  const send = () =>
    run(async () => {
      const normalized = normalizePhone(phone);
      if (!normalized) {
        setError("Enter a valid Indian mobile number.");
        return;
      }
      await props.onSendOTP(normalized);
      if (!mounted.current) return;
      setCode("");
      setDeadline(Date.now() + 30000);
      setStep("otp");
    });
  return (
    <SafeAreaView style={s.safe}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        disabled={busy}
        onPress={props.onBack}
        style={s.back}
      >
        <EvilIcons name="chevron-left" size={34} color="#1a1a1a" />
        <Text style={s.backLabel}>Back</Text>
      </Pressable>
      <KeyboardAvoidingView
        style={s.safe}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={s.page}
        >
          <Text style={s.brand}>CUPID CLOTHING</Text>
          <Text style={s.title}>
            {step === "phone"
              ? props.title || "Enter your mobile number"
              : "Verify your number"}
          </Text>
          <Text style={s.body}>
            {step === "phone"
              ? "Sign in to save favourites, shop and track your orders."
              : `Enter the 6-digit code sent to your number ending ${phone.replace(/\D/g, "").slice(-4)}.`}
          </Text>
          {step === "phone" ? (
            <>
              <Text style={s.label}>Mobile number</Text>
              <View style={s.row}>
                <Text
                  accessibilityLabel="India, country code plus ninety one"
                  style={s.country}
                >
                  India +91
                </Text>
                <TextInput
                  accessibilityLabel="Mobile number"
                  editable={!busy && !props.fixedPhone}
                  style={s.phone}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  textContentType="telephoneNumber"
                  autoComplete="tel"
                  placeholder="98765 43210"
                  placeholderTextColor="#9CA3AF"
                  maxLength={18}
                  autoFocus
                />
              </View>
              <Text style={s.small}>
                Phone sign-in is currently available for Indian mobile numbers.
              </Text>
              <Pressable
                accessibilityRole="button"
                disabled={busy || !normalizePhone(phone)}
                onPress={() => void send()}
                style={[s.button, (busy || !normalizePhone(phone)) && s.dim]}
              >
                <Text style={s.buttonText}>
                  {busy ? "Sending code…" : "Continue"}
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <TextInput
                ref={input}
                accessibilityLabel="Six digit verification code"
                style={s.otp}
                value={code}
                editable={!busy}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete={
                  Platform.OS === "android" ? "sms-otp" : "one-time-code"
                }
                maxLength={6}
                onChangeText={(text) =>
                  setCode(text.replace(/\D/g, "").slice(0, 6))
                }
                onSubmitEditing={() => {
                  if (code.length === 6)
                    void run(() => props.onVerifyOTP(code));
                }}
              />
              <Pressable
                accessibilityRole="button"
                disabled={busy || code.length !== 6}
                style={[s.button, (busy || code.length !== 6) && s.dim]}
                onPress={() => void run(() => props.onVerifyOTP(code))}
              >
                <Text style={s.buttonText}>
                  {busy ? "Verifying…" : "Verify number"}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={busy || seconds > 0}
                style={s.secondary}
                onPress={() =>
                  void run(async () => {
                    await props.onResendOTP();
                    if (mounted.current) {
                      setCode("");
                      setDeadline(Date.now() + 30000);
                      input.current?.focus();
                    }
                  })
                }
              >
                <Text style={s.link}>
                  {seconds > 0 ? `Resend OTP in ${seconds}s` : "Resend OTP"}
                </Text>
              </Pressable>
              {!props.fixedPhone && (
                <Pressable
                  accessibilityRole="button"
                  disabled={busy}
                  style={s.secondary}
                  onPress={() => {
                    props.onChangeNumber();
                    setCode("");
                    setError("");
                    setStep("phone");
                  }}
                >
                  <Text style={s.link}>Change number</Text>
                </Pressable>
              )}
            </>
          )}
          {busy && (
            <ActivityIndicator color="#F87387" style={{ marginTop: 12 }} />
          )}
          {!!(error || props.error) && (
            <Text
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
              style={s.error}
            >
              {error || props.error}
            </Text>
          )}
          <Text style={s.small}>
            By continuing, you agree to receive an SMS for verification. Google
            processes your number to help prevent abuse.
          </Text>
          <View style={s.links}>
            <Pressable onPress={() => router.push("/TermsAndConditions")}>
              <Text style={s.link}>Terms</Text>
            </Pressable>
            <Pressable onPress={() => router.push("/PrivacyPolicy")}>
              <Text style={s.link}>Privacy policy</Text>
            </Pressable>
            <Pressable onPress={() => router.push("/Helpcenter")}>
              <Text style={s.link}>Get help</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFF7F8" },
  page: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    paddingBottom: 36,
  },
  back: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
  },
  backLabel: { marginLeft: -4 },
  brand: {
    color: "#F87387",
    fontWeight: "800",
    letterSpacing: 1.4,
    marginVertical: 16,
  },
  title: { color: "#1A1A1A", fontSize: 28, fontWeight: "800" },
  body: { color: "#666", fontSize: 15, lineHeight: 22, marginVertical: 18 },
  label: { fontWeight: "600", marginBottom: 8 },
  row: {
    flexDirection: "row",
    borderColor: "#EDDDE0",
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: "white",
    alignItems: "center",
  },
  country: { padding: 12, fontWeight: "600" },
  phone: { flex: 1, paddingVertical: 18, fontSize: 17 },
  otp: {
    backgroundColor: "white",
    borderColor: "#EDDDE0",
    borderWidth: 1,
    borderRadius: 12,
    padding: 18,
    fontSize: 28,
    letterSpacing: 10,
    textAlign: "center",
  },
  button: {
    padding: 18,
    backgroundColor: "#F87387",
    borderRadius: 12,
    alignItems: "center",
    marginTop: 18,
  },
  buttonText: { color: "white", fontWeight: "800", fontSize: 16 },
  dim: { opacity: 0.5 },
  secondary: { paddingVertical: 16 },
  link: { color: "#A82D49", fontWeight: "600" },
  small: { fontSize: 12, lineHeight: 18, color: "#777", marginTop: 10 },
  error: { color: "#B5213F", marginVertical: 14, lineHeight: 21 },
  links: { flexDirection: "row", gap: 20, marginTop: 20 },
});
