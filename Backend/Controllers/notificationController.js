const Notification = require("../Models/notificationModel");

const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipientId: req.user.userId,
    }).sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to fetch notifications",
    });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipientId: req.user.userId,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    notification.isRead = true;
    await notification.save();

    res.json({
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to update notification",
    });
  }
};

module.exports = {
  getMyNotifications,
  markNotificationAsRead,
};