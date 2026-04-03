const express = require("express");
const router = express.Router();

const {
  registerTeam,
  getMyTeamRegistration,
  getMyRegistrations,
  getMyRegistrationById,
  updateMyRegistration,
  deleteMyRegistration,
} = require("../Controllers/participantController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

router.post(
  "/tournaments/:id/register-team",
  protect,
  authorizeRoles("participant"),
  registerTeam
);
router.get(
  "/tournaments/:id/my-registration",
  protect,
  authorizeRoles("participant"),
  getMyTeamRegistration
);
router.get(
  "/registrations/my",
  protect,
  authorizeRoles("participant"),
  getMyRegistrations
);
router.get(
  "/registrations/:registrationId",
  protect,
  authorizeRoles("participant"),
  getMyRegistrationById
);
router.put(
  "/registrations/:registrationId",
  protect,
  authorizeRoles("participant"),
  updateMyRegistration
);
router.delete(
  "/registrations/:registrationId",
  protect,
  authorizeRoles("participant"),
  deleteMyRegistration
);

module.exports = router;