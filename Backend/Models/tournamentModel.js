const mongoose = require("mongoose");

const tournamentSchema = new mongoose.Schema(
  {
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    sportType: {
      type: String,
      required: true,
      trim: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    venue: {
      type: String,
      required: true,
      trim: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    registrationDeadline: {
      type: Date,
      required: true,
    },

    teamLimit: {
      type: Number,
      required: true,
      min: 1,
    },

    registrationFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    rules: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["Draft", "Published", "Closed"],
      default: "Draft",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tournament", tournamentSchema);