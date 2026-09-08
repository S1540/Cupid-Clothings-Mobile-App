// Only offer countries explicitly enabled for this rollout. Expand after SMS
// region policy and normalization are validated; never imply unsupported coverage.
export const PHONE_COUNTRIES = [{ iso: "IN", name: "India", dial: "+91" }] as const;
export function normalizePhone(value: string): string | null {
  if (!/^\+?[\d\s()-]+$/.test(value.trim()) || (value.includes("+") && !value.trim().startsWith("+91"))) return null;
  let digits = value.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? `+91${digits}` : null;
}
export function resendSeconds(deadline: number, now = Date.now()) {
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}
