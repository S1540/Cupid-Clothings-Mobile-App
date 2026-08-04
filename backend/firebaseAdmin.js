const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
};

const app = initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore(app);
const auth = getAuth(app);

module.exports = { auth, db };

// const { initializeApp, cert } = require("firebase-admin/app");
// const { getFirestore } = require("firebase-admin/firestore");

// const serviceAccount = require("./serviceAccountKey.json"); // path adjust kar lena

// const app = initializeApp({
//   credential: cert(serviceAccount),
// });

// const db = getFirestore(app);

// module.exports = { db };
