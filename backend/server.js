const express = require("express");
require("dotenv").config();
const { db } = require("./firebaseAdmin");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const judgeMeRoutes = require("./routes/judgeMeRoutes");
const userRoutes = require("./routes/userRoutes");
const { saveOrderToFirebase } = require("./services/orderService");
const app = express();

app.use(express.json());
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/judgeme", judgeMeRoutes);
app.use("/api/users", userRoutes);
// Test Webhook Shiprocket
// app.post("/api/tracking-webhook", async (req, res) => {
//   const token = req.headers["x-api-key"];
//   console.log("=== SHIPROCKET WEBHOOK ===");
//   console.log(JSON.stringify(req.body, null, 2));

//   res.status(200).send("OK");
// });
app.get("/api/tracking-webhook", (req, res) => {
  res.status(200).send("Webhook Working");
});

app.get("/", (req, res) => {
  res.send("Cupid Clothing Backend Running Successfully ...");
});

app.get("/api/orders/shopify/order-created", (req, res) => {
  res.send("Webhook Route Working");
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
