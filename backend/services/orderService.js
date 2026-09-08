const { db, app } = require("../firebaseAdmin");
const { FieldValue } = require("firebase-admin/firestore");
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
    console.warn("Product image unavailable for an order item.");
    return null;
  }
};

const { getAuth } = require("firebase-admin/auth");
const { createOrderLifecycle } = require("./orderLifecycle");
module.exports = createOrderLifecycle(db, getAuth(app), FieldValue, getProductImage);