const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { MemoryFirestore, FieldValue } = require("./memoryFirestore");
const { createProfileService, validateProfile } = require("../services/profileService");
const { createOrderLifecycle, trackingPatch } = require("../services/orderLifecycle");
const { createTokenVerifier, requireRecentAuth } = require("../middleware/authPolicy");
const { verifyShopifyWebhook, verifyShiprocketWebhook } = require("../middleware/verifyWebhooks");
const { createAccountDeletion } = require("../services/accountDeletion");
const { checkoutLines, cartToken, createCheckoutService } = require("../services/checkoutService");
const { resumeRequestedDeletions } = require("../services/deletionRecovery");
const account = { uid: "original", phoneNumber: "+919000000000", email: "owner@example.test", emailVerified: true };
const auth = { getUser: async uid => ({ ...account, uid }) };
function response() { return { statusCode: 200, body: null, status(value) { this.statusCode = value; return this; }, json(value) { this.body = value; return this; }, sendStatus(value) { this.statusCode = value; return this; } }; }
const order = { id: 1234, order_number: 42, email: "owner@example.test", total_price: "1000", line_items: [], financial_status: "paid" };

test("tracking order numbers accept a display hash and reject ambiguous coercions", async () => {
  const { trackingOrderNumber } = require("../services/orderLifecycle");
  for (const value of [76653, "76653", "#76653", " #76653 "]) assert.equal(trackingOrderNumber(value), 76653);
  for (const value of [true, [76653], "7e4", "0x12", "76653.0", "Order#76653", "", null, "#0", "9007199254740992"]) assert.equal(trackingOrderNumber(value), null);
  const db = new MemoryFirestore({ "users/original": { email: order.email } });
  const service = createOrderLifecycle(db, auth, FieldValue, async () => null);
  await service.updateTrackingStatus({ order_id: "#76653", current_status: "IN TRANSIT", awb: 77904524655 });
  await service.saveOrderToFirebase({ ...order, order_number: 76653 });
  assert.equal(db.documents.get("users/original/orders/1234").trackingStatus, "IN TRANSIT");
  assert.equal(db.documents.get("users/original/orders/1234").awb, "77904524655");
});

test("Shiprocket sample numeric AWB becomes copyable text and mixed-case Delivered credits once", async () => {
  const db = new MemoryFirestore({ "users/sample": { cupidCoins: 0 }, "users/sample/orders/1234": { orderId: "1234", orderNumber: 13905312, total: 1000, coinRewardGiven: false } });
  const service = createOrderLifecycle(db, auth, FieldValue, async () => null);
  const payload = { awb: 59629792084, current_status: "Delivered", order_id: "13905312", current_timestamp: "2021-07-02 16:41:59", etd: "2021-07-02 16:41:59", current_status_id: 7, channel_order_id: "enter your channel order id", courier_name: "enter courier_name", scans: [{ date: "2019-06-25 12:08:00", activity: "SHIPMENT DELIVERED", location: "PATIALA" }] };
  await service.updateTrackingStatus(payload);
  await service.updateTrackingStatus(payload);
  const saved = db.documents.get("users/sample/orders/1234");
  assert.equal(saved.awb, "59629792084");
  assert.equal(saved.trackingStatus, "Delivered");
  assert.equal(saved.trackingHistory.length, 1);
  assert.equal(db.documents.get("users/sample").cupidCoins, 50);
  assert.equal(trackingPatch({ awb: "000123" }).awb, "000123");
});

test("retrying an existing Shopify order replays retained tracking without replacing it", async () => {
  const db = new MemoryFirestore({ "users/original": {}, "users/original/orders/1234": { orderId: "1234", orderNumber: 42, total: 1000, awb: "KEEP", coinRewardGiven: true }, "pendingTracking/late": { orderNumber: 42, payload: { order_id: "42", current_status: "IN TRANSIT" } } });
  await createOrderLifecycle(db, auth, FieldValue, async () => null).saveOrderToFirebase(order);
  assert.equal(db.documents.get("users/original/orders/1234").awb, "KEEP");
  assert.equal(db.documents.get("users/original/orders/1234").trackingStatus, "IN TRANSIT");
  assert.equal(db.documents.get("users/original/orders/1234").coinRewardGiven, true);
  assert.ok(!db.documents.has("pendingTracking/late"));
});
test("a deleted order ownership record cannot be reacquired using an email", async () => {
  const db = new MemoryFirestore({ "users/original": { email: order.email }, "orderOwners/1234": { uid: "deleted", deleted: true } });
  const result = await createOrderLifecycle(db, auth, FieldValue, async () => null).saveOrderToFirebase(order);
  assert.equal(result.saved, false); assert.ok(!db.documents.has("users/original/orders/1234"));
});
test("deletion recovery runs only explicitly requested pending jobs", async () => {
  const db = new MemoryFirestore({ "accountDeletions/requested": { state: "pending" }, "accountDeletions/finished": { state: "complete" }, "users/unrequested": {} });
  const called = [];
  assert.deepEqual(await resumeRequestedDeletions(db, async uid => called.push(uid)), { completed: 1, failed: 0 });
  assert.deepEqual(called, ["requested"]);
});
test("bootstrap returns existing contact details for onboarding without overwriting them", async () => {
  const db = new MemoryFirestore({ "users/original": { email: "saved@example.test", walletBalance: 79 } });
  const result = await createProfileService(db, auth, FieldValue).bootstrap("original");
  assert.equal(result.profile.email, "saved@example.test"); assert.equal(db.documents.get("users/original").walletBalance, 79);
});

test("phone-only bootstrap is idempotent and preserves all existing metadata", async () => {
  const db = new MemoryFirestore({ "users/original": { walletBalance: 987, cupidCoins: 321, totalEarnedCoins: 432, referralCode: "KEEP", userName: "Owner", customField: "preserve", phone: "legacy" }, "users/original/orders/1234": { awb: "keep" } });
  const service = createProfileService(db, auth, FieldValue);
  await Promise.all([service.bootstrap("original"), service.bootstrap("original")]);
  const data = db.documents.get("users/original");
  assert.equal(data.walletBalance, 987); assert.equal(data.cupidCoins, 321); assert.equal(data.referralCode, "KEEP"); assert.equal(data.customField, "preserve"); assert.equal(data.phone, account.phoneNumber); assert.equal(data.legacyContactPhone, "legacy");
  assert.deepEqual(db.documents.get("users/original/orders/1234"), { awb: "keep" });
});
test("new phone-only profile skips email, generates referral, and awards referral once", async () => {
  const db = new MemoryFirestore({ "users/referrer": { referralCode: "REF", totalReferrals: 5, walletBalance: 100, cupidCoins: 100 } });
  const service = createProfileService(db, { getUser: async uid => ({ uid, phoneNumber: account.phoneNumber }) }, FieldValue);
  await Promise.all([service.bootstrap("new"), service.bootstrap("new")]);
  assert.equal(db.documents.get("users/new").email, "");
  assert.equal(db.documents.get("users/new").emailVerified, false);
  const results = await Promise.all([service.save("new", { userName: "Shopper", email: "" }, "REF", true), service.save("new", { userName: "Shopper", email: "" }, "REF", true)]);
  assert.equal(results.filter(result => result.completedSignup).length, 1);
  assert.equal(db.documents.get("users/new").walletBalance, 79);
  assert.equal(db.documents.get("users/referrer").walletBalance, 179);
  assert.equal(db.documents.get("users/referrer").totalReferrals, 6);
});
test("optional email updates never verify a different email or alter orders", async () => {
  const db = new MemoryFirestore({ "users/original": { userName: "Owner", email: "owner@example.test", emailVerified: true }, "users/original/orders/1234": { trackingStatus: "IN TRANSIT" } });
  const service = createProfileService(db, auth, FieldValue);
  await service.save("original", { email: "Different@example.test" });
  assert.equal(db.documents.get("users/original").emailVerified, false);
  assert.equal(db.documents.get("users/original").emailNormalized, "different@example.test");
  await service.save("original", { email: "" });
  assert.equal(db.documents.get("users/original").email, "");
  assert.deepEqual(db.documents.get("users/original/orders/1234"), { trackingStatus: "IN TRANSIT" });
});
test("profile allowlist rejects identity, reward, ownership and prototype fields", () => {
  for (const field of ["uid", "phone", "emailVerified", "shopifyCustomerId", "walletBalance", "cupidCoins", "rewardGiven", "constructor", "toString"]) assert.throws(() => validateProfile({ [field]: "spoof" }), { code: "INVALID_PROFILE" });
  assert.throws(() => validateProfile({ email: "bad" }), { code: "INVALID_PROFILE" });
});
test("legacy profile completion cannot claim signup rewards", async () => {
  const db = new MemoryFirestore({ "users/original": { walletBalance: 15, rewardGiven: false } });
  const service = createProfileService(db, auth, FieldValue);
  await service.bootstrap("original");
  const result = await service.save("original", { userName: "Owner" }, "ANY", true);
  assert.equal(result.completedSignup, false); assert.equal(db.documents.get("users/original").walletBalance, 15);
});
test("strict Bearer authentication derives UID and checks revocation", async () => {
  let calls = 0;
  const verifier = createTokenVerifier({ verifyIdToken: async (token, revoked) => { assert.equal(token, "valid"); assert.equal(revoked, true); return { uid: "original" }; } });
  for (const authorization of [undefined, "Basic valid", "valid", "Bearer ", "Bearer valid extra"]) { const res = response(); await verifier({ headers: { authorization } }, res, () => calls++); assert.equal(res.statusCode, 401); }
  const req = { headers: { authorization: "Bearer valid" }, body: { uid: "victim" } };
  await verifier(req, response(), () => calls++); assert.equal(req.user.uid, "original"); assert.equal(calls, 1);
  const bad = response(); await createTokenVerifier({ verifyIdToken: async () => { throw new Error("secret detail"); } })({ headers: { authorization: "Bearer expired" } }, bad, () => calls++);
  assert.equal(bad.statusCode, 401); assert.ok(!JSON.stringify(bad.body).includes("secret"));
});
test("deletion rejects old and exchanged sessions but accepts recent phone auth", () => {
  for (const user of [{ auth_time: 0 }, { auth_time: Date.now() / 1000, firebase: { sign_in_provider: "custom" } }, {}]) { const res = response(); requireRecentAuth({ user }, res, () => assert.fail()); assert.equal(res.statusCode, 403); }
  let allowed = false; requireRecentAuth({ user: { auth_time: Date.now() / 1000, firebase: { sign_in_provider: "phone" } } }, response(), () => { allowed = true; }); assert.ok(allowed);
});
test("Shopify HMAC verifies original bytes and rejects tampering", () => {
  const old = process.env.SHOPIFY_WEBHOOK_SECRET; process.env.SHOPIFY_WEBHOOK_SECRET = "test-secret";
  try {
    const rawBody = Buffer.from('{ "id": 1234 }'); const signature = crypto.createHmac("sha256", "test-secret").update(rawBody).digest("base64");
    let called = false; verifyShopifyWebhook({ rawBody, headers: { "x-shopify-hmac-sha256": signature } }, response(), () => { called = true; }); assert.ok(called);
    const bad = response(); verifyShopifyWebhook({ rawBody: Buffer.from("{}"), headers: { "x-shopify-hmac-sha256": signature } }, bad, () => assert.fail()); assert.equal(bad.statusCode, 401);
  } finally { if (old === undefined) delete process.env.SHOPIFY_WEBHOOK_SECRET; else process.env.SHOPIFY_WEBHOOK_SECRET = old; }
});
test("Shiprocket requires its configured token regardless of retired validation flags", () => {
  const old = { token: process.env.SHIPROCKET_WEBHOOK_TOKEN, validated: process.env.SHIPROCKET_WEBHOOK_VALIDATED };
  try {
    delete process.env.SHIPROCKET_WEBHOOK_TOKEN; process.env.SHIPROCKET_WEBHOOK_VALIDATED = "false";
    const disabled = response(); verifyShiprocketWebhook({ headers: { "x-api-key": "test-token" } }, disabled, () => assert.fail()); assert.equal(disabled.statusCode, 503);
    process.env.SHIPROCKET_WEBHOOK_TOKEN = "test-token";
    let allowed = false; verifyShiprocketWebhook({ headers: { "x-api-key": "test-token" } }, response(), () => { allowed = true; }); assert.ok(allowed);
    const bad = response(); verifyShiprocketWebhook({ headers: { "x-api-key": "wrong" } }, bad, () => assert.fail()); assert.equal(bad.statusCode, 401);
  } finally { for (const [key, value] of [["SHIPROCKET_WEBHOOK_TOKEN", old.token], ["SHIPROCKET_WEBHOOK_VALIDATED", old.validated]]) value === undefined ? delete process.env[key] : process.env[key] = value; }
});

test("Shopify store configuration supports existing slug or domain without accepting URL paths", () => {
  const { storefrontConfig } = require("../services/shopifyConfig");
  for (const setting of [{ SHOPIFY_SHOP: "test-shop" }, { SHOPIFY_STORE: "https://test-shop.myshopify.com/" }]) {
    const config = storefrontConfig({ ...setting, SHOPIFY_STOREFRONT_TOKEN: "local-test" });
    assert.equal(config.domain, "test-shop.myshopify.com");
    assert.equal(config.version, "2026-01");
    assert.equal(config.valid, true);
  }
  assert.equal(storefrontConfig({ SHOPIFY_STORE: "test-shop.myshopify.com/path", SHOPIFY_STOREFRONT_TOKEN: "local-test" }).valid, false);
});
test("duplicate Shopify event preserves UID, tracking, coins and order document", async () => {
  const original = { orderId: "1234", orderNumber: 42, awb: "AWB", trackingStatus: "DELIVERED", coinRewardGiven: true, earnedCoins: 50 };
  const db = new MemoryFirestore({ "users/original": { email: "old@example.test" }, "users/original/orders/1234": original, "users/other": { email: order.email } });
  await createOrderLifecycle(db, auth, FieldValue, async () => null).saveOrderToFirebase(order);
  assert.deepEqual(db.documents.get("users/original/orders/1234"), original); assert.ok(!db.documents.has("users/other/orders/1234"));
});
test("unverified or ambiguous contact email cannot acquire orders", async () => {
  for (const extra of [{}, { "users/other": { email: order.email } }]) {
    const db = new MemoryFirestore({ "users/original": { email: order.email }, ...extra });
    const service = createOrderLifecycle(db, { getUser: async () => ({ ...account, emailVerified: false }) }, FieldValue, async () => null);
    const result = await service.saveOrderToFirebase(order); assert.equal(result.saved, false); assert.ok(db.documents.has("unresolvedShopifyOrders/1234")); assert.ok(!db.documents.has("users/original/orders/1234"));
  }
});
test("legacy verified-email webhook still creates the existing document shape", async () => {
  const db = new MemoryFirestore({ "users/original": { email: order.email } });
  const service = createOrderLifecycle(db, auth, FieldValue, async () => null);
  await service.saveOrderToFirebase(order);
  const saved = db.documents.get("users/original/orders/1234"); assert.equal(saved.orderNumber, 42); assert.equal(saved.orderId, "1234"); assert.equal(saved.total, 1000); assert.equal(saved.coinRewardGiven, false);
});
test("concurrent delivery events credit existing formula exactly once", async () => {
  const db = new MemoryFirestore({ "users/original": { cupidCoins: 20, totalEarnedCoins: 30 }, "users/original/orders/1234": { orderId: "1234", orderNumber: 42, total: 1000, awb: "KEEP", coinRewardGiven: false } });
  const service = createOrderLifecycle(db, auth, FieldValue, async () => null);
  await Promise.all(Array.from({ length: 6 }, () => service.updateTrackingStatus({ order_id: "42", current_status: "DELIVERED" })));
  assert.equal(db.documents.get("users/original").cupidCoins, 70); assert.equal(db.documents.get("users/original").totalEarnedCoins, 80);
  assert.equal(db.documents.get("users/original/orders/1234").earnedCoins, 50); assert.equal(db.documents.get("users/original/orders/1234").awb, "KEEP");
});
test("tracking statuses, AWB, delivery estimate and scan history are preserved", async () => {
  const db = new MemoryFirestore({ "users/original": {}, "users/original/orders/1234": { orderNumber: 42, total: 1000, awb: "KEEP", estimatedDeliveryDate: "tomorrow", trackingHistory: [{ date: "one", activity: "pickup" }] } });
  const service = createOrderLifecycle(db, auth, FieldValue, async () => null);
  for (const status of ["OUT FOR PICKUP", "PICKED UP", "IN TRANSIT", "OUT FOR DELIVERY", "DELIVERED", "CANCELLED"]) { await service.updateTrackingStatus({ order_id: "42", current_status: status, scans: [] }); assert.equal(db.documents.get("users/original/orders/1234").trackingStatus, status); }
  const saved = db.documents.get("users/original/orders/1234"); assert.equal(saved.awb, "KEEP"); assert.equal(saved.estimatedDeliveryDate, "tomorrow"); assert.equal(saved.trackingHistory.length, 1);
  assert.equal(trackingPatch({ scans: [{ activity: "new" }] }, saved).trackingHistory.length, 2);
});
test("tracking arriving before order is retained and replayed", async () => {
  const db = new MemoryFirestore({ "users/original": { email: order.email } });
  const service = createOrderLifecycle(db, auth, FieldValue, async () => null);
  await service.updateTrackingStatus({ order_id: "42", current_status: "IN TRANSIT", awb: "AWB" });
  await service.saveOrderToFirebase(order); assert.equal(db.documents.get("users/original/orders/1234").awb, "AWB");
});
test("deletion is phone/email-independent and retryable without touching Shopify", async () => {
  const seed = { "users/original": { phone: account.phoneNumber }, "users/other": { cupidCoins: 500 } };
  for (const name of ["address", "cart", "orders", "wishlist", "coupons"]) seed[`users/original/${name}/1234`] = { saved: true };
  seed["users/original/address/1234/nested/1"] = { saved: true };
  const db = new MemoryFirestore(seed); let attempts = 0;
  const remove = createAccountDeletion(db, { deleteUser: async uid => { assert.equal(uid, "original"); if (++attempts === 1) throw new Error("temporary"); } }, FieldValue);
  await assert.rejects(remove("original")); assert.equal(db.documents.get("accountDeletions/original").state, "pending");
  await assert.rejects(createProfileService(db, auth, FieldValue).bootstrap("original"), { code: "ACCOUNT_DELETING" });
  await remove("original"); assert.ok(!db.documents.has("users/original")); assert.equal(db.documents.get("users/other").cupidCoins, 500); assert.equal(db.documents.get("accountDeletions/original").state, "complete"); assert.ok(db.documents.get("orderOwners/1234").deleted);
});
test("checkout validates variants and is gated without a production assumption", async () => {
  assert.equal(cartToken("gid://shopify/Cart/example?key=private"), "example");
  assert.throws(() => checkoutLines([{ merchandiseId: "spoof", quantity: 1 }]));
  assert.throws(() => checkoutLines([{ merchandiseId: "gid://shopify/ProductVariant/1", quantity: -1 }]));
  assert.deepEqual(checkoutLines([{ merchandiseId: "gid://shopify/ProductVariant/1", quantity: 2, uid: "victim" }]), [{ merchandiseId: "gid://shopify/ProductVariant/1", quantity: 2 }]);
  const old = process.env.CHECKOUT_ENABLED; process.env.CHECKOUT_ENABLED = "false";
  try { await assert.rejects(createCheckoutService(new MemoryFirestore(), async () => assert.fail())("original", []), { code: "CHECKOUT_UNAVAILABLE" }); }
  finally { old === undefined ? delete process.env.CHECKOUT_ENABLED : process.env.CHECKOUT_ENABLED = old; }
});

test("trusted checkout mapping assigns a phone-only order without trusting contact email", async () => {
  const settings = { CHECKOUT_ENABLED: "true", SHOPIFY_STOREFRONT_DOMAIN: "example.myshopify.com", SHOPIFY_STOREFRONT_TOKEN: "test-only", SHOPIFY_STOREFRONT_API_VERSION: "2026-01" };
  const previous = Object.fromEntries(Object.keys(settings).map(key => [key, process.env[key]]));
  Object.assign(process.env, settings);
  try {
    const db = new MemoryFirestore({ "users/original": { phone: account.phoneNumber } });
    const create = createCheckoutService(db, async (_url, options) => {
      const input = JSON.parse(options.body).variables.input;
      assert.equal(input.buyerIdentity, undefined);
      assert.equal(input.lines[0].uid, undefined);
      return { ok: true, json: async () => ({ data: { cartCreate: { cart: { id: "gid://shopify/Cart/test-cart?key=secret", checkoutUrl: "https://example.test/checkout" }, userErrors: [] } } }) };
    });
    await create("original", [{ merchandiseId: "gid://shopify/ProductVariant/1", quantity: 1, uid: "victim" }]);
    const result = await createOrderLifecycle(db, auth, FieldValue, async () => null).saveOrderToFirebase({ ...order, email: "another@example.test", cart_token: "test-cart" });
    assert.equal(result.saved, true);
    assert.ok(db.documents.has("users/original/orders/1234"));
    assert.ok(!db.documents.has("users/victim/orders/1234"));
  } finally {
    for (const [key, value] of Object.entries(previous)) value === undefined ? delete process.env[key] : process.env[key] = value;
  }
});

test("email-free checkout receives tracking even after checkout creation is paused", async () => {
  const key = crypto.createHash("sha256").update("phone-cart").digest("hex");
  const db = new MemoryFirestore({ "users/phone": { phone: account.phoneNumber }, [`checkoutOwners/${key}`]: { uid: "phone", orderId: null } });
  const service = createOrderLifecycle(db, { getUser: async () => assert.fail("email lookup must not be needed") }, FieldValue, async () => null);
  const previous = process.env.CHECKOUT_ENABLED;
  process.env.CHECKOUT_ENABLED = "false";
  try {
    await service.updateTrackingStatus({ order_id: "42", current_status: "IN TRANSIT", awb: "PHONE-AWB" });
    const result = await service.saveOrderToFirebase({ ...order, email: null, contact_email: null, cart_token: "phone-cart" });
    assert.equal(result.saved, true);
    assert.equal(db.documents.get("users/phone/orders/1234").awb, "PHONE-AWB");
    assert.equal(db.documents.get("users/phone/orders/1234").trackingStatus, "IN TRANSIT");
    await service.updateTrackingStatus({ order_id: "42", current_status: "DELIVERED" });
    await service.saveOrderToFirebase({ ...order, email: "changed@example.test", cart_token: "phone-cart" });
    assert.equal(db.documents.get("users/phone/orders/1234").trackingStatus, "DELIVERED");
    assert.equal(db.documents.get("users/phone").cupidCoins, 50);
  } finally { previous === undefined ? delete process.env.CHECKOUT_ENABLED : process.env.CHECKOUT_ENABLED = previous; }
});

test("a consumed checkout cannot assign a second order through email fallback", async () => {
  const key = crypto.createHash("sha256").update("used-cart").digest("hex");
  const db = new MemoryFirestore({ "users/original": { email: order.email }, [`checkoutOwners/${key}`]: { uid: "phone", orderId: "999" } });
  const result = await createOrderLifecycle(db, auth, FieldValue, async () => null).saveOrderToFirebase({ ...order, cart_token: "used-cart" });
  assert.equal(result.saved, false);
  assert.equal(result.reason, "checkout_already_used");
  assert.ok(!db.documents.has("users/original/orders/1234"));
});

test("checkout prefills verified phone and optional profile email without exposing client identity fields", async () => {
  const settings = { CHECKOUT_ENABLED: "true", SHOPIFY_STOREFRONT_DOMAIN: "example.myshopify.com", SHOPIFY_STOREFRONT_TOKEN: "test-only", SHOPIFY_STOREFRONT_API_VERSION: "2026-01" };
  const previous = Object.fromEntries(Object.keys(settings).map(key => [key, process.env[key]]));
  Object.assign(process.env, settings);
  try {
    for (const email of ["", "contact@example.test"]) {
      const db = new MemoryFirestore({ "users/phone": { email, phone: "untrusted-profile-phone" } });
      const create = createCheckoutService(db, async (_url, options) => {
        const input = JSON.parse(options.body).variables.input;
        assert.deepEqual(input.buyerIdentity, { phone: account.phoneNumber, ...(email ? { email } : {}) });
        assert.equal(input.attributes, undefined);
        return { ok: true, json: async () => ({ data: { cartCreate: { cart: { id: "gid://shopify/Cart/phone-cart?key=secret", checkoutUrl: "https://example.test/checkout" }, userErrors: [] } } }) };
      });
      await create("phone", [{ merchandiseId: "gid://shopify/ProductVariant/1", quantity: 1 }], account.phoneNumber);
      assert.equal([...db.documents.entries()].find(([path]) => path.startsWith("checkoutOwners/"))[1].uid, "phone");
    }
    await assert.rejects(createCheckoutService(new MemoryFirestore(), async () => assert.fail("must not create a cart without a profile"))("missing", [{ merchandiseId: "gid://shopify/ProductVariant/1", quantity: 1 }]), { code: "PROFILE_MISSING" });
    const deletingDb = new MemoryFirestore({ "users/phone": {} });
    const deletingCheckout = createCheckoutService(deletingDb, async () => {
      await deletingDb.collection("accountDeletions").doc("phone").set({ state: "pending" });
      return { ok: true, json: async () => ({ data: { cartCreate: { cart: { id: "gid://shopify/Cart/deleting-cart", checkoutUrl: "https://example.test/checkout" }, userErrors: [] } } }) };
    });
    await assert.rejects(deletingCheckout("phone", [{ merchandiseId: "gid://shopify/ProductVariant/1", quantity: 1 }]), { code: "ACCOUNT_DELETING" });
    assert.ok(![...deletingDb.documents.keys()].some(path => path.startsWith("checkoutOwners/")), "deletion during Shopify request must prevent returning an associated checkout");
  } finally { for (const [key, value] of Object.entries(previous)) value === undefined ? delete process.env[key] : process.env[key] = value; }
});
