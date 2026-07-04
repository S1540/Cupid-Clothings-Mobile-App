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

module.exports = router;
