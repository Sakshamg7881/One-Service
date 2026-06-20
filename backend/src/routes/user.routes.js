/**
 * OneService – User Routes
 */
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const User = require("../models/User.model");

// GET /api/users/me
router.get("/me", protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

// PATCH /api/users/me
router.patch("/me", protect, async (req, res, next) => {
  try {
    const allowed = ["name", "phone", "avatar", "location", "preferences", "fcmToken"];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

// PATCH /api/users/me/password
router.patch("/me/password", protect, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ success: false, message: "Current password is incorrect." });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: "Password updated." });
  } catch (err) { next(err); }
});

module.exports = router;
