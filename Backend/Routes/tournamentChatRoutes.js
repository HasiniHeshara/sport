const express = require("express");
const router = express.Router();

const {
  getOrCreateTournamentChat,
  getParticipantTournamentMessages,
  sendParticipantTournamentMessage,
  getOrganizerTournamentChats,
  getOrganizerTournamentChatMessages,
  sendOrganizerTournamentMessage,
  getParticipantUnreadOrganizerCount,
} = require("../Controllers/tournamentChatController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// participant side
router.post(
  "/tournament/:tournamentId/start",
  protect,
  authorizeRoles("participant"),
  getOrCreateTournamentChat
);

router.get(
  "/tournament/:tournamentId/messages",
  protect,
  authorizeRoles("participant"),
  getParticipantTournamentMessages
);

router.post(
  "/tournament/:tournamentId/messages",
  protect,
  authorizeRoles("participant"),
  sendParticipantTournamentMessage
);

router.get(
  "/participant/unread-count",
  protect,
  authorizeRoles("participant"),
  getParticipantUnreadOrganizerCount
);

// organizer side
router.get(
  "/organizer/chats",
  protect,
  authorizeRoles("organizer"),
  getOrganizerTournamentChats
);

router.get(
  "/organizer/chats/:chatId/messages",
  protect,
  authorizeRoles("organizer"),
  getOrganizerTournamentChatMessages
);

router.post(
  "/organizer/chats/:chatId/messages",
  protect,
  authorizeRoles("organizer"),
  sendOrganizerTournamentMessage
);

module.exports = router;