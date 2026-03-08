const mongoose = require("mongoose");

const allocationSchema = new mongoose.Schema(
  {
    equipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Equipment",
      required: true,
    },
    eventName: {
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
    returnedQuantity: {
      type: Number,
      default: 0,
      min: 0,
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