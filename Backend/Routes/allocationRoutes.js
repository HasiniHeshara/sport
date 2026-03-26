const express = require("express");
const router = express.Router();
const {
  allocateEquipment,
  getAllocationsByTournament,
  getAllAllocations,
} = require("../Controllers/allocationController");

router.post("/", allocateEquipment);
router.get("/", getAllAllocations);
router.get("/tournament/:tournamentId", getAllocationsByTournament);

module.exports = router;