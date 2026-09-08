const { getAuth } = require("firebase-admin/auth");
const { app } = require("../firebaseAdmin");
const { createTokenVerifier, requireRecentAuth } = require("./authPolicy");
module.exports = { verifyFirebaseToken: createTokenVerifier(getAuth(app)), requireRecentAuth };