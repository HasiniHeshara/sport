const express = require("express");
const router = express.Router();
const {
  allocateEquipment,
  getAllocations,
} = require("../Controllers/allocationController");

router.post("/", allocateEquipment);
router.get("/", getAllocations);

module.exports = router;