const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const { MemoryFirestore } = require("./memoryFirestore");
function load(relative, mocks = {}) {
  const filename = path.resolve(__dirname, "../..", relative);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(source, { module, exports: module.exports, require: id => Object.hasOwn(mocks, id) ? mocks[id] : require(id), Date, Map, Set, WeakMap, Promise, Proxy, console, setTimeout, clearTimeout }, { filename });
  return module.exports;
}
test("phone input normalizes Indian local, country-code and pasted formats", () => {
  const { normalizePhone, resendSeconds } = load("lib/phone.ts");
  for (const value of ["9000000000", "+91 90000 00000", "919000000000", "09000000000"]) assert.equal(normalizePhone(value), "+919000000000");
  for (const value of ["123", "1234567890", "+1 9999999999", "call9000000000", "+9000000000", "+91+9000000000", ""]) assert.equal(normalizePhone(value), null);
  assert.equal(resendSeconds(30000, 1000), 29); assert.equal(resendSeconds(30000, 60000), 0);
});

test("phone checkout always uses the authenticated backend and never falls back after failure", async () => {
  const requests = [];
  const unavailable = new Error("backend unavailable");
  const { createCheckoutCart } = load("lib/shopify.ts", {
    "./api": { ApiError: Error, apiRequest: async (path, init) => { requests.push({ path, input: JSON.parse(init.body) }); throw unavailable; } },
    "./analytics": { Analytics: { beginCheckout: () => assert.fail("failed checkout must not emit beginCheckout") } },
  });
  const items = [{ variantId: "gid://shopify/ProductVariant/1", quantity: 2, price: 100, title: "Shirt" }];
  await assert.rejects(createCheckoutCart(items, { uid: "phone", email: null }), error => error === unavailable);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].path, "/api/checkout");
  assert.deepEqual(JSON.parse(JSON.stringify(requests[0].input)), { lines: [{ merchandiseId: "gid://shopify/ProductVariant/1", quantity: 2 }] });
  await assert.rejects(createCheckoutCart(items, null));
  assert.equal(requests.length, 1, "guest must sign in before a checkout is created");
});
test("existing email/password user links credential without sign-in or UID change", async () => {
  const { applyPhoneCredential } = load("lib/phoneCredential.ts");
  let linked = 0; const user = { uid: "original" };
  await applyPhoneCredential({ purpose: "link", credential: "otp-proof", expectedUid: "original", currentUser: () => user, signIn: async () => assert.fail("must not create/sign in a second account"), link: async proof => { assert.equal(proof, "otp-proof"); linked++; }, change: async () => assert.fail(), reauthenticate: async () => assert.fail() });
  assert.equal(linked, 1); assert.equal(user.uid, "original");
});
test("phone credential collision propagates without merge/delete/sign-in fallback", async () => {
  const { applyPhoneCredential } = load("lib/phoneCredential.ts");
  await assert.rejects(applyPhoneCredential({ purpose: "link", credential: "proof", expectedUid: "original", currentUser: () => ({ uid: "original" }), signIn: async () => assert.fail(), link: async () => { throw { code: "auth/credential-already-in-use" }; } }), { code: "auth/credential-already-in-use" });
});
test("account switch cancels linking before SDK mutation", async () => {
  const { applyPhoneCredential } = load("lib/phoneCredential.ts");
  await assert.rejects(applyPhoneCredential({ purpose: "link", credential: "proof", expectedUid: "original", currentUser: () => ({ uid: "other" }), link: async () => assert.fail() }), { code: "auth/user-mismatch" });
});
test("new phone sign-in and reauthentication use distinct SDK operations", async () => {
  const { applyPhoneCredential } = load("lib/phoneCredential.ts");
  let current = null; let reauthenticated = false;
  await applyPhoneCredential({ purpose: "login", credential: "otp", expectedUid: null, currentUser: () => current, signIn: async () => { current = { uid: "new" }; } });
  await applyPhoneCredential({ purpose: "reauth", credential: "otp", expectedUid: "new", currentUser: () => current, reauthenticate: async () => { reauthenticated = true; }, signIn: async () => assert.fail() });
  assert.ok(reauthenticated); assert.equal(current.uid, "new");
});
test("safe messages cover expiry, invalid OTP, network, rate limits and conflicts", () => {
  const { authErrorMessage } = load("lib/authErrors.ts");
  for (const code of ["auth/invalid-phone-number", "auth/invalid-verification-code", "auth/session-expired", "auth/too-many-requests", "auth/network-request-failed", "auth/credential-already-in-use", "auth/operation-not-allowed", "unknown"]) {
    const message = authErrorMessage({ code, message: "SECRET backend text +919000000000" }); assert.ok(message.length > 10); assert.ok(!message.includes("SECRET")); assert.ok(!message.includes("9000000000"));
  }
});
test("late cart results cannot populate another user's or guest's store", () => {
  const scope = load("lib/sessionScope.ts");
  const { useCartStore } = load("store/cartStore.ts", { "@/lib/sessionScope": scope });
  scope.setSessionScope("A"); const old = scope.scopeResult([{ cartKey: "p::v", quantity: 2 }], "A");
  useCartStore.getState().setCartItems(old); assert.equal(useCartStore.getState().cartCount, 2);
  scope.setSessionScope("B"); useCartStore.getState().setCartItems([]); useCartStore.getState().setCartItems(old); assert.equal(useCartStore.getState().cartCount, 0);
  scope.setSessionScope(null); useCartStore.getState().setCartItems(old); assert.equal(useCartStore.getState().cartCount, 0);
});
test("order store resets loading and data on account switch and direct entry", () => {
  const { useOrderStore } = load("store/orderStore.ts");
  useOrderStore.getState().startSession("A"); useOrderStore.getState().setOrders([{ orderId: "1234" }]);
  useOrderStore.getState().startSession("B"); assert.equal(useOrderStore.getState().orders.length, 0); assert.equal(useOrderStore.getState().ordersLoaded, false); assert.equal(useOrderStore.getState().ownerUid, "B");
  useOrderStore.getState().startSession(null); assert.equal(useOrderStore.getState().ordersLoaded, true);
});
test("native cart adapter retains variant keys, quantities, UID paths and guest storage", async () => {
  const db = new MemoryFirestore(); const storage = new Map(); const scope = load("lib/sessionScope.ts");
  const { createCartKey } = load("store/cartStore.ts", { "@/lib/sessionScope": scope });
  const adapter = {
    collection: (_db, ...parts) => db.collection(parts.join("/")),
    doc: (_db, ...parts) => { const id = parts.pop(); return db.collection(parts.join("/")).doc(id); },
    getDocs: ref => ref.get(), setDoc: (ref, value) => ref.set(value), deleteDoc: ref => ref.delete(),
    writeBatch: () => { const writes = []; return { set: (ref, value) => writes.push(() => ref.set(value)), delete: ref => writes.push(() => ref.delete()), commit: async () => { for (const write of writes) await write(); } }; },
  };
  const cart = load("lib/cart.ts", { "@/firebaseConfig": { db }, "@react-native-firebase/firestore": adapter, "@react-native-async-storage/async-storage": { getItem: async key => storage.get(key) || null, setItem: async (key, value) => storage.set(key, value), removeItem: async key => storage.delete(key) }, "@/store/cartStore": { CART_STORAGE_KEY: "cartItems", createCartKey }, "./sessionScope": scope });
  const user = { uid: "original" }; const product = { productId: "gid://shopify/Product/1", variantId: "gid://shopify/ProductVariant/2", title: "Shirt", price: 500, quantity: 1, size: "M", image: "", handle: "shirt" }; product.cartKey = createCartKey(product.productId, product.variantId);
  await cart.addCartLine(user, product); await cart.addCartLine(user, product);
  let items = await cart.loadCart(user); assert.equal(items.length, 1); assert.equal(items[0].quantity, 2);
  const variant = { ...product, variantId: "gid://shopify/ProductVariant/3", size: "L" }; variant.cartKey = createCartKey(variant.productId, variant.variantId);
  await cart.addCartLine(user, variant); items = await cart.loadCart(user); assert.equal(items.length, 2);
  await cart.setCartLineQuantity(user, product.cartKey, 4); assert.equal((await cart.loadCart(user)).find(item => item.cartKey === product.cartKey).quantity, 4);
  await cart.addCartLine(null, product); assert.equal((await cart.loadCart(null)).length, 1); assert.equal((await cart.loadCart({ uid: "other" })).length, 0);
  assert.ok([...db.documents.keys()].every(key => key.startsWith("users/original/cart/")));
});
test("analytics failures never reject business-operation promises and auth events omit PII", async () => {
  const calls = [];
  const analytics = new Proxy({}, { get: (_target, method) => async (...args) => { calls.push({ method, args }); throw new Error("offline"); } });
  const { Analytics } = load("lib/analytics.ts", { "@react-native-firebase/analytics": { getAnalytics: () => analytics } });
  await Analytics.login("phone"); await Analytics.signUp("phone"); await Analytics.otp("phone_otp_verified", "login"); await Analytics.otp("phone_login_failed", "login", false, "arbitrary secret email@example.test"); await Analytics.beginCheckout(1000);
  assert.equal(calls.length, 5); assert.ok(!JSON.stringify(calls).includes("email@example.test")); assert.equal(calls[0].args[0].method, "phone");
});

test("analytics initialization failure is contained and purchase includes all line items", async () => {
  const broken = load("lib/analytics.ts", { "@react-native-firebase/analytics": { getAnalytics: () => { throw new Error("native unavailable"); } } });
  await broken.Analytics.login("phone");
  let purchase;
  const working = load("lib/analytics.ts", { "@react-native-firebase/analytics": { getAnalytics: () => ({ logPurchase: async value => { purchase = value; } }) } });
  await working.Analytics.purchase("1234", 500, [{ id: "1", title: "Shirt", quantity: 2, price: 100 }, { id: "2", title: "Dress", quantity: 1, price: 300 }]);
  assert.equal(purchase.items.length, 2);
  assert.equal(purchase.items[0].quantity, 2);
  assert.equal(purchase.value, 500);
});

test("free-text search analytics never includes contact details or addresses", async () => {
  let event;
  const { Analytics } = load("lib/analytics.ts", { "@react-native-firebase/analytics": { getAnalytics: () => ({ logEvent: async (...args) => { event = args; } }) } });
  await Analytics.search("name@example.test +919000000000 123 Private Street");
  assert.equal(event[0], "search");
  assert.deepEqual(JSON.parse(JSON.stringify(event[1])), { query_length_band: "long" });
});
