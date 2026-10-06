const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function load(relative, mocks = {}) {
  const source = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, "../..", relative), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(source, { module, exports: module.exports, require: (id) => {
    assert.ok(Object.hasOwn(mocks, id));
    return mocks[id];
  } });
  return module.exports;
}
const { swipeTarget } = load("lib/productSwipe.ts");

test("small drags settle on the current image", () => {
  assert.equal(swipeTarget(1, 5, 180, -15, -80), 1);
  assert.equal(swipeTarget(1, 5, 180, 15, 80), 1);
});
test("left/right drags and quick flicks select the adjacent image", () => {
  assert.equal(swipeTarget(1, 5, 180, -50, -100), 2);
  assert.equal(swipeTarget(1, 5, 180, 50, 100), 0);
  assert.equal(swipeTarget(1, 5, 180, -12, -600), 2);
  assert.equal(swipeTarget(1, 5, 180, 12, 600), 0);
});
test("edge gestures never wrap or go beyond the available images", () => {
  assert.equal(swipeTarget(0, 5, 180, 80, 900), 0);
  assert.equal(swipeTarget(4, 5, 180, -80, -900), 4);
  assert.equal(swipeTarget(0, 1, 180, -80, -900), 0);
  assert.equal(swipeTarget(0, 5, 0, -80, -900), 0);
});
test("very long drags still move only one page", () => {
  assert.equal(swipeTarget(1, 5, 180, -500, -900), 2);
});

test("image preload is deduplicated, memory/disk cached and concurrency limited", async () => {
  const calls = [];
  const resolvers = [];
  const { preloadProductImages } = load("lib/productImagePreload.ts", { "expo-image": { Image: {
    prefetch: (url, policy) => {
      calls.push({ url, policy });
      return new Promise((resolve) => resolvers.push(resolve));
    },
  } } });
  preloadProductImages(["a", "b", "c", "d", "a"].map((url) => ({ url })));
  assert.equal(calls.length, 3);
  assert.ok(calls.every((call) => call.policy === "memory-disk"));
  preloadProductImages([{ url: "a" }]);
  assert.equal(calls.length, 3);
  resolvers[0](true);
  await new Promise(setImmediate);
  assert.equal(calls.length, 4);
  assert.equal(calls[3].url, "d");
  resolvers.slice(1).forEach((resolve) => resolve(true));
  await new Promise(setImmediate);
  preloadProductImages([{ url: "a" }]);
  assert.equal(calls.length, 4);
});

test("failed preloads are retried when a card becomes visible again", async () => {
  let calls = 0;
  const { preloadProductImages } = load("lib/productImagePreload.ts", { "expo-image": { Image: {
    prefetch: async () => { calls++; return false; },
  } } });
  preloadProductImages([{ url: "a" }]);
  await new Promise(setImmediate);
  preloadProductImages([{ url: "a" }]);
  await new Promise(setImmediate);
  assert.equal(calls, 2);
});

test("sort previews promote visible images without duplicating in-flight downloads", async () => {
  const calls = [];
  const resolvers = [];
  const { preloadProductImages } = load("lib/productImagePreload.ts", { "expo-image": { Image: {
    prefetch: (url) => {
      calls.push(url);
      return new Promise((resolve) => resolvers.push(resolve));
    },
  } } });
  preloadProductImages(["a", "b", "c", "offscreen", "next"].map((url) => ({ url })));
  preloadProductImages(["next", "fresh", "a"].map((url) => ({ url })), true);
  assert.deepEqual(calls, ["a", "b", "c"]);
  resolvers[0](true);
  await new Promise(setImmediate);
  assert.equal(calls[3], "next");
  resolvers[1](true);
  await new Promise(setImmediate);
  assert.equal(calls[4], "fresh");
  assert.equal(calls.filter((url) => url === "a").length, 1);
  resolvers[2](true);
  await new Promise(setImmediate);
  assert.equal(calls[5], "offscreen");
  resolvers.slice(3).forEach((resolve) => resolve(true));
  await new Promise(setImmediate);
});
