const express = require("express");
const { db } = require("./firebaseAdmin");
require("dotenv").config();

const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const { saveOrderToFirebase } = require("./services/orderService");
const app = express();

app.use(express.json());
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
// Test Webhook Shiprocket
app.post("/api/tracking-webhook", async (req, res) => {
  const token = req.headers["x-api-key"];

  // if (token !== "cupid_shiprocket_secret") {
  //   return res.status(401).send("Unauthorized");
  // }

  console.log("=== SHIPROCKET WEBHOOK ===");
  console.log(JSON.stringify(req.body, null, 2));

  res.status(200).send("OK");
});
app.get("/api/tracking-webhook", (req, res) => {
  res.status(200).send("Webhook Working");
});

app.get("/", (req, res) => {
  res.send("Cupid Clothing Backend Running Successfully ...");
});
// app.get("/test-firebase", async (req, res) => {
//   await db.collection("test").add({
//     message: "Firebase connected",
//     createdAt: new Date(),
//   });

//   res.send("Success");
// });

// app.get("/test-order-save", async (req, res) => {
//   const fakeOrder = {
//     id: "999999",
//     order_number: 74164,
//     email: "shubhamkumar2452004@gmail.com",
//     total_price: "899",

//     line_items: [
//       {
//         product_id: 123,
//         variant_id: 456,
//         title: "Cotton Capris For Women",
//         variant_title: "6XL / Black",
//         quantity: 1,
//         price: "849",
//       },
//     ],

//     shipping_address: {
//       name: "Shubham Singh",
//       city: "Buxar",
//       province: "Bihar",
//     },

//     financial_status: "paid",
//   };

//   await saveOrderToFirebase(fakeOrder);

//   res.send("Fake order saved");
// });
app.get("/api/orders/shopify/order-created", (req, res) => {
  res.send("Webhook Route Working");
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
