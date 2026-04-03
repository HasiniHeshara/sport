const express = require("express");
const router = express.Router();

const {
  approveRegistration,
  rejectRegistration,
} = require("../Controllers/tournamentController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

router.patch("/:registrationId/approve", protect, authorizeRoles("organizer"), approveRegistration);
router.patch("/:registrationId/reject", protect, authorizeRoles("organizer"), rejectRegistration);

module.exports = router;
