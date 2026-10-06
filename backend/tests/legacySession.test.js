const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function loadAuth(mocks, relative = "lib/auth.ts", globals = {}) {
  const filename = path.resolve(path.dirname(require.resolve("../../package.json")), relative);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(source, {
    ...globals, module, exports: module.exports,
    require: id => { assert.ok(Object.hasOwn(mocks, id), `Unexpected import: ${id}`); return mocks[id]; },
  }, { filename });
  return module.exports;
}

function recovery({ nativeUid = null, resultUid = "legacy-user", failExchange = false } = {}) {
  const events = [];
  const auth = { currentUser: nativeUid ? { uid: nativeUid } : null, authStateReady: async () => {} };
  const legacy = { currentUser: { uid: "legacy-user", getIdToken: async () => "synthetic-id-token" }, authStateReady: async () => {} };
  const api = loadAuth({
    "@/firebaseConfig": { auth },
    "@react-native-firebase/auth": {
      signInWithCustomToken: async (_auth, token) => { assert.equal(token, "synthetic-custom-token"); events.push("native-login"); return { user: { uid: resultUid } }; },
      signOut: async () => { events.push("native-signout"); },
    },
    "firebase/auth": { signOut: async () => { events.push("legacy-signout"); } },
    "./legacyFirebaseAuth": { getLegacyAuth: () => legacy },
    "./api": { apiRequest: async (route, options, token) => {
      assert.equal(route, "/api/users/session/native"); assert.equal(options.method, "POST"); assert.equal(token, "synthetic-id-token");
      events.push("exchange"); if (failExchange) throw new Error("offline");
      return { token: "synthetic-custom-token" };
    } },
  });
  return { api, events, legacy };
}

test("saved JS session migrates with the same UID before legacy sign-out", async () => {
  const { api, events } = recovery(); await api.recoverLegacySession();
  assert.deepEqual(events, ["exchange", "native-login", "legacy-signout"]);
});
test("different saved accounts are never silently merged or signed out", async () => {
  const { api, events } = recovery({ nativeUid: "other" });
  await assert.rejects(api.recoverLegacySession(), /Two different saved accounts/); assert.deepEqual(events, []);
});
test("failed token exchange retains the saved JS session for retry", async () => {
  const { api, events } = recovery({ failExchange: true });
  await assert.rejects(api.recoverLegacySession(), /offline/); assert.deepEqual(events, ["exchange"]);
});
test("wrong recovered UID signs out native auth while preserving legacy recovery", async () => {
  const { api, events } = recovery({ resultUid: "other" });
  await assert.rejects(api.recoverLegacySession(), /safely/); assert.deepEqual(events, ["exchange", "native-login", "native-signout"]);
});
test("already migrated sessions avoid another token exchange", async () => {
  const { api, events } = recovery({ nativeUid: "legacy-user" });
  await api.recoverLegacySession(); assert.deepEqual(events, ["legacy-signout"]);
});
test("logout clears both SDK sessions and an empty legacy session needs no migration", async () => {
  const { api, events, legacy } = recovery(); legacy.currentUser = null;
  await api.recoverLegacySession(); assert.deepEqual(events, []);
  await api.signOutAllSessions(); assert.deepEqual(events, ["legacy-signout", "native-signout"]);
});

test("Firebase RN Auth restores the Firebase 11 saved-user format and original storage key", async () => {
  // Explicit RN entry: Node's default firebase/auth export uses browser/Node persistence.
  // Fixture was serialized by Firebase 11.10.0; all identity/token values are synthetic.
  const authRoot = path.dirname(require.resolve("@firebase/auth/package.json"));
  const sdk = require(path.join(authRoot, "dist/rn/index.js"));
  const appSdk = require("firebase/app");
  const fixture = require("./fixtures/firebase-11-auth-user.json");
  const key = "firebase:authUser:demo-api-key:[DEFAULT]";
  const storage = new Map([[key, JSON.stringify(fixture)]]);
  const adapter = {
    getItem: async name => storage.get(name) ?? null,
    setItem: async (name, value) => { storage.set(name, value); },
    removeItem: async name => { storage.delete(name); },
  };
  const { getLegacyAuth } = loadAuth({
    "firebase/app": appSdk,
    "firebase/auth": sdk,
    "@react-native-async-storage/async-storage": { default: adapter },
  }, "lib/legacyFirebaseAuth.ts", {
    process: { env: { EXPO_PUBLIC_FIREBASE_API_KEY: "demo-api-key", EXPO_PUBLIC_FIREBASE_PROJECT_ID: "demo-cupid-auth" } },
  });
  const originalFetch = globalThis.fetch;
  // Offline restoration: no Firebase project, network call, or real credential is used.
  globalThis.fetch = async () => { throw new TypeError("offline test"); };
  try {
    const auth = getLegacyAuth();
    await auth.authStateReady();
    assert.equal(auth.currentUser?.uid, fixture.uid);
    assert.equal(auth.currentUser.email, fixture.email);
    assert.equal(auth.currentUser.providerData[0].providerId, "password");
    assert.equal(await auth.currentUser.getIdToken(), "synthetic-access-token");
    assert.ok(storage.has(key));
    assert.equal(getLegacyAuth(), auth, "Repeated bridge access must reuse the persisted auth instance");
    await sdk.signOut(auth);
    assert.equal(storage.has(key), false);
  } finally {
    await Promise.all(appSdk.getApps().map(app => appSdk.deleteApp(app)));
    globalThis.fetch = originalFetch;
  }
});
