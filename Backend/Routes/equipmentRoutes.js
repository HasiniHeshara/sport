const express = require("express");
const router = express.Router();
const {
  addEquipment,
  getAllEquipment,
} = require("../Controllers/equipmentController");

router.post("/", addEquipment);
router.get("/", getAllEquipment);

module.exports = router;