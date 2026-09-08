function storefrontConfig(env = process.env) {
  let domain = (env.SHOPIFY_STOREFRONT_DOMAIN || env.SHOPIFY_STORE || env.SHOPIFY_SHOP || "").trim().replace(/^https:\/\//, "").replace(/\/$/, "");
  if (/^[a-zA-Z0-9][a-zA-Z0-9-]*$/.test(domain)) domain += ".myshopify.com";
  const version = env.SHOPIFY_STOREFRONT_API_VERSION || "2026-01";
  const token = env.SHOPIFY_STOREFRONT_TOKEN;
  const valid = /^[a-zA-Z0-9][a-zA-Z0-9.-]+$/.test(domain) && /^\d{4}-\d{2}$/.test(version) && Boolean(token?.trim());
  return { domain, version, token, valid };
}
module.exports = { storefrontConfig };
