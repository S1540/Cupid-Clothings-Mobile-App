const SHOPIFY_DOMAIN = process.env.EXPO_PUBLIC_SHOPIFY_DOMAIN!;
const STOREFRONT_TOKEN = process.env.EXPO_PUBLIC_SHOPIFY_STOREFRONT_TOKEN!;

export async function createCheckoutCart(cartItems: any[], user: any) {
  const lines = cartItems.map((item) => ({
    merchandiseId: item.variantId,
    quantity: item.quantity,
  }));

  const response = await fetch(
    `https://${SHOPIFY_DOMAIN}/api/2025-04/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
      },
      body: JSON.stringify({
        query: `
          mutation cartCreate($input: CartInput) {
            cartCreate(input: $input) {
              cart {
                id
                checkoutUrl
                totalQuantity

                attributes {
                  key
                  value
                }
              }

              userErrors {
                field
                message
              }
            }
          }
        `,
        variables: {
          input: {
            lines,

            attributes: [
              {
                key: "firebase_uid",
                value: user?.uid || "",
              },
              {
                key: "firebase_email",
                value: user?.email || "",
              },
            ],
          },
        },
      }),
    },
  );

  return response.json();
}
