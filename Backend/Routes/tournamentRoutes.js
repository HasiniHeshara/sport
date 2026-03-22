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
} = require("../Controllers/tournamentController");

const Tournament = require("../Models/tournamentModel");

// ✅ Public / Participant
router.get("/published", getPublishedTournaments);

// ✅ Organizer dashboard (query organizerId for now)
// ✅ Organizer dashboard (for now using query organizerId)
router.get("/mine", getMyTournaments);

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

// ✅ Organizer actions
router.post("/", createTournament);
router.put("/:id", updateTournament);
router.patch("/:id/publish", publishTournament);
router.patch("/:id/unpublish", unpublishTournament);
router.patch("/:id/close", closeTournament);
router.delete("/:id", deleteTournament);

module.exports = router;