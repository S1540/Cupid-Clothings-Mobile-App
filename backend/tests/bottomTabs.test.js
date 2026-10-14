const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const moduleSource = ts.transpileModule(
  fs.readFileSync(path.resolve(__dirname, "../../lib/navigation/bottomTabs.ts"), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;
const exported = {};
vm.runInNewContext(moduleSource, { exports: exported });
const { bottomTabIndex, tabPositionAt } = exported;

test("gesture selects each tab at its center across phone widths", () => {
  for (const width of [280, 360, 700]) {
    for (let index = 0; index < 4; index++) {
      assert.equal(Math.round(tabPositionAt((index + 0.5) * width / 4, width, 4)), index);
    }
  }
});
test("dragging past either edge never produces an invalid route index", () => {
  assert.equal(tabPositionAt(-100, 360, 4), 0);
  assert.equal(tabPositionAt(1000, 360, 4), 3);
  assert.equal(tabPositionAt(40, 0, 4), 0);
});
test("selection changes at the slot boundary while the lens moves continuously", () => {
  assert.ok(tabPositionAt(89, 360, 4) < 0.5);
  assert.ok(tabPositionAt(91, 360, 4) > 0.5);
  assert.equal(tabPositionAt(90, 360, 4), 0.5);
});
test("Studio selects its actual destination; detail routes have no selected tab", () => {
  assert.equal(bottomTabIndex("/MaintenanceScreen"), 2);
  assert.equal(bottomTabIndex("/Cart"), 3);
  assert.equal(bottomTabIndex("/category/women"), -1);
});
