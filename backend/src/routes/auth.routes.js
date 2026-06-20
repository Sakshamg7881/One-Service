/**
 * OneService – Auth Routes
 */
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const {
  signup, verifyOTP, login, refreshToken, logout,
  forgotPassword, resetPassword
} = require("../controllers/auth.controller");

router.post("/signup", signup);
router.post("/verify-otp", verifyOTP);
router.post("/login", login);
router.post("/refresh", refreshToken);
router.post("/logout", protect, logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
