const Equipment = require("../Models/equipmentModel");

// Add equipment
const addEquipment = async (req, res) => {
  try {
    const { equipmentName, totalQuantity, description } = req.body;

    if (!equipmentName || totalQuantity === undefined) {
      return res
        .status(400)
        .json({ message: "Equipment name and total quantity are required" });
    }

    if (totalQuantity < 0) {
      return res
        .status(400)
        .json({ message: "Total quantity cannot be negative" });
    }

    let status = "Available";
    if (totalQuantity === 0) status = "Out of Stock";
    else if (totalQuantity <= 5) status = "Limited";

    const newEquipment = new Equipment({
      equipmentName,
      totalQuantity,
      availableQuantity: totalQuantity,
      description,
      status,
    });

    const savedEquipment = await newEquipment.save();
    res.status(201).json(savedEquipment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all equipment
const getAllEquipment = async (req, res) => {
  try {
    const equipmentList = await Equipment.find().sort({ createdAt: -1 });
    res.status(200).json(equipmentList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update equipment
const updateEquipment = async (req, res) => {
  try {
    const { equipmentName, totalQuantity, description } = req.body;

    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({ message: "Equipment not found" });
    }

    if (!equipmentName || totalQuantity === undefined) {
      return res
        .status(400)
        .json({ message: "Equipment name and total quantity are required" });
    }

    if (totalQuantity < 0) {
      return res
        .status(400)
        .json({ message: "Total quantity cannot be negative" });
    }

    const usedQuantity = equipment.totalQuantity - equipment.availableQuantity;

    if (totalQuantity < usedQuantity) {
      return res.status(400).json({
        message:
          "Total quantity cannot be less than already allocated quantity",
      });
    }

    equipment.equipmentName = equipmentName;
    equipment.totalQuantity = totalQuantity;
    equipment.availableQuantity = totalQuantity - usedQuantity;
    equipment.description = description || "";

    if (equipment.availableQuantity === 0) equipment.status = "Out of Stock";
    else if (equipment.availableQuantity <= 5) equipment.status = "Limited";
    else equipment.status = "Available";

    const updatedEquipment = await equipment.save();
    res.status(200).json(updatedEquipment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete equipment
const deleteEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({ message: "Equipment not found" });
    }

    await Equipment.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Equipment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addEquipment,
  getAllEquipment,
  updateEquipment,
  deleteEquipment,
};