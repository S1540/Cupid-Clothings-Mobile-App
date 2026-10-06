import { getAnalytics } from "@react-native-firebase/analytics";

// Resolve lazily inside the best-effort boundary, including SDK initialization.
const analytics = new Proxy({} as ReturnType<typeof getAnalytics>, {
  get(_target, property) {
    const instance = getAnalytics();
    const value = Reflect.get(instance, property);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

const events = {
  appOpen: async () => {
    await analytics.logAppOpen();
  },

  login: async (method = "phone") => {
    await analytics.logLogin({
      method,
    });
  },

  signUp: async (method = "phone") => {
    await analytics.logSignUp({
      method,
    });
  },

  viewProduct: async (product: {
    id: string;
    title: string;
    price: number;
    category?: string;
  }) => {
    await analytics.logViewItem({
      currency: "INR",
      value: product.price,
      items: [
        {
          item_id: product.id,
          item_name: product.title,
          item_category: product.category,
          price: product.price,
          quantity: 1,
        },
      ],
    });
  },

  addToCart: async (product: {
    id: string;
    title: string;
    price: number;
    quantity: number;
  }) => {
    await analytics.logAddToCart({
      currency: "INR",
      value: product.price * product.quantity,
      items: [
        {
          item_id: product.id,
          item_name: product.title,
          price: product.price,
          quantity: product.quantity,
        },
      ],
    });
  },

  beginCheckout: async (value: number) => {
    await analytics.logBeginCheckout({
      currency: "INR",
      value,
    });
  },

  purchase: async (
    orderId: string,
    total: number,
    products: {
      id: string;
      title: string;
      quantity?: number;
      price?: number;
    }[],
  ) => {
    await analytics.logPurchase({
      transaction_id: orderId,
      currency: "INR",
      value: total,
      items: products.map((product) => ({
        item_id: product.id,
        item_name: product.title,
        quantity: product.quantity ?? 1,
        ...(product.price === undefined ? {} : { price: product.price }),
      })),
    });
  },

  search: async (keyword: string) => {
    // Search is free text and may contain contact details or an address.
    await analytics.logEvent("search", {
      query_length_band: keyword.trim().length <= 10 ? "short" : "long",
    });
  },

  wishlist: async (product: { id: string; title: string }) => {
    await analytics.logAddToWishlist({
      currency: "INR",
      value: 0,
      items: [
        {
          item_id: product.id,
          item_name: product.title,
        },
      ],
    });
  },

  screen: async (screenName: string) => {
    await analytics.logScreenView({
      screen_name: screenName,
      screen_class: screenName,
    });
  },

  // Custom Events
  deleteAccount: async () => {
    await analytics.logEvent("delete_account", {});
  },

  coinRedeemed: async (coins: number) => {
    await analytics.logEvent("coins_redeemed", {
      coins,
    });
  },

  sizeSelected: async (size: string) => {
    await analytics.logEvent("size_selected", {
      size,
    });
  },
  emailAdded: async () => analytics.logEvent("email_added", {}),
  otp: async (
    event:
      | "phone_otp_requested"
      | "phone_otp_verified"
      | "phone_login_success"
      | "phone_login_failed",
    purpose: string,
    isResend = false,
    code?: string,
  ) => {
    const allowedPurposes = ["login", "link", "change", "reauth"];
    const allowedErrors = [
      "auth/invalid-verification-code",
      "auth/session-expired",
      "auth/too-many-requests",
      "auth/network-request-failed",
      "auth/credential-already-in-use",
    ];
    await analytics.logEvent(event, {
      purpose: allowedPurposes.includes(purpose) ? purpose : "login",
      is_resend: isResend ? 1 : 0,
      ...(code
        ? {
            error_category: allowedErrors.includes(code)
              ? code.replace("auth/", "")
              : "other",
          }
        : {}),
    });
  },
};

// Analytics is best effort. Rejected logging must never interrupt commerce/auth.
export const Analytics = new Proxy(events, {
  get(target, property: keyof typeof events) {
    const handler = target[property];
    if (typeof handler !== "function") return handler;
    return (...args: unknown[]) =>
      Promise.resolve()
        .then(() => (handler as (...values: unknown[]) => unknown)(...args))
        .catch(() => undefined);
  },
});
