const { db, app } = require("../firebaseAdmin");
const { getAuth } = require("firebase-admin/auth");

const deleteUserAccount = async (uid) => {
  // Delete Address Collection
  const address = await db
    .collection("users")
    .doc(uid)
    .collection("address")
    .get();

  for (const doc of address.docs) {
    await doc.ref.delete();
  }

  // Delete Cart Collection
  const cart = await db.collection("users").doc(uid).collection("cart").get();

  for (const doc of cart.docs) {
    await doc.ref.delete();
  }

  // Delete Orders Collection
  const orders = await db
    .collection("users")
    .doc(uid)
    .collection("orders")
    .get();

  for (const doc of orders.docs) {
    await doc.ref.delete();
  }

  // Delete Wishlist Collection
  const wishlist = await db
    .collection("users")
    .doc(uid)
    .collection("wishlist")
    .get();

  for (const doc of wishlist.docs) {
    await doc.ref.delete();
  }

  // Delete Coupons Collection
  const coupons = await db
    .collection("users")
    .doc(uid)
    .collection("coupons")
    .get();

  for (const doc of coupons.docs) {
    await doc.ref.delete();
  }

  // Delete User Document
  await db.collection("users").doc(uid).delete();

  // Delete Firebase Authentication User
  await getAuth(app).deleteUser(uid);
};

module.exports = {
  deleteUserAccount,
};
