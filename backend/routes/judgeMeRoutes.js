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
    const productReviews = {};

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

      // NEW
      if (!productReviews[productId]) {
        productReviews[productId] = [];
      }

      productReviews[productId].push({
        id: review.id,
        rating: review.rating,
        title: review.title,
        body: review.body,
        reviewer: {
          name: review.reviewer?.name || "Anonymous",
        },
        verified: review.verified,
        created_at: review.created_at,
        pictures: review.pictures || [],
      });
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

    const batch = db.batch();

    Object.keys(productReviews).forEach((productId) => {
      const ref = db.collection("judgemeReviews").doc(productId);

      batch.set(ref, {
        averageRating: products[productId].averageRating,
        reviewCount: products[productId].reviewCount,
        reviews: productReviews[productId],
        updatedAt: new Date(),
      });
    });

    await batch.commit();

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
router.get("/review-summary", async (req, res) => {
  try {
    const doc = await db.collection("judgeme").doc("summary").get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: "Summary not found. Run sync first.",
      });
    }

    res.json({
      success: true,
      ...doc.data(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
