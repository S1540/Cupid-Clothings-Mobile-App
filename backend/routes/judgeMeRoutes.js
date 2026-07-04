const express = require("express");
const router = express.Router();
const judgeMeApi = require("../services/judgeMeService");

router.get("/review-summary", async (req, res) => {
  try {
    let currentPage = 1;
    const perPage = 100;
    let allReviews = [];
    let hasMore = true;

    while (hasMore) {
      const response = await judgeMeApi.get("/reviews", {
        params: {
          page: currentPage,
          per_page: perPage,
        },
      });

      const reviews = response.data.reviews || [];

      allReviews.push(...reviews);

      if (reviews.length < perPage) {
        hasMore = false;
      } else {
        currentPage++;
      }
    }

    const summary = {};

    allReviews.forEach((review) => {
      const productId = String(review.product_external_id);

      if (!summary[productId]) {
        summary[productId] = {
          reviewCount: 0,
          totalRating: 0,
        };
      }

      summary[productId].reviewCount++;
      summary[productId].totalRating += review.rating;
    });

    Object.keys(summary).forEach((productId) => {
      summary[productId].averageRating = Number(
        (
          summary[productId].totalRating / summary[productId].reviewCount
        ).toFixed(1),
      );

      delete summary[productId].totalRating;
    });

    res.json({
      success: true,
      totalProducts: Object.keys(summary).length,
      totalReviews: allReviews.length,
      summary,
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
