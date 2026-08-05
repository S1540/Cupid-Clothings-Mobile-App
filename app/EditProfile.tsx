import { Feather, Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg"; // used for the ring progress around the avatar
import { updateDoc, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { SafeAreaView } from "react-native-safe-area-context";
import { OneSignal } from "react-native-onesignal";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PRIMARY = "#759EF0";
const PROGRESS_PINK = "#F87387";
const BORDER = "#EFEFF1";
const INK = "#242424";
const INK_MID = "#5B5B60";
const INK_SOFT = "#8A8A90";
const INK_LIGHT = "#B2B2B8";
const DANGER = "#EF4444";
const GREEN = "#198754";
const WHITE = "#ffffff";
const BG = "#F5F5F8";
const CARD_SHADOW = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.035,
  shadowRadius: 10,
  elevation: 1,
} as const;

// ─── TYPES & INITIAL STATE ──────────────────────────────────────────────────

type Gender = "Male" | "Female" | "Prefer not to say" | "";
type Category = "Men" | "Women" | "Kids" | "Beauty" | "";

interface ProfileFormState {
  profileImage: string;
  fullName: string;
  email: string;
  phone: string;
  gender: Gender;
  dob: string;
  anniversary: string;
  country: string;
  state: string;
  city: string;
  pincode: string;
  preferredCategory: Category;
  language: string;
  promotionalNotification: boolean;
  orderUpdates: boolean;
  whatsappUpdates: boolean;
  emailOffers: boolean;
}

const INITIAL_FORM: ProfileFormState = {
  profileImage: "",
  fullName: "",
  email: "",
  phone: "",
  gender: "",
  dob: "",
  anniversary: "",
  country: "India",
  state: "",
  city: "",
  pincode: "",
  preferredCategory: "",
  language: "English",
  promotionalNotification: true,
  orderUpdates: true,
  whatsappUpdates: false,
  emailOffers: true,
};

type FormErrors = Partial<Record<keyof ProfileFormState, string>>;

const GENDER_OPTIONS: Gender[] = ["Male", "Female", "Prefer not to say"];
const CATEGORY_OPTIONS: Category[] = ["Men", "Women", "Kids", "Beauty"];
const LANGUAGE_OPTIONS = ["English", "Hindi", "Tamil", "Bengali", "Marathi"];

const COMPLETION_FIELDS: (keyof ProfileFormState)[] = [
  "fullName",
  "phone",
  "gender",
  "dob",
  "country",
  "state",
  "city",
  "pincode",
  "preferredCategory",
  "language",
];

// Ring geometry for the circular progress that wraps the avatar
const AVATAR_SIZE = 62;
const RING_SIZE = 74;
const RING_STROKE = 3;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// ─── STYLES ──────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: WHITE },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: {
    marginTop: 10,
    fontSize: 12.5,
    color: INK_LIGHT,
    fontWeight: "400",
  },
  subtitle: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    fontSize: 13,
    lineHeight: 19,
    color: INK_LIGHT,
    fontWeight: "400",
  },

  // Edit-mode card
  card: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: WHITE,
    padding: 16,
    ...CARD_SHADOW,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: INK_LIGHT,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  cardBody: { gap: 16 },

  // FormInput
  inputLabel: {
    fontSize: 12.5,
    fontWeight: "500",
    color: INK_SOFT,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 6,
    paddingHorizontal: 14,
    backgroundColor: WHITE,
  },
  inputWrapDisabled: { backgroundColor: BG },
  input: {
    flex: 1,
    fontSize: 14,
    color: INK_MID,
    fontWeight: "400",
    minHeight: 48,
    paddingVertical: 12,
  },
  inputError: { marginTop: 5, fontSize: 11, color: DANGER, fontWeight: "400" },

  // ChipGroup
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chipText: { fontSize: 12.5, fontWeight: "500" },

  // SwitchRow (edit)
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchLabel: { fontSize: 13.5, fontWeight: "500", color: INK_MID },
  switchSub: {
    fontSize: 11.5,
    color: INK_LIGHT,
    marginTop: 2,
    fontWeight: "400",
  },
  divider: { height: 1, backgroundColor: BORDER },

  // Profile image (edit mode — big avatar, unchanged placement)
  avatarWrap: { alignItems: "center", paddingBottom: 24, paddingTop: 4 },
  avatarCircleLg: {
    height: 108,
    width: 108,
    borderRadius: 54,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: BG,
  },
  cameraBadgeLg: {
    position: "absolute",
    bottom: 0,
    right: 0,
    height: 34,
    width: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: WHITE,
    backgroundColor: PRIMARY,
  },
  changePhotoTxt: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: "600",
    color: PRIMARY,
  },

  // Save bar
  saveBar: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: WHITE,
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  saveBtn: {
    height: 54,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnTxt: { fontSize: 15, fontWeight: "700", color: WHITE },

  // ── Summary (Account-page style) ──────────────────────────────────────
  summaryWrap: { paddingHorizontal: 16, paddingBottom: 6 },

  // Thin horizontal header card — avatar+ring | name/email | Edit pill
  profileHeaderCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: WHITE,
    paddingVertical: 14,
    paddingHorizontal: 14,
    ...CARD_SHADOW,
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarCircleSm: {
    height: AVATAR_SIZE,
    width: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: BG,
  },
  cameraBadgeSm: {
    position: "absolute",
    bottom: -2,
    right: -2,
    height: 22,
    width: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: WHITE,
    backgroundColor: PRIMARY,
  },
  headerTextCol: { flex: 1, marginLeft: 14, paddingRight: 8 },
  profileName: { fontSize: 15.5, fontWeight: "700", color: INK },
  profileEmail: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "400",
    color: INK_LIGHT,
  },
  profileCompletion: {
    marginTop: 5,
    fontSize: 11,
    fontWeight: "600",
    color: PRIMARY,
  },
  editPillBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: PRIMARY,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: WHITE,
  },
  editPillTxt: { fontSize: 12.5, fontWeight: "700", color: PRIMARY },

  summaryCard: {
    marginTop: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: WHITE,
    paddingHorizontal: 16,
    paddingTop: 13,
    paddingBottom: 3,
    ...CARD_SHADOW,
  },
  summaryCardTitle: {
    fontSize: 10.5,
    fontWeight: "600",
    color: INK_LIGHT,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  gridRow: { flexDirection: "row", gap: 16, paddingVertical: 11 },
  cellLabelRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  cellLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#C7C7CB",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginLeft: 5,
  },
  cellValue: { fontSize: 13.5, fontWeight: "500", color: INK_MID },
  singleCellWrap: { paddingVertical: 11 },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 11,
  },
  statusLabel: { fontSize: 13, fontWeight: "500", color: INK_MID },
  statusBadge: {
    width: 62,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 99,
    paddingVertical: 4,
  },
  statusDot: { height: 6, width: 6, borderRadius: 3, marginRight: 6 },
  statusTxt: { fontSize: 10, fontWeight: "700" },
});

// ─── REUSABLE: PRESS-SCALE WRAPPER (button press animation) ────────────────

const PressableScale = memo(
  ({
    onPress,
    disabled,
    style,
    children,
  }: {
    onPress: () => void;
    disabled?: boolean;
    style?: any;
    children: React.ReactNode;
  }) => {
    const scale = useRef(new Animated.Value(1)).current;

    const onPressIn = () =>
      Animated.spring(scale, {
        toValue: 0.97,
        useNativeDriver: true,
        speed: 50,
      }).start();
    const onPressOut = () =>
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
      }).start();

    return (
      <Animated.View
        style={[{ transform: [{ scale }] }, disabled && { opacity: 0.75 }]}
      >
        <Pressable
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          disabled={disabled}
          style={style}
        >
          {children}
        </Pressable>
      </Animated.View>
    );
  },
);

// ─── REUSABLE: SECTION CARD (edit mode) ─────────────────────────────────────

const Card = memo(
  ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={S.card}>
      <Text style={S.cardTitle}>{title}</Text>
      <View style={S.cardBody}>{children}</View>
    </View>
  ),
);

// ─── REUSABLE: ANIMATED TEXT INPUT (focus border + inline error) ───────────

const FormInput = memo(
  ({
    label,
    required,
    value,
    onChangeText,
    placeholder,
    keyboardType = "default",
    editable = true,
    error,
    icon,
    maxLength,
  }: {
    label: string;
    required?: boolean;
    value: string;
    onChangeText?: (t: string) => void;
    placeholder?: string;
    keyboardType?: "default" | "email-address" | "phone-pad" | "number-pad";
    editable?: boolean;
    error?: string;
    icon?: keyof typeof Feather.glyphMap;
    maxLength?: number;
  }) => {
    const focusAnim = useRef(new Animated.Value(0)).current;

    const animateTo = (toValue: number) =>
      Animated.timing(focusAnim, {
        toValue,
        duration: 160,
        useNativeDriver: false,
      }).start();

    const borderColor = focusAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [error ? DANGER : BORDER, PRIMARY],
    });

    return (
      <View>
        <Text style={S.inputLabel}>
          {label}
          {required && <Text style={{ color: PRIMARY }}> *</Text>}
        </Text>

        <Animated.View
          style={[
            S.inputWrap,
            !editable && S.inputWrapDisabled,
            { borderColor, borderWidth: error ? 1.4 : 1.2 },
          ]}
        >
          {icon && (
            <Feather
              name={icon}
              size={16}
              color={INK_LIGHT}
              style={{ marginRight: 8 }}
            />
          )}
          <TextInput
            value={value}
            onChangeText={onChangeText}
            onFocus={() => animateTo(1)}
            onBlur={() => animateTo(0)}
            editable={editable}
            placeholder={placeholder}
            placeholderTextColor="#C9C9CD"
            keyboardType={keyboardType}
            maxLength={maxLength}
            style={S.input}
          />
          {!editable && <Feather name="lock" size={14} color="#D4D4D8" />}
        </Animated.View>

        {!!error && <Text style={S.inputError}>{error}</Text>}
      </View>
    );
  },
);

// ─── REUSABLE: SINGLE-SELECT CHIP GROUP ─────────────────────────────────────

const ChipGroup = memo(
  ({
    label,
    required,
    options,
    selected,
    onSelect,
    error,
  }: {
    label: string;
    required?: boolean;
    options: string[];
    selected: string;
    onSelect: (v: string) => void;
    error?: string;
  }) => (
    <View>
      <Text style={S.inputLabel}>
        {label}
        {required && <Text style={{ color: PRIMARY }}> *</Text>}
      </Text>
      <View style={S.chipRow}>
        {options.map((opt) => {
          const active = selected === opt;
          return (
            <Pressable
              key={opt}
              onPress={() => onSelect(opt)}
              style={[
                S.chip,
                {
                  backgroundColor: active ? PRIMARY : WHITE,
                  borderColor: active ? PRIMARY : BORDER,
                },
              ]}
            >
              <Text style={[S.chipText, { color: active ? WHITE : INK_SOFT }]}>
                {opt}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {!!error && <Text style={[S.inputError, { marginTop: 6 }]}>{error}</Text>}
    </View>
  ),
);

// ─── REUSABLE: SWITCH ROW (communication preferences — edit mode) ──────────

const SwitchRow = memo(
  ({
    label,
    subtitle,
    value,
    onValueChange,
  }: {
    label: string;
    subtitle: string;
    value: boolean;
    onValueChange: (v: boolean) => void;
  }) => (
    <View style={S.switchRow}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={S.switchLabel}>{label}</Text>
        <Text style={S.switchSub}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#E5E5EA", true: "#F8738780" }}
        thumbColor={value ? PRIMARY : WHITE}
        ios_backgroundColor="#E5E5EA"
      />
    </View>
  ),
);

// ─── REUSABLE: CIRCULAR AVATAR WITH PROGRESS RING ───────────────────────────
// The completeness bar now wraps around the profile photo instead of sitting
// underneath it, matching the "ring around avatar" pattern from the Account
// screen mock. Track = light gray, progress arc = brand pink, rounded caps.

const CircularAvatar = memo(
  ({
    image,
    completion,
    onPress,
  }: {
    image: string;
    completion: number;
    onPress: () => void;
  }) => {
    const progressOffset =
      RING_CIRCUMFERENCE - (RING_CIRCUMFERENCE * completion) / 100;

    return (
      <View style={S.ringWrap}>
        <Svg
          width={RING_SIZE}
          height={RING_SIZE}
          style={{ position: "absolute" }}
        >
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke="#F0F0F2"
            strokeWidth={RING_STROKE}
            fill="none"
          />
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={PROGRESS_PINK}
            strokeWidth={RING_STROKE}
            fill="none"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={progressOffset}
            strokeLinecap="round"
            rotation={-90}
            origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
          />
        </Svg>

        <View style={S.avatarCircleSm}>
          {image ? (
            <Image
              source={{ uri: image }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="person" size={30} color="#C9C9CE" />
          )}
        </View>

        <Pressable onPress={onPress} hitSlop={6} style={S.cameraBadgeSm}>
          <Feather name="camera" size={11} color={WHITE} />
        </Pressable>
      </View>
    );
  },
);

// ─── READ-ONLY SUMMARY PIECES ───────────────────────────────────────────────

const InfoCell = memo(
  ({
    icon,
    label,
    value,
  }: {
    icon: keyof typeof Feather.glyphMap;
    label: string;
    value: string;
  }) => (
    <View style={{ flex: 1 }}>
      <View style={S.cellLabelRow}>
        <Feather name={icon} size={11} color="#C7C7CB" />
        <Text style={S.cellLabel}>{label}</Text>
      </View>
      <Text style={S.cellValue} numberOfLines={1}>
        {value || "—"}
      </Text>
    </View>
  ),
);

const InfoGridRow = memo(
  ({
    left,
    right,
  }: {
    left: { icon: keyof typeof Feather.glyphMap; label: string; value: string };
    right: {
      icon: keyof typeof Feather.glyphMap;
      label: string;
      value: string;
    };
  }) => (
    <View style={S.gridRow}>
      <InfoCell {...left} />
      <InfoCell {...right} />
    </View>
  ),
);

const StatusRow = memo(
  ({ label, active }: { label: string; active: boolean }) => (
    <View style={S.statusRow}>
      <Text style={S.statusLabel}>{label}</Text>
      <View
        style={[S.statusBadge, { backgroundColor: active ? "#EAF7EF" : BG }]}
      >
        <View
          style={[S.statusDot, { backgroundColor: active ? GREEN : INK_LIGHT }]}
        />
        <Text style={[S.statusTxt, { color: active ? GREEN : INK_LIGHT }]}>
          {active ? "ON" : "OFF"}
        </Text>
      </View>
    </View>
  ),
);

const SummaryCard = memo(
  ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={S.summaryCard}>
      <Text style={S.summaryCardTitle}>{title}</Text>
      {children}
    </View>
  ),
);

const ProfileSummaryView = memo(
  ({
    form,
    completion,
    onEdit,
    onChangePhoto,
    onDeleteAccount,
  }: {
    form: ProfileFormState;
    completion: number;
    onEdit: () => void;
    onChangePhoto: () => void;
    onDeleteAccount: () => void;
  }) => {
    const locationLine = [form.city, form.state].filter(Boolean).join(", ");

    return (
      <View style={S.summaryWrap}>
        {/* Thin header card — avatar+ring | name/email | Edit pill (Account-page style) */}
        <View style={S.profileHeaderCard}>
          <CircularAvatar
            image={form.profileImage}
            completion={completion}
            onPress={onChangePhoto}
          />

          <View style={S.headerTextCol}>
            <Text style={S.profileName} numberOfLines={1}>
              {form.fullName || "Add your name"}
            </Text>
            <Text style={S.profileEmail} numberOfLines={1}>
              {form.email || "Complete your profile"}
            </Text>
            <Text style={S.profileCompletion}>{completion}% complete</Text>
          </View>

          <PressableScale onPress={onEdit} style={S.editPillBtn}>
            <Feather name="edit-2" size={12} color={PRIMARY} />
            <Text style={S.editPillTxt}>Edit</Text>
          </PressableScale>
        </View>

        {/* Personal details */}
        <SummaryCard title="Personal Information">
          <InfoGridRow
            left={{
              icon: "phone",
              label: "Mobile",
              value: form.phone ? `+91 ${form.phone}` : "",
            }}
            right={{ icon: "user", label: "Gender", value: form.gender }}
          />
          <View style={S.divider} />
          <InfoGridRow
            left={{ icon: "calendar", label: "Date of Birth", value: form.dob }}
            right={{
              icon: "heart",
              label: "Anniversary",
              value: form.anniversary,
            }}
          />
        </SummaryCard>

        {/* Location */}
        <SummaryCard title="Location">
          <InfoGridRow
            left={{
              icon: "map-pin",
              label: "City / State",
              value: locationLine,
            }}
            right={{ icon: "globe", label: "Country", value: form.country }}
          />
          <View style={S.divider} />
          <View style={S.singleCellWrap}>
            <InfoCell icon="hash" label="Pincode" value={form.pincode} />
          </View>
        </SummaryCard>

        {/* Shopping preferences */}
        <SummaryCard title="Shopping Preferences">
          <InfoGridRow
            left={{
              icon: "shopping-bag",
              label: "Category",
              value: form.preferredCategory,
            }}
            right={{ icon: "globe", label: "Language", value: form.language }}
          />
        </SummaryCard>

        {/* Communication preferences */}
        <SummaryCard title="Communication Preferences">
          <StatusRow
            label="Promotional Notifications"
            active={form.promotionalNotification}
          />
          <View style={S.divider} />
          <StatusRow label="Order Updates" active={form.orderUpdates} />
          <View style={S.divider} />
          <StatusRow label="WhatsApp Updates" active={form.whatsappUpdates} />
          <View style={S.divider} />
          <StatusRow label="Email Offers" active={form.emailOffers} />
          <View style={S.divider} />
          <View style={{ height: 12 }} />
          <Pressable onPress={onDeleteAccount}>
            <Text style={S.editPillTxt}>Delete Account</Text>
          </Pressable>
          <View style={{ height: 12 }} />
        </SummaryCard>
      </View>
    );
  },
);

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

export default function EditProfile() {
  const router = useRouter();
  const [form, setForm] = useState<ProfileFormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 380,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!auth.currentUser) {
          setLoading(false);
          return;
        }
        const snap = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (snap.exists()) {
          const data = snap.data() as Partial<ProfileFormState>;
          setForm((prev) => ({
            ...prev,
            ...data,
            email: auth.currentUser?.email ?? data.email ?? prev.email,
            phone: (data.phone ?? "").toString().replace("+91", ""),
          }));
        } else {
          setForm((prev) => ({
            ...prev,
            email: auth.currentUser?.email ?? prev.email,
          }));
        }
      } catch (e) {
        console.log("Fetch profile error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const completion = useMemo(() => {
    const filled = COMPLETION_FIELDS.filter(
      (f) => `${form[f] ?? ""}`.trim().length > 0,
    ).length;
    return Math.round((filled / COMPLETION_FIELDS.length) * 100);
  }, [form]);

  const handleChange = useCallback(
    <K extends keyof ProfileFormState>(
      field: K,
      value: ProfileFormState[K],
    ) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) =>
        prev[field] ? { ...prev, [field]: undefined } : prev,
      );
    },
    [],
  );

  const validateForm = useCallback((): boolean => {
    const next: FormErrors = {};

    if (!form.fullName.trim()) next.fullName = "Full name is required";

    if (!form.phone.trim()) next.phone = "Mobile number is required";
    else if (!/^[6-9]\d{9}$/.test(form.phone.trim()))
      next.phone = "Enter a valid 10-digit mobile number";

    if (!form.gender) next.gender = "Please select your gender";

    if (form.pincode.trim() && !/^\d{6}$/.test(form.pincode.trim()))
      next.pincode = "Enter a valid 6-digit pincode";

    setErrors(next);
    return Object.keys(next).length === 0;
  }, [form]);

  const handleSave = useCallback(async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      if (!auth.currentUser) return;
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        fullName: form.fullName,
        phone: `+91${form.phone}`,
        gender: form.gender,
        dob: form.dob,
        anniversary: form.anniversary,
        country: form.country,
        state: form.state,
        city: form.city,
        pincode: form.pincode,
        preferredCategory: form.preferredCategory,
        language: form.language,
        promotionalNotification: form.promotionalNotification,
        orderUpdates: form.orderUpdates,
        whatsappUpdates: form.whatsappUpdates,
        emailOffers: form.emailOffers,
      });
      OneSignal.User.addTag("gender", form.gender);
      OneSignal.User.addTag("city", form.city);
      OneSignal.User.addTag("category", form.preferredCategory);
      OneSignal.User.addTag("language", form.language);
      setIsEditing(false);
    } catch (e) {
      Alert.alert("Something went wrong", "Please try again.");
    } finally {
      setSaving(false);
    }
  }, [form, validateForm]);

  const pickImage = useCallback(() => {
    Alert.alert(
      "Upload Photo",
      "Connect expo-image-picker (or your preferred picker) here to select/capture a photo.",
    );
  }, []);
  // Delete user
  const deleteAccount = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/delete-account`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Your account has been deleted.");

        await AsyncStorage.clear();
        await auth.signOut();

        router.replace("/");
      } else {
        Alert.alert("Error", data.message);
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Unable to delete account.");
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      "Delete Account",
      "This action cannot be undone. Do you want to permanently delete your account?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: deleteAccount,
        },
      ],
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <Text style={{ fontSize: 16, fontWeight: "700", color: INK }}>
              {isEditing ? "Edit Profile" : "My Profile"}
            </Text>
          ),
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "#fff7f8" },
          headerLeft: () => (
            <Pressable
              onPress={() => (isEditing ? setIsEditing(false) : router.back())}
              hitSlop={10}
            >
              <Ionicons
                name={isEditing ? "close" : "chevron-back"}
                size={26}
                color={INK}
              />
            </Pressable>
          ),
        }}
      />

      <SafeAreaView style={S.screen} edges={["bottom"]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          {loading ? (
            <View style={S.loadingWrap}>
              <ActivityIndicator color={PRIMARY} />
              <Text style={S.loadingText}>Loading your profile…</Text>
            </View>
          ) : !isEditing ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 110 }}
            >
              <Animated.View style={{ opacity: fadeAnim }}>
                <Text style={S.subtitle}>
                  Here's everything we have on file - tap Edit to make changes.
                </Text>
                <ProfileSummaryView
                  form={form}
                  completion={completion}
                  onEdit={() => setIsEditing(true)}
                  onChangePhoto={pickImage}
                  onDeleteAccount={confirmDelete}
                />
              </Animated.View>
            </ScrollView>
          ) : (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              <Animated.View style={{ opacity: fadeAnim }}>
                <Text style={S.subtitle}>
                  Keep your profile updated for a better shopping experience.
                </Text>

                <View style={S.avatarWrap}>
                  <View style={{ position: "relative" }}>
                    <View style={S.avatarCircleLg}>
                      {form.profileImage ? (
                        <Image
                          source={{ uri: form.profileImage }}
                          style={{ width: "100%", height: "100%" }}
                          resizeMode="cover"
                        />
                      ) : (
                        <Ionicons name="person" size={52} color="#C9C9CE" />
                      )}
                    </View>
                    <Pressable
                      onPress={pickImage}
                      hitSlop={6}
                      style={S.cameraBadgeLg}
                    >
                      <Feather name="camera" size={16} color={WHITE} />
                    </Pressable>
                  </View>

                  <PressableScale
                    onPress={pickImage}
                    style={{
                      marginTop: 12,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                    }}
                  >
                    <Text style={S.changePhotoTxt}>
                      {form.profileImage ? "Change Photo" : "Upload Photo"}
                    </Text>
                  </PressableScale>
                </View>

                <Card title="Personal Information">
                  <FormInput
                    label="Full Name"
                    required
                    icon="user"
                    value={form.fullName}
                    onChangeText={(t) => handleChange("fullName", t)}
                    placeholder="Enter your full name"
                    error={errors.fullName}
                  />

                  <FormInput
                    label="Email"
                    icon="mail"
                    editable={false}
                    value={form.email}
                    placeholder="Add during signup"
                  />

                  <FormInput
                    label="Mobile Number"
                    required
                    icon="phone"
                    value={form.phone}
                    onChangeText={(t) =>
                      handleChange("phone", t.replace(/[^0-9]/g, ""))
                    }
                    placeholder="10-digit mobile number"
                    keyboardType="phone-pad"
                    maxLength={10}
                    error={errors.phone}
                  />

                  <ChipGroup
                    label="Gender"
                    required
                    options={GENDER_OPTIONS as string[]}
                    selected={form.gender}
                    onSelect={(v) => handleChange("gender", v as Gender)}
                    error={errors.gender}
                  />

                  <FormInput
                    label="Date of Birth"
                    icon="calendar"
                    value={form.dob}
                    onChangeText={(t) => handleChange("dob", t)}
                    placeholder="DD/MM/YYYY"
                  />

                  <FormInput
                    label="Anniversary (optional)"
                    icon="heart"
                    value={form.anniversary}
                    onChangeText={(t) => handleChange("anniversary", t)}
                    placeholder="DD/MM/YYYY"
                  />
                </Card>

                <Card title="Location">
                  <FormInput
                    label="Country"
                    icon="globe"
                    value={form.country}
                    onChangeText={(t) => handleChange("country", t)}
                    placeholder="Country"
                  />
                  <FormInput
                    label="State"
                    icon="map"
                    value={form.state}
                    onChangeText={(t) => handleChange("state", t)}
                    placeholder="Enter your state"
                  />
                  <FormInput
                    label="City"
                    icon="map-pin"
                    value={form.city}
                    onChangeText={(t) => handleChange("city", t)}
                    placeholder="Enter your city"
                  />
                  <FormInput
                    label="Pincode"
                    icon="hash"
                    value={form.pincode}
                    onChangeText={(t) =>
                      handleChange("pincode", t.replace(/[^0-9]/g, ""))
                    }
                    placeholder="6-digit pincode"
                    keyboardType="number-pad"
                    maxLength={6}
                    error={errors.pincode}
                  />
                </Card>

                <Card title="Shopping Preferences">
                  <ChipGroup
                    label="Preferred Category"
                    options={CATEGORY_OPTIONS as string[]}
                    selected={form.preferredCategory}
                    onSelect={(v) =>
                      handleChange("preferredCategory", v as Category)
                    }
                  />
                  <ChipGroup
                    label="Preferred Language"
                    options={LANGUAGE_OPTIONS}
                    selected={form.language}
                    onSelect={(v) => handleChange("language", v)}
                  />
                </Card>

                <Card title="Communication Preferences">
                  <SwitchRow
                    label="Promotional Notifications"
                    subtitle="Offers, sales & new arrivals"
                    value={form.promotionalNotification}
                    onValueChange={(v) =>
                      handleChange("promotionalNotification", v)
                    }
                  />
                  <View style={S.divider} />
                  <SwitchRow
                    label="Order Updates"
                    subtitle="Shipping & delivery status"
                    value={form.orderUpdates}
                    onValueChange={(v) => handleChange("orderUpdates", v)}
                  />
                  <View style={S.divider} />
                  <SwitchRow
                    label="WhatsApp Updates"
                    subtitle="Order alerts on WhatsApp"
                    value={form.whatsappUpdates}
                    onValueChange={(v) => handleChange("whatsappUpdates", v)}
                  />
                  <View style={S.divider} />
                  <SwitchRow
                    label="Email Offers"
                    subtitle="Deals straight to your inbox"
                    value={form.emailOffers}
                    onValueChange={(v) => handleChange("emailOffers", v)}
                  />
                </Card>
              </Animated.View>

              <View style={S.saveBar}>
                <PressableScale
                  onPress={handleSave}
                  disabled={saving}
                  style={[S.saveBtn, { backgroundColor: PRIMARY }]}
                >
                  {saving ? (
                    <ActivityIndicator color={WHITE} />
                  ) : (
                    <Text style={S.saveBtnTxt}>Save Changes</Text>
                  )}
                </PressableScale>
              </View>
            </ScrollView>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
