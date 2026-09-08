const { createHash } = require("node:crypto");
const { failure } = require("./profileService");

function trackingOrderNumber(value) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = String(value).trim();
  if (!/^#?\d+$/.test(text)) return null;
  const number = Number(text.replace(/^#/, ""));
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

function trackingPatch(payload, previous = {}) {
  const patch = { trackingUpdatedAt: new Date() };
  const pairs = { sr_order_id: "shiprocketOrderId", awb: "awb", courier_name: "courier", current_status: "trackingStatus", etd: "estimatedDeliveryDate", pickup_exception_reason: "pickupExceptionReason", undelivered_reason: "undeliveredReason" };
  for (const [source, target] of Object.entries(pairs)) {
    if (payload[source] !== undefined && payload[source] !== null && payload[source] !== "") patch[target] = payload[source];
  }
  // Shiprocket samples contain both numeric and string AWBs. Mobile clipboard
  // and tracking links expect text; retain leading zeroes on string values.
  if (patch.awb !== undefined) patch.awb = String(patch.awb);
  if (Array.isArray(payload.scans) && payload.scans.length) {
    // Preserve older activity when a provider update contains only recent scans.
    const history = [...(Array.isArray(previous.trackingHistory) ? previous.trackingHistory : []), ...payload.scans];
    patch.trackingHistory = [...new Map(history.map(scan => [JSON.stringify(scan), scan])).values()];
  }
  return patch;
}

function createOrderLifecycle(db, auth, FieldValue, getProductImage) {
  async function existingOrders(id, number) {
    // Keep the existing lookup architecture; do not require a new collection-group index.
    const users = await db.collection("users").get();
    const matches = [];
    for (const user of users.docs) {
      const orders = user.ref.collection("orders");
      if (id) {
        const order = await orders.doc(id).get();
        if (order.exists) matches.push({ user, order });
      } else {
        const result = await orders.where("orderNumber", "==", number).limit(2).get();
        for (const order of result.docs) matches.push({ user, order });
      }
    }
    return matches;
  }

  async function resolveOwner(order) {
    const registered = await db.collection("orderOwners").doc(String(order.id)).get();
    if (registered.exists && registered.data().deleted) return { reason: "account_deleted" };
    const existing = await existingOrders(String(order.id));
    if (existing.length > 1) return { reason: "ambiguous_existing_order" };
    if (existing.length === 1) return { uid: existing[0].user.id, existing: true };
    if (order.cart_token) {
      const key = createHash("sha256").update(String(order.cart_token)).digest("hex");
      const association = await db.collection("checkoutOwners").doc(key).get();
      if (association.exists) {
        if (association.data().orderId && association.data().orderId !== String(order.id)) return { reason: "checkout_already_used" };
        return { uid: association.data().uid, association: association.ref };
      }
    }
    // Retain email lookup for legacy users, but a newly editable contact address
    // is never ownership proof. Only the matching, verified Auth email qualifies.
    const email = order.email || order.contact_email;
    if (typeof email !== "string" || !email.trim()) return { reason: "missing_email" };
    const users = await db.collection("users").where("email", "==", email).limit(2).get();
    if (users.size !== 1) return { reason: users.empty ? "unmatched_email" : "ambiguous_email" };
    const user = users.docs[0];
    let account;
    try { account = await auth.getUser(user.id); }
    catch (error) { if (error.code === "auth/user-not-found") return { reason: "account_missing" }; throw error; }
    if (!account.emailVerified || account.email?.trim().toLowerCase() !== email.trim().toLowerCase()) return { reason: "ownership_required" };
    return { uid: user.id };
  }

  async function saveOrderToFirebase(order) {
    if (!order || !/^\d+$/.test(String(order.id)) || !Number.isSafeInteger(Number(order.order_number))) throw failure("INVALID_ORDER");
    const id = String(order.id);
    const owner = await resolveOwner(order);
    const pending = db.collection("unresolvedShopifyOrders").doc(id);
    if (!owner.uid) {
      await pending.set({ order, reason: owner.reason, receivedAt: FieldValue.serverTimestamp() }, { merge: true });
      return { saved: false, reason: owner.reason };
    }
    if (owner.existing) {
      await replayTracking(Number(order.order_number));
      return { saved: true, duplicate: true };
    }
    const products = await Promise.all((order.line_items || []).map(async item => ({
      product_id: item.product_id ?? null, variant_id: item.variant_id ?? null,
      title: item.title || "", variant_title: item.variant_title || "", quantity: item.quantity,
      price: item.price, image: item.product_id ? await getProductImage(item.product_id) : null,
    })));
    const userRef = db.collection("users").doc(owner.uid);
    const orderRef = userRef.collection("orders").doc(id);
    const registry = db.collection("orderOwners").doc(id);
    const result = await db.runTransaction(async tx => {
      const deleted = await tx.get(db.collection("accountDeletions").doc(owner.uid));
      const user = await tx.get(userRef);
      const current = await tx.get(orderRef);
      const registered = await tx.get(registry);
      const association = owner.association ? await tx.get(owner.association) : null;
      if (deleted.exists || !user.exists || user.data().deletionState) return { saved: false, reason: "account_unavailable" };
      if (registered.exists && (registered.data().deleted || registered.data().uid !== owner.uid)) return { saved: false, reason: "ownership_conflict" };
      if (owner.association && (!association?.exists || association.data().uid !== owner.uid)) return { saved: false, reason: "checkout_unavailable" };
      if (association?.exists && association.data().orderId && association.data().orderId !== id) return { saved: false, reason: "checkout_already_used" };
      if (current.exists) return { saved: true, duplicate: true };
      tx.create(orderRef, {
        orderId: id, orderNumber: Number(order.order_number), shopifyName: order.name || null,
        status: order.financial_status || null, total: Number(order.total_price),
        createdAt: new Date(), orderConfirmedAt: new Date(), products,
        shippingAddress: order.shipping_address || {}, awb: null, courier: null,
        shiprocketOrderId: null, trackingStatus: null, coinRewardGiven: false,
        earnedCoins: 0, coinRewardedAt: null,
      });
      tx.set(registry, { uid: owner.uid, orderId: id });
      if (owner.association) tx.update(owner.association, { orderId: id });
      return { saved: true };
    });
    if (!result.saved) await pending.set({ order, reason: result.reason, receivedAt: FieldValue.serverTimestamp() }, { merge: true });
    if (result.saved) await replayTracking(Number(order.order_number));
    return result;
  }

  async function replayTracking(orderNumber) {
    const waiting = await db.collection("pendingTracking").where("orderNumber", "==", orderNumber).get();
    for (const event of waiting.docs) {
      const result = await updateTrackingStatus(event.data().payload);
      if (result.updated) await event.ref.delete();
    }
  }

  async function updateTrackingStatus(payload) {
    const orderNumber = trackingOrderNumber(payload?.order_id);
    if (!Number.isSafeInteger(orderNumber) || orderNumber <= 0 || typeof payload.current_status !== "string" || !payload.current_status.trim()) throw failure("INVALID_TRACKING");
    const matches = await existingOrders(null, orderNumber);
    if (matches.length !== 1) {
      const key = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
      await db.collection("pendingTracking").doc(key).set({ orderNumber, payload, reason: matches.length ? "ambiguous_order" : "order_missing", receivedAt: FieldValue.serverTimestamp() }, { merge: true });
      return { updated: false };
    }
    const { user, order } = matches[0];
    return db.runTransaction(async tx => {
      const deleted = await tx.get(db.collection("accountDeletions").doc(user.id));
      const profile = await tx.get(user.ref);
      const current = await tx.get(order.ref);
      if (deleted.exists || !profile.exists || profile.data().deletionState || !current.exists) return { updated: false };
      const data = current.data();
      const patch = trackingPatch(payload, data);
      if (payload.current_status.trim().toUpperCase() === "DELIVERED" && !data.coinRewardGiven) {
        const coins = Math.floor((data.total || 0) / 20);
        tx.update(user.ref, { cupidCoins: FieldValue.increment(coins), totalEarnedCoins: FieldValue.increment(coins), lastRewardAt: new Date() });
        Object.assign(patch, { coinRewardGiven: true, earnedCoins: coins, coinRewardedAt: new Date() });
      }
      tx.update(order.ref, patch);
      return { updated: true };
    });
  }
  return { saveOrderToFirebase, updateTrackingStatus };
}
module.exports = { createOrderLifecycle, trackingPatch, trackingOrderNumber };
