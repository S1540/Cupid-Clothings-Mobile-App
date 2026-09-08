const { db, app } = require("../firebaseAdmin");
const { getAuth } = require("firebase-admin/auth");
const { FieldValue } = require("firebase-admin/firestore");
const { createAccountDeletion } = require("./accountDeletion");
module.exports = { deleteUserAccount: createAccountDeletion(db, getAuth(app), FieldValue) };