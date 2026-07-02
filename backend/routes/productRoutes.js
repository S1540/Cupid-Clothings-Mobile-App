const express = require("express");

const router = express.Router();

const {
  getProductByCollection,
  getMenu,
  searchedProducts,
  getProductByHandle,
  getRecommendations,
} = require("../controllers/productController");
const { fetchRecommendedProducts } = require("../services/shopifyService");

router.get("/menu/:handle", getMenu);
router.get("/search", searchedProducts);
router.get("/product/:handle", getProductByHandle);
router.get("/recommendations/:productId", getRecommendations);
router.get("/:handle", getProductByCollection);

module.exports = router;
