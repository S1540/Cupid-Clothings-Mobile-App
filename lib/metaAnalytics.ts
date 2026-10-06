import { AppEventsLogger } from "react-native-fbsdk-next";

export const MetaAnalytics = {
  //  View Product
  viewProduct: (product: { id: string; title: string; price: number }) => {
    const price = Number(product.price);

    AppEventsLogger.logEvent(AppEventsLogger.AppEvents.ViewedContent, price, {
      [AppEventsLogger.AppEventParams.ContentID]: product.id,
      [AppEventsLogger.AppEventParams.ContentType]: "product",
      [AppEventsLogger.AppEventParams.Currency]: "INR",
    });
  },

  //  Add To Cart
  addToCart: (product: {
    id: string;
    title: string;
    price: number;
    quantity: number;
  }) => {
    const price = Number(product.price);
    const quantity = Number(product.quantity);
    const totalPrice = price * quantity;

    AppEventsLogger.logEvent(
      AppEventsLogger.AppEvents.AddedToCart,
      totalPrice,
      {
        [AppEventsLogger.AppEventParams.ContentID]: product.id,
        [AppEventsLogger.AppEventParams.ContentType]: "product",
        [AppEventsLogger.AppEventParams.Currency]: "INR",
        quantity: quantity,
      },
    );
  },

  // Initiate Checkout
  initiateCheckout: (
    cartItems: {
      id: string;
      title: string;
      price: number;
      quantity: number;
    }[],
  ) => {
    const totalPrice = cartItems.reduce(
      (total, item) => total + Number(item.price) * Number(item.quantity),
      0,
    );

    const totalQuantity = cartItems.reduce(
      (total, item) => total + Number(item.quantity),
      0,
    );

    console.log("META CHECKOUT TOTAL:", totalPrice);
    console.log("META CHECKOUT ITEMS:", totalQuantity);

    AppEventsLogger.logEvent(
      AppEventsLogger.AppEvents.InitiatedCheckout,
      totalPrice,
      {
        [AppEventsLogger.AppEventParams.NumItems]: totalQuantity,
        [AppEventsLogger.AppEventParams.Currency]: "INR",
      },
    );
  },
};
