import { create } from "zustand";

export interface OrderProduct {
  image?: string;
  title: string;
  variant_title?: string;
  quantity: number;
  price: string;
}

export interface ShippingAddress {
  name?: string;
  phone?: string;
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  zip?: string;
  country?: string;
}

export interface TrackingHistoryItem {
  date: string;
  activity: string;
  location?: string;
  status?: string;
  "sr-status"?: string;
  "sr-status-label"?: string;
}

export interface Order {
  orderId: any;
  orderNumber: number;
  shopifyName?: string;
  total: number;
  status?: string;
  createdAt?: any;
  orderConfirmedAt?: any;
  awb?: string;
  courier?: string;
  shiprocketOrderId?: number;
  trackingStatus?: string;
  trackingUpdatedAt?: any;
  estimatedDeliveryDate?: string;
  trackingHistory?: TrackingHistoryItem[];
  pickupExceptionReason?: string;
  undeliveredReason?: string;
  products: OrderProduct[];
  shippingAddress?: ShippingAddress;
}

interface OrderStore {
  orders: Order[];
  ordersLoaded: boolean;
  setOrders: (orders: Order[]) => void;
  updateOrder: (order: Order) => void;
  clearOrders: () => void;
}

export const useOrderStore = create<OrderStore>((set) => ({
  orders: [],
  ordersLoaded: false,

  setOrders: (orders) =>
    set({
      orders,
      ordersLoaded: true,
    }),

  updateOrder: (updatedOrder) =>
    set((state) => ({
      orders: state.orders.map((order) =>
        order.orderId === updatedOrder.orderId ? updatedOrder : order,
      ),
    })),

  clearOrders: () =>
    set({
      orders: [],
    }),
}));
