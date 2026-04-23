const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
  {
    roundName: {
      type: String,
      required: true,
      trim: true,
    },
    teamA: {
      type: String,
      required: true,
      trim: true,
    },
    teamB: {
      type: String,
      required: true,
      trim: true,
    },
    matchNumber: {
      type: Number,
      required: true,
    },
    matchDate: {
      type: String,
      default: "",
      trim: true,
    },
    matchTime: {
      type: String,
      default: "",
      trim: true,
    },
    venue: {
      type: String,
      default: "",
      trim: true,
    },
    score: {
      type: String,
      default: "",
      trim: true,
    },
    winner: {
      type: String,
      default: "",
      trim: true,
    },
    remarks: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["Scheduled", "Completed"],
      default: "Scheduled",
    },
  },
  { _id: false }
);

const matchDrawSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
      unique: true,
    },
    format: {
      type: String,
      enum: ["Knockout"],
      default: "Knockout",
    },
    champion: {
      type: String,
      default: "",
      trim: true,
    },
    runnerUp: {
      type: String,
      default: "",
      trim: true,
    },
    matches: [matchSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("MatchDraw", matchDrawSchema);