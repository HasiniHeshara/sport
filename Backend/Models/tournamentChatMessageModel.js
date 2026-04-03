const mongoose = require("mongoose");

const tournamentChatMessageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TournamentChat",
      required: true,
    },
    senderType: {
      type: String,
      enum: ["participant", "organizer"],
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "TournamentChatMessage",
  tournamentChatMessageSchema
);