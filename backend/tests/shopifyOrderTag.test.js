const test = require("node:test");
const assert = require("node:assert/strict");
const { tagMobileAppOrder, isMobileAppOrder } = require("../services/shopifyOrderTagService");

const previousEnv = { SHOPIFY_STORE: process.env.SHOPIFY_STORE, SHOPIFY_ADMIN_ACCESS_TOKEN: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN, SHOPIFY_ADMIN_API_VERSION: process.env.SHOPIFY_ADMIN_API_VERSION };
process.env.SHOPIFY_STORE = "example.myshopify.com";
process.env.SHOPIFY_ADMIN_ACCESS_TOKEN = "test-admin-token";
process.env.SHOPIFY_ADMIN_API_VERSION = "2026-01";
test.after(() => {
  for (const [key, value] of Object.entries(previousEnv)) value === undefined ? delete process.env[key] : process.env[key] = value;
});

function response(body, ok = true) {
  return { ok, status: ok ? 200 : 500, json: async () => body };
}

test("mobile order is tagged while preserving existing Shopify tags", async () => {
  const requests = [];
  const result = await tagMobileAppOrder({
    id: 12345,
    note_attributes: [{ name: "mobile_order_source", value: "Mobile App" }],
  }, async (_url, init) => {
    const body = JSON.parse(init.body);
    requests.push(body);
    if (body.query.startsWith("query")) return response({ data: { order: { id: "gid://shopify/Order/12345", tags: ["VIP"] } } });
    return response({ data: { orderUpdate: { order: { id: "gid://shopify/Order/12345", tags: ["VIP", "Mobile App"] }, userErrors: [] } } });
  });
  assert.deepEqual(result, { tagged: true, id: "gid://shopify/Order/12345" });
  assert.deepEqual(requests[1].variables.input.tags, ["VIP", "Mobile App"]);
});

test("website order is left unchanged without a mobile cart attribute", async () => {
  let called = false;
  const result = await tagMobileAppOrder({ id: 99, note_attributes: [{ name: "campaign", value: "website" }] }, async () => { called = true; });
  assert.deepEqual(result, { tagged: false, skipped: true, reason: "not_mobile_app" });
  assert.equal(called, false);
  assert.equal(isMobileAppOrder({ note_attributes: [{ name: "mobile_order_source", value: "Website" }] }), false);
});

test("duplicate webhook delivery does not rewrite an existing tag", async () => {
  let mutationCalled = false;
  const result = await tagMobileAppOrder({ id: 77, custom_attributes: [{ key: "mobile_order_source", value: "Mobile App" }] }, async (_url, init) => {
    const body = JSON.parse(init.body);
    if (body.query.startsWith("query")) return response({ data: { order: { id: "gid://shopify/Order/77", tags: ["Mobile App", "VIP"] } } });
    mutationCalled = true;
    return response({});
  });
  assert.deepEqual(result, { tagged: true, alreadyTagged: true, id: "gid://shopify/Order/77" });
  assert.equal(mutationCalled, false);
});

test("Admin API errors are surfaced for webhook retry", async () => {
  await assert.rejects(tagMobileAppOrder({ id: 44, note_attributes: [{ name: "mobile_order_source", value: "Mobile App" }] }, async () => response({ errors: [{ message: "forbidden" }] }, false),), /forbidden/);
});
