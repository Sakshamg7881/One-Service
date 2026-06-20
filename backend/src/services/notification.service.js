/**
 * OneService – Notification Service
 * Saves to DB + emits via socket
 */
const { Notification } = require("../models/index");

exports.send = async ({ recipientId, type, title, message, data = {} }) => {
  try {
    const notification = await Notification.create({ recipient: recipientId, type, title, message, data });

    // Real-time via socket
    try {
      const { getIO } = require("../socket/socketManager");
      const io = getIO();
      io.to(`user_${recipientId}`).emit("notification", notification);
    } catch (_) { /* Socket may not be ready */ }

    return notification;
  } catch (err) {
    console.error("Notification service error:", err.message);
  }
};
