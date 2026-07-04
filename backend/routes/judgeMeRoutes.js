const express = require("express");
const router = express.Router();

router.get("/test", async (req, res) => {
  res.json({
    success: true,
    message: "Judge.me Route Working",
  });
});

module.exports = router;
