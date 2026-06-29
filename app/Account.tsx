import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Switch,
  StatusBar,
} from "react-native";
import { auth } from "@/firebaseConfig";
import { useUserStore } from "@/store/userStore";
import { Stack, useRouter } from "expo-router";
import { signOut as firebaseSignOut } from "firebase/auth";
import { Ionicons, Feather, MaterialIcons } from "@expo/vector-icons";
import LoginModel from "../components/modal/LoginModel";
import SignUpModel from "@/components/modal/SignUpModel";
import { useOrderStore } from "@/store/orderStore";

// ------------------------------ Reusable: Section Label
const SectionLabel = ({ title }: { title: string }) => (
  <Text className="text-[11px] font-bold text-[#999] uppercase tracking-widest px-4 pt-6 pb-2">
    {title}
  </Text>
);

//------------------------------- Reusable: Card wrapper-------------------------------------------
const Card = ({ children }: { children: React.ReactNode }) => (
  <View className="bg-white mx-4 rounded-md overflow-hidden border border-[#f0f0f0]">
    {children}
  </View>
);

//----------------------------- Reusable: Row inside card---------------------------------------
const Row = ({
  icon,
  label,
  subtitle,
  onPress,
  right,
  showBorder = true,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  showBorder?: boolean;
}) => (
  <>
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-4 py-[14px] bg-white active:bg-[#fafafa]"
    >
      <View className="w-8 items-center mr-3">{icon}</View>
      <View className="flex-1">
        <Text className="text-[14.5px] font-semibold text-[#1c1c1c]">
          {label}
        </Text>
        {subtitle ? (
          <Text className="text-[12px] text-[#999] mt-[2px]">{subtitle}</Text>
        ) : null}
      </View>
      {right !== undefined ? (
        right
      ) : (
        <Feather name="chevron-right" size={16} color="#c8c8c8" />
      )}
    </Pressable>
    {showBorder && <View className="h-px bg-[#f4f4f4] ml-[56px]" />}
  </>
);

// ---------------------------- Reusable: Toggle Row--------------------------------------------
const ToggleRow = ({
  icon,
  label,
  subtitle,
  value,
  onChange,
  showBorder = true,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  showBorder?: boolean;
}) => (
  <Row
    icon={icon}
    label={label}
    subtitle={subtitle}
    showBorder={showBorder}
    right={
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: "#e5e5e5", true: "#ffb3c1" }}
        thumbColor={value ? "#F87387" : "#fff"}
        ios_backgroundColor="#e5e5e5"
      />
    }
  />
);

// ---------------------------- Main Account Screen-----------------------------------------
const Account = () => {
  const [notifOrders, setNotifOrders] = useState(true);
  const [notifOffers, setNotifOffers] = useState(true);
  const [notifNewArrivals, setNotifNewArrivals] = useState(false);
  const [notifSMS, setNotifSMS] = useState(false);
  const [emailNewsletter, setEmailNewsletter] = useState(true);
  const [personalised, setPersonalised] = useState(true);
  const [openLogin, setOpenLogin] = useState(false);
  const [openSignup, setOpenSignup] = useState(false);
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const clearUser = useUserStore((state) => state.clearUser);
  const isLoggedIn = !!user;

  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
      clearUser();
      useOrderStore.getState().clearOrders();
      router.replace("/");
    } catch {
      console.log("Error signing out");
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#1a1a1a" }}>
              Account
            </Text>
          ),
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "#fff7f8" },
          headerLeft: () => (
            <Pressable onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color="#1a1a1a" />
            </Pressable>
          ),
        }}
      />

      <View className="flex-1 bg-[#f6f6f6] pb-16 ">
        <LoginModel
          openLogin={openLogin}
          setOpenLogin={setOpenLogin}
          openSignup={setOpenSignup}
        />
        <SignUpModel openModal={openSignup} setOpenModal={setOpenSignup} />
        <StatusBar barStyle="dark-content" backgroundColor="#f6f6f6" />
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          {/* TOP GUEST BANNER*/}
          <View className="bg-white px-4 pt-6 pb-5 flex-row items-center justify-between border-b border-[#f0f0f0]">
            <View>
              <Text className="text-[22px] font-black text-[#1c1c1c] tracking-tight">
                {isLoggedIn ? `${user?.userName}` : "Guest"}
              </Text>
              <Text className="text-[13px] text-[#999] mt-1">
                {isLoggedIn
                  ? "Welcome Back, Stay With Cupid."
                  : "Log in to access your orders & more"}
              </Text>
            </View>
            <View className="flex-row gap-2">
              {/* Login & Signup buttons  */}
              <Pressable
                onPress={handleSignOut}
                className={`border border-[#F87387] rounded-md px-4 py-2 ${
                  isLoggedIn ? "block" : "hidden"
                }`}
              >
                <Text className="text-[#F87387] font-bold text-[13px]">
                  Log Out
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setOpenLogin(!openLogin)}
                className={`border border-[#F87387] rounded-md px-4 py-2 ${
                  isLoggedIn ? "hidden" : ""
                }`}
              >
                <Text className="text-[#F87387] font-bold text-[13px]">
                  Log In
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setOpenSignup(!openSignup)}
                className={`bg-[#F87387] rounded-md px-4 py-2 ${
                  isLoggedIn ? "hidden" : ""
                }`}
              >
                <Text className="text-white font-bold text-[13px]">
                  Sign Up
                </Text>
              </Pressable>
            </View>
          </View>

          {/* ----------------------------QUICK LINKS---------------------------------------  */}
          <View className="flex-row bg-white mx-4 mt-4 rounded-md border border-[#f0f0f0] overflow-hidden">
            {[
              { icon: "package", label: "Orders", route: "/Orders" },
              { icon: "heart", label: "Wishlist", route: "/Wishlist" },
              { icon: "map-pin", label: "Addresses", route: "/Addresses" },
              // { icon: "credit-card", label: "Payments", route: "/Payment" },
            ].map((item, i, arr) => (
              <Pressable
                onPress={() => router.push(item.route as any)}
                key={item.label}
                className={`flex-1 items-center py-4 active:bg-[#fafafa] ${
                  i < arr.length - 1 ? "border-r border-[#f0f0f0]" : ""
                }`}
              >
                <Feather name={item.icon as any} size={20} color="#F87387" />
                <Text className="text-[11px] font-semibold text-[#444] mt-1.5">
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/*---------------------------- OFFERS STRIP------------------------------*/}
          <SectionLabel title="Offers & Rewards" />
          <Card>
            <Row
              icon={<Feather name="tag" size={18} color="#F87387" />}
              label="Coupons & Discounts"
              subtitle="3 coupons available"
            />
            <Row
              onPress={() => router.push("./Cupidcoins")}
              icon={<Ionicons name="star-outline" size={18} color="#F87387" />}
              label="Cupid Coins"
              subtitle="1,240 Cupid Coins · Tap to redeem"
            />
            <Row
              onPress={() => router.push("./ReferAndEarn")}
              icon={
                <Ionicons name="people-outline" size={18} color="#F87387" />
              }
              label="Refer & Earn"
              subtitle="Invite friends, earn ₹121 each after first order delivered"
              showBorder={false}
            />
          </Card>

          {/* NOTIFICATIONS */}
          <SectionLabel title="Notifications" />
          <Card>
            <ToggleRow
              icon={
                <Ionicons name="notifications-outline" size={18} color="#555" />
              }
              label="Order Updates"
              subtitle="Shipping & delivery alerts"
              value={notifOrders}
              onChange={setNotifOrders}
            />
            <ToggleRow
              icon={<Feather name="tag" size={17} color="#555" />}
              label="Deals & Offers"
              subtitle="Sales, coupons & flash deals"
              value={notifOffers}
              onChange={setNotifOffers}
            />
            <ToggleRow
              icon={<Ionicons name="sparkles-outline" size={17} color="#555" />}
              label="New Arrivals"
              subtitle="Be first to see new styles"
              value={notifNewArrivals}
              onChange={setNotifNewArrivals}
            />
            <ToggleRow
              icon={
                <Ionicons name="chatbubble-outline" size={17} color="#555" />
              }
              label="SMS Alerts"
              subtitle="Text messages on your phone"
              value={notifSMS}
              onChange={setNotifSMS}
              showBorder={false}
            />
          </Card>

          {/* -------------------------- MARKETING PREFERENCES------------------------------------  */}
          <SectionLabel title="Marketing Preferences" />
          <Card>
            <ToggleRow
              icon={<Feather name="mail" size={17} color="#555" />}
              label="Email Newsletter"
              subtitle="Lookbooks, style tips & updates"
              value={emailNewsletter}
              onChange={setEmailNewsletter}
            />
            <ToggleRow
              icon={<Feather name="sliders" size={17} color="#555" />}
              label="Personalised Picks"
              subtitle="AI-curated styles just for you"
              value={personalised}
              onChange={setPersonalised}
              showBorder={false}
            />
          </Card>

          {/*--------------------------- HELP & SUPPORT ------------------------------------ */}
          <SectionLabel title="Help & Support" />
          <Card>
            <Row
              onPress={() => router.push("./Helpcenter")}
              icon={<Feather name="help-circle" size={18} color="#555" />}
              label="Help Center"
              subtitle="FAQs, returns & more"
            />
            <Row
              onPress={() => router.push("./AppRating")}
              icon={<Feather name="star" size={18} color="#555" />}
              label="Rate the App"
              subtitle="Enjoying Cupid? Let us know"
              showBorder={false}
            />
          </Card>

          {/*-------------------------------------- LEGAL-------------------------------------  */}
          <SectionLabel title="Legal" />
          <Card>
            <Row
              onPress={() => router.push("./TermsAndConditions")}
              icon={<Feather name="file-text" size={17} color="#555" />}
              label="Terms & Conditions"
            />
            <Row
              onPress={() => router.push("./PrivacyPolicy")}
              icon={<Feather name="shield" size={17} color="#555" />}
              label="Privacy Policy"
            />
            <Row
              onPress={() => router.push("./ReturnAndExchange")}
              icon={<MaterialIcons name="policy" size={17} color="#555" />}
              label="Return & Exchange Policy"
              showBorder={false}
            />
          </Card>

          {/* -------------------------------- FOOTER------------------------------------ */}
          <View className="mx-4 mt-4 mb-10">
            <Pressable className="flex-row items-center justify-center gap-2 border border-[#e8e8e8] rounded-md py-4 bg-white">
              <Feather name="log-in" size={16} color="#F87387" />
              <Text className="text-[#F87387] font-bold text-[14px]">
                Log In / Sign Up
              </Text>
            </Pressable>
            <Text className="text-center text-[#c0c0c0] text-[11px] mt-4">
              Cupid Clothings v1.0.0 · Made with Unnity
            </Text>
          </View>
        </ScrollView>
      </View>
    </>
  );
};

export default Account;
