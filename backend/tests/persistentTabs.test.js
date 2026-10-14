const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const { StackRouter, TabRouter } = require("@react-navigation/routers");
const exported = {};
vm.runInNewContext(ts.transpileModule(
  fs.readFileSync(path.resolve(__dirname, "../../lib/navigation/persistentTabs.ts"), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText, { exports: exported });
const { persistentTabAction } = exported;
const stackOptions = { routeNames: ["(tabs)", "Search", "Cart"], routeParamList: {}, routeGetIdList: {} };
const tabOptions = { routeNames: ["index", "Account", "MaintenanceScreen"], routeParamList: {}, routeGetIdList: {} };

test("returning from Search reuses the tab host instead of pushing another copy", () => {
  const stack = StackRouter({ initialRouteName: "(tabs)" });
  const tabs = TabRouter({ initialRouteName: "index", backBehavior: "initialRoute" });
  let state = stack.getInitialState(stackOptions);
  const savedTabs = tabs.getInitialState(tabOptions);
  state.routes[0].state = savedTabs;
  const originalKey = state.routes[0].key;
  state = stack.getStateForAction(state, { type: "PUSH", payload: { name: "Search" } }, stackOptions);
  const action = persistentTabAction({ key: "expo-root", index: 0, routes: [{ name: "__root", state }] }, "/Account");
  assert.equal(action.target, state.key);
  const next = stack.getStateForAction(state, action, stackOptions);
  assert.equal(next.routes.length, 1);
  assert.equal(next.routes[0].key, originalKey);
  assert.equal(next.routes[0].state, savedTabs);
  assert.equal(next.routes[0].params.screen, "Account");
});

test("switching repeatedly preserves all tab route keys", () => {
  const tabs = TabRouter({ initialRouteName: "index", backBehavior: "initialRoute" });
  let state = tabs.getInitialState(tabOptions);
  const keys = state.routes.map(route => route.key);
  for (const name of ["Account", "MaintenanceScreen", "index", "Account", "index"]) {
    state = tabs.getStateForAction(state, { type: "NAVIGATE", payload: { name } }, tabOptions);
    assert.deepEqual(state.routes.map(route => route.key), keys);
    assert.equal(state.routes[state.index].name, name);
  }
});

test("Android back from a primary tab returns to Home without replacing its route", () => {
  const tabs = TabRouter({ initialRouteName: "index", backBehavior: "initialRoute" });
  let state = tabs.getInitialState(tabOptions);
  const key = state.routes[0].key;
  state = tabs.getStateForAction(state, { type: "NAVIGATE", payload: { name: "Account" } }, tabOptions);
  state = tabs.getStateForAction(state, { type: "GO_BACK" }, tabOptions);
  assert.equal(state.index, 0);
  assert.equal(state.routes[0].key, key);
});

test("Cart keeps normal stack navigation; missing tab host falls back safely", () => {
  const root = { key: "app", index: 0, routes: [{ name: "(tabs)" }] };
  assert.equal(persistentTabAction(root, "/Cart"), null);
  assert.equal(persistentTabAction(undefined, "/Account"), null);
});
