const Chat = require("../Models/chatModel");
const Message = require("../Models/messageModel");
const User = require("../Models/userModel");

// USER: create/find own chat
const getOrCreateMyChat = async (req, res) => {
  try {
    let chat = await Chat.findOne({ userId: req.user.userId });

    if (!chat) {
      chat = await Chat.create({
        userId: req.user.userId,
        adminId: "admin",
      });
    }

    res.json(chat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// USER: get own messages
const getMyMessages = async (req, res) => {
  try {
    const chat = await Chat.findOne({ userId: req.user.userId });

    if (!chat) {
      return res.json([]);
    }

    const messages = await Message.find({ chatId: chat._id }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// USER: send message
const sendMyMessage = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Message text is required" });
    }

    let chat = await Chat.findOne({ userId: req.user.userId });

    if (!chat) {
      chat = await Chat.create({
        userId: req.user.userId,
        adminId: "admin",
      });
    }

    const user = await User.findById(req.user.userId);

    const message = await Message.create({
      chatId: chat._id,
      senderType: "user",
      senderId: user._id.toString(),
      senderName: user.name,
      text,
    });

    chat.lastMessage = text;
    chat.lastMessageAt = new Date();
    await chat.save();

    const io = req.app.get("io");
    io.to(chat._id.toString()).emit("new_message", message);

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ADMIN: get all chats with user info
const getAllChatsForAdmin = async (req, res) => {
  try {
    const chats = await Chat.find()
      .populate("userId", "name email itNumber role")
      .sort({ lastMessageAt: -1 });

    res.json(chats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ADMIN: get messages for selected chat
const getChatMessagesForAdmin = async (req, res) => {
  try {
    const { chatId } = req.params;

    const messages = await Message.find({ chatId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ADMIN: send message to user
const sendAdminMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Message text is required" });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const message = await Message.create({
      chatId,
      senderType: "admin",
      senderId: "admin",
      senderName: "Admin",
      text,
    });

    chat.lastMessage = text;
    chat.lastMessageAt = new Date();
    await chat.save();

    const io = req.app.get("io");
    io.to(chatId).emit("new_message", message);

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getOrCreateMyChat,
  getMyMessages,
  sendMyMessage,
  getAllChatsForAdmin,
  getChatMessagesForAdmin,
  sendAdminMessage,
};