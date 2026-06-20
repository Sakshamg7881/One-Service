/**
 * OneService – Chat Routes
 */
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const { ChatMessage } = require("../models/index");

// GET /api/chat/:bookingId — load chat history
router.get("/:bookingId", protect, async (req, res, next) => {
  try {
    const messages = await ChatMessage.find({ booking: req.params.bookingId })
      .populate("sender", "name avatar role")
      .sort({ createdAt: 1 })
      .limit(200);
    res.json({ success: true, data: messages });
  } catch (err) { next(err); }
});

// POST /api/chat/:bookingId — save a message (socket handles real-time, this persists)
router.post("/:bookingId", protect, async (req, res, next) => {
  try {
    const { receiverId, message, mediaUrl, mediaType } = req.body;
    const msg = await ChatMessage.create({
      booking: req.params.bookingId,
      sender: req.user._id,
      receiver: receiverId,
      message, mediaUrl, mediaType,
    });
    await msg.populate("sender", "name avatar role");
    res.status(201).json({ success: true, data: msg });
  } catch (err) { next(err); }
});

module.exports = router;
