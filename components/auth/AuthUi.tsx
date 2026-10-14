import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  forwardRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AuthBackground, { type AuthBackgroundVariant } from "./AuthBackground";

type IconName = ComponentProps<typeof Ionicons>["name"];
export const AUTH_COLORS = {
  ink: "#282B3C",
  muted: "#656B80",
  placeholder: "#75798B",
  accent: "#963B62",
  border: "#E4E3ED",
};

export function AuthScaffold({
  title,
  description,
  eyebrow,
  icon,
  brandHero = false,
  background = "soft",
  onBack,
  busy,
  children,
}: {
  title: string;
  description: string;
  eyebrow: string;
  icon: IconName;
  brandHero?: boolean;
  background?: AuthBackgroundVariant;
  onBack?: () => void;
  busy?: boolean;
  children: ReactNode;
}) {
  return (
    <View style={a.screen}>
      <AuthBackground variant={background} />
      <SafeAreaView style={a.flex}>
        <KeyboardAvoidingView
          style={a.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={a.page}
          >
            <View style={a.content}>
              <View style={a.topBar}>
                {onBack ? (
                  <Pressable
                    disabled={busy}
                    onPress={onBack}
                    style={a.back}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                  >
                    <Ionicons
                      name="chevron-back"
                      size={22}
                      color={AUTH_COLORS.ink}
                    />
                  </Pressable>
                ) : (
                  <View style={a.backSpacer} />
                )}
                {!brandHero && (
                  <Image
                    source={require("../../assets/images/Cupid.png")}
                    resizeMode="contain"
                    style={a.logo}
                    accessibilityLabel="Cupid Clothing"
                  />
                )}
                <View style={a.backSpacer} />
              </View>
              <View style={a.hero}>
                {brandHero ? (
                  <Image
                    source={require("../../assets/images/Cupid.png")}
                    resizeMode="contain"
                    style={[a.logo, { marginBottom: 20 }]}
                    accessibilityLabel="Cupid Clothing"
                  />
                ) : (
                  <View style={a.heroIcon}>
                    <LinearGradient
                      colors={["#FFFFFF", "#ECEFFF", "#FCE5EC"]}
                      style={StyleSheet.absoluteFill}
                    />
                    <Ionicons
                      name={icon}
                      size={27}
                      color={AUTH_COLORS.accent}
                    />
                  </View>
                )}
                <Text style={a.eyebrow}>{eyebrow}</Text>
                <Text style={a.title} accessibilityRole="header">
                  {title}
                </Text>
                <Text style={a.description}>{description}</Text>
              </View>
              {children}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

export function AuthCard({
  children,
  radius,
}: {
  children: ReactNode;
  radius?: number;
}) {
  return (
    <View
      style={[
        a.card,
        radius !== undefined && {
          borderRadius: radius,
          backgroundColor: "#FFFFFF",
          borderColor: AUTH_COLORS.border,
        },
      ]}
    >
      {children}
    </View>
  );
}

type AuthFieldProps = TextInputProps & {
  label: string;
  optional?: boolean;
  hint?: string;
  icon?: IconName;
  prefix?: ReactNode;
};

/** Visible labels remain readable even when an OEM/theme hides placeholder text. */
export const AuthField = forwardRef<TextInput, AuthFieldProps>(
  function AuthField(
    { label, optional, hint, icon, prefix, style, onFocus, onBlur, ...props },
    ref,
  ) {
    const [focused, setFocused] = useState(false);
    return (
      <View style={a.field}>
        <View style={a.labelRow}>
          <Text style={a.label}>{label}</Text>
          {optional && <Text style={a.optional}>Optional</Text>}
        </View>
        <View style={[a.inputShell, focused && a.inputFocused]}>
          {prefix}
          {icon && (
            <Ionicons
              name={icon}
              size={19}
              color={focused ? AUTH_COLORS.accent : AUTH_COLORS.muted}
              style={a.inputIcon}
            />
          )}
          <TextInput
            ref={ref}
            accessibilityLabel={optional ? `${label}, optional` : label}
            placeholderTextColor={AUTH_COLORS.placeholder}
            selectionColor={AUTH_COLORS.accent}
            cursorColor={AUTH_COLORS.accent}
            underlineColorAndroid="transparent"
            keyboardAppearance="light"
            {...props}
            style={[a.input, style]}
            onFocus={(event) => {
              setFocused(true);
              onFocus?.(event);
            }}
            onBlur={(event) => {
              setFocused(false);
              onBlur?.(event);
            }}
          />
        </View>
        {!!hint && <Text style={a.hint}>{hint}</Text>}
      </View>
    );
  },
);

export function AuthButton({
  title,
  onPress,
  disabled,
  busy,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
}) {
  const inactive = disabled || busy;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!busy }}
      style={({ pressed }) => [a.button, pressed && { opacity: 0.88 }]}
    >
      <LinearGradient
        colors={inactive ? ["#E9E2E9", "#E2E2EF"] : ["#F87387", "#F87387"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={a.buttonInner}
      >
        {busy && <ActivityIndicator color="#675566" />}
        <Text style={[a.buttonText, inactive && { color: "#675566" }]}>
          {title}
        </Text>
        {!busy && (
          <Ionicons
            name="arrow-forward"
            size={19}
            color={inactive ? "#675566" : "#FFF"}
          />
        )}
      </LinearGradient>
    </Pressable>
  );
}

export function AuthError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <View style={a.errorBox}>
      <Ionicons name="alert-circle-outline" color="#A02D48" size={19} />
      <Text
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        style={a.error}
      >
        {message}
      </Text>
    </View>
  );
}

export const a = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  page: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
  },
  content: { width: "100%", maxWidth: 480, alignSelf: "center" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 26,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    backgroundColor: "rgba(255,255,255,0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  backSpacer: { width: 44, height: 44 },
  logo: { width: 104, height: 40 },
  hero: { marginBottom: 24 },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  eyebrow: {
    color: AUTH_COLORS.accent,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.8,
    marginBottom: 9,
  },
  title: {
    color: AUTH_COLORS.ink,
    fontSize: 29,
    fontWeight: "700",
    letterSpacing: -0.8,
  },
  description: {
    color: AUTH_COLORS.muted,
    fontSize: 14,
    marginTop: 10,
    lineHeight: 22,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.86)",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    borderRadius: 26,
    padding: 20,
    shadowColor: "#655775",
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 2,
  },
  field: { marginBottom: 18 },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 9,
  },
  label: { color: AUTH_COLORS.ink, fontSize: 13, fontWeight: "600" },
  optional: { color: AUTH_COLORS.muted, fontSize: 11 },
  inputShell: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    borderWidth: 1,
    borderColor: AUTH_COLORS.border,
    borderRadius: 3,
    backgroundColor: "#FAFAFD",
    paddingHorizontal: 14,
  },
  inputFocused: { borderColor: "#B5698C", backgroundColor: "#FFF9FC" },
  input: {
    flex: 1,
    minWidth: 0,
    color: AUTH_COLORS.ink,
    fontSize: 16,
    paddingVertical: 14,
    paddingHorizontal: 0,
    textAlignVertical: "center",
  },
  inputIcon: { marginRight: 10 },
  hint: {
    color: AUTH_COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 8,
  },
  button: {
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 2,
  },
  buttonInner: {
    borderRadius: 3,
    minHeight: 54,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    flexShrink: 1,
    textAlign: "center",
  },
  errorBox: {
    backgroundColor: "#FFF0F3",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 16,
  },
  error: { flex: 1, color: "#A02D48", fontSize: 13, lineHeight: 20 },
  secondary: {
    minHeight: 44,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  link: {
    color: AUTH_COLORS.accent,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  muted: { color: AUTH_COLORS.muted },
  legal: {
    color: AUTH_COLORS.muted,
    fontSize: 11,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 22,
    paddingHorizontal: 10,
  },
  links: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    columnGap: 22,
  },
  status: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 18,
  },
  statusText: { color: AUTH_COLORS.muted, fontSize: 11, flexShrink: 1 },
});
