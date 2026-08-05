const express = require("express");
const router = express.Router();

const { deleteAccount } = require("../controllers/userController");
const { verifyFirebaseToken } = require("../middleware/verifyFirebaseToken");

router.delete("/delete-account", verifyFirebaseToken, deleteAccount);

module.exports = router;
