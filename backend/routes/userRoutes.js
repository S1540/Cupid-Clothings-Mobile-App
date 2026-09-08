const express = require("express");
const router = express.Router();

const { deleteAccount } = require("../controllers/userController");
const { verifyFirebaseToken, requireRecentAuth } = require("../middleware/verifyFirebaseToken");
const { userRequestLimit } = require("../middleware/requestLimit");
const { getAuth } = require("firebase-admin/auth");
const { FieldValue } = require("firebase-admin/firestore");
const { db, app } = require("../firebaseAdmin");
const { createProfileService } = require("../services/profileService");
const auth = getAuth(app);
const profiles = createProfileService(db, auth, FieldValue);
router.use(verifyFirebaseToken, userRequestLimit);
const handle = (action) => async (req, res) => {
  try { res.json(await action(req)); }
  catch (error) { res.status(error.status || 500).json({ code: error.status ? error.code : "UNAVAILABLE", message: "We couldn't complete that request." }); }
};

router.post("/session/native", handle(async req => {
  if ((await db.collection("accountDeletions").doc(req.user.uid).get()).exists) {
    throw Object.assign(new Error("ACCOUNT_DELETING"), { code: "ACCOUNT_DELETING", status: 409 });
  }
  return { token: await auth.createCustomToken(req.user.uid) };
}));
router.post("/me/bootstrap", handle(req => profiles.bootstrap(req.user.uid)));
router.patch("/me", handle(req => profiles.save(req.user.uid, req.body)));
router.post("/me/onboarding", handle(req => profiles.save(req.user.uid, req.body.profile, req.body.referralCode, true)));

router.delete("/delete-account", requireRecentAuth, deleteAccount);

module.exports = router;
