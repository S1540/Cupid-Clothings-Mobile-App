const { db } = require("../firebaseAdmin");
const axios = require("axios");

// Fetch product image from Shopify Admin API
const getProductImage = async (productId) => {
  try {
    const response = await axios.get(
      `https://${process.env.SHOPIFY_STORE}/admin/api/2025-04/products/${productId}.json`,
      {
        headers: {
          "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_ACCESS_TOKEN,
        },
      },
    );

    return response.data.product?.image?.src || null;
  } catch (error) {
    console.log(
      `IMAGE FETCH ERROR (${productId}):`,
      error.response?.data || error.message,
    );
    return null;
  }
};

const saveOrderToFirebase = async (order) => {
  const email = order.email || order.contact_email;
  console.log(email);

  const userSnap = await db
    .collection("users")
    .where("email", "==", email)
    .limit(1)
    .get();

  console.log("FOUND USERS:", userSnap.size);

  if (userSnap.empty) {
    console.log("User not found");
    return;
  }

  const uid = userSnap.docs[0].id;

  // Build products array with images
  const products = await Promise.all(
    (order.line_items || []).map(async (item) => ({
      product_id: item.product_id,
      variant_id: item.variant_id,
      title: item.title,
      variant_title: item.variant_title,
      quantity: item.quantity,
      price: item.price,
      image: item.product_id ? await getProductImage(item.product_id) : null,
    })),
  );

  // console.log("PRODUCTS WITH IMAGES:");
  // console.log(JSON.stringify(products, null, 2));

  await db
    .collection("users")
    .doc(uid)
    .collection("orders")
    .doc(String(order.id))
    .set({
      orderId: String(order.id),
      orderNumber: order.order_number,
      shopifyName: order.name || null,
      status: order.financial_status,
      total: Number(order.total_price),
      createdAt: new Date(),
      orderConfirmedAt: new Date(),
      products,
      shippingAddress: order.shipping_address || {},
      awb: null,
      courier: null,
      shiprocketOrderId: null,
      trackingStatus: null,
    });

  console.log("ORDER SAVED:", order.id);
};

// Update firebase order upon shopify order accepted
const updateTrackingStatus = async (payload) => {
  const orderNumber = Number(payload.order_id);

  console.log("ORDER NUMBER:", orderNumber);
  console.log("AWB:", payload.awb);

  const usersSnap = await db.collection("users").get();

  for (const userDoc of usersSnap.docs) {
    const orderSnap = await db
      .collection("users")
      .doc(userDoc.id)
      .collection("orders")
      .where("orderNumber", "==", orderNumber)
      .limit(1)
      .get();

    console.log("CHECK USER:", userDoc.id, "MATCHES:", orderSnap.size);

    if (!orderSnap.empty) {
      console.log("ORDER FOUND");

      const orderDoc = orderSnap.docs[0];
      const userRef = db.collection("users").doc(userDoc.id);
      const userData = (await userRef.get()).data();

      // console.log("USER DATA:", {
      //   referredBy: userData.referredBy,
      //   rewardGiven: userData.rewardGiven,
      // });

      await orderDoc.ref.update({
        shiprocketOrderId: payload.sr_order_id || null,
        awb: payload.awb || null,
        courier: payload.courier_name || null,
        trackingStatus: payload.current_status || null,
        trackingUpdatedAt: new Date(),
        estimatedDeliveryDate: payload.etd || null,
        trackingHistory: Array.isArray(payload.scans) ? payload.scans : [],
        pickupExceptionReason: payload.pickup_exception_reason || null,
        undeliveredReason: payload.undelivered_reason || null,
      });

      if (
        payload.current_status?.toUpperCase() === "DELIVERED" &&
        userData.referredBy &&
        !userData.rewardGiven
      ) {
        console.log("REFERRAL REWARD ELIGIBLE");

        const referrerSnap = await db
          .collection("users")
          .where("referralCode", "==", userData.referredBy)
          .limit(1)
          .get();

        if (!referrerSnap.empty) {
          const referrerRef = referrerSnap.docs[0].ref;
          const referrerData = referrerSnap.docs[0].data();

          await referrerRef.update({
            walletBalance: (referrerData.walletBalance || 0) + 79,
            totalEarnings: (referrerData.totalEarnings || 0) + 79,
            referralEarnings: (referrerData.referralEarnings || 0) + 79,
            lastRewardAt: new Date(),
          });

          await userRef.update({
            walletBalance: (userData.walletBalance || 0) + 79,
            totalEarnings: (userData.totalEarnings || 0) + 79,
            rewardGiven: true,
            lastRewardAt: new Date(),
          });

          console.log("₹171 REFERRAL REWARD GIVEN");
        }
      }
      // console.log("TRACKING UPDATED:", orderNumber);
      break;
    }
  }
};
module.exports = {
  saveOrderToFirebase,
  updateTrackingStatus,
};
