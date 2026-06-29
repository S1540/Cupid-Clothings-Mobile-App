import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/firebaseConfig";
import {
  collection,
  doc,
  getDocs,
  increment,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { Feather } from "@expo/vector-icons";
import CircleLoader from "../CircleLoader";

type SignupModalProps = {
  openModal: boolean;
  setOpenModal: (value: boolean) => void;
};

const SignupModal = ({ openModal, setOpenModal }: SignupModalProps) => {
  const slideAnim = useRef(new Animated.Value(400)).current;
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Signup With Firebase logicc
  const signUp = async () => {
    setLoading(true);
    try {
      // Referral validation
      let referrerDoc = null;
      if (referralCode.trim()) {
        const refSnap = await getDocs(
          query(
            collection(db, "users"),
            where("referralCode", "==", referralCode.trim().toUpperCase()),
          ),
        );

        if (refSnap.empty) {
          setLoading(false);
          alert("Invalid Referral Code");
          return;
        }

        referrerDoc = refSnap.docs[0];
      }
      const generatedReferralCode =
        name.replace(/\s/g, "").substring(0, 4).toUpperCase() +
        Math.floor(10000 + Math.random() * 90000);

      const response = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      await setDoc(doc(db, "users", response.user.uid), {
        userName: name,
        email,
        number,
        referralCode: generatedReferralCode,
        referredBy: referralCode.trim().toUpperCase() || null,
        totalReferrals: 0,
        referralEarnings: 0,
        activeCoupon: null,
        walletBalance: 0,
        totalEarnings: 0,
        rewardGiven: false,
        lastRewardAt: null,
        createdAt: new Date(),
      });
      if (referrerDoc) {
        await updateDoc(referrerDoc.ref, {
          totalReferrals: increment(1),
        });
      }

      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        closeModal();
      }, 2000);
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  };
  useEffect(() => {
    if (openModal) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
      }).start();
    }
  }, [openModal]);

  const closeModal = () => {
    Animated.timing(slideAnim, {
      toValue: 900,
      duration: 260,
      useNativeDriver: true,
    }).start(() => {
      setOpenModal(false);
    });
  };

  return (
    <>
      <Modal visible={openModal} transparent animationType="none">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View className="flex-1 justify-end bg-black/40">
            <Pressable className="flex-1" onPress={closeModal} />
            <Animated.View
              style={{ transform: [{ translateY: slideAnim }] }}
              className="bg-white rounded-t-[14px] px-5 pt-5 pb-10"
            >
              {/* HANDLE */}
              <View className="w-14 h-1.5 rounded-full bg-[#ddd] self-center mb-6" />

              {/* HEADER */}
              <View className="flex-row items-center justify-between mb-6">
                <View>
                  <Text className="text-2xl font-black text-[#1a1a1a]">
                    Create Account
                  </Text>
                  <Text className="text-[#888] mt-1">Join Cupid Clothings</Text>
                </View>
                <Pressable onPress={closeModal}>
                  <Feather name="x" size={22} color="#444" />
                </Pressable>
              </View>

              {/* NAME */}
              <View className="mb-4">
                <Text className="text-[13px] font-semibold text-[#444] mb-2">
                  Full Name
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                  placeholderTextColor="#aaa"
                  className="border border-[#eee] rounded-xl px-4 py-4 text-[15px]"
                />
              </View>

              {/* PHONE */}
              <View className="mb-4">
                <Text className="text-[13px] font-semibold text-[#444] mb-2">
                  Phone Number
                </Text>
                <TextInput
                  value={number}
                  onChangeText={setNumber}
                  placeholder="Enter phone number"
                  placeholderTextColor="#aaa"
                  keyboardType="phone-pad"
                  className="border border-[#eee] rounded-xl px-4 py-4 text-[15px]"
                />
              </View>

              {/* EMAIL */}
              <View className="mb-4">
                <Text className="text-[13px] font-semibold text-[#444] mb-2">
                  Email
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your Email"
                  placeholderTextColor="#aaa"
                  keyboardType="email-address"
                  className="border border-[#eee] rounded-xl px-4 py-4 text-[15px]"
                />
              </View>

              {/* PASSWORD */}
              <View className="mb-4">
                <Text className="text-[13px] font-semibold text-[#444] mb-2">
                  Password
                </Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Create password"
                  placeholderTextColor="#aaa"
                  secureTextEntry
                  className="border border-[#eee] rounded-xl px-4 py-4 text-[15px]"
                />
              </View>

              {/* REFERRAL */}
              <View className="mb-4">
                <Text className="text-[13px] font-semibold text-[#444] mb-2">
                  Referral Code (Optional)
                </Text>
                <TextInput
                  value={referralCode}
                  onChangeText={setReferralCode}
                  placeholder="Enter referral code"
                  placeholderTextColor="#aaa"
                  autoCapitalize="characters"
                  className="border border-[#eee] rounded-xl px-4 py-4 text-[15px]"
                />
              </View>

              {/* BUTTON */}
              <Pressable
                onPress={signUp}
                className="bg-[#F87387] rounded-xl py-4 items-center mt-6 active:opacity-90"
              >
                <Text className="text-white font-bold text-[15px]">
                  Create Account
                </Text>
              </Pressable>

              {/* TERMS */}
              <Text className="text-center text-[#aaa] text-[11px] mt-5 leading-5">
                By continuing, you agree to Cupid's Terms & Conditions and
                Privacy Policy.
              </Text>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>

        {/*  CircleLoader — Modal ke andar, poori screen cover karta hai */}
        {loading && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.35)",
              zIndex: 9999,
            }}
          >
            <CircleLoader />
          </View>
        )}

        {/*  Success toast — Modal ke andar */}
        {success && (
          <View
            style={{
              position: "absolute",
              top: 60,
              alignSelf: "center",
              zIndex: 9999,
              backgroundColor: "#22a55b",
              borderRadius: 6,
              paddingHorizontal: 20,
              paddingVertical: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 10,
              elevation: 8,
            }}
          >
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 99,
                backgroundColor: "rgba(255,255,255,0.2)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name="check" size={16} color="#fff" />
            </View>
            <View>
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 14 }}>
                Account Created! 🎉
              </Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.8)",
                  fontSize: 11,
                  marginTop: 2,
                }}
              >
                Welcome to Cupid Clothings
              </Text>
            </View>
          </View>
        )}
      </Modal>
    </>
  );
};

export default SignupModal;
