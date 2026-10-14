import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { RefObject } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import {
  a,
  AUTH_COLORS,
  AuthButton,
  AuthCard,
  AuthError,
  AuthField,
  AuthScaffold,
} from "./AuthUi";

export type PhoneOtpViewProps = {
  step: "phone" | "otp";
  phone: string;
  code: string;
  busy: boolean;
  error: string;
  seconds: number;
  canSend: boolean;
  fixedPhone?: string;
  title?: string;
  input: RefObject<TextInput | null>;
  onPhoneChange: (phone: string) => void;
  onCodeChange: (code: string) => void;
  onSend: () => void;
  onVerify: () => void;
  onResend: () => void;
  onChangeNumber: () => void;
  onBack: () => void;
};

/** Presentation only: SMS, credential verification and cooldowns live in the controller. */
export default function PhoneOtpView(props: PhoneOtpViewProps) {
  const router = useRouter();
  const { width, fontScale } = useWindowDimensions();
  const isPhone = props.step === "phone";
  return (
    <AuthScaffold
      brandHero
      background={isPhone ? "welcome" : "verification"}
      eyebrow={isPhone ? "YOUR STYLE STARTS HERE" : "VERIFY YOUR NUMBER"}
      title={
        isPhone ? props.title || "Welcome to Cupid" : "Enter verification code"
      }
      description={
        isPhone
          ? "Your favourites, your orders, your kind of style. All in one place."
          : `Enter the 6-digit code sent to your mobile number ending ${props.phone.replace(/\D/g, "").slice(-4)}.`
      }
      icon={isPhone ? "phone-portrait-outline" : "chatbubble-ellipses-outline"}
      onBack={props.onBack}
      busy={props.busy}
    >
      <AuthCard radius={6}>
        {isPhone ? (
          <>
            <AuthField
              label="Mobile number"
              value={props.phone}
              onChangeText={props.onPhoneChange}
              editable={!props.busy && !props.fixedPhone}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              autoComplete="tel"
              placeholder="Mobile number"
              maxLength={18}
              prefix={
                <View style={local.country}>
                  <Text style={local.countryName}>IN</Text>
                  <Text style={local.countryCode}>+91</Text>
                </View>
              }
              hint="We’ll send you a verification code by SMS. Indian numbers only."
              onSubmitEditing={
                props.canSend && !props.busy ? props.onSend : undefined
              }
            />
            <AuthError message={props.error} />
            <AuthButton
              title={props.busy ? "Sending code…" : "Get verification code"}
              busy={props.busy}
              disabled={!props.canSend}
              onPress={props.onSend}
            />
          </>
        ) : (
          <>
            <AuthField
              ref={props.input}
              label="Verification code"
              accessibilityLabel="Six digit verification code"
              value={props.code}
              editable={!props.busy}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete={
                Platform.OS === "android" ? "sms-otp" : "one-time-code"
              }
              maxLength={6}
              maxFontSizeMultiplier={1.3}
              placeholder="000000"
              onChangeText={props.onCodeChange}
              onSubmitEditing={
                props.code.length === 6 ? props.onVerify : undefined
              }
              style={{
                fontSize: width < 360 ? 23 : 27,
                letterSpacing: width < 360 || fontScale > 1.2 ? 3 : 9,
                textAlign: "center",
                fontVariant: ["tabular-nums"],
              }}
            />
            <AuthError message={props.error} />
            <AuthButton
              title={props.busy ? "Verifying…" : "Verify & continue"}
              busy={props.busy}
              disabled={props.code.length !== 6}
              onPress={props.onVerify}
            />
            <Pressable
              accessibilityRole="button"
              disabled={props.busy || props.seconds > 0}
              onPress={props.onResend}
              style={a.secondary}
            >
              <Text
                style={[a.link, (props.seconds > 0 || props.busy) && a.muted]}
              >
                {props.seconds > 0
                  ? `Resend code in ${props.seconds}s`
                  : "Resend code"}
              </Text>
            </Pressable>
            {!props.fixedPhone && (
              <Pressable
                accessibilityRole="button"
                disabled={props.busy}
                onPress={props.onChangeNumber}
                style={local.changeNumber}
              >
                <Ionicons
                  name="create-outline"
                  size={16}
                  color={AUTH_COLORS.accent}
                />
                <Text style={a.link}>Change mobile number</Text>
              </Pressable>
            )}
          </>
        )}
      </AuthCard>
      <View style={a.status}>
        <Ionicons
          name="lock-closed-outline"
          size={13}
          color={AUTH_COLORS.muted}
        />
        <Text style={a.statusText}>
          Sign in with a one-time verification code
        </Text>
      </View>
      <Text style={a.legal}>
        By continuing, you agree to receive an SMS for verification. Google
        processes your number to help prevent abuse.
      </Text>
      <View style={a.links}>
        <Pressable
          accessibilityRole="link"
          style={a.secondary}
          onPress={() => router.push("/TermsAndConditions")}
        >
          <Text style={a.link}>Terms</Text>
        </Pressable>
        <Pressable
          accessibilityRole="link"
          style={a.secondary}
          onPress={() => router.push("/PrivacyPolicy")}
        >
          <Text style={a.link}>Privacy</Text>
        </Pressable>
        <Pressable
          accessibilityRole="link"
          style={a.secondary}
          onPress={() => router.push("/Helpcenter")}
        >
          <Text style={a.link}>Get help</Text>
        </Pressable>
      </View>
    </AuthScaffold>
  );
}

const local = StyleSheet.create({
  country: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    paddingRight: 12,
    marginRight: 12,
    borderRightWidth: 1,
    borderRightColor: AUTH_COLORS.border,
  },
  countryName: { color: AUTH_COLORS.muted, fontSize: 10, fontWeight: "700" },
  countryCode: { color: AUTH_COLORS.ink, fontSize: 15, fontWeight: "600" },
  changeNumber: {
    minHeight: 44,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
  },
});
