const { admin } = require("../firebaseAdmin");

const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "No token provided",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    const decoded = await admin.auth().verifyIdToken(token);

    req.user = decoded;

    next();
  } catch (err) {
    console.log("VERIFY TOKEN ERROR:", err);

    return res.status(401).json({
      message: "Invalid Token",
    });
  }
};

module.exports = {
  verifyFirebaseToken,
};
