const admin = require("firebase-admin");

const verifyFirebaseToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const decoded = await admin.auth().verifyIdToken(token);

    req.user = decoded;

    next();
  } catch (e) {
    return res.status(401).json({
      message: "Invalid Token",
    });
  }
};

module.exports = {
  verifyFirebaseToken,
};
