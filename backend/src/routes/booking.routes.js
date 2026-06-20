/**
 * OneService – Booking Routes
 */
const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth.middleware");
const {
  createBooking, getMyBookings, getBookingById,
  updateBookingStatus, downloadReceipt
} = require("../controllers/booking.controller");

router.post("/", protect, authorize("user", "admin"), createBooking);
router.get("/", protect, getMyBookings);
router.get("/:id", protect, getBookingById);
router.patch("/:id/status", protect, updateBookingStatus);
router.get("/:id/receipt", protect, downloadReceipt);

module.exports = router;
