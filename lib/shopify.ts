import type { User } from "@react-native-firebase/auth";
import type { CartItem } from "@/store/cartStore";
import { apiRequest, ApiError } from "./api";
import { Analytics } from "./analytics";


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

  if (!user) throw new ApiError("UNAUTHENTICATED", "Please sign in to place an order and track it in your account.", 401);
  const result = await apiRequest<ShopifyCartResponse>("/api/checkout", {
    method: "POST", body: JSON.stringify({ lines: cartItems.map(item => ({ merchandiseId: item.variantId, quantity: item.quantity })) }),
  });
  void Analytics.beginCheckout(cartItems.reduce((total, item) => total + item.price * item.quantity, 0));
  return result;
}
