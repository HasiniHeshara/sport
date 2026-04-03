const express = require("express");
const router = express.Router();
const {
  generateMatchDraw,
  getMatchDrawByTournament,
} = require("../Controllers/matchDrawController");
const { protect } = require("../Middleware/authMiddleware");

router.post("/tournaments/:id/match-draw", protect, generateMatchDraw);
router.get("/tournaments/:id/match-draw", protect, getMatchDrawByTournament);

module.exports = router;