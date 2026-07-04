const express = require("express");
const router = express.Router();
const judgeMeApi = require("../services/judgeMeService");
const { db } = require("../firebaseAdmin");

router.post("/sync", async (req, res) => {
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

    const products = {};

    allReviews.forEach((review) => {
      const productId = String(review.product_external_id);

      if (!products[productId]) {
        products[productId] = {
          reviewCount: 0,
          totalRating: 0,
        };
      }

      products[productId].reviewCount++;
      products[productId].totalRating += review.rating;
    });

    Object.keys(products).forEach((id) => {
      products[id].averageRating = Number(
        (products[id].totalRating / products[id].reviewCount).toFixed(1),
      );

      delete products[id].totalRating;
    });

    await db
      .collection("judgeme")
      .doc("summary")
      .set({
        updatedAt: new Date(),
        totalProducts: Object.keys(products).length,
        totalReviews: allReviews.length,
        products,
      });

    res.json({
      success: true,
      message: "Judge.me summary synced successfully",
      totalProducts: Object.keys(products).length,
      totalReviews: allReviews.length,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post("/sync", async (req, res) => {
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

    const products = {};

    allReviews.forEach((review) => {
      const productId = String(review.product_external_id);

      if (!products[productId]) {
        products[productId] = {
          reviewCount: 0,
          totalRating: 0,
        };
      }

      products[productId].reviewCount++;
      products[productId].totalRating += review.rating;
    });

    Object.keys(products).forEach((id) => {
      products[id].averageRating = Number(
        (products[id].totalRating / products[id].reviewCount).toFixed(1),
      );

      delete products[id].totalRating;
    });

    await db
      .collection("judgeme")
      .doc("summary")
      .set({
        updatedAt: new Date(),
        totalProducts: Object.keys(products).length,
        totalReviews: allReviews.length,
        products,
      });

    res.json({
      success: true,
      message: "Judge.me summary synced successfully",
      totalProducts: Object.keys(products).length,
      totalReviews: allReviews.length,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
