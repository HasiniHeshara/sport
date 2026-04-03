const express = require("express");
const router = express.Router();

const {
  approveRegistration,
  rejectRegistration,
} = require("../Controllers/tournamentController");

const {
  getMyRegistrations,
  updateMyRejectedRegistration,
  requestEditApprovedMembers,
  requestDeleteApprovedTeam,
} = require("../Controllers/participantController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

router.get("/my", protect, authorizeRoles("participant"), getMyRegistrations);
router.put("/:registrationId", protect, authorizeRoles("participant"), updateMyRejectedRegistration);
router.put("/:registrationId/edit-members", protect, authorizeRoles("participant"), requestEditApprovedMembers);
router.delete("/:registrationId", protect, authorizeRoles("participant"), requestDeleteApprovedTeam);
router.patch("/:registrationId/approve", protect, authorizeRoles("organizer"), approveRegistration);
router.patch("/:registrationId/reject", protect, authorizeRoles("organizer"), rejectRegistration);

module.exports = router;
