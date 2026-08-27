const fs = require("fs");
const path = require("path");
const { initializeApp, cert, getApps, getApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

require("dotenv").config();

const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");
const serviceAccountJson = fs.existsSync(serviceAccountPath)
  ? JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"))
  : null;
const serviceAccount = serviceAccountJson
  ? {
      projectId: serviceAccountJson.project_id,
      clientEmail: serviceAccountJson.client_email,
      privateKey: serviceAccountJson.private_key,
    }
  : {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    };

if (
  !serviceAccount.projectId ||
  !serviceAccount.clientEmail ||
  !serviceAccount.privateKey
) {
  throw new Error(
    "Firebase Admin credentials are missing. Provide backend/serviceAccountKey.json locally or the FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.",
  );
}

const app = getApps().length
  ? getApp()
  : initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.projectId,
    });

const db = getFirestore(app);

module.exports = {
  app,
  db,
};
