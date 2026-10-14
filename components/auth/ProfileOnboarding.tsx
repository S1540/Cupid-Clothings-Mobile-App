import { Analytics } from "@/lib/analytics";
import { ApiError, apiRequest } from "@/lib/api";
import { useRef, useState } from "react";
import {
  AuthScaffold,
  AuthCard,
  AuthField,
  AuthError,
  AuthButton,
} from "./AuthUi";
export default function ProfileOnboarding({
  onDone,
  initialProfile,
}: {
  onDone: () => void;
  initialProfile: { userName: string; email: string };
}) {
  const [userName, setName] = useState(initialProfile.userName);
  const [email, setEmail] = useState(initialProfile.email);
  const [referralCode, setReferral] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  async function save() {
    if (lock.current) return;
    if (!userName.trim()) {
      setError("Please add your name.");
      return;
    }
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await apiRequest<{
        emailAdded: boolean;
        completedSignup: boolean;
      }>("/api/users/me/onboarding", {
        method: "POST",
        body: JSON.stringify({
          profile: { userName, email },
          referralCode: referralCode.trim(),
        }),
      });
      if (result.emailAdded) void Analytics.emailAdded();
      if (result.completedSignup) void Analytics.signUp("phone");
      onDone();
    } catch (reason) {
      setError(
        reason instanceof ApiError
          ? reason.message
          : "Couldn't save your profile. Please retry.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <AuthScaffold
      eyebrow="YOUR CUPID PROFILE"
      title="Make yourself at home"
      description="Your phone is verified. Add your name and you're ready to explore."
      icon="person-outline"
      busy={busy}
    >
      <AuthCard>
        <AuthField
          label="Full name"
          icon="person-outline"
          value={userName}
          onChangeText={setName}
          placeholder="Enter your name"
          maxLength={100}
          editable={!busy}
          autoComplete="name"
          textContentType="name"
          autoCapitalize="words"
        />
        <AuthField
          label="Email address"
          optional
          icon="mail-outline"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          maxLength={254}
          editable={!busy}
          hint="Useful for receipts and help with previous orders. No email verification needed."
        />
        <AuthField
          label="Referral code"
          optional
          icon="gift-outline"
          value={referralCode}
          onChangeText={setReferral}
          placeholder="Enter referral code"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={20}
          editable={!busy}
        />
        <AuthError message={error} />
        <AuthButton
          title={busy ? "Saving..." : "Start shopping"}
          busy={busy}
          onPress={() => void save()}
        />
      </AuthCard>
    </AuthScaffold>
  );
}
