const MOBILE_SOURCE_KEY = "mobile_order_source";
const MOBILE_SOURCE_VALUE = "Mobile App";
const MOBILE_ORDER_TAG = "Mobile App";

function shopifyAdminConfig(env = process.env) {
  let domain = String(env.SHOPIFY_STORE || env.SHOPIFY_SHOP || "").trim()
    .replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (domain && !domain.includes(".")) domain += ".myshopify.com";
  const version = env.SHOPIFY_ADMIN_API_VERSION || env.SHOPIFY_STOREFRONT_API_VERSION || "2026-01";
  const token = env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  return { domain, version, token, valid: Boolean(domain && token && /^\d{4}-\d{2}$/.test(version)) };
}

function orderAdminId(order) {
  if (typeof order?.admin_graphql_api_id === "string" && /^gid:\/\/shopify\/Order\/\d+$/.test(order.admin_graphql_api_id)) return order.admin_graphql_api_id;
  if (/^\d+$/.test(String(order?.id || ""))) return `gid://shopify/Order/${order.id}`;
  return null;
}

function attributeEntries(order) {
  return [order?.note_attributes, order?.custom_attributes, order?.attributes]
    .flatMap(value => Array.isArray(value) ? value : [])
    .map(value => ({ key: value.name ?? value.key, value: value.value }))
    .filter(value => typeof value.key === "string");
}

function isMobileAppOrder(order) {
  return attributeEntries(order).some(attribute => attribute.key === MOBILE_SOURCE_KEY && attribute.value === MOBILE_SOURCE_VALUE);
}

async function adminGraphql(query, variables, fetchImpl = fetch) {
  const config = shopifyAdminConfig();
  if (!config.valid) throw new Error("Shopify Admin API is not configured for order tagging.");
  const response = await fetchImpl(`https://${config.domain}/admin/api/${config.version}/graphql.json`, {
    method: "POST",
    signal: AbortSignal.timeout(15000),
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": config.token },
    body: JSON.stringify({ query, variables }),
  });
  const result = await response.json();
  if (!response.ok || result.errors?.length) throw new Error(result.errors?.[0]?.message || `Shopify Admin API error: ${response.status}`);
  return result;
}

async function tagMobileAppOrder(order, fetchImpl = fetch) {
  if (!isMobileAppOrder(order)) return { tagged: false, skipped: true, reason: "not_mobile_app" };
  const id = orderAdminId(order);
  if (!id) throw new Error("Shopify order is missing a valid Admin GraphQL ID.");
  const existingResult = await adminGraphql("query MobileOrderTags($id: ID!) { order(id: $id) { id tags } }", { id }, fetchImpl);
  const existing = existingResult.data?.order;
  if (!existing) throw new Error("Shopify order was not found in Admin API.");
  const tags = Array.isArray(existing.tags) ? existing.tags : [];
  if (tags.includes(MOBILE_ORDER_TAG)) return { tagged: true, alreadyTagged: true, id };
  const result = await adminGraphql("mutation TagMobileOrder($input: OrderInput!) { orderUpdate(input: $input) { order { id tags } userErrors { field message } } }", { input: { id, tags: [...tags, MOBILE_ORDER_TAG] } }, fetchImpl);
  const errors = result.data?.orderUpdate?.userErrors || [];
  if (errors.length) throw new Error(errors.map(error => error.message).join("; "));
  return { tagged: true, id };
}

module.exports = { MOBILE_SOURCE_KEY, MOBILE_SOURCE_VALUE, MOBILE_ORDER_TAG, shopifyAdminConfig, orderAdminId, attributeEntries, isMobileAppOrder, tagMobileAppOrder };
