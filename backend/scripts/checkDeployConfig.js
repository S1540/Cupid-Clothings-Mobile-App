// Read-only configuration check. Never prints credential values or contacts a provider.
const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, "../.env"), quiet: true });

const missing = [];
for (const key of ["SHOPIFY_WEBHOOK_SECRET", "SHIPROCKET_WEBHOOK_TOKEN", "SHOPIFY_STOREFRONT_TOKEN"]) {
  if (!process.env[key]?.trim()) missing.push(key);
}
if (!require("../services/shopifyConfig").storefrontConfig().valid) missing.push("valid Shopify Storefront configuration");
if (process.env.CHECKOUT_ENABLED === "false") missing.push("CHECKOUT_ENABLED is false");
console.log(JSON.stringify({
  configurationReady: missing.length === 0,
  missingOrDisabled: missing,
  externalChecksStillRequired: [
    "Deployed Firestore rules protect user data and server-owned checkout/order mappings",
    "Firebase Admin credentials identify the existing project and authenticate successfully",
    "Genuine Shopify cart_token matches the saved checkout mapping",
    "Genuine Shiprocket callback authenticates and matches the store order number",
    "Testers install the updated OTP app; old editable-email checkout assignment is not preserved",
  ],
}, null, 2));
if (missing.length) process.exitCode = 1;
