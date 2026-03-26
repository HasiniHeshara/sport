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

// Return / damage / lost update
const updateAllocationStatus = async (req, res) => {
  try {
    const { returnedQuantity = 0, damagedQuantity = 0, lostQuantity = 0, remarks } = req.body;

    const allocation = await Allocation.findById(req.params.id);
    if (!allocation) {
      return res.status(404).json({ message: "Allocation record not found" });
    }

    const equipment = await Equipment.findById(allocation.equipmentId);
    if (!equipment) {
      return res.status(404).json({ message: "Equipment not found" });
    }

    const totalHandled =
      Number(returnedQuantity) + Number(damagedQuantity) + Number(lostQuantity);

    if (totalHandled <= 0) {
      return res.status(400).json({
        message: "At least one quantity must be entered",
      });
    }

    if (totalHandled > allocation.allocatedQuantity) {
      return res.status(400).json({
        message: "Handled quantity cannot exceed allocated quantity",
      });
    }

    allocation.returnedQuantity = Number(returnedQuantity);
    allocation.damagedQuantity = Number(damagedQuantity);
    allocation.lostQuantity = Number(lostQuantity);
    allocation.remarks = remarks || allocation.remarks;
    allocation.returnedDate = new Date();

    if (Number(damagedQuantity) > 0) {
      allocation.status = "Damaged";
    } else if (Number(lostQuantity) > 0) {
      allocation.status = "Lost";
    } else {
      allocation.status = "Returned";
    }

    // only returned items go back to available stock
    equipment.availableQuantity += Number(returnedQuantity);

    if (equipment.availableQuantity === 0) {
      equipment.status = "Out of Stock";
    } else if (equipment.availableQuantity <= 5) {
      equipment.status = "Limited";
    } else {
      equipment.status = "Available";
    }

    await allocation.save();
    await equipment.save();

    res.status(200).json({
      message: "Allocation updated successfully",
      allocation,
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

// Get all allocations for admin
const getAllAllocations = async (req, res) => {
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
  updateAllocationStatus,
  getAllocationsByTournament,
  getAllAllocations,
};