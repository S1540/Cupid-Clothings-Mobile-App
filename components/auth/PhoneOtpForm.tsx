import { ApiError } from "@/lib/api";
import { authErrorMessage } from "@/lib/authErrors";
import { normalizePhone, resendSeconds } from "@/lib/phone";
import { useEffect, useRef, useState } from "react";
import { AppState, TextInput } from "react-native";
import PhoneOtpView from "./PhoneOtpView";

export type PhoneAuthProps = {
  onSendOTP: (phone: string) => Promise<void>;
  onVerifyOTP: (code: string) => Promise<void>;
  onResendOTP: () => Promise<void>;
  onChangeNumber: () => void;
  onBack: () => void;
  fixedPhone?: string;
  error?: string;
  title?: string;
};
export default function PhoneOtpForm(props: PhoneAuthProps) {
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
    <PhoneOtpView
      {...props}
      step={step}
      phone={phone}
      code={code}
      busy={busy}
      error={error || props.error || ""}
      seconds={seconds}
      canSend={!!normalizePhone(phone)}
      input={input}
      onPhoneChange={setPhone}
      onCodeChange={(text) => setCode(text.replace(/\D/g, "").slice(0, 6))}
      onSend={() => void send()}
      onVerify={() => {
        if (code.length === 6) void run(() => props.onVerifyOTP(code));
      }}
      onResend={() => {
        if (resendSeconds(deadline) > 0) return;
        void run(async () => {
          await props.onResendOTP();
          if (mounted.current) {
            setCode("");
            setDeadline(Date.now() + 30000);
            input.current?.focus();
          }
        });
      }}
      onChangeNumber={() => {
        props.onChangeNumber();
        setCode("");
        setError("");
        setStep("phone");
      }}
    />
  );
}
