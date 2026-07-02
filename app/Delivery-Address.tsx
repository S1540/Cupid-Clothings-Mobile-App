import React, { useEffect, useState } from "react";
import * as Location from "expo-location";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Switch,
  StatusBar,
} from "react-native";
import {
  Ionicons,
  Feather,
  MaterialIcons,
  AntDesign,
  EvilIcons,
} from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useRouter } from "expo-router";
import { useCartStore } from "@/store/cartStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { auth, db } from "@/firebaseConfig";
import { useLocalSearchParams } from "expo-router";
import {
  doc,
  setDoc,
  collection,
  updateDoc,
  serverTimestamp,
  getDocs,
  addDoc,
  getDoc,
} from "firebase/firestore";
import CircleLoader from "@/components/ui/CircleLoader";

// ─── Tokens -----------------------------------
const C = {
  pink: "#F87387",
  pinkLight: "#FFF0F3",
  pinkBg: "#FFF7F8",
  border: "#EBEBEB",
  focusBorder: "#F87387",
  white: "#FFFFFF",
  bg: "#F6F6F6",
  label: "#999999",
  sub: "#AAAAAA",
  ink: "#1C1C1C",
  error: "#E05252",
};

// ─── Clean Input — no floating label, just static label above ─────────────────
const Field = ({
  label,
  value,
  onChange,
  placeholder,
  optional,
  keyboardType = "default",
  maxLength,
  error,
  prefix,
  flex,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  optional?: boolean;
  keyboardType?: "default" | "numeric" | "phone-pad";
  maxLength?: number;
  error?: string;
  prefix?: string;
  flex?: number;
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ flex, marginBottom: 16 }}>
      {/* Static label */}
      <Text
        style={{
          fontSize: 12,
          fontWeight: "600",
          color: C.label,
          marginBottom: 6,
          letterSpacing: 0.2,
        }}
      >
        {label}
        {optional && (
          <Text style={{ fontWeight: "400", color: C.sub }}> (Optional)</Text>
        )}
      </Text>

      {/* Input box */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          borderColor: error ? C.error : focused ? C.focusBorder : C.border,
          borderRadius: 6,
          backgroundColor: C.white,
          paddingHorizontal: 12,
          height: 48,
        }}
      >
        {prefix && (
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: C.ink,
              marginRight: 6,
              borderRightWidth: 1,
              borderRightColor: C.border,
              paddingRight: 8,
            }}
          >
            {prefix}
          </Text>
        )}
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder ?? label}
          placeholderTextColor="#CCCCCC"
          keyboardType={keyboardType}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            fontSize: 14,
            color: C.ink,
            fontWeight: "500",
            paddingVertical: 0,
          }}
          selectionColor={C.pink}
        />
      </View>

      {/* Error */}
      {error ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 4,
            gap: 4,
          }}
        >
          <Ionicons name="alert-circle-outline" size={12} color={C.error} />
          <Text style={{ fontSize: 11, color: C.error, fontWeight: "500" }}>
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

// ─── Section Card ─────────────────────────────────────────────────────────────
const Card = ({ children }: { children: React.ReactNode }) => (
  <View
    style={{
      backgroundColor: C.white,
      borderRadius: 6,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: C.border,
    }}
  >
    {children}
  </View>
);

// ─── Section Title ────────────────────────────────────────────────────────────
const SectionTitle = ({ title }: { title: string }) => (
  <Text
    style={{
      fontSize: 13,
      fontWeight: "700",
      color: C.ink,
      letterSpacing: 0.1,
      marginBottom: 16,
      textTransform: "uppercase",
    }}
  >
    {title}
  </Text>
);
const DetectLocation = ({
  title,
  onPress,
}: {
  title: string;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    style={{
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginBottom: 16,
    }}
  >
    <Text>
      <MaterialIcons name="my-location" size={20} color="#F87387" />
    </Text>
    <Text
      style={{
        fontSize: 13,
        fontWeight: "700",
        color: C.pink,
        letterSpacing: 0.1,
        textTransform: "uppercase",
      }}
    >
      {title}
    </Text>
  </Pressable>
);

// ─── Address Type Chip ────────────────────────────────────────────────────────
const Chip = ({
  label,
  icon,
  selected,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  selected: boolean;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    style={{
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      paddingVertical: 10,
      borderRadius: 6,
      backgroundColor: selected ? C.pink : C.bg,
      borderWidth: 1,
      borderColor: selected ? C.pink : C.border,
    }}
  >
    {icon}
    <Text
      style={{
        fontSize: 13,
        fontWeight: "600",
        color: selected ? "#fff" : C.label,
      }}
    >
      {label}
    </Text>
  </Pressable>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const DeliveryAddress = () => {
  const [wishlist, setWishlist] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [addressType, setAddressType] = useState<"Home" | "Work" | "Other">(
    "Home",
  );
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pincode, setPincode] = useState("");
  const [flat, setFlat] = useState("");
  const [area, setArea] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [altMobile, setAltMobile] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();
  const cartCount = useCartStore((state) => state.cartCount);
  const inset = useSafeAreaInsets();
  const { addressId } = useLocalSearchParams();

  const clearErr = (key: string) =>
    setErrors((prev) => ({ ...prev, [key]: "" }));

  const handleDetect = async () => {
    setDetecting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Location permission denied");
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = location.coords;
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${process.env.EXPO_PUBLIC_MAPBOX_API_TOKEN}`,
      );

      const data = await response.json();
      const features = data.features;

      const city =
        features.find((f: any) => f.place_type.includes("place"))?.text || "";

      const state =
        features.find((f: any) => f.place_type.includes("region"))?.text || "";

      const pincode =
        features.find((f: any) => f.place_type.includes("postcode"))?.text ||
        "";

      const area =
        features.find((f: any) => f.place_type.includes("neighborhood"))
          ?.text || "";

      setPincode(pincode);
      setCity(city);
      setStateName(state);
      setArea(area);
    } catch (error) {
      console.log(error);
    } finally {
      setDetecting(false);
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (pincode.length < 6) e.pincode = "Enter valid 6-digit pincode";
    if (!flat) e.flat = "Required";
    if (!area) e.area = "Required";
    if (!city) e.city = "Required";
    if (!stateName) e.state = "Required";
    if (!fullName) e.fullName = "Required";
    if (mobile.length < 10) e.mobile = "Enter valid 10-digit number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  // fetch data (if any edit mode on)
  useEffect(() => {
    const loadAddress = async () => {
      try {
        if (!addressId) return;
        const user = auth.currentUser;
        if (!user) return;
        const addressRef = doc(
          db,
          "users",
          user.uid,
          "address",
          addressId as string,
        );

        const snap = await getDoc(addressRef);
        if (!snap.exists()) return;
        const data = snap.data();

        setFullName(data.fullName || "");
        setMobile(data.mobile || "");
        setAltMobile(data.altMobile || "");
        setPincode(data.pincode || "");
        setFlat(data.flat || "");
        setArea(data.area || "");
        setLandmark(data.landmark || "");
        setCity(data.city || "");
        setStateName(data.stateName || "");
        setAddressType(data.addressType || "Home");
        setIsDefault(data.isDefault || false);
      } catch (error) {
        console.log(error);
      }
    };

    loadAddress();
  }, [addressId]);

  // Save Data To DB firebase
  const saveAddress = async () => {
    if (!validate()) return;
    setDetecting(true);
    try {
      const user = auth.currentUser;
      if (!user) return;
      const addressRef = collection(db, "users", user.uid, "address");
      const snapshot = await getDocs(addressRef);
      if (isDefault) {
        for (const docSnap of snapshot.docs) {
          await updateDoc(docSnap.ref, {
            isDefault: false,
          });
        }
      }
      if (addressId) {
        await updateDoc(
          doc(db, "users", user.uid, "address", addressId as string),
          {
            fullName,
            mobile,
            altMobile,
            pincode,
            flat,
            area,
            landmark,
            city,
            stateName,
            addressType,
            isDefault,
            createdAt: serverTimestamp(),
          },
        );
      }
      await addDoc(addressRef, {
        fullName,
        mobile,
        altMobile,
        pincode,
        flat,
        area,
        landmark,
        city,
        stateName,
        addressType,
        isDefault,
        createdAt: serverTimestamp(),
      });

      setDetecting(false);
      router.back();
    } catch {
      (error: any) => console.log(error);
    } finally {
      setDetecting(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#1a1a1a" }}>
              Delivery Address
            </Text>
          ),
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "#fff7f8" },
          headerLeft: () => (
            <Pressable onPress={() => router.back()}>
              <EvilIcons name="chevron-left" size={34} color="#1a1a1a" />
            </Pressable>
          ),
          headerRight: () => (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Pressable
                onPress={() => router.push("/Search")}
                style={{ padding: 6 }}
              >
                <Feather name="search" size={22} color="#1a1a1a" />
              </Pressable>
              <Pressable
                onPress={() => setWishlist(!wishlist)}
                style={{ padding: 6 }}
              >
                <Ionicons
                  name={wishlist ? "heart" : "heart-outline"}
                  size={22}
                  color={wishlist ? "#ff5c84" : "#1a1a1a"}
                />
              </Pressable>
              <Pressable
                onPress={() => router.push("/Cart")}
                style={{ padding: 6 }}
              >
                <Feather name="shopping-bag" size={22} color="#1a1a1a" />
                {cartCount > 0 && (
                  <View
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      width: 16,
                      height: 16,
                      borderRadius: 99,
                      backgroundColor: "#ff5c84",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 9,
                        fontWeight: "800",
                      }}
                    >
                      {cartCount}
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>
          ),
        }}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: C.pinkBg }}>
        <StatusBar barStyle="dark-content" backgroundColor={C.white} />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              padding: 14,
              paddingBottom: inset.bottom + 140,
            }}
          >
            {/* SHiping Warn */}
            <View
              style={{
                backgroundColor: C.white,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: "#FACCCC",
                marginBottom: 12,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 2,
                  padding: 14,
                  backgroundColor: C.pinkLight,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AntDesign
                    name="exclamation-circle"
                    size={18}
                    color="black"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>
                    Detailed address helps us deliver your order safely to your
                    doorstep.
                  </Text>
                </View>
              </View>
            </View>

            {/* Divider */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
              }}
            >
              <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
              <Text style={{ fontSize: 11, color: C.sub, fontWeight: "500" }}>
                LIVE OR ENTER MANUALLY
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
            </View>

            {/* ── ADDRESS DETAILS ─────────────────────────────────────────── */}
            <Card>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <SectionTitle title="Address" />
                <DetectLocation
                  onPress={handleDetect}
                  title="Detect Location"
                />
              </View>

              <Field
                label="Pincode"
                value={pincode}
                onChange={(v) => {
                  setPincode(v);
                  clearErr("pincode");
                }}
                keyboardType="numeric"
                maxLength={6}
                placeholder="6-digit pincode"
                error={errors.pincode}
              />
              <Field
                label="House / Flat / Apartment No."
                value={flat}
                onChange={(v) => {
                  setFlat(v);
                  clearErr("flat");
                }}
                placeholder="e.g. Flat 4B, Tower 2"
                error={errors.flat}
              />
              <Field
                label="Area / Colony / Street"
                value={area}
                onChange={(v) => {
                  setArea(v);
                  clearErr("area");
                }}
                placeholder="e.g. Sector 15, MG Road"
                error={errors.area}
              />
              <Field
                label="Landmark"
                value={landmark}
                onChange={setLandmark}
                placeholder="e.g. Near City Mall"
                optional
              />
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Field
                  label="City"
                  value={city}
                  onChange={(v) => {
                    setCity(v);
                    clearErr("city");
                  }}
                  placeholder="City"
                  error={errors.city}
                  flex={1}
                />
                <Field
                  label="State"
                  value={stateName}
                  onChange={(v) => {
                    setStateName(v);
                    clearErr("state");
                  }}
                  placeholder="State"
                  error={errors.state}
                  flex={1}
                />
              </View>
            </Card>

            {/* ── ADDRESS TYPE ────────────────────────────────────────────── */}
            <Card>
              <SectionTitle title="Address Type" />
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Chip
                  label="Home"
                  selected={addressType === "Home"}
                  onPress={() => setAddressType("Home")}
                  icon={
                    <Ionicons
                      name="home-outline"
                      size={14}
                      color={addressType === "Home" ? "#fff" : C.label}
                    />
                  }
                />
                <Chip
                  label="Work"
                  selected={addressType === "Work"}
                  onPress={() => setAddressType("Work")}
                  icon={
                    <Ionicons
                      name="briefcase-outline"
                      size={14}
                      color={addressType === "Work" ? "#fff" : C.label}
                    />
                  }
                />
                <Chip
                  label="Other"
                  selected={addressType === "Other"}
                  onPress={() => setAddressType("Other")}
                  icon={
                    <Ionicons
                      name="location-outline"
                      size={14}
                      color={addressType === "Other" ? "#fff" : C.label}
                    />
                  }
                />
              </View>
            </Card>

            {/* ── DEFAULT TOGGLE ───────────────────────────────────────────── */}
            <Card>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <Ionicons
                  name={isDefault ? "star" : "star-outline"}
                  size={20}
                  color={isDefault ? C.pink : C.sub}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ fontSize: 14, fontWeight: "600", color: C.ink }}
                  >
                    Set as default address
                  </Text>
                  <Text style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>
                    Used automatically at checkout
                  </Text>
                </View>
                <Switch
                  value={isDefault}
                  onValueChange={setIsDefault}
                  trackColor={{ false: C.border, true: "#FFB3BF" }}
                  thumbColor={isDefault ? C.pink : "#fff"}
                  ios_backgroundColor={C.border}
                />
              </View>
            </Card>

            {/* ── CONTACT DETAILS ─────────────────────────────────────────── */}
            <Card>
              <SectionTitle title="Contact" />
              <Field
                label="Full Name"
                value={fullName}
                onChange={(v) => {
                  setFullName(v);
                  clearErr("fullName");
                }}
                placeholder="Full name"
                error={errors.fullName}
              />
              <Field
                label="Mobile Number"
                value={mobile}
                onChange={(v) => {
                  setMobile(v);
                  clearErr("mobile");
                }}
                keyboardType="phone-pad"
                maxLength={10}
                placeholder="10-digit mobile number"
                prefix="+91"
                error={errors.mobile}
              />
              <Field
                label="Alternate Mobile"
                value={altMobile}
                onChange={setAltMobile}
                keyboardType="phone-pad"
                maxLength={10}
                placeholder="Optional"
                prefix="+91"
                optional
              />
            </Card>

            {/* ── TRUST NOTE ------------------------------------- */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                backgroundColor: C.pinkLight,
                borderRadius: 6,
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderWidth: 1,
                borderColor: "#FACCCC",
                marginBottom: 4,
              }}
            >
              <MaterialIcons name="security" size={16} color={C.pink} />
              <Text
                style={{
                  flex: 1,
                  fontSize: 12,
                  color: "#888",
                  lineHeight: 17,
                }}
              >
                Your info is{" "}
                <Text style={{ color: C.ink, fontWeight: "600" }}>
                  encrypted & securely stored.
                </Text>
              </Text>
            </View>
          </ScrollView>
          {detecting && (
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
              }}
            >
              <CircleLoader />
            </View>
          )}

          {/* ── STICKY SAVE BUTTON --------------------------*/}
          <View
            style={{
              position: "absolute",
              bottom: inset.bottom + 50,
              left: 0,
              right: 0,
              zIndex: 9999,
              backgroundColor: C.white,
              paddingHorizontal: 14,
              paddingTop: 10,
              paddingBottom: Platform.OS === "ios" ? 28 : 14,
              borderTopWidth: 1,
              borderTopColor: C.border,
            }}
          >
            <Pressable
              onPress={saveAddress}
              style={{
                backgroundColor: C.pink,
                borderRadius: 10,
                paddingVertical: 15,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 8,
                // opacity: pressed ? 0.85 : 1,
              }}
            >
              <Feather name="check-circle" size={17} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>
                Save & Continue
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
};

export default DeliveryAddress;
