const TournamentChat = require("../Models/tournamentChatModel");
const TournamentChatMessage = require("../Models/tournamentChatMessageModel");
const Tournament = require("../Models/tournamentModel");
const TeamRegistration = require("../Models/teamRegistrationModel");
const User = require("../Models/userModel");

// Participant starts or gets chat after registration
const getOrCreateTournamentChat = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const participantId = req.user.userId;

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    // participant must have registered for this tournament
    const registration = await TeamRegistration.findOne({
      tournamentId,
      leaderId: participantId,
    });

    if (!registration) {
      return res.status(403).json({
        message: "You can chat with organizer only after registering for this tournament",
      });
    }

    let chat = await TournamentChat.findOne({
      tournamentId,
      participantId,
      organizerId: tournament.organizerId,
    });

    if (!chat) {
      chat = await TournamentChat.create({
        tournamentId,
        participantId,
        organizerId: tournament.organizerId,
        registrationId: registration._id,
      });
    }

    const populatedChat = await TournamentChat.findById(chat._id)
      .populate("participantId", "name email itNumber")
      .populate("organizerId", "name email itNumber")
      .populate("tournamentId", "title sportType venue status");

    res.json(populatedChat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Participant gets own messages for one tournament chat
const getParticipantTournamentMessages = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const participantId = req.user.userId;

    const chat = await TournamentChat.findOne({
      tournamentId,
      participantId,
    });

    if (!chat) {
      return res.json([]);
    }

    await TournamentChatMessage.updateMany(
      {
        chatId: chat._id,
        senderType: "organizer",
        isRead: false,
      },
      { $set: { isRead: true } }
    );

    const messages = await TournamentChatMessage.find({
      chatId: chat._id,
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};



// Participant sends message
const sendParticipantTournamentMessage = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { text } = req.body;
    const participantId = req.user.userId;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Message text is required" });
    }

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    const registration = await TeamRegistration.findOne({
      tournamentId,
      leaderId: participantId,
    });

    if (!registration) {
      return res.status(403).json({
        message: "You can chat with organizer only after registering for this tournament",
      });
    }

    let chat = await TournamentChat.findOne({
      tournamentId,
      participantId,
      organizerId: tournament.organizerId,
    });

    if (!chat) {
      chat = await TournamentChat.create({
        tournamentId,
        participantId,
        organizerId: tournament.organizerId,
        registrationId: registration._id,
      });
    }

    const participant = await User.findById(participantId);

    const message = await TournamentChatMessage.create({
      chatId: chat._id,
      senderType: "participant",
      senderId: participant._id,
      senderName: participant.name,
      text,
    });

    chat.lastMessage = text;
    chat.lastMessageAt = new Date();
    await chat.save();

    const io = req.app.get("io");
    io.to(chat._id.toString()).emit("new_tournament_message", message);

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Organizer gets all chats related to own tournaments
const getOrganizerTournamentChats = async (req, res) => {
  try {
    const organizerId = req.user.userId;

    const chats = await TournamentChat.find({ organizerId })
      .populate("participantId", "name email itNumber")
      .populate("tournamentId", "title sportType venue status")
      .sort({ lastMessageAt: -1 });

    const chatsWithUnread = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await TournamentChatMessage.countDocuments({
          chatId: chat._id,
          senderType: "participant",
          isRead: false,
        });

        return {
          ...chat.toObject(),
          unreadCount,
        };
      })
    );

    res.json(chatsWithUnread);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Organizer gets messages of selected chat
const getOrganizerTournamentChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const organizerId = req.user.userId;

    const chat = await TournamentChat.findOne({
      _id: chatId,
      organizerId,
    });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    await TournamentChatMessage.updateMany(
      {
        chatId,
        senderType: "participant",
        isRead: false,
      },
      { $set: { isRead: true } }
    );

    const messages = await TournamentChatMessage.find({ chatId }).sort({
      createdAt: 1,
    });

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Organizer sends message
const sendOrganizerTournamentMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { text } = req.body;
    const organizerId = req.user.userId;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Message text is required" });
    }

    const chat = await TournamentChat.findOne({
      _id: chatId,
      organizerId,
    });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const organizer = await User.findById(organizerId);

    const message = await TournamentChatMessage.create({
      chatId,
      senderType: "organizer",
      senderId: organizer._id,
      senderName: organizer.name,
      text,
    });

    chat.lastMessage = text;
    chat.lastMessageAt = new Date();
    await chat.save();

    const io = req.app.get("io");
    io.to(chat._id.toString()).emit("new_tournament_message", message);

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Participant unread organizer replies count
const getParticipantUnreadOrganizerCount = async (req, res) => {
  try {
    const participantId = req.user.userId;

    const chats = await TournamentChat.find({ participantId });

    if (!chats.length) {
      return res.json({ unreadCount: 0 });
    }

    const chatIds = chats.map((c) => c._id);

    const unreadCount = await TournamentChatMessage.countDocuments({
      chatId: { $in: chatIds },
      senderType: "organizer",
      isRead: false,
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getOrCreateTournamentChat,
  getParticipantTournamentMessages,
  sendParticipantTournamentMessage,
  getOrganizerTournamentChats,
  getOrganizerTournamentChatMessages,
  sendOrganizerTournamentMessage,
  getParticipantUnreadOrganizerCount,
};