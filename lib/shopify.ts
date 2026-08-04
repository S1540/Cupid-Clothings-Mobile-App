import type { User } from "firebase/auth";
import type { CartItem } from "@/store/cartStore";

const SHOPIFY_DOMAIN = process.env.EXPO_PUBLIC_SHOPIFY_DOMAIN!;
const STOREFRONT_TOKEN = process.env.EXPO_PUBLIC_SHOPIFY_STOREFRONT_TOKEN!;

type ShopifyUserError = {
  field?: string[] | null;
  message: string;
};

type ShopifyCartResponse = {
  data?: {
    cartCreate?: {
      cart?: {
        id: string;
        checkoutUrl: string;
        totalQuantity: number;
      } | null;
      userErrors?: ShopifyUserError[];
    };
  };
  errors?: { message: string }[];
};

function validateCheckoutItems(cartItems: CartItem[]): void {
  if (!cartItems.length) {
    throw new Error("Your bag is empty.");
  }

  for (const item of cartItems) {
    if (!item.variantId || item.variantId.startsWith("legacy:")) {
      throw new Error(
        `${item.title || "This item"} needs a selected size or variant before checkout.`,
      );
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      throw new Error(
        `${item.title || "This item"} has an invalid quantity. Please update your bag and try again.`,
      );
    }
  }
}

export async function createCheckoutCart(
  cartItems: CartItem[],
  user: User | null,
): Promise<ShopifyCartResponse> {
  validateCheckoutItems(cartItems);

  if (!SHOPIFY_DOMAIN || !STOREFRONT_TOKEN) {
    throw new Error("Checkout is not configured. Please try again later.");
  }

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

  let result: ShopifyCartResponse;
  try {
    result = (await response.json()) as ShopifyCartResponse;
  } catch {
    throw new Error("Checkout returned an invalid response. Please try again.");
  }

  if (!response.ok) {
    throw new Error(
      result.errors?.map((error) => error.message).join(" ") ||
        "Checkout could not be started. Please try again.",
    );
  }

  if (result.errors?.length) {
    throw new Error(result.errors.map((error) => error.message).join(" "));
  }

  const userErrors = result.data?.cartCreate?.userErrors ?? [];
  if (userErrors.length) {
    throw new Error(userErrors.map((error) => error.message).join(" "));
  }

  if (!result.data?.cartCreate?.cart?.checkoutUrl) {
    throw new Error("Shopify did not return a checkout URL.");
  }

  return result;
}
