function createAccountDeletion(db, auth, FieldValue) {
  return async function deleteUserAccount(uid) {
    const ref = db.collection("users").doc(uid);
    const job = db.collection("accountDeletions").doc(uid);
    await db.runTransaction(async tx => {
      const user = await tx.get(ref);
      tx.set(job, { state: "pending", updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      if (user.exists) tx.update(ref, { deletionState: "pending" });
    });
    const orders = await ref.collection("orders").get();
    for (const order of orders.docs) {
      const ownership = db.collection("orderOwners").doc(order.id);
      await db.runTransaction(async tx => {
        const existing = await tx.get(ownership);
        if (existing.exists && existing.data().uid !== uid) throw new Error("ORDER_OWNERSHIP_CONFLICT");
        tx.set(ownership, { uid, orderId: order.id, deleted: true }, { merge: true });
      });
    }
    for (const name of ["address", "cart", "orders", "wishlist", "coupons"]) await db.recursiveDelete(ref.collection(name));
    for (const name of ["checkoutOwners", "judgemeReviewSubmissions"]) {
      const field = name === "judgemeReviewSubmissions" ? "userId" : "uid";
      const records = await db.collection(name).where(field, "==", uid).get();
      for (const record of records.docs) await record.ref.delete();
    }
    // Retain the marker on failure; retry is safe. No Shopify-side deletion.
    try { await auth.deleteUser(uid); }
    catch (error) { if (error.code !== "auth/user-not-found") throw error; }
    await ref.delete();
    await job.set({ state: "complete", updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  };
}
module.exports = { createAccountDeletion };
