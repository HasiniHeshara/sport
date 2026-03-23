const express = require("express");
const router = express.Router();

const {
  createTournament,
  updateTournament,
  publishTournament,
  unpublishTournament,
  closeTournament,
  deleteTournament,
  getPublishedTournaments,
  getMyTournaments,
  registerTeam,
  getMyTeamRegistration,
  getTournamentRegistrations,
} = require("../Controllers/tournamentController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const Tournament = require("../Models/tournamentModel");

// ✅ Public / Participant
router.get("/published", getPublishedTournaments);

// ✅ Organizer dashboard (query organizerId for now)
// ✅ Organizer dashboard (for now using query organizerId)
router.get("/mine", protect, authorizeRoles("organizer"), getMyTournaments);

/**
 * ✅ DEBUG: show real tournament _id + length
 * Use:
 * GET /api/tournaments/debug/mine?organizerId=YOUR_ORGANIZER_ID
 */
router.get("/debug/mine", async (req, res) => {
  try {
    const organizerId = req.query.organizerId;
    const list = await Tournament.find({ organizerId });

    const out = list.map((t) => ({
      id: t._id.toString(),
      length: t._id.toString().length,
      status: t.status,
      title: t.title,
    }));

    res.json(out);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ Get tournament by id (for edit page)
// ✅ Get tournament by id (for testing)
router.get("/:id", async (req, res) => {
  try {
    const t = await Tournament.findById(req.params.id);
    if (!t) return res.status(404).json({ message: "Tournament not found" });
    res.json(t);
  } catch (err) {
    return res.status(400).json({ message: "Invalid tournament id", error: err.message });
  }
});

// ✅ Participant team registration flow
router.post("/:id/register-team", protect, authorizeRoles("participant"), registerTeam);
router.get("/:id/my-registration", protect, authorizeRoles("participant"), getMyTeamRegistration);

// ✅ Organizer registration management
router.get("/:id/registrations", protect, authorizeRoles("organizer"), getTournamentRegistrations);

// ✅ Organizer actions
router.post("/", protect, authorizeRoles("organizer"), createTournament);
router.put("/:id", protect, authorizeRoles("organizer"), updateTournament);
router.patch("/:id/publish", protect, authorizeRoles("organizer"), publishTournament);
router.patch("/:id/unpublish", protect, authorizeRoles("organizer"), unpublishTournament);
router.patch("/:id/close", protect, authorizeRoles("organizer"), closeTournament);
router.delete("/:id", protect, authorizeRoles("organizer"), deleteTournament);

module.exports = router;