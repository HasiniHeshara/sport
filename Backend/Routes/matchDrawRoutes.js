const express = require("express");
const router = express.Router();

const {
  generateMatchDraw,
  getMatchDrawByTournament,
  updateMatchFixture,
  updateMatchResult,
  updateChampion,
} = require("../Controllers/matchDrawController");

const { protect } = require("../Middleware/authMiddleware");

router.post("/tournaments/:id/match-draw", protect, generateMatchDraw);
router.get("/tournaments/:id/match-draw", protect, getMatchDrawByTournament);

router.patch("/tournaments/:id/match-draw/:matchNumber/fixture", protect, updateMatchFixture);
router.patch("/tournaments/:id/match-draw/:matchNumber/result", protect, updateMatchResult);
router.patch("/tournaments/:id/match-draw/champion", protect, updateChampion);

module.exports = router;