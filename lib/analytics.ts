import { getAnalytics } from "@react-native-firebase/analytics";

const analytics = getAnalytics();

export const Analytics = {
  appOpen: async () => {
    await analytics.logAppOpen();
  },

  login: async () => {
    await analytics.logLogin({
      method: "email",
    });
  },

  signUp: async () => {
    await analytics.logSignUp({
      method: "email",
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
      value: product.price,
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
    product: {
      id: string;
      title: string;
    },
  ) => {
    await analytics.logPurchase({
      transaction_id: orderId,
      currency: "INR",
      value: total,
      items: [
        {
          item_id: product.id,
          item_name: product.title,
          quantity: 1,
        },
      ],
    });
  },

  search: async (keyword: string) => {
    await analytics.logSearch({
      search_term: keyword,
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
};
