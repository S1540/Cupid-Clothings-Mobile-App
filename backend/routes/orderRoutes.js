const express = require("express");
const router = express.Router();
const {
  saveOrderToFirebase,
  updateTrackingStatus,
} = require("../services/orderService");
const { fetchRecommendedProducts } = require("../services/shopifyService");
const { verifyShopifyWebhook, verifyShiprocketWebhook } = require("../middleware/verifyWebhooks");

router.post("/shopify/order-created", verifyShopifyWebhook, async (req, res) => {
  try {
    const order = req.body;
    await saveOrderToFirebase(order);
    // res.send("OK");
    res.status(200).send("OK");
  } catch (error) {
    res.status(error.status || 500).json({
      error: "Order update could not be processed.",
    });
  }
});

router.post("/tracking-webhook", verifyShiprocketWebhook, async (req, res) => {
  try {

    await updateTrackingStatus(req.body);

    res.status(200).send("OK");
  } catch (err) {
    res.status(err.status || 500).send("ERROR");
  }
});
// router.get("/test-delivered", async (req, res) => {
//   await updateTrackingStatus({
//     order_id: "74242",
//     current_status: "DELIVERED",
//     awb: "80101491724",
//     courier_name: "Blue Dart Air",
//     sr_order_id: 999999,
//   });

//   res.send("done");
// });
router.get("/recommendations/:productId", async (req, res) => {
  try {
    const products = await fetchRecommendedProducts(req.params.productId);
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;
