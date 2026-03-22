const mongoose = require("mongoose");

const equipmentSchema = new mongoose.Schema(
  {
    equipmentName: {
      type: String,
      required: true,
      trim: true,
    },
    totalQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    availableQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Available", "Limited", "Out of Stock"],
      default: "Available",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Equipment", equipmentSchema);