const express = require("express");
const router = express.Router();

const {
  getMyNotifications,
  markNotificationAsRead,
} = require("../Controllers/notificationController");

const { protect } = require("../middleware/authMiddleware");

router.get("/my", protect, getMyNotifications);
router.patch("/:id/read", protect, markNotificationAsRead);

module.exports = router;