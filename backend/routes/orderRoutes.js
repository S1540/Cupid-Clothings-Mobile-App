const express = require("express");
const router = express.Router();
const {
  saveOrderToFirebase,
  updateTrackingStatus,
} = require("../services/orderService");

router.post("/shopify/order-created", async (req, res) => {
  try {
    const order = req.body;
    await saveOrderToFirebase(order);
    res.status(200).send("OK");
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error.message,
    });
  }
});

router.post("/tracking-webhook", async (req, res) => {
  try {
    console.log("=== SHIPROCKET WEBHOOK ===");
    console.log(JSON.stringify(req.body, null, 2));

    await updateTrackingStatus(req.body);

    res.status(200).send("OK");
  } catch (err) {
    console.error(err);
    res.status(500).send("ERROR");
  }
});
router.get("/test-delivered", async (req, res) => {
  await updateTrackingStatus({
    order_id: "74242",
    current_status: "DELIVERED",
    awb: "80101491724",
    courier_name: "Blue Dart Air",
    sr_order_id: 999999,
  });

  res.send("done");
});

module.exports = router;
