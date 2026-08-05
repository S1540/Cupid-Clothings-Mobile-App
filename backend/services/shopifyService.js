const SHOP = process.env.SHOPIFY_SHOP;
const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN;

async function fetchProducts(collectionHandle) {
  const response = await fetch(
    `https://${SHOP}.myshopify.com/api/2025-01/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
      },

      body: JSON.stringify({
        query: `
        {
          collection(handle: "${collectionHandle}") {
            title

            products(first: 250) {
              edges {
                node {
                  id
                  title
                  description
                  handle

                  priceRange {
                    minVariantPrice {
                      amount
                      currencyCode
                    }
                  }
                    compareAtPriceRange {
                     minVariantPrice {
                      amount
                     currencyCode
                    }
                   }

                  images(first: 5) {
                    edges {
                      node {
                        url
                        altText
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Shopify error: ${response.status}`);
  }

  const data = await response.json();

  return data.data.collection.products.edges.map((edge) => {
    const original = parseFloat(
      edge.node.compareAtPriceRange.minVariantPrice.amount,
    );
    const sale = parseFloat(edge.node.priceRange.minVariantPrice.amount);
    const discount =
      original > sale ? Math.round(((original - sale) / original) * 100) : 0;

    return {
      id: edge.node.id,
      title: edge.node.title,
      handle: edge.node.handle,
      description: edge.node.description,
      price: sale,
      compareAtPrice: original > sale ? original.toFixed(0) : null,
      discountPercent: discount > 0 ? discount : null,
      currency: edge.node.priceRange.minVariantPrice.currencyCode,
      images: edge.node.images.edges.map((img) => ({
        url: img.node.url,
        alt: img.node.altText,
      })),
    };
  });
}

// fetchMenu(Categoriess..)
async function fetchMenu(menuHandle) {
  const response = await fetch(
    `https://${SHOP}.myshopify.com/api/2025-01/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
      },
      body: JSON.stringify({
        query: `
        {
          menu(handle: "${menuHandle}") {
            title
            items {
              title
              url
              items {
                title
                url
                items {
                  title
                  url
                }
              }
            }
          }
        }
        `,
      }),
    },
  );

  const data = await response.json();

  if (!data?.data?.menu) {
    throw new Error(`Menu "${menuHandle}" not found`);
  }

  return data.data.menu.items.map((item) => ({
    title: item.title,
    handle: item.url?.split("/").pop() || "",

    subcategories: (item.items || []).map((sub) => ({
      title: sub.title,
      handle: sub.url?.split("/").pop() || "",

      children: (sub.items || []).map((child) => ({
        title: child.title,
        handle: child.url?.split("/").pop() || "",
      })),
    })),
  }));
}
const searchCache = new Map();
const SEARCH_CACHE_TTL = 30_000;
const SEARCH_SYNONYMS = {
  pant: ["pants", "trouser", "trousers", "bottom"],
  pants: ["pant", "trouser", "trousers", "bottom"],
  trouser: ["pant", "pants", "trousers", "bottom"],
  tshirt: ["t-shirt", "tee", "t shirt"],
  tee: ["tshirt", "t-shirt", "t shirt"],
  short: ["shorts", "half"],
  shorts: ["short", "half"],
  half: ["short", "shorts", "capri"],
  cool: ["casual", "summer", "cotton", "oversized"],
  blue: ["navy", "indigo", "sky"],
  party: ["partywear", "occasion", "dressy"],
  nightwear: ["night suit", "sleepwear", "pajama", "pyjama"],
  pajama: ["pajamas", "night suit", "sleepwear"],
};

const normalizeSearch = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenizeSearch = (value) =>
  [...new Set(normalizeSearch(value).split(" ").filter((token) => token.length > 1))];

const toSearchProduct = (node) => {
  const original = parseFloat(node.compareAtPriceRange?.minVariantPrice?.amount || 0);
  const sale = parseFloat(node.priceRange?.minVariantPrice?.amount || 0);
  const discount = original > sale ? Math.round(((original - sale) / original) * 100) : 0;
  return {
    id: node.id,
    title: node.title,
    handle: node.handle,
    description: node.description || "",
    productType: node.productType || "",
    vendor: node.vendor || "",
    tags: node.tags || [],
    price: sale.toFixed(0),
    compareAtPrice: original > sale ? original.toFixed(0) : null,
    discountPercent: discount > 0 ? discount : null,
    images: (node.images?.edges || []).map((img) => ({ url: img.node.url, alt: img.node.altText })),
  };
};

const scoreSearchProduct = (product, tokens) => {
  const searchable = [product.title, product.handle, product.description, product.productType, product.vendor, ...(product.tags || [])].join(" ").toLowerCase();
  const title = String(product.title || "").toLowerCase();
  const matched = tokens.reduce((total, token) => {
    const alternatives = [token, ...(SEARCH_SYNONYMS[token] || [])];
    return total + (alternatives.some((word) => searchable.includes(word)) ? 1 : 0);
  }, 0);
  const titleMatches = tokens.reduce((total, token) => total + (title.includes(token) ? 1 : 0), 0);
  return matched * 10 + titleMatches * 8 + (searchable.includes(tokens.join(" ")) ? 12 : 0);
};

async function fetchSearchProducts(searchQuery) {
  const response = await fetch(
    `https://${SHOP}.myshopify.com/api/2025-01/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
      },
      body: JSON.stringify({
        query: `query SearchProducts($searchQuery: String!) {
          products(first: 50, query: $searchQuery) {
            edges {
              node {
                id
                title
                description
                handle
                productType
                vendor
                tags
                priceRange {
                  minVariantPrice { amount currencyCode }
                }
                compareAtPriceRange {
                  minVariantPrice { amount }
                }
                images(first: 2) {
                  edges {
                    node { url altText }
                  }
                }
              }
            }
          }
        }`,
        variables: { searchQuery },
      }),
    },
  );

  const data = await response.json();
  if (!response.ok || data.errors) {
    throw new Error(data.errors?.[0]?.message || `Shopify search error: ${response.status}`);
  }
  return (data.data?.products?.edges || []).map((edge) => toSearchProduct(edge.node));
/*
    const original = parseFloat(
      edge.node.compareAtPriceRange.minVariantPrice.amount,
    );
    const sale = parseFloat(edge.node.priceRange.minVariantPrice.amount);
    const discount =
      original > sale ? Math.round(((original - sale) / original) * 100) : 0;

    return {
      id: edge.node.id,
      title: edge.node.title,
      handle: edge.node.handle,
      price: sale.toFixed(0),
      compareAtPrice: original > sale ? original.toFixed(0) : null,
      discountPercent: discount > 0 ? discount : null,
      images: edge.node.images.edges.map((img) => ({
        url: img.node.url,
        alt: img.node.altText,
      })),
    };
  });*/
}
async function searchProducts(query) {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) return [];

  const cached = searchCache.get(normalizedQuery);
  if (cached && Date.now() - cached.createdAt < SEARCH_CACHE_TTL) return cached.products;

  const tokens = tokenizeSearch(normalizedQuery);
  const candidateLists = await Promise.all([
    fetchSearchProducts(normalizedQuery),
    ...tokens.slice(0, 4).map((token) => fetchSearchProducts(token)),
  ]);
  const uniqueProducts = [...new Map(candidateLists.flat().map((product) => [product.id, product])).values()];
  const products = uniqueProducts
    .map((product) => ({ product, score: scoreSearchProduct(product, tokens) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 40)
    .map(({ product }) => product);

  searchCache.set(normalizedQuery, { createdAt: Date.now(), products });
  return products;
}

// for product page  ....
async function fetchSingleProduct(handle) {
  const response = await fetch(
    `https://${SHOP}.myshopify.com/api/2025-01/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
      },
      body: JSON.stringify({
        query: `{
          product(handle: "${handle}") {
            id title description handle
            priceRange { minVariantPrice { amount currencyCode } }
            compareAtPriceRange { minVariantPrice { amount } }
            images(first: 6) {
              edges { node { url altText } }
            }
            options {
              name
              values
            }
            variants(first: 50) {
              edges {
                node {
                  id
                  title
                  availableForSale
                  price { amount }
                  compareAtPrice { amount }
                  selectedOptions {
                    name
                    value
                  }
                }
              }
            }
          }
        }`,
      }),
    },
  );

  const data = await response.json();
  const node = data.data.product;
  if (!node) return null;

  const original = parseFloat(node.compareAtPriceRange.minVariantPrice.amount);
  const sale = parseFloat(node.priceRange.minVariantPrice.amount);
  const discount =
    original > sale ? Math.round(((original - sale) / original) * 100) : 0;

  return {
    id: node.id,
    title: node.title,
    handle: node.handle,
    description: node.description,
    price: sale.toFixed(0),
    compareAtPrice: original > sale ? original.toFixed(0) : null,
    discountPercent: discount > 0 ? discount : null,
    currency: node.priceRange.minVariantPrice.currencyCode,
    images: node.images.edges.map((img) => ({
      url: img.node.url,
      alt: img.node.altText,
    })),
    options: node.options,
    variants: node.variants.edges.map((v) => ({
      id: v.node.id,
      title: v.node.title,
      available: v.node.availableForSale,
      price: parseFloat(v.node.price.amount).toFixed(0),
      selectedOptions: v.node.selectedOptions,
    })),
  };
}

// For Similar product show on every card
async function fetchRecommendedProducts(productId) {
  try {
    console.log("========== START ==========");
    console.log("Product ID:", productId);
    console.log("SHOP:", SHOP);
    console.log(
      "TOKEN:",
      STOREFRONT_TOKEN ? `${STOREFRONT_TOKEN.substring(0, 8)}...` : "UNDEFINED",
    );

    const response = await fetch(
      `https://${SHOP}.myshopify.com/api/2025-01/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
        },
        body: JSON.stringify({
          query: `
            query GetRecommendations($productId: ID!) {
              productRecommendations(productId: $productId) {
                id
                title
                handle

                priceRange {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                }

                compareAtPriceRange {
                  minVariantPrice {
                    amount
                  }
                }

                images(first: 2) {
                  edges {
                    node {
                      url
                      altText
                    }
                  }
                }
              }
            }
          `,
          variables: {
            productId,
          },
        }),
      },
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Shopify HTTP Error: ${response.status}`);
    }

    if (data.errors) {
      console.log("GraphQL Errors:", data.errors);
      throw new Error(data.errors[0].message);
    }

    console.log(
      "Recommendations Count:",
      data.data?.productRecommendations?.length ?? 0,
    );

    return (data.data?.productRecommendations || []).map((product) => {
      const original = parseFloat(
        product.compareAtPriceRange?.minVariantPrice?.amount ?? 0,
      );

      const sale = parseFloat(product.priceRange.minVariantPrice.amount);

      const discount =
        original > sale ? Math.round(((original - sale) / original) * 100) : 0;

      return {
        id: product.id,
        title: product.title,
        handle: product.handle,
        price: sale.toFixed(0),
        compareAtPrice: original > sale ? original.toFixed(0) : null,
        discountPercent: discount || null,
        currency: product.priceRange.minVariantPrice.currencyCode,
        images: product.images.edges.map((img) => ({
          url: img.node.url,
          alt: img.node.altText,
        })),
      };
    });
  } catch (err) {
    console.log("========== ERROR ==========");
    console.log(err);
    throw err;
  }
}
// For You may Also Like on Home Screen Bases on user interests
async function fetchHomeRecommendations(handles) {
  let allProducts = [];
  for (const handle of handles) {
    const product = await fetchSingleProduct(handle);
    if (!product) continue;

    console.log("Product ID:", product.id);
    // const recommendations = await fetchRecommendedProducts(product.id);

    const recommendations = await fetchRecommendedProducts(product.id);

    console.log("Recommendations Count:", recommendations.length);
    console.log(recommendations);

    allProducts.push(...recommendations);
  }

  // Remove viewed products
  allProducts = allProducts.filter((p) => !handles.includes(p.handle));
  // remove duplicates
  allProducts = [
    ...new Map(allProducts.map((item) => [item.handle, item])).values(),
  ];

  return allProducts.slice(0, 8);
}

module.exports = {
  fetchProducts,
  fetchMenu,
  searchProducts,
  fetchSingleProduct,
  fetchRecommendedProducts,
  fetchHomeRecommendations,
};
