const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const source = ts.transpileModule(
  fs.readFileSync(path.resolve(__dirname, "../../store/catalogStore.ts"), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;
const product = (handle) => ({ id: handle, handle, title: handle, images: [], options: [], variants: [] });
const response = (data) => ({ ok: true, json: async () => data });
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};

function cache(fetcher, disk = new Map(), storageOverrides = {}) {
  let now = 100000000;
  const storage = {
    getItem: async (key) => disk.get(key) ?? null,
    setItem: async (key, value) => { disk.set(key, value); },
    removeItem: async (key) => { disk.delete(key); },
    ...storageOverrides,
  };
  const module = { exports: {} };
  vm.runInNewContext(source, {
    module, exports: module.exports, console, setTimeout, clearTimeout, AbortController,
    Date: class extends Date { static now() { return now; } },
    process: { env: { EXPO_PUBLIC_API_URL: "https://catalog.test" } },
    fetch: fetcher,
    require: (id) => id === "@react-native-async-storage/async-storage"
      ? { default: storage } : require(id),
  });
  return { ...module.exports, advance: (ms) => { now += ms; } };
}

test("fresh entries and valid empty collections avoid repeat requests", async () => {
  let calls = 0;
  const c = cache(async () => { calls++; return response([]); });
  await c.fetchCatalog(c.collectionPath("women"));
  await c.fetchCatalog(c.collectionPath("women"));
  assert.equal(calls, 1);
  assert.equal(c.useCatalogStore.getState().entries[c.collectionPath("women")].data.length, 0);
});

test("concurrent screens share one in-flight request", async () => {
  const gate = deferred();
  let calls = 0;
  const c = cache(async () => { calls++; return gate.promise; });
  const first = c.fetchCatalog(c.collectionPath("women"));
  const second = c.fetchCatalog(c.collectionPath("women"));
  await c.catalogReady;
  gate.resolve(response([product("a")]));
  assert.equal(await first, await second);
  assert.equal(calls, 1);
});

test("stale data remains available while refreshing; failed refresh retains it", async () => {
  let fail = false;
  const c = cache(async () => { if (fail) throw Error("offline"); return response([product("a")]); });
  const key = c.collectionPath("women");
  const saved = await c.fetchCatalog(key);
  c.advance(300001);
  fail = true;
  const refresh = c.fetchCatalog(key);
  assert.equal(c.useCatalogStore.getState().entries[key].data, saved);
  await assert.rejects(refresh, /offline/);
  assert.equal(c.useCatalogStore.getState().entries[key].data, saved);
  fail = false;
  await c.fetchCatalog(key);
  assert.equal(c.useCatalogStore.getState().entries[key].data, saved, "unchanged response keeps list reference");
});

test("force refresh bypasses freshness and details expire earlier than collections", async () => {
  let calls = 0;
  const c = cache(async (url) => { calls++; return response(url.includes("/product/") ? product("a") : []); });
  const detail = c.productPath("a");
  const list = c.collectionPath("women");
  await c.fetchCatalog(detail);
  await c.fetchCatalog(list);
  c.advance(60001);
  await c.fetchCatalog(detail);
  await c.fetchCatalog(list);
  assert.equal(calls, 3);
  await c.fetchCatalog(list, true);
  assert.equal(calls, 4);
});

test("out-of-order category responses stay under their own route keys", async () => {
  const women = deferred();
  const men = deferred();
  const c = cache((url) => url.endsWith("/women") ? women.promise : men.promise);
  const a = c.fetchCatalog(c.collectionPath("women"));
  const b = c.fetchCatalog(c.collectionPath("men"));
  men.resolve(response([product("men-shirt")]));
  await b;
  women.resolve(response([product("women-shirt")]));
  await a;
  assert.equal(c.useCatalogStore.getState().entries[c.collectionPath("men")].data[0].handle, "men-shirt");
});

test("app restart restores disk cache before deciding to request", async () => {
  const disk = new Map();
  const first = cache(async () => response([product("a")]), disk);
  await first.fetchCatalog(first.collectionPath("women"));
  const next = cache(async () => { throw Error("should use restored cache"); }, disk);
  const restored = await next.fetchCatalog(next.collectionPath("women"));
  assert.equal(restored[0].handle, "a");
});

test("invalid response and HTTP error never become cached products", async () => {
  for (const result of [response({ error: "bad response" }), { ok: false, status: 503 }]) {
    const c = cache(async () => result);
    await assert.rejects(c.fetchCatalog(c.collectionPath("women")));
    assert.equal(Object.keys(c.useCatalogStore.getState().entries).length, 0);
  }
});

test("corrupt persistence or disk write failure still allows network data", async () => {
  const c = cache(async () => response([product("a")]), new Map(), {
    getItem: async () => "broken json",
    setItem: async () => { throw Error("disk full"); },
  });
  assert.equal((await c.fetchCatalog(c.collectionPath("women")))[0].handle, "a");
});

test("cache is bounded even when many products finish in the same millisecond", async () => {
  const c = cache(async () => response(product("a")));
  for (let i = 0; i < 65; i++) await c.fetchCatalog(c.productPath(String(i)));
  assert.equal(Object.keys(c.useCatalogStore.getState().entries).length, 60);
  assert.ok(c.useCatalogStore.getState().entries[c.productPath("64")]);
});

test("a slow disk restore finishes before a request can overwrite saved entries", async () => {
  const gate = deferred();
  let calls = 0;
  const c = cache(async () => { calls++; return response([]); }, new Map(), {
    getItem: () => gate.promise,
  });
  const key = c.collectionPath("women");
  const pending = c.fetchCatalog(key);
  await Promise.resolve();
  assert.equal(calls, 0);
  gate.resolve(JSON.stringify({ version: 1, state: { entries: {
    [key]: { data: [product("restored")], updatedAt: 100000000 },
  } } }));
  assert.equal((await pending)[0].handle, "restored");
  assert.equal(calls, 0);
});

test("expired disk data is replaced instead of treated as fresh", async () => {
  let calls = 0;
  const c = cache(async () => { calls++; return response([product("fresh")]); }, new Map(), {
    getItem: async () => JSON.stringify({ version: 1, state: { entries: {
      "/api/products/women": { data: [product("old")], updatedAt: 1 },
    } } }),
  });
  await c.catalogReady;
  assert.equal(Object.keys(c.useCatalogStore.getState().entries).length, 0);
  assert.equal((await c.fetchCatalog(c.collectionPath("women")))[0].handle, "fresh");
  assert.equal(calls, 1);
});

test("oversized entries remain in memory without exceeding the disk budget", async () => {
  const disk = new Map();
  const large = { ...product("large"), description: "x".repeat(800000) };
  const c = cache(async () => response(large), disk);
  assert.equal((await c.fetchCatalog(c.productPath("large"))).handle, "large");
  const persisted = [...disk.values()][0];
  assert.ok(persisted.length * 2 < 1500000);
  assert.equal(Object.keys(JSON.parse(persisted).state.entries).length, 0);
});
