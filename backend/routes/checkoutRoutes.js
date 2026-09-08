const router = require("express").Router();
const { db } = require("../firebaseAdmin");
const { verifyFirebaseToken } = require("../middleware/verifyFirebaseToken");
const { userRequestLimit } = require("../middleware/requestLimit");
const { createCheckoutService } = require("../services/checkoutService");
const createCheckout = createCheckoutService(db);
router.post("/", verifyFirebaseToken, userRequestLimit, async (req, res) => {
  try { res.json(await createCheckout(req.user.uid, req.body?.lines, req.user.phone_number)); }
  catch (error) { res.status(error.status || 502).json({ code: error.code || "CHECKOUT_UNAVAILABLE", message: "Checkout is temporarily unavailable. Your bag has been saved." }); }
});
router.post("/status", verifyFirebaseToken, userRequestLimit, async (req, res) => {
  try {
    const { cartToken } = require("../services/checkoutService");
    const token = cartToken(req.body?.cartId);
    if (!token) return res.status(400).json({ code: "INVALID_CART" });
    const key = require("node:crypto").createHash("sha256").update(token).digest("hex");
    const owner = await db.collection("checkoutOwners").doc(key).get();
    if (!owner.exists || owner.data().uid !== req.user.uid) return res.status(404).json({ code: "NOT_FOUND" });
    const deletion = await db.collection("accountDeletions").doc(req.user.uid).get();
    if (deletion.exists) return res.status(409).json({ code: "ACCOUNT_DELETING" });
    if (!owner.data().orderId) return res.json({ confirmed: false });
    const order = await db.collection("users").doc(req.user.uid).collection("orders").doc(owner.data().orderId).get();
    if (!order.exists) return res.json({ confirmed: false });
    const data = order.data();
    return res.json({ confirmed: true, orderId: order.id, total: data.total, products: data.products.map(item => ({ id: String(item.product_id || ""), title: item.title, quantity: item.quantity, price: Number(item.price) })) });
  } catch { return res.status(503).json({ code: "UNAVAILABLE" }); }
});
module.exports = router;
