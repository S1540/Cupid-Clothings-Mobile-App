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
// fetchMenu (Categories)
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
  console.log("==================================");
  console.log("Requested Menu:", menuHandle);
  console.log(JSON.stringify(data, null, 2));
  console.log("==================================");
  console.log(JSON.stringify(data.data.menu.items[0], null, 2));

  if (!data.data?.menu) {
    throw new Error(`Menu "${menuHandle}" not found`);
  }

  return data.data.menu.items.map((item) => ({
    title: item.title,
    handle: item.url?.split("/").pop() || "",

    subcategories: (item.items || []).map((sub) => ({
      title: sub.title,
      handle: sub.url?.split("/").pop() || "",

      // NEW (3rd Level)
      children: (sub.items || []).map((child) => ({
        title: child.title,
        handle: child.url?.split("/").pop() || "",
      })),
    })),
  }));
}
async function searchProducts(query) {
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
          products(first: 20, query: "${query}") {
            edges {
              node {
                id
                title
                handle
                priceRange {
                  minVariantPrice { amount currencyCode }
                }
                compareAtPriceRange {
                  minVariantPrice { amount }
                }
                images(first: 1) {
                  edges {
                    node { url altText }
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
  return data.data.products.edges.map((edge) => {
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
  });
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

module.exports = {
  fetchProducts,
  fetchMenu,
  searchProducts,
  fetchSingleProduct,
  fetchRecommendedProducts,
};
