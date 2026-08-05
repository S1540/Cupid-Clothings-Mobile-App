import admin from "firebase-admin";

const db = admin.firestore();

export async function deleteUserAccount(uid) {
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

  // Delete Wishlist

  const wishlist = await db
    .collection("users")
    .doc(uid)
    .collection("wishlist")
    .get();

  for (const doc of wishlist.docs) {
    await doc.ref.delete();
  }

  // Delete Coupons

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

  await admin.auth().deleteUser(uid);
}
