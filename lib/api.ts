import { auth } from "@/firebaseConfig";
export class ApiError extends Error {
  constructor(public code: string, message: string, public status: number) { super(message); }
}
const messages: Record<string, string> = {
  RECENT_AUTH_REQUIRED: "Please verify your identity again to continue.",
  INVALID_PROFILE: "Check your profile details and try again.",
  INVALID_REFERRAL: "That referral code isn't available. Check it or continue without a code.",
  PHONE_REQUIRED: "Verify your mobile number to continue.",
  PROFILE_MISSING: "Finish setting up your profile before checking out.",
  ACCOUNT_DELETING: "Account deletion is in progress. Please retry deletion.",
  EMAIL_REQUIRED: "Add a contact email in your profile to submit a review.",
  CHECKOUT_UNAVAILABLE: "Checkout is temporarily unavailable. Your bag has been saved.",
  SESSION_CHANGED: "Your account changed. Please try again.",
  UNAVAILABLE: "This service is temporarily unavailable. Please try again later.",
};
export async function apiRequest<T>(path: string, init: RequestInit = {}, tokenOverride?: string): Promise<T> {
  const user = auth.currentUser;
  let token: string | undefined;
  try { token = tokenOverride ?? await user?.getIdToken(); }
  catch { throw new ApiError("UNAUTHENTICATED", "Please sign in again to continue.", 401); }
  if (!token) throw new ApiError("UNAUTHENTICATED", "Please sign in to continue.", 401);
  const base = process.env.EXPO_PUBLIC_API_URL;
  if (!base) throw new ApiError("UNAVAILABLE", "This service is temporarily unavailable.", 503);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`${base.replace(/\/+$/, "")}${path}`, {
      ...init, signal: controller.signal,
      headers: { ...init.headers, "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });
    const data = await response.json().catch(() => ({}));
    if (!tokenOverride && auth.currentUser?.uid !== user?.uid) throw new ApiError("SESSION_CHANGED", messages.SESSION_CHANGED, 409);
    if (!response.ok) {
      if (response.status === 404 && path === "/api/users/me/bootstrap") {
        throw new ApiError("PROFILE_SERVICE_UNAVAILABLE", "You're signed in, but profile setup is temporarily unavailable. Please try again later.", 404);
      }
      const code = typeof data.code === "string" ? data.code : "REQUEST_FAILED";
      throw new ApiError(code, messages[code] ?? (response.status === 401 ? "Please sign in again." : "We couldn't complete that request. Please try again."), response.status);
    }
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("NETWORK", "Check your connection and try again.", 0);
  } finally { clearTimeout(timeout); }
}
