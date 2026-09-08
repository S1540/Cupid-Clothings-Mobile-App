const crypto = require("node:crypto");
function equalSecret(actual, expected) {
  if (typeof actual !== "string" || typeof expected !== "string" || !expected) return false;
  const a = Buffer.from(actual); const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function verifyShopifyWebhook(req, res, next) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) return res.status(503).json({ code: "WEBHOOK_NOT_CONFIGURED" });
  if (!Buffer.isBuffer(req.rawBody)) return res.sendStatus(401);
  const expected = crypto.createHmac("sha256", secret).update(req.rawBody).digest("base64");
  if (!equalSecret(req.headers["x-shopify-hmac-sha256"], expected)) return res.sendStatus(401);
  return next();
}
function verifyShiprocketWebhook(req, res, next) {
  if (!process.env.SHIPROCKET_WEBHOOK_TOKEN) return res.status(503).json({ code: "WEBHOOK_NOT_CONFIGURED" });
  if (!equalSecret(req.headers["x-api-key"], process.env.SHIPROCKET_WEBHOOK_TOKEN)) return res.sendStatus(401);
  return next();
}
module.exports = { equalSecret, verifyShopifyWebhook, verifyShiprocketWebhook };
