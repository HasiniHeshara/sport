const Equipment = require("../Models/equipmentModel");

// Add new equipment
const addEquipment = async (req, res) => {
  try {
    const { equipmentName, totalQuantity, description } = req.body;

    if (!equipmentName || totalQuantity === undefined) {
      return res.status(400).json({ message: "Equipment name and quantity are required" });
    }

    let status = "Available";
    if (totalQuantity === 0) {
      status = "Out of Stock";
    } else if (totalQuantity <= 5) {
      status = "Limited";
    }

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

module.exports = {
  addEquipment,
  getAllEquipment,
};