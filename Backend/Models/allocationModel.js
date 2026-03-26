const mongoose = require("mongoose");

const allocationSchema = new mongoose.Schema(
  {
    equipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Equipment",
      required: true,
    },
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },
    tournamentTitle: {
      type: String,
      required: true,
      trim: true,
    },
    allocatedQuantity: {
      type: Number,
      required: true,
      min: 1,
    },
    allocatedDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["Allocated", "Returned", "Damaged", "Lost"],
      default: "Allocated",
    },
    remarks: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Allocation", allocationSchema);