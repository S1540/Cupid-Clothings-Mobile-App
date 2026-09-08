export function authErrorCode(error: unknown): string {
  const code = (error as { code?: unknown })?.code;
  return typeof code === "string" ? code : "unknown";
}
export function authErrorMessage(error: unknown): string {
  switch (authErrorCode(error)) {
    case "auth/invalid-phone-number": return "Enter a valid mobile number, including its country code.";
    case "auth/invalid-verification-code": return "That code isn't correct. Please try again.";
    case "auth/session-expired":
    case "auth/code-expired":
    case "auth/invalid-verification-id": return "This code has expired. Request a new OTP.";
    case "auth/too-many-requests":
    case "auth/quota-exceeded": return "Too many attempts. Please wait before trying again.";
    case "auth/network-request-failed": return "Check your connection and try again.";
    case "auth/credential-already-in-use":
    case "auth/account-exists-with-different-credential":
    case "auth/email-already-in-use": return "This sign-in belongs to another Cupid account. No accounts were combined. Use your existing sign-in or contact support.";
    case "auth/user-mismatch": return "The number doesn't belong to this account. Use your account's verified number.";
    case "auth/requires-recent-login": return "Please verify your identity again to continue.";
    case "auth/invalid-email": return "Enter a valid email address.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found": return "The email or password isn't correct. Try again or recover your existing account.";
    case "auth/user-disabled": return "This account is unavailable. Please contact Cupid support.";
    case "auth/operation-not-allowed":
    case "auth/app-not-authorized":
    case "auth/invalid-app-credential":
    case "auth/missing-client-identifier": return "Phone sign-in is temporarily unavailable. Please try again later.";
    default: return "We couldn't complete that request. Please try again.";
  }
}
