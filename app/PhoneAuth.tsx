import PhoneAuth from "@/components/ui/PhoneAuth";
import {
  getAuth,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "@react-native-firebase/auth";
import { Stack, useRouter } from "expo-router";
import { useRef, useState } from "react";

export default function PhoneAuthScreen() {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(
    null,
  );
  const lastPhoneNumber = useRef("");

  const handleSendOTP = async (phoneNumber: string) => {
    try {
      const confirmationResult = await signInWithPhoneNumber(
        getAuth(),
        phoneNumber,
      );
      lastPhoneNumber.current = phoneNumber;
      setConfirmation(confirmationResult);
    } catch (error) {
      console.error("Send OTP error:", error);
      throw error;
    }
  };

  const handleVerifyOTP = async (otp: string) => {
    if (!confirmation) {
      throw new Error("OTP session expired. Please request a new OTP.");
    }

    try {
      const credential = await confirmation.confirm(otp);
      console.log("Phone login successful:", credential.user.uid);
    } catch (error) {
      console.error("OTP verification error:", error);
      throw error;
    }
  };

  // The existing PhoneAuth UI calls resend without an argument, so the last
  // successfully submitted number is retained in this screen.
  const handleResendOTP = async () => {
    if (!lastPhoneNumber.current) {
      throw new Error("Enter your phone number and request an OTP again.");
    }
    await handleSendOTP(lastPhoneNumber.current);
  };

  const handleGoogleSignIn = async () => {
    throw new Error("Google sign-in will be connected next.");
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <PhoneAuth
        onSendOTP={handleSendOTP}
        onVerifyOTP={handleVerifyOTP}
        onResendOTP={handleResendOTP}
        onGoogleSignIn={handleGoogleSignIn}
        onSuccess={() => router.replace("/")}
        onBack={() => router.back()}
      />
    </>
  );
}
