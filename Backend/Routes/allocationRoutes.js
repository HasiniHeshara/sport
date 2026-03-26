const express = require("express");
const router = express.Router();
const {
  allocateEquipment,
  updateAllocationStatus,
  getAllocationsByTournament,
  getAllAllocations,
} = require("../Controllers/allocationController");

router.post("/", allocateEquipment);
router.get("/", getAllAllocations);
router.get("/tournament/:tournamentId", getAllocationsByTournament);
router.put("/:id/return", updateAllocationStatus);

module.exports = router;