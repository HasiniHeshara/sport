const express = require("express");
const router = express.Router();

const {
  getOrCreateMyChat,
  getMyMessages,
  sendMyMessage,
  getAllChatsForAdmin,
  getChatMessagesForAdmin,
  sendAdminMessage,
} = require("../Controllers/chatController");

const { protect } = require("../middleware/authMiddleware");
const { adminProtect } = require("../middleware/adminMiddleware");

// USER
router.post("/my", protect, getOrCreateMyChat);
router.get("/my/messages", protect, getMyMessages);
router.post("/my/messages", protect, sendMyMessage);

// ADMIN
router.get("/admin/all", adminProtect, getAllChatsForAdmin);
router.get("/admin/:chatId/messages", adminProtect, getChatMessagesForAdmin);
router.post("/admin/:chatId/messages", adminProtect, sendAdminMessage);

module.exports = router;