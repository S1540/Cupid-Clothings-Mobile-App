const test = require("node:test");
const assert = require("node:assert/strict");
const { rankSearchProducts } = require("../lib/searchRelevance");
const products = [
  { id: "1", title: "Blue Polo T-shirts for Men", handle: "blue-polo-men" },
  { id: "2", title: "Red Polo T-shirt for Men", handle: "red-polo-men" },
  { id: "3", title: "Blue Track Pants for Women", handle: "blue-pants-women", description: "Pair with a polo t-shirt for men" },
  { id: "4", title: "Blue Polo T-shirt for Women", handle: "blue-polo-women" },
];
test("every meaningful search term must match, without description cross-selling", () => {
  assert.deepEqual(rankSearchProducts(products, "blue polo men").map(p => p.id), ["1"]);
});
test("men never matches women by substring", () => {
  assert.deepEqual(rankSearchProducts(products, "men").map(p => p.id), ["1", "2"]);
});
test("t-shirt spelling, plurals and partial final words work", () => {
  assert.deepEqual(rankSearchProducts(products, "men's blue tees").map(p => p.id), ["1"]);
  assert.deepEqual(rankSearchProducts(products, "women track pan").map(p => p.id), ["3"]);
});
test("unrelated and empty searches have no fabricated fallback", () => {
  assert.deepEqual(rankSearchProducts(products, "black kurti"), []);
  assert.deepEqual(rankSearchProducts(products, ""), []);
});
