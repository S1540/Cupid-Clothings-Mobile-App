function createTokenVerifier(auth) {
  return async (req, res, next) => {
    const match = /^Bearer ([^\s]+)$/i.exec(req.headers.authorization || "");
    if (!match) return res.status(401).json({ code: "UNAUTHENTICATED", message: "Please sign in again." });
    try {
      req.user = await auth.verifyIdToken(match[1], true);
      if (!req.user.uid) throw new Error("Missing UID");
      return next();
    } catch {
      return res.status(401).json({ code: "UNAUTHENTICATED", message: "Please sign in again." });
    }
  };
}
function requireRecentAuth(req, res, next) {
  const age = Date.now() / 1000 - Number(req.user?.auth_time);
  // A token exchange must not turn an old session into recent authentication.
  if (!Number.isFinite(age) || age < -60 || age > 300 || req.user?.firebase?.sign_in_provider === "custom") {
    return res.status(403).json({ code: "RECENT_AUTH_REQUIRED", message: "Please verify your identity again." });
  }
  return next();
}
module.exports = { createTokenVerifier, requireRecentAuth };
