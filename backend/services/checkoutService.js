const { createHash } = require("node:crypto");
const { failure } = require("./profileService");
const { storefrontConfig } = require("./shopifyConfig");
function cartToken(id) {
  const match = /^gid:\/\/shopify\/Cart\/([^?]+)(?:\?.*)?$/.exec(id || "");
  return match ? match[1] : null;
}
function checkoutLines(input) {
  if (!Array.isArray(input) || input.length < 1 || input.length > 100) throw failure("INVALID_CART");
  return input.map(line => {
    if (!/^gid:\/\/shopify\/ProductVariant\/\d+$/.test(line?.merchandiseId) || !Number.isSafeInteger(line.quantity) || line.quantity < 1 || line.quantity > 99) throw failure("INVALID_CART");
    return { merchandiseId: line.merchandiseId, quantity: line.quantity };
  });
}
function createCheckoutService(db, fetchImpl = fetch) {
  return async (uid, input, verifiedPhone) => {
    if (process.env.CHECKOUT_ENABLED === "false") throw failure("CHECKOUT_UNAVAILABLE", 503);
    const lines = checkoutLines(input);
    const profile = await db.collection("users").doc(uid).get();
    const deleting = await db.collection("accountDeletions").doc(uid).get();
    if (deleting.exists || profile.data()?.deletionState) throw failure("ACCOUNT_DELETING", 409);
    if (!profile.exists) throw failure("PROFILE_MISSING", 409);
    const buyerIdentity = {};
    if (profile.data().email) buyerIdentity.email = profile.data().email;
    if (verifiedPhone) buyerIdentity.phone = verifiedPhone;
    const { domain, token, version, valid } = storefrontConfig();
    if (!valid) throw failure("CHECKOUT_UNAVAILABLE", 503);
    const response = await fetchImpl(`https://${domain}/api/${version}/graphql.json`, {
      method: "POST", signal: AbortSignal.timeout(15000),
      headers: { "Content-Type": "application/json", "X-Shopify-Storefront-Access-Token": token },
      body: JSON.stringify({ query: "mutation Cart($input: CartInput!) { cartCreate(input: $input) { cart { id checkoutUrl totalQuantity } userErrors { field message } } }", variables: { input: { lines, ...(Object.keys(buyerIdentity).length ? { buyerIdentity } : {}) } } }),
    });
    const result = await response.json();
    const cart = result.data?.cartCreate?.cart;
    const identifier = cartToken(cart?.id);
    if (!response.ok || result.errors?.length || result.data?.cartCreate?.userErrors?.length || !identifier || !cart.checkoutUrl) throw failure("CHECKOUT_UNAVAILABLE", 502);
    const key = createHash("sha256").update(identifier).digest("hex");
    await db.runTransaction(async tx => {
      const deletion = await tx.get(db.collection("accountDeletions").doc(uid));
      const currentProfile = await tx.get(db.collection("users").doc(uid));
      if (deletion.exists || currentProfile.data()?.deletionState) throw failure("ACCOUNT_DELETING", 409);
      if (!currentProfile.exists) throw failure("PROFILE_MISSING", 409);
      tx.create(db.collection("checkoutOwners").doc(key), { uid, createdAt: new Date(), orderId: null });
    });
    return result;
  };
}
module.exports = { createCheckoutService, checkoutLines, cartToken };
