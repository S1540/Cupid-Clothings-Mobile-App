// Local demo emulator only. Never imports production Firebase configuration.
const { test, before, after } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require(path.join(root, 'node_modules/.cache/auth-validation-tools/node_modules/@firebase/rules-unit-testing'));
let environment;
before(async () => {
  if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080') throw new Error('Requires the isolated local Firestore emulator');
  environment = await initializeTestEnvironment({ projectId: 'demo-cupid-auth', firestore: { host: '127.0.0.1', port: 8080, rules: fs.readFileSync(path.join(root, 'firestore.rules'), 'utf8') } });
  await environment.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await Promise.all([
      db.doc('users/alice').set({ coins: 100, phone: '+919000000000' }),
      db.doc('users/alice/orders/123').set({ status: 'IN TRANSIT' }),
      db.doc('users/alice/coupons/a').set({ amount: 10 }),
      db.doc('users/bob').set({ coins: 50 }),
      db.doc('users/deleting').set({ coins: 50 }),
      db.doc('accountDeletions/deleting').set({ status: 'pending' }),
      db.doc('checkoutOwners/private').set({ uid: 'alice' }),
    ]);
  });
});
after(async () => { await environment?.cleanup(); });
test('own profile and orders readable; other identities and anonymous clients denied', async () => {
  const alice = environment.authenticatedContext('alice').firestore();
  await assertSucceeds(alice.doc('users/alice').get());
  await assertSucceeds(alice.collection('users/alice/orders').get());
  await assertFails(alice.doc('users/bob').get());
  await assertFails(alice.collection('users').get());
  await assertFails(environment.unauthenticatedContext().firestore().doc('users/alice').get());
});
test('profile identity, coins, orders and coupons cannot be written by clients', async () => {
  const db = environment.authenticatedContext('alice').firestore();
  for (const document of ['users/alice', 'users/alice/orders/123', 'users/alice/coupons/a']) {
    await assertFails(db.doc(document).set({ uid: 'alice', coins: 9999, emailVerified: true }));
    await assertFails(db.doc(document).delete());
  }
});
test('cart, address and wishlist support own CRUD and reject cross-account access', async () => {
  const db = environment.authenticatedContext('alice').firestore();
  for (const collection of ['cart', 'address', 'wishlist']) {
    const own = db.doc(`users/alice/${collection}/test`);
    await assertSucceeds(own.set({ value: 'test' }));
    await assertSucceeds(own.get());
    await assertSucceeds(own.update({ value: 'updated' }));
    await assertFails(environment.authenticatedContext('bob').firestore().doc(own.path).get());
    await assertFails(db.doc(`users/bob/${collection}/test`).set({ value: 'test' }));
    await assertSucceeds(own.delete());
  }
});
test('ownership registries and deleting accounts remain inaccessible', async () => {
  const db = environment.authenticatedContext('alice').firestore();
  for (const collection of ['checkoutOwners', 'orderOwners', 'unresolvedShopifyOrders', 'pendingTracking', 'accountDeletions']) {
    await assertFails(db.doc(`${collection}/private`).get());
    await assertFails(db.doc(`${collection}/private`).set({ uid: 'alice' }));
  }
  const deleting = environment.authenticatedContext('deleting').firestore();
  await assertFails(deleting.doc('users/deleting').get());
  await assertFails(deleting.doc('users/deleting/cart/new').set({ quantity: 1 }));
});

test('an existing UID-scoped order listener receives backend tracking updates', async () => {
  const db = environment.authenticatedContext('alice').firestore();
  let unsubscribe;
  let timer;
  try {
    const delivered = new Promise((resolve, reject) => {
      timer = setTimeout(() => reject(new Error('Tracking listener timed out')), 5000);
      unsubscribe = db.doc('users/alice/orders/123').onSnapshot(snapshot => {
        if (snapshot.data()?.status === 'DELIVERED') resolve();
      }, reject);
    });
    await environment.withSecurityRulesDisabled(context => context.firestore().doc('users/alice/orders/123').update({ status: 'DELIVERED' }));
    await delivered;
  } finally { clearTimeout(timer); unsubscribe?.(); }
});
