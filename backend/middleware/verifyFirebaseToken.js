const { getAuth } = require("firebase-admin/auth");
const { app } = require("../firebaseAdmin");

const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "No token provided",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    const decoded = await getAuth(app).verifyIdToken(token);

    req.user = decoded;

    next();
  } catch (err) {
    console.error("VERIFY TOKEN ERROR:", err);
    console.error("ERROR CODE:", err.code);
    console.error("ERROR MESSAGE:", err.message);

    return res.status(401).json({
      message: err.message,
    });
  }
};

module.exports = {
  verifyFirebaseToken,
};
