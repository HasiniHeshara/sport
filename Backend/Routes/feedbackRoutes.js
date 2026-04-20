const express = require("express");
const router = express.Router();

const {
  createFeedback,
  getAllFeedbacks,
  getRecentFeedbacks,
  deleteFeedback,
} = require("../Controllers/feedbackController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// public for home page
router.get("/recent", getRecentFeedbacks);

// logged-in users only
router.post("/", protect, createFeedback);

// admin only
router.get("/", protect, authorizeRoles("admin"), getAllFeedbacks);
router.delete("/:id", protect, authorizeRoles("admin"), deleteFeedback);

module.exports = router;