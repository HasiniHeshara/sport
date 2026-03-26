const Allocation = require("../Models/allocationModel");
const Equipment = require("../Models/equipmentModel");

// Book equipment for a tournament
const allocateEquipment = async (req, res) => {
  try {
    const {
      equipmentId,
      tournamentId,
      tournamentTitle,
      allocatedQuantity,
      remarks,
    } = req.body;

    if (
      !equipmentId ||
      !tournamentId ||
      !tournamentTitle ||
      !allocatedQuantity
    ) {
      return res.status(400).json({
        message: "All required fields must be filled",
      });
    }

    if (allocatedQuantity <= 0) {
      return res.status(400).json({
        message: "Allocated quantity must be greater than 0",
      });
    }

    const equipment = await Equipment.findById(equipmentId);

    if (!equipment) {
      return res.status(404).json({ message: "Equipment not found" });
    }

    if (allocatedQuantity > equipment.availableQuantity) {
      return res.status(400).json({
        message: "Requested quantity exceeds available stock",
      });
    }

    const newAllocation = new Allocation({
      equipmentId,
      tournamentId,
      tournamentTitle,
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

    res.status(201).json({
      message: "Equipment booked successfully",
      allocation: newAllocation,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get allocations for one tournament
const getAllocationsByTournament = async (req, res) => {
  try {
    const allocations = await Allocation.find({
      tournamentId: req.params.tournamentId,
    })
      .populate(
        "equipmentId",
        "equipmentName totalQuantity availableQuantity status"
      )
      .sort({ createdAt: -1 });

    res.status(200).json(allocations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  allocateEquipment,
  getAllocationsByTournament,
};