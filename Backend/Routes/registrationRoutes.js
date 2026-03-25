const express = require("express");
const router = express.Router();

const {
  getMyRegistrations,
  updateMyRejectedRegistration,
  approveRegistration,
  rejectRegistration,
} = require("../Controllers/tournamentController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

router.get("/my", protect, authorizeRoles("participant"), getMyRegistrations);
router.put("/:registrationId", protect, authorizeRoles("participant"), updateMyRejectedRegistration);
router.patch("/:registrationId/approve", protect, authorizeRoles("organizer"), approveRegistration);
router.patch("/:registrationId/reject", protect, authorizeRoles("organizer"), rejectRegistration);

module.exports = router;
