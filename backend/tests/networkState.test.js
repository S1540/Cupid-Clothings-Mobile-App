const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function load(relative, mocks, globals = {}) {
  const source = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, "../..", relative), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(source, { module, exports: module.exports, ...globals, require: (id) => {
    assert.ok(Object.hasOwn(mocks, id), `Unexpected import: ${id}`);
    return mocks[id];
  } });
  return module.exports;
}

function setup() {
  const store = load("store/networkStore.ts", { zustand: require("zustand") });
  let next = { isConnected: true, isInternetReachable: true };
  let networkListener;
  let appListener;
  let networkRemoved = false;
  let appRemoved = false;
  const api = load("lib/network.ts", {
    "@/store/networkStore": store,
    "@react-native-community/netinfo": { default: {
      refresh: async () => { if (next instanceof Error) throw next; return next; },
      addEventListener: (fn) => { networkListener = fn; return () => { networkRemoved = true; }; },
    } },
    "react-native": { Platform: { OS: "android" }, NativeModules: { RNCNetInfo: {} }, AppState: { addEventListener: (_event, fn) => {
      appListener = fn;
      return { remove: () => { appRemoved = true; } };
    } } },
  });
  return {
    ...store, ...api,
    status: () => store.useNetworkStore.getState().status,
    setNext: (value) => { next = value; },
    emit: (state) => networkListener(state),
    resume: () => appListener("active"),
    removed: () => networkRemoved && appRemoved,
  };
}

test("startup uncertainty isn't labelled as no internet", () => {
  const c = setup();
  assert.equal(c.status(), "unknown");
  assert.equal(c.connectionStatus({ isConnected: null, isInternetReachable: null }), "unknown");
  assert.equal(c.connectionStatus({ isConnected: true, isInternetReachable: null }), "unknown");
});

test("airplane mode and Wi-Fi without internet are both offline", () => {
  const c = setup();
  assert.equal(c.connectionStatus({ isConnected: false, isInternetReachable: null }), "offline");
  assert.equal(c.connectionStatus({ isConnected: true, isInternetReachable: false }), "offline");
});

test("live network updates move from offline to online", () => {
  const c = setup();
  const stop = c.monitorConnection();
  c.emit({ isConnected: false, isInternetReachable: false });
  assert.equal(c.status(), "offline");
  c.emit({ isConnected: true, isInternetReachable: true });
  assert.equal(c.status(), "online");
  stop();
  assert.ok(c.removed(), "both native subscriptions are disposed");
});

test("retry rechecks the actual connection and clears offline status", async () => {
  const c = setup();
  c.setNext({ isConnected: false, isInternetReachable: false });
  assert.equal(await c.refreshConnection(), "offline");
  c.setNext({ isConnected: true, isInternetReachable: true });
  assert.equal(await c.refreshConnection(), "online");
});

test("a failed connection check does not invent an offline state", async () => {
  const c = setup();
  await c.refreshConnection();
  c.setNext(new Error("native check unavailable"));
  assert.equal(await c.refreshConnection(), "online");
});

test("returning from device settings refreshes connectivity", async () => {
  const c = setup();
  const stop = c.monitorConnection();
  c.emit({ isConnected: false, isInternetReachable: false });
  c.resume();
  await new Promise(setImmediate);
  assert.equal(c.status(), "online");
  stop();
});

function legacyBuild(fetcher) {
  const store = load("store/networkStore.ts", { zustand: require("zustand") });
  let tick;
  let stopped = false;
  const appState = { currentState: "active", addEventListener: () => ({ remove() {} }) };
  const api = load("lib/network.ts", {
    "@/store/networkStore": store,
    // NetInfo is deliberately absent: importing it would crash this old binary.
    "react-native": { Platform: { OS: "android" }, NativeModules: {}, AppState: appState },
  }, {
    fetch: fetcher, AbortController, setTimeout, clearTimeout,
    setInterval: (fn) => { tick = fn; return 1; },
    clearInterval: () => { stopped = true; },
    process: { env: { EXPO_PUBLIC_API_URL: "https://catalog.test" } },
  });
  return { ...api, status: () => store.useNetworkStore.getState().status, appState,
    tick: () => tick(), stopped: () => stopped };
}

test("old binary without RNCNetInfo loads safely and uses HTTP fallback", async () => {
  const urls = [];
  const c = legacyBuild(async (url) => { urls.push(url); return { status: 200 }; });
  assert.equal(await c.refreshConnection(), "online");
  assert.deepEqual(urls, ["https://catalog.test/health"]);
});

test("fallback does not mistake HTTP server failures for no internet", async () => {
  const c = legacyBuild(async () => ({ status: 503 }));
  assert.equal(await c.refreshConnection(), "online");
});

test("fallback checks independent reachability if the app server cannot be reached", async () => {
  const c = legacyBuild(async (url) => {
    if (url.includes("catalog.test")) throw Error("server DNS failure");
    return { status: 204 };
  });
  assert.equal(await c.refreshConnection(), "online");
});

test("old binary detects connection loss and recovery without rebuilding", async () => {
  let offline = true;
  const c = legacyBuild(async () => {
    if (offline) throw Error("network unavailable");
    return { status: 200 };
  });
  assert.equal(await c.refreshConnection(), "offline");
  offline = false;
  assert.equal(await c.refreshConnection(), "online");
});

test("fallback polls only in foreground and cleans up its timer", async () => {
  let calls = 0;
  const c = legacyBuild(async () => { calls++; return { status: 200 }; });
  const stop = c.monitorConnection();
  await c.refreshConnection();
  assert.equal(calls, 1, "startup and explicit refresh share one check");
  c.appState.currentState = "background";
  c.tick();
  assert.equal(calls, 1);
  c.appState.currentState = "active";
  c.tick();
  await c.refreshConnection();
  assert.equal(calls, 2);
  stop();
  assert.ok(c.stopped());
});
