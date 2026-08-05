import express from "express";
import { deleteAccount } from "../controllers/userController.js";
import { verifyFirebaseToken } from "../middleware/verifyFirebaseToken.js";

const router = express.Router();

router.delete("/delete-account", verifyFirebaseToken, deleteAccount);

export default router;
