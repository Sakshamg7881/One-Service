/**
 * OneService – Admin Routes
 */
const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth.middleware");
const User = require("../models/User.model");
const Vendor = require("../models/Vendor.model");
const Booking = require("../models/Booking.model");
const Payment = require("../models/Payment.model");
const { Review } = require("../models/index");
const notificationService = require("../services/notification.service");

const adminOnly = [protect, authorize("admin")];

// GET /api/admin/stats — dashboard analytics
router.get("/stats", ...adminOnly, async (req, res, next) => {
  try {
    const [totalUsers, totalVendors, totalBookings, totalPayments,
      pendingVendors, activeBookings, revenueAgg] = await Promise.all([
      User.countDocuments({ role: "user" }),
      Vendor.countDocuments(),
      Booking.countDocuments(),
      Payment.countDocuments({ status: "succeeded" }),
      Vendor.countDocuments({ status: "pending" }),
      Booking.countDocuments({ status: { $in: ["pending", "accepted", "in_progress"] } }),
      Payment.aggregate([
        { $match: { status: "succeeded" } },
        { $group: { _id: null, total: { $sum: "$amount" }, platformFee: { $sum: "$platformFee" } } },
      ]),
    ]);

    const revenue = revenueAgg[0] || { total: 0, platformFee: 0 };

    // Monthly booking trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyTrend = await Booking.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    res.json({
      success: true,
      data: { totalUsers, totalVendors, totalBookings, totalPayments, pendingVendors, activeBookings, revenue, monthlyTrend },
    });
  } catch (err) { next(err); }
});

// GET /api/admin/vendors?status=pending
router.get("/vendors", ...adminOnly, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const vendors = await Vendor.find(filter)
      .populate("user", "name email phone")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Vendor.countDocuments(filter);
    res.json({ success: true, data: vendors, pagination: { total, page: Number(page) } });
  } catch (err) { next(err); }
});

// PATCH /api/admin/vendors/:id/approve
router.patch("/vendors/:id/approve", ...adminOnly, async (req, res, next) => {
  try {
    const { action, note } = req.body; // action: "approve" | "reject" | "suspend"
    const statusMap = { approve: "approved", reject: "rejected", suspend: "suspended" };
    const newStatus = statusMap[action];
    if (!newStatus) return res.status(400).json({ success: false, message: "Invalid action." });

    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      { status: newStatus, isVerified: action === "approve", adminNote: note || "" },
      { new: true }
    );

    if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found." });

    // Notify vendor
    await notificationService.send({
      recipientId: vendor.user,
      type: action === "approve" ? "vendor_approved" : "vendor_rejected",
      title: action === "approve" ? "🎉 Application Approved!" : "Application Status Update",
      message: action === "approve"
        ? "Congratulations! Your vendor application has been approved. You can now start accepting bookings."
        : `Your vendor application was ${newStatus}. Reason: ${note || "See admin panel."}`,
      data: { vendorId: vendor._id },
    });

    res.json({ success: true, message: `Vendor ${newStatus}.`, data: vendor });
  } catch (err) { next(err); }
});

// GET /api/admin/bookings
router.get("/bookings", ...adminOnly, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const bookings = await Booking.find(filter)
      .populate("user", "name email")
      .populate("vendor", "businessName")
      .populate("service", "title")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Booking.countDocuments(filter);
    res.json({ success: true, data: bookings, pagination: { total, page: Number(page) } });
  } catch (err) { next(err); }
});

// GET /api/admin/users
router.get("/users", ...adminOnly, async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    const users = await User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
    const total = await User.countDocuments(filter);
    res.json({ success: true, data: users, pagination: { total, page: Number(page) } });
  } catch (err) { next(err); }
});

// PATCH /api/admin/users/:id/toggle
router.patch("/users/:id/toggle", ...adminOnly, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, message: `User ${user.isActive ? "activated" : "suspended"}.` });
  } catch (err) { next(err); }
});

// DELETE /api/admin/reviews/:id — remove fake review
router.delete("/reviews/:id", ...adminOnly, async (req, res, next) => {
  try {
    await Review.findByIdAndUpdate(req.params.id, { isVisible: false });
    res.json({ success: true, message: "Review hidden." });
  } catch (err) { next(err); }
});

module.exports = router;
