const Feedback = require("../Models/feedbackModel");
const User = require("../Models/userModel");

// logged-in users only
const createFeedback = async (req, res) => {
  try {
    const { rating, subject, message } = req.body;

    if (!rating || !subject || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findById(req.user.userId).select("name role");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const feedback = await Feedback.create({
      userId: req.user.userId,
      userName: user.name,
      userRole: user.role,
      rating,
      subject,
      message,
    });

    res.status(201).json({
      message: "Feedback submitted successfully",
      feedback,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// admin page
const getAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// home page recent 4
const getRecentFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .sort({ createdAt: -1 })
      .limit(4);

    res.json(feedbacks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    res.json({ message: "Feedback deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createFeedback,
  getAllFeedbacks,
  getRecentFeedbacks,
  deleteFeedback,
};