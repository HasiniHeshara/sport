const mongoose = require("mongoose");

const teamMemberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    itNumber: {
      type: String,
      required: true,
      trim: true,
    },
    contactNumber: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const teamRegistrationSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
      index: true,
    },
    leaderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    leaderEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    teamName: {
      type: String,
      required: true,
      trim: true,
    },
    contactNumber: {
      type: String,
      required: true,
      trim: true,
    },
    members: {
      type: [teamMemberSchema],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "At least one team member is required",
      },
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: "",
    },
    editCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    editDeadline: {
      type: Date,
      default: null,
    },
    deleteDeadline: {
      type: Date,
      default: null,
    },
    pendingAction: {
      type: String,
      enum: ["None", "EditMembers", "DeleteTeam"],
      default: "None",
    },
    pendingMembers: {
      type: [teamMemberSchema],
      default: [],
    },
  },
  { timestamps: true }
);

teamRegistrationSchema.index({ tournamentId: 1, leaderId: 1 }, { unique: true });

module.exports = mongoose.model("TeamRegistration", teamRegistrationSchema);
