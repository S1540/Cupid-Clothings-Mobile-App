// Pure matching rules shared by the API and mobile app (including cached results).
const aliases = {
  tshirts: "tshirt", tees: "tshirt", tee: "tshirt",
  shirts: "shirt", pants: "pant", trousers: "pant", trouser: "pant",
  shorts: "short", tops: "top", kurtis: "kurti", kurtas: "kurta",
  suits: "suit", polos: "polo", combos: "combo",
  mens: "men", man: "men", male: "men",
  womens: "women", woman: "women", female: "women", ladies: "women",
  boys: "boy", girls: "girl", kids: "kid",
  pyjamas: "pajama", pyjama: "pajama", pajamas: "pajama",
};
const ignored = new Set(["for", "and", "with", "in", "the", "a", "of", "by"]);
function normalizeSearch(value) {
  return String(value || "").toLowerCase()
    .replace(/[’']/g, "")
    .replace(/\bt[\s-]*shirts?\b/g, "tshirt")
    .replace(/\bnight[\s-]*suits?\b/g, "night suit")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ").trim();
}
function tokenizeSearch(value) {
  return [...new Set(normalizeSearch(value).split(" ")
    .filter((word) => word.length > 1 && !ignored.has(word))
    .map((word) => aliases[word] || word))];
}
function scoreSearchProduct(product, tokens) {
  const title = tokenizeSearch(product.title);
  const words = new Set(tokenizeSearch([product.title, product.handle, product.productType, product.vendor].join(" ")));
  if (!tokens.length) return 0;
  const matches = tokens.map((token, index) => words.has(token) ||
    (index === tokens.length - 1 && token.length >= 3 && [...words].some((word) => word.startsWith(token))));
  if (!matches.every(Boolean)) return 0;
  return 10 + tokens.filter((token) => title.includes(token)).length * 8;
}
function rankSearchProducts(products, query) {
  const tokens = tokenizeSearch(query);
  return [...new Map(products.map((product) => [product.id, product])).values()]
    .map((product) => ({ product, score: scoreSearchProduct(product, tokens) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ product }) => product);
}
module.exports = { normalizeSearch, tokenizeSearch, scoreSearchProduct, rankSearchProducts };
