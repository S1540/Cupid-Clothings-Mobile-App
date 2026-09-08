const express = require("express");
const router = express.Router();
const judgeMeApi = require("../services/judgeMeService");
const { getAuth } = require("firebase-admin/auth");
const { app, db } = require("../firebaseAdmin");
const { verifyFirebaseToken } = require("../middleware/verifyFirebaseToken");
const { userRequestLimit } = require("../middleware/requestLimit");

router.post("/reviews", verifyFirebaseToken, userRequestLimit, async (req, res) => {
  try {
    const decodedToken = req.user;
    const profile = await db.collection("users").doc(decodedToken.uid).get();
    if (profile.data()?.deletionState) return res.status(409).json({ code: "ACCOUNT_DELETING" });
    const email = profile.data()?.email;
    const { productId, rating, title = "", body, name } = req.body;
    const normalizedRating = Number(rating);
    const normalizedName = String(name || "").trim();
    const normalizedBody = String(body || "").trim();

    if (!productId || !Number.isInteger(normalizedRating) || normalizedRating < 1 || normalizedRating > 5 || !normalizedName || normalizedBody.length < 10) {
      return res.status(400).json({
        success: false,
        error: "Please provide a name, a 1–5 star rating, and a review of at least 10 characters.",
      });
    }

    if (!email) {
      return res.status(400).json({ success: false, code: "EMAIL_REQUIRED", error: "Add a contact email in your profile to submit a review." });
    }

    const submissionRef = db
      .collection("judgemeReviewSubmissions")
      .doc(`${decodedToken.uid}_${productId}`);
    if ((await submissionRef.get()).exists) {
      return res.status(409).json({
        success: false,
        error: "You've already submitted a review for this product.",
      });
    }

    const response = await judgeMeApi.post("/reviews", {
      platform: "shopify",
      id: String(productId),
      name: normalizedName.slice(0, 80),
      email,
      rating: normalizedRating,
      title: String(title).trim().slice(0, 120),
      body: normalizedBody.slice(0, 2000),
    });

    const review = response.data?.review || response.data;
    await submissionRef.set({
      productId: String(productId),
      reviewId: review.id || null,
      submittedAt: new Date(),
      userId: decodedToken.uid,
    });
    return res.status(201).json({
      success: true,
      review: {
        id: review.id,
        rating: review.rating || normalizedRating,
        title: review.title || String(title).trim(),
        body: review.body || normalizedBody,
        reviewer: { name: review.reviewer?.name || normalizedName },
        verified: false,
        created_at: review.created_at || new Date().toISOString(),
      },
      pending: review.published === false,
    });
  } catch (error) {
    const status = error.response?.status;
    const message = "We couldn't submit your review. Please try again.";
    return res.status(status && status < 500 ? status : 500).json({ success: false, error: message });
  }
});

router.get("/sync", verifyFirebaseToken, (req, res, next) => req.user.admin === true ? next() : res.sendStatus(403), async (req, res) => {
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

router.get("/product/:productId", async (req, res) => {
  const { productId } = req.params;

  const doc = await db.collection("judgemeReviews").doc(productId).get();

  if (!doc.exists) {
    return res.status(404).json({
      success: false,
      message: "Reviews not found",
    });
  }

  res.json({
    success: true,
    ...doc.data(),
  });
});
module.exports = router;
