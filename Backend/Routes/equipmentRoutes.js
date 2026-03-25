const express = require("express");
const router = express.Router();
const {
  addEquipment,
  getAllEquipment,
  updateEquipment,
  deleteEquipment,
} = require("../Controllers/equipmentController");

router.post("/", addEquipment);
router.get("/", getAllEquipment);
router.put("/:id", updateEquipment);
router.delete("/:id", deleteEquipment);

module.exports = router;