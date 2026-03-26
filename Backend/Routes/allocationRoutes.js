const express = require("express");
const router = express.Router();
const {
  allocateEquipment,
  getAllocationsByTournament,
} = require("../Controllers/allocationController");

router.post("/", allocateEquipment);
router.get("/tournament/:tournamentId", getAllocationsByTournament);

module.exports = router;