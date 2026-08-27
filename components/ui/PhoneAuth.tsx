import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const OTP_LENGTH = 6;
const PINK = "#F87387";
const INK = "#1A1A1A";

export type PhoneAuthProps = {
  onSendOTP?: (phone: string) => Promise<void>;
  onVerifyOTP?: (otp: string) => Promise<void>;
  onResendOTP?: () => Promise<void>;
  onGoogleSignIn?: () => Promise<void>;
  onSuccess?: () => void;
  onBack?: () => void;
};

export default function PhoneAuth({
  onSendOTP,
  onVerifyOTP,
  onResendOTP,
  onGoogleSignIn,
  onSuccess,
  onBack,
}: PhoneAuthProps) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(30);
  const [success, setSuccess] = useState(false);
  const inputs = useRef(
    Array.from({ length: OTP_LENGTH }, () => React.createRef<TextInput>()),
  );
  const successScale = useSharedValue(0);
  const validPhone = /^[6-9]\d{9}$/.test(phone);
  const otp = digits.join("");
  const successStyle = useAnimatedStyle(() => ({
    opacity: successScale.value,
    transform: [{ scale: successScale.value }],
  }));

  useEffect(() => {
    if (step !== "otp" || seconds === 0 || success) return;
    const timer = setTimeout(() => setSeconds((current) => current - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds, step, success]);

  const submitPhone = async () => {
    if (!validPhone || loading) return;
    setLoading(true);
    setError("");
    try {
      await onSendOTP?.(`+91${phone}`);
      setDigits(Array(OTP_LENGTH).fill(""));
      setSeconds(30);
      setStep("otp");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "OTP could not be sent. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const verify = async (code = otp) => {
    if (code.length !== OTP_LENGTH || loading || success) return;
    setLoading(true);
    setError("");
    try {
      await onVerifyOTP?.(code);
      setSuccess(true);
      successScale.value = withSequence(
        withTiming(0.72, { duration: 200 }),
        withSpring(1),
      );
      setTimeout(() => onSuccess?.(), 1050);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Incorrect OTP. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const changeDigit = (index: number, value: string) => {
    const pasted = value.replace(/\D/g, "").slice(0, OTP_LENGTH);
    const next = [...digits];
    if (!pasted) next[index] = "";
    else
      pasted.split("").forEach((digit, offset) => {
        if (index + offset < OTP_LENGTH) next[index + offset] = digit;
      });
    setDigits(next);
    const code = next.join("");
    if (code.length === OTP_LENGTH) {
      inputs.current[OTP_LENGTH - 1].current?.blur();
      void verify(code);
    } else
      inputs.current[
        Math.min(index + pasted.length, OTP_LENGTH - 1)
      ].current?.focus();
  };

  const google = async () => {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      await onGoogleSignIn?.();
      onSuccess?.();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Google sign-in could not be completed.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={s.safe}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={s.page}>
          <Pressable
            style={s.back}
            onPress={step === "otp" ? () => setStep("phone") : onBack}
          >
            <Ionicons name="chevron-back" size={25} color={INK} />
          </Pressable>
          <View style={s.logo}>
            <Text style={s.logoText}>C</Text>
          </View>
          <Text style={s.kicker}>CUPID CLOTHINGS</Text>
          <Text style={s.title}>
            {step === "phone" ? "Welcome to Cupid" : "Verify your number"}
          </Text>
          <Text style={s.subtitle}>
            {step === "phone"
              ? "Sign in to save favourites, track orders and get exclusive offers."
              : `We sent a 6-digit code to +91 ${phone}.`}
          </Text>
          {step === "phone" ? (
            <Animated.View entering={FadeIn.duration(220)}>
              <Text style={s.label}>Mobile number</Text>
              <View style={s.phoneRow}>
                <Text style={s.code}>+91</Text>
                <View style={s.divider} />
                <TextInput
                  value={phone}
                  onChangeText={(value) =>
                    setPhone(value.replace(/\D/g, "").slice(0, 10))
                  }
                  keyboardType="phone-pad"
                  maxLength={10}
                  placeholder="98765 43210"
                  placeholderTextColor="#B5B5B5"
                  style={s.phoneInput}
                />
              </View>
              <Pressable
                disabled={!validPhone || loading}
                onPress={() => void submitPhone()}
                style={[s.primary, (!validPhone || loading) && s.dim]}
              >
                <Text style={s.primaryText}>
                  {loading ? "Sending OTP..." : "Continue with phone"}
                </Text>
              </Pressable>
              <View style={s.or}>
                <View style={s.line} />
                <Text style={s.orText}>OR</Text>
                <View style={s.line} />
              </View>
              <Pressable
                disabled={loading}
                onPress={() => void google()}
                style={s.google}
              >
                <Text style={s.g}>G</Text>
                <Text style={s.googleText}>
                  {loading ? "Please wait..." : "Continue with Google"}
                </Text>
              </Pressable>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeIn.duration(220)}>
              <View style={s.otpArea}>
                {!success ? (
                  <View style={s.otpRow}>
                    {digits.map((digit, index) => (
                      <Animated.View
                        key={index}
                        layout={LinearTransition.springify()}
                        style={s.box}
                      >
                        <TextInput
                          ref={inputs.current[index]}
                          value={digit}
                          editable={!loading}
                          keyboardType="number-pad"
                          maxLength={OTP_LENGTH}
                          selectTextOnFocus
                          style={s.boxInput}
                          onChangeText={(value) => changeDigit(index, value)}
                          onKeyPress={({ nativeEvent }) => {
                            if (
                              nativeEvent.key === "Backspace" &&
                              !digits[index] &&
                              index > 0
                            )
                              inputs.current[index - 1].current?.focus();
                          }}
                        />
                      </Animated.View>
                    ))}
                  </View>
                ) : (
                  <Animated.View style={[s.check, successStyle]}>
                    <Ionicons name="checkmark" color="#fff" size={42} />
                  </Animated.View>
                )}
              </View>
              <Text style={s.hint}>
                {success
                  ? "Number verified successfully"
                  : "On verification, all six boxes merge into a success tick."}
              </Text>
              <Pressable
                disabled={otp.length !== OTP_LENGTH || loading}
                onPress={() => void verify()}
                style={[
                  s.primary,
                  (otp.length !== OTP_LENGTH || loading) && s.dim,
                ]}
              >
                <Text style={s.primaryText}>
                  {loading ? "Verifying..." : "Verify OTP"}
                </Text>
              </Pressable>
              <View style={s.resend}>
                <Text style={s.muted}>Didn&apos;t receive the code? </Text>
                <Pressable
                  disabled={seconds > 0 || loading}
                  onPress={async () => {
                    setLoading(true);
                    try {
                      await onResendOTP?.();
                      setSeconds(30);
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  <Text style={[s.link, seconds > 0 && s.disabledText]}>
                    {seconds ? `Resend in ${seconds}s` : "Resend OTP"}
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          )}
          {!!error && <Text style={s.error}>{error}</Text>}
          <Text style={s.terms}>
            By continuing, you agree to Cupid Clothings&apos; Terms & Privacy
            Policy.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFF7F8" },
  page: { flex: 1, padding: 24, justifyContent: "center" },
  back: { position: "absolute", top: 15, left: 15, padding: 8 },
  logo: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: PINK,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },
  logoText: { color: "#fff", fontSize: 30, fontWeight: "800" },
  kicker: {
    color: PINK,
    letterSpacing: 1.4,
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 8,
  },
  title: { color: INK, fontSize: 29, fontWeight: "800", marginBottom: 9 },
  subtitle: { color: "#777", fontSize: 14, lineHeight: 21, marginBottom: 30 },
  label: { fontSize: 13, fontWeight: "700", color: INK, marginBottom: 9 },
  phoneRow: {
    height: 58,
    borderRadius: 6,
    backgroundColor: "#fff",
    borderColor: "#F2DADF",
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  code: { fontSize: 16, fontWeight: "800", color: INK },
  divider: {
    height: 24,
    width: 1,
    backgroundColor: "#E8E0E1",
    marginHorizontal: 13,
  },
  phoneInput: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: INK,
    fontWeight: "600",
    letterSpacing: 0.8,
  },
  primary: {
    height: 54,
    marginTop: 18,
    borderRadius: 6,
    backgroundColor: PINK,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
  primaryText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  dim: { opacity: 0.45 },
  or: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 22,
  },
  line: { height: 1, flex: 1, backgroundColor: "#EDDDE0" },
  orText: { fontSize: 11, fontWeight: "700", color: "#9A8D90" },
  google: {
    height: 54,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E6DADD",
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 11,
  },
  g: { fontSize: 21, fontWeight: "800", color: "#4285F4" },
  googleText: { fontSize: 15, fontWeight: "700", color: INK },
  otpArea: { minHeight: 62, justifyContent: "center" },
  otpRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  box: {
    height: 53,
    flex: 1,
    maxWidth: 54,
    borderRadius: 6,
    backgroundColor: "#fff",
    borderColor: "#F1D9DE",
    borderWidth: 1.2,
    justifyContent: "center",
  },
  boxInput: {
    width: "100%",
    height: "100%",
    padding: 0,
    textAlign: "center",
    fontSize: 21,
    fontWeight: "800",
    color: INK,
  },
  check: {
    height: 62,
    width: 62,
    borderRadius: 20,
    alignSelf: "center",
    backgroundColor: "#55B979",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },
  hint: { marginTop: 16, textAlign: "center", fontSize: 12, color: "#8B7E81" },
  resend: { marginTop: 21, flexDirection: "row", justifyContent: "center" },
  muted: { fontSize: 13, color: "#8B7E81" },
  link: { fontSize: 13, fontWeight: "800", color: PINK },
  disabledText: { color: "#AAA" },
  error: { marginTop: 16, textAlign: "center", fontSize: 13, color: "#D6465E" },
  terms: {
    position: "absolute",
    bottom: 28,
    left: 32,
    right: 32,
    textAlign: "center",
    fontSize: 11,
    lineHeight: 16,
    color: "#A59B9D",
  },
});
