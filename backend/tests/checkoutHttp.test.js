const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { createHmac } = require('node:crypto');
const express = require('express');
const { MemoryFirestore, FieldValue } = require('./memoryFirestore');
const { createTokenVerifier } = require('../middleware/authPolicy');
const checkoutService = require('../services/checkoutService');
const { createOrderLifecycle } = require('../services/orderLifecycle');

// Load real route handlers with isolated Auth/Firestore/Shopify adapters.
// Never import firebaseAdmin, read .env, or contact a provider.
function route(file, mocks) {
  const filename = path.resolve(__dirname, '../routes', file);
  const localRequire = createRequire(filename);
  const module = { exports: {} };
  const execute = vm.runInThisContext(`(function(require, module, exports) {\n${fs.readFileSync(filename, 'utf8')}\n})`, { filename });
  execute(name => Object.hasOwn(mocks, name) ? mocks[name] : localRequire(name), module, module.exports);
  return module.exports;
}

test('HTTP checkout: phone-only ownership, signed order, tracking and cross-account denial', async () => {
  const settings = {
    CHECKOUT_ENABLED: 'true', SHIPROCKET_WEBHOOK_VALIDATED: 'true',
    SHOPIFY_WEBHOOK_SECRET: 'local-test-signature', SHIPROCKET_WEBHOOK_TOKEN: 'local-test-tracking',
    SHOPIFY_STOREFRONT_DOMAIN: '', SHOPIFY_STORE: 'https://example.myshopify.com/', SHOPIFY_STOREFRONT_TOKEN: 'local-test-only',
    SHOPIFY_STOREFRONT_API_VERSION: '',
  };
  const previous = Object.fromEntries(Object.keys(settings).map(key => [key, process.env[key]]));
  Object.assign(process.env, settings);
  let server;
  try {
    const db = new MemoryFirestore({ 'users/phone': { email: '', cupidCoins: 10, totalEarnedCoins: 10 }, 'users/other': {} });
    const verifyFirebaseToken = createTokenVerifier({ verifyIdToken: async (token, revoked) => {
      assert.equal(revoked, true);
      if (!['phone', 'other'].includes(token)) throw new Error('invalid test token');
      return { uid: token, phone_number: '+919000000000' };
    } });
    const lifecycle = createOrderLifecycle(db, { getUser: async () => assert.fail('phone checkout must not need email lookup') }, FieldValue, async () => null);
    const cartId = 'gid://shopify/Cart/http-test-cart?key=test-only';
    let shopifyCalls = 0;
    const createCheckoutService = database => checkoutService.createCheckoutService(database, async (_url, init) => {
      assert.equal(_url, 'https://example.myshopify.com/api/2026-01/graphql.json');
      shopifyCalls++;
      const input = JSON.parse(init.body).variables.input;
      assert.deepEqual(input.buyerIdentity, { phone: '+919000000000' });
      assert.deepEqual(input.lines, [{ merchandiseId: 'gid://shopify/ProductVariant/123', quantity: 2 }]);
      return { ok: true, json: async () => ({ data: { cartCreate: { cart: { id: cartId, checkoutUrl: 'https://example.test/checkout', totalQuantity: 2 }, userErrors: [] } } }) };
    });
    const app = express();
    app.use(express.json({ limit: '2mb', verify: (req, _res, buffer) => { req.rawBody = Buffer.from(buffer); } }));
    app.use('/api/users', route('userRoutes.js', {
      '../firebaseAdmin': { db, app: {} },
      '../middleware/verifyFirebaseToken': { verifyFirebaseToken, requireRecentAuth: require('../middleware/authPolicy').requireRecentAuth },
      'firebase-admin/auth': { getAuth: () => ({ getUser: async uid => ({ uid, phoneNumber: '+919000000000' }) }) },
      'firebase-admin/firestore': { FieldValue },
      '../controllers/userController': { deleteAccount: () => assert.fail('deletion is not part of this flow') },
    }));
    app.use('/api/checkout', route('checkoutRoutes.js', {
      '../firebaseAdmin': { db }, '../middleware/verifyFirebaseToken': { verifyFirebaseToken },
      '../services/checkoutService': { ...checkoutService, createCheckoutService },
    }));
    app.use('/api/orders', route('orderRoutes.js', {
      '../services/orderService': lifecycle,
      '../services/shopifyService': { fetchRecommendedProducts: async () => [] },
    }));
    server = await new Promise((resolve, reject) => {
      const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
      listening.once('error', reject);
    });
    const base = `http://127.0.0.1:${server.address().port}`;
    async function post(endpoint, payload, headers = {}) {
      return fetch(`${base}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(payload), signal: AbortSignal.timeout(5000) });
    }
    const lines = [{ merchandiseId: 'gid://shopify/ProductVariant/123', quantity: 2, uid: 'other' }];
    assert.equal((await post('/api/users/me/bootstrap', {})).status, 401);
    const bootstrap = await post('/api/users/me/bootstrap', {}, { Authorization: 'Bearer phone' });
    assert.equal(bootstrap.status, 200);
    assert.equal((await bootstrap.json()).profile.email, '');
    assert.equal((await post('/api/users/me/onboarding', { profile: { userName: 'Test shopper', email: '' } }, { Authorization: 'Bearer phone' })).status, 200);
    assert.equal((await post('/api/checkout', { lines })).status, 401);
    assert.equal((await post('/api/checkout', { lines }, { Authorization: 'Bearer invalid' })).status, 401);
    assert.equal(shopifyCalls, 0);
    const created = await post('/api/checkout', { lines, uid: 'other', email: 'spoof@example.test' }, { Authorization: 'Bearer phone' });
    assert.equal(created.status, 200);
    assert.equal((await created.json()).data.cartCreate.cart.id, cartId);
    const status = who => post('/api/checkout/status', { cartId }, { Authorization: `Bearer ${who}` });
    assert.deepEqual(await (await status('phone')).json(), { confirmed: false });
    assert.equal((await status('other')).status, 404);

    const order = { id: 5678, order_number: 73, cart_token: 'http-test-cart', email: null, contact_email: null, total_price: '1000', financial_status: 'paid', line_items: [{ product_id: 9, variant_id: 123, title: 'Test shirt', quantity: 2, price: '500' }] };
    const signature = createHmac('sha256', settings.SHOPIFY_WEBHOOK_SECRET).update(JSON.stringify(order)).digest('base64');
    assert.equal((await post('/api/orders/shopify/order-created', order)).status, 401);
    assert.equal((await post('/api/orders/shopify/order-created', { ...order, id: 9999 }, { 'x-shopify-hmac-sha256': signature })).status, 401);
    assert.ok(!db.documents.has('users/phone/orders/5678'));
    assert.equal((await post('/api/orders/shopify/order-created', order, { 'x-shopify-hmac-sha256': signature })).status, 200);
    const confirmed = await (await status('phone')).json();
    assert.equal(confirmed.confirmed, true);
    assert.equal(confirmed.orderId, '5678');
    assert.equal(confirmed.products[0].quantity, 2);
    assert.ok(!db.documents.has('users/other/orders/5678'));

    for (const email of ['optional@example.test', 'changed@example.test', '']) {
      const saved = await fetch(`${base}/api/users/me`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer phone' }, body: JSON.stringify({ email }), signal: AbortSignal.timeout(5000) });
      assert.equal(saved.status, 200);
      assert.equal(db.documents.get('users/phone').email, email);
      assert.equal(db.documents.get('users/phone').emailVerified, false);
      assert.equal((await (await status('phone')).json()).orderId, '5678');
    }

    const tracking = { order_id: '73', current_status: 'DELIVERED', awb: 'LOCAL-TEST-AWB' };
    assert.equal((await post('/api/orders/tracking-webhook', tracking)).status, 401);
    assert.equal(db.documents.get('users/phone/orders/5678').trackingStatus, null);
    for (let repeat = 0; repeat < 2; repeat++) {
      assert.equal((await post('/api/orders/tracking-webhook', tracking, { 'x-api-key': settings.SHIPROCKET_WEBHOOK_TOKEN })).status, 200);
    }
    assert.equal(db.documents.get('users/phone/orders/5678').trackingStatus, 'DELIVERED');
    assert.equal(db.documents.get('users/phone/orders/5678').awb, 'LOCAL-TEST-AWB');
    assert.equal(db.documents.get('users/phone').cupidCoins, 60);
    assert.equal((await status('other')).status, 404);
    await db.collection('accountDeletions').doc('phone').set({ state: 'pending' });
    assert.equal((await status('phone')).status, 409);
  } finally {
    if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
    for (const [key, value] of Object.entries(previous)) value === undefined ? delete process.env[key] : process.env[key] = value;
  }
});
