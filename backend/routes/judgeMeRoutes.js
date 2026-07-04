const express = require("express");
const router = express.Router();
const judgeMeApi = require("../services/judgeMeService");

router.get("/test", async (req, res) => {
  try {
    const response = await judgeMeApi.get("/reviews", {
      params: {
        per_page: 1,
      },
    });

    res.json({
      success: true,
      total_reviews: response.data.total_count,
      data: response.data.reviews,
    });
  } catch (error) {
    console.error(error.response?.data || error.message);

    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
});
router.get("/product/:productId", async (req, res) => {
  try {
    const { productId } = req.params;

    const response = await judgeMeApi.get("/reviews", {
      params: {
        product_id: productId,
      },
    });

    res.json({
      success: true,
      reviews: response.data.reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
});
router.get("/raw", async (req, res) => {
  try {
    const response = await judgeMeApi.get("/reviews", {
      params: {
        per_page: 100,
      },
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
});

module.exports = router;
