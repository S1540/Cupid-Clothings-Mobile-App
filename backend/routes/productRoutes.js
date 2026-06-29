const express = require("express");

const router = express.Router();

const {
  getProductByCollection,
  getMenu,
  searchedProducts,
  getProductByHandle,
} = require("../controllers/productController");

router.get("/menu/:handle", getMenu);
router.get("/search", searchedProducts);
router.get("/product/:handle", getProductByHandle);
router.get("/:handle", getProductByCollection);

module.exports = router;
