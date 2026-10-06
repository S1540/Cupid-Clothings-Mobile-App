const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const moduleObject = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(
    fs.readFileSync(
      path.resolve(__dirname, "../../lib/catalogFilters.ts"),
      "utf8",
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText,
  { module: moduleObject, exports: moduleObject.exports },
);
const {
  emptyFilters,
  clampRange,
  indexCatalog,
  selectCatalog,
  filterCount,
  discountOf,
} = moduleObject.exports;
const menu = [
  {
    title: "Women",
    handle: "women",
    subcategories: [{ title: "Tops", handle: "tops" }],
  },
];
const products = [
  {
    id: "a",
    price: "499",
    compareAtPrice: "999",
    sizes: ["M", "L"],
    availableForSale: true,
    collections: [{ handle: "tops", title: "Tops" }],
    createdAt: "2025-01-01",
    productType: "T-shirt",
  },
  {
    id: "b",
    price: 999,
    compareAtPrice: null,
    sizes: ["S"],
    availableForSale: false,
    collections: [],
    createdAt: "2026-01-01",
    productType: "Dress",
  },
  {
    id: "c",
    price: "299",
    compareAtPrice: "400",
    sizes: ["S", "M"],
    availableForSale: true,
    collections: [{ handle: "tops", title: "Tops" }],
    createdAt: "2025-06-01",
    productType: "T-shirt",
  },
];
const index = indexCatalog(products, menu);
const ids = (filters = {}, sort = "recommended", source = index) =>
  Array.from(
    selectCatalog(source, { ...emptyFilters(), ...filters }, sort),
    (item) => item.id,
  );

test("changing collection clears selections and sort, including a return visit", () => {
  let saved;
  const hookModule = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.resolve(__dirname, "../../hooks/useCollectionFilters.ts"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, {
    module: hookModule, exports: hookModule.exports,
    require: (name) => name === "react" ? {
      useState: (initial) => { saved ??= initial; return [saved, (next) => { saved = next; }]; },
      useMemo: (factory) => factory(),
    } : moduleObject.exports,
  });
  const render = (scope) => hookModule.exports.useCollectionFilters(products, menu, scope);
  let state = render("tops");
  state.setFilters({ ...emptyFilters(), sizes: ["L"] });
  state = render("tops");
  state.setSort("priceDesc");
  state = render("tops");
  assert.equal(state.results.length, 1);
  assert.equal(state.sort, "priceDesc");
  state = render("dresses");
  assert.equal(filterCount(state.filters), 0);
  assert.equal(state.sort, "recommended");
  state = render("tops");
  assert.equal(filterCount(state.filters), 0);
  assert.equal(state.results.length, 3);
});

test("price is inclusive, strictly bounded, and inverted/nonfinite inputs are safe", () => {
  assert.deepEqual(Array.from(clampRange(-10, 2000)), [299, 1500]);
  assert.deepEqual(Array.from(clampRange(999, 499)), [999, 999]);
  assert.deepEqual(Array.from(clampRange(NaN, Infinity)), [299, 1500]);
  assert.deepEqual(ids({ price: [299, 499] }), ["a", "c"]);
  assert.deepEqual(ids({ price: [500, 749] }), []);
});
test("OR within a facet and AND across facets; no source mutation", () => {
  assert.deepEqual(ids({ sizes: ["L", "S"] }), ["a", "b", "c"]);
  assert.deepEqual(
    ids({
      sizes: ["L", "S"],
      availability: ["in"],
      price: [400, 1500],
      genders: ["Women"],
      categories: ["tops"],
      discount: 40,
    }),
    ["a"],
  );
  assert.equal(index.rows[0].product, products[0]);
  assert.deepEqual(
    products.map((product) => product.id),
    ["a", "b", "c"],
  );
});
test("sorts real prices, discounts and dates; Recommended restores original order", () => {
  assert.deepEqual(ids({}, "priceAsc"), ["c", "a", "b"]);
  assert.deepEqual(ids({}, "priceDesc"), ["b", "a", "c"]);
  assert.deepEqual(ids({}, "newest"), ["b", "c", "a"]);
  assert.deepEqual(ids({}, "discount"), ["a", "c", "b"]);
  assert.deepEqual(ids(), ["a", "b", "c"]);
  assert.deepEqual(ids({ discount: 0 }), ["b"]);
  assert.equal(discountOf({ price: 1000, compareAtPrice: 900 }), 0);
});
test("facets come from metadata and menu, never from product names", () => {
  assert.deepEqual(
    Array.from(
      index.facets.find((facet) => facet.key === "sizes").options,
      (option) => option.value,
    ),
    ["L", "M", "S"],
  );
  assert.deepEqual(
    Array.from(
      index.facets.find((facet) => facet.key === "genders").options,
      (option) => option.value,
    ),
    ["Women"],
  );
  const old = indexCatalog(
    [{ id: "old", title: "Women size M", price: 350 }],
    menu,
  );
  assert.deepEqual(
    Array.from(old.facets, (facet) => facet.key),
    ["price", "discount"],
  );
  assert.equal(old.hasDates, false);
  assert.deepEqual(ids({}, "recommended", old), ["old"]);
  assert.deepEqual(ids({ availability: ["out"] }, "recommended", old), []);
});
test("clear all removes every constraint and count includes zero-discount selection", () => {
  assert.equal(
    filterCount({
      ...emptyFilters(),
      discount: 0,
      sizes: ["M", "L"],
      price: [299, 499],
    }),
    4,
  );
  assert.equal(filterCount(emptyFilters()), 0);
  assert.deepEqual(ids(emptyFilters()), ["a", "b", "c"]);
});
test("catalog response adds real filter metadata without changing card fields", async () => {
  let query;
  const backend = { exports: {} };
  vm.runInNewContext(
    fs.readFileSync(
      path.resolve(__dirname, "../services/shopifyService.js"),
      "utf8",
    ),
    {
      module: backend,
      require: (name) => {
        assert.equal(name, "../lib/searchRelevance");
        return require("../lib/searchRelevance");
      },
      exports: backend.exports,
      process: { env: {} },
      console,
      fetch: async (_, request) => {
        query = JSON.parse(request.body).query;
        return {
          ok: true,
          json: async () => ({
            data: {
              collection: {
                products: {
                  edges: [
                    {
                      node: {
                        id: "p",
                        title: "Top",
                        handle: "top",
                        description: "Description",
                        availableForSale: false,
                        createdAt: "2026-01-01",
                        productType: "Top",
                        options: [
                          { name: "Size", values: ["XS", "M"] },
                          { name: "Other", values: ["ignored"] },
                        ],
                        collections: {
                          nodes: [{ handle: "tops", title: "Tops" }],
                        },
                        priceRange: {
                          minVariantPrice: {
                            amount: "499",
                            currencyCode: "INR",
                          },
                        },
                        compareAtPriceRange: {
                          minVariantPrice: { amount: "999" },
                        },
                        images: {
                          edges: [{ node: { url: "image", altText: "Top" } }],
                        },
                      },
                    },
                  ],
                },
              },
            },
          }),
        };
      },
    },
  );
  const [product] = await backend.exports.fetchProducts("tops");
  assert.equal(product.price, 499);
  assert.equal(product.compareAtPrice, "999");
  assert.equal(product.discountPercent, 50);
  assert.equal(product.availableForSale, false);
  assert.deepEqual(Array.from(product.sizes), ["XS", "M"]);
  assert.equal(product.images[0].url, "image");
  assert.match(query, /availableForSale/);
  assert.match(query, /products\(first: 250\)/);
});
