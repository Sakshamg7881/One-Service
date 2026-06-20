/**
 * OneService – Notification Routes
 */
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const { Notification } = require("../models/index");

router.get("/", protect, async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 }).limit(50);
    const unread = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
    res.json({ success: true, data: notifications, unread });
  } catch (err) { next(err); }
});

router.patch("/read-all", protect, async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true, readAt: new Date() });
    res.json({ success: true, message: "All notifications marked as read." });
  } catch (err) { next(err); }
});

router.patch("/:id/read", protect, async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true, readAt: new Date() }
    );
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
