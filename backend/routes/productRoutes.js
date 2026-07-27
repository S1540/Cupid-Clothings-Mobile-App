const express = require("express");

const router = express.Router();

const {
  getProductByCollection,
  getMenu,
  searchedProducts,
  getProductByHandle,
  getRecommendations,
  getHomeRecommendations,
} = require("../controllers/productController");
const { fetchRecommendedProducts } = require("../services/shopifyService");

router.get("/menu/:handle", getMenu);
router.get("/search", searchedProducts);
router.get("/product/:handle", getProductByHandle);
router.get("/recommendations/:productId", getRecommendations);
router.get("/:handle", getProductByCollection);
router.post("/recommendations/home", getHomeRecommendations);

module.exports = router;
