const Allocation = require("../Models/allocationModel");
const Equipment = require("../Models/equipmentModel");

// Allocate equipment
const allocateEquipment = async (req, res) => {
  try {
    const { equipmentId, eventName, allocatedQuantity, remarks } = req.body;

    if (!equipmentId || !eventName || !allocatedQuantity) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    const equipment = await Equipment.findById(equipmentId);

    if (!equipment) {
      return res.status(404).json({ message: "Equipment not found" });
    }

    if (allocatedQuantity > equipment.availableQuantity) {
      return res.status(400).json({ message: "Not enough equipment available" });
    }

    const newAllocation = new Allocation({
      equipmentId,
      eventName,
      allocatedQuantity,
      remarks,
    });

    await newAllocation.save();

    equipment.availableQuantity -= allocatedQuantity;

    if (equipment.availableQuantity === 0) {
      equipment.status = "Out of Stock";
    } else if (equipment.availableQuantity <= 5) {
      equipment.status = "Limited";
    } else {
      equipment.status = "Available";
    }

    await equipment.save();

    res.status(201).json({ message: "Equipment allocated successfully", newAllocation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get allocation history
const getAllocations = async (req, res) => {
  try {
    const allocations = await Allocation.find()
      .populate("equipmentId", "equipmentName")
      .sort({ createdAt: -1 });

    res.status(200).json(allocations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  allocateEquipment,
  getAllocations,
};