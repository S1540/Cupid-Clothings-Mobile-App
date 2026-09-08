const crypto = require("node:crypto");

function failure(code, status = 400) { return Object.assign(new Error(code), { code, status }); }
const stringFields = { userName: 100, email: 254, gender: 30, dob: 20, anniversary: 20, country: 80, state: 80, city: 100, pincode: 15, preferredCategory: 40, language: 40 };
const booleanFields = new Set(["promotionalNotification", "orderUpdates", "whatsappUpdates", "emailOffers"]);
function validateProfile(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw failure("INVALID_PROFILE");
  const result = {};
  for (const [key, value] of Object.entries(input)) {
    if (Object.hasOwn(stringFields, key)) {
      if (typeof value !== "string" || value.trim().length > stringFields[key]) throw failure("INVALID_PROFILE");
      result[key] = value.trim();
    } else if (booleanFields.has(key) && typeof value === "boolean") result[key] = value;
    else throw failure("INVALID_PROFILE");
  }
  if (result.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email)) throw failure("INVALID_PROFILE");
  return result;
}

function createProfileService(db, auth, FieldValue) {
  async function bootstrap(uid) {
    const account = await auth.getUser(uid);
    const ref = db.collection("users").doc(uid);
    const code = crypto.randomBytes(6).toString("hex").toUpperCase();
    return db.runTransaction(async tx => {
      const deleted = await tx.get(db.collection("accountDeletions").doc(uid));
      const snap = await tx.get(ref);
      if (deleted.exists || snap.data()?.deletionState) throw failure("ACCOUNT_DELETING", 409);
      const current = snap.data() || {};
      const patch = { updatedAt: FieldValue.serverTimestamp() };
      if (account.phoneNumber) {
        // Preserve an old editable contact before replacing the identity display.
        if (current.phone && current.phone !== account.phoneNumber && !current.legacyContactPhone) patch.legacyContactPhone = current.phone;
        patch.phone = account.phoneNumber;
      }
      if (!snap.exists) {
        Object.assign(patch, {
          uid, userName: "", email: "", emailVerified: false,
          referralCode: code, referredBy: null, totalReferrals: 0,
          referralEarnings: 0, walletBalance: 0, totalEarnings: 0,
          cupidCoins: 0, totalEarnedCoins: 0, rewardGiven: false,
          activeCoupon: null, lastRewardAt: null,
          createdAt: FieldValue.serverTimestamp(), onboardingState: "pending", onboardingRewardEligible: true,
        });
      } else if (!current.referralCode) patch.referralCode = code;
      tx.set(ref, patch, { merge: true });
      return { created: !snap.exists, needsOnboarding: !snap.exists || current.onboardingState === "pending" || !current.userName, profile: { userName: current.userName || "", email: current.email || "" } };
    });
  }

  async function save(uid, input, referralCode, onboarding = false) {
    const fields = validateProfile(input);
    const account = await auth.getUser(uid);
    if (onboarding && !account.phoneNumber) throw failure("PHONE_REQUIRED");
    if (onboarding && !fields.userName) throw failure("INVALID_PROFILE");
    if (referralCode !== undefined && (typeof referralCode !== "string" || !/^[A-Z0-9]{0,20}$/i.test(referralCode))) throw failure("INVALID_REFERRAL");
    const ref = db.collection("users").doc(uid);
    return db.runTransaction(async tx => {
      const deleted = await tx.get(db.collection("accountDeletions").doc(uid));
      const snap = await tx.get(ref);
      if (deleted.exists || snap.data()?.deletionState) throw failure("ACCOUNT_DELETING", 409);
      if (!snap.exists) throw failure("PROFILE_MISSING", 409);
      const current = snap.data();
      const eligible = onboarding && current.onboardingState === "pending" && current.onboardingRewardEligible === true;
      let referrer;
      if (eligible && referralCode) {
        const matches = await tx.get(db.collection("users").where("referralCode", "==", referralCode.toUpperCase()).limit(2));
        if (matches.size !== 1 || matches.docs[0].id === uid || matches.docs[0].data().deletionState) throw failure("INVALID_REFERRAL");
        referrer = matches.docs[0].ref;
      }
      if (Object.hasOwn(fields, "email")) {
        fields.emailNormalized = fields.email.toLowerCase();
        fields.emailVerified = Boolean(account.emailVerified && account.email?.toLowerCase() === fields.emailNormalized && fields.emailNormalized);
        // No update to Auth email, Shopify identity or any existing order.
      }
      fields.updatedAt = FieldValue.serverTimestamp();
      if (onboarding && !current.onboardingCompletedAt) {
        fields.onboardingState = "complete";
        fields.onboardingCompletedAt = FieldValue.serverTimestamp();
      }
      if (eligible) {
        fields.onboardingState = "complete";
        fields.onboardingCompletedAt = FieldValue.serverTimestamp();
        fields.referredBy = referralCode?.toUpperCase() || null;
        if (referrer && !current.rewardGiven) {
          for (const key of ["walletBalance", "totalEarnings", "cupidCoins", "totalEarnedCoins"]) fields[key] = FieldValue.increment(79);
          fields.rewardGiven = true;
          fields.lastRewardAt = FieldValue.serverTimestamp();
          tx.update(referrer, {
            totalReferrals: FieldValue.increment(1), referralEarnings: FieldValue.increment(79),
            walletBalance: FieldValue.increment(79), totalEarnings: FieldValue.increment(79),
            cupidCoins: FieldValue.increment(79), totalEarnedCoins: FieldValue.increment(79),
            lastRewardAt: FieldValue.serverTimestamp(),
          });
        }
      }
      tx.update(ref, fields);
      return { success: true, emailAdded: !current.email && Boolean(fields.email), completedSignup: eligible };
    });
  }
  return { bootstrap, save };
}
module.exports = { createProfileService, validateProfile, failure };
