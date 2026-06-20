/**
 * OneService – Booking Controller
 */
const Booking = require("../models/Booking.model");
const Service = require("../models/Service.model");
const Vendor = require("../models/Vendor.model");
const Payment = require("../models/Payment.model");
const { Notification } = require("../models/index");
const notificationService = require("../services/notification.service");
const pdfService = require("../services/pdf.service");
const { getIO } = require("../socket/socketManager");

const PLATFORM_FEE_PERCENT = 10;
const URGENT_FEE_PERCENT = 20;

// ── POST /api/bookings ────────────────────────────────────────────────────────
exports.createBooking = async (req, res, next) => {
  try {
    const { serviceId, scheduledAt, isUrgent, address, notes, problemImageUrl, aiAnalysis } = req.body;

    const service = await Service.findById(serviceId).populate("vendor");
    if (!service || !service.isActive) {
      return res.status(404).json({ success: false, message: "Service not found or inactive." });
    }

    const vendor = service.vendor;
    if (vendor.status !== "approved") {
      return res.status(400).json({ success: false, message: "Vendor is not active." });
    }

    const baseAmount = service.price.base;
    const urgentFee = isUrgent ? Math.round(baseAmount * (URGENT_FEE_PERCENT / 100)) : 0;
    const platformFee = Math.round((baseAmount + urgentFee) * (PLATFORM_FEE_PERCENT / 100));
    const total = baseAmount + urgentFee + platformFee;

    const booking = await Booking.create({
      user: req.user._id,
      vendor: vendor._id,
      service: service._id,
      scheduledAt,
      isUrgent: !!isUrgent,
      address,
      notes,
      problemImageUrl,
      aiAnalysis,
      amount: { base: baseAmount, urgentFee, platformFee, total },
      timeline: [{ status: "pending", note: "Booking created by user." }],
    });

    // Notify vendor via socket + push
    const io = getIO();
    io.to(`vendor_${vendor._id}`).emit("new_booking", { bookingId: booking._id, booking });

    await notificationService.send({
      recipientId: vendor.user,
      type: "booking_confirmed",
      title: "New Booking Request",
      message: `You have a new booking for ${service.title}`,
      data: { bookingId: booking._id },
    });

    res.status(201).json({ success: true, message: "Booking created.", data: booking });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/bookings (user's own) ────────────────────────────────────────────
exports.getMyBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { user: req.user._id };
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate("vendor", "businessName rating isVerified")
      .populate("service", "title category images price")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Booking.countDocuments(filter);

    res.json({
      success: true,
      data: bookings,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/bookings/:id ─────────────────────────────────────────────────────
exports.getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("user", "name email phone avatar")
      .populate("vendor", "businessName rating vendorId location")
      .populate("service", "title category images price duration");

    if (!booking) return res.status(404).json({ success: false, message: "Booking not found." });

    // Ensure only involved parties can view
    const userId = req.user._id.toString();
    const isUser = booking.user._id.toString() === userId;
    const vendor = await Vendor.findById(booking.vendor._id);
    const isVendor = vendor?.user.toString() === userId;
    const isAdmin = req.user.role === "admin";

    if (!isUser && !isVendor && !isAdmin) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/bookings/:id/status ────────────────────────────────────────────
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { status, note, cancellationReason } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found." });

    // Validate transitions
    const vendorDoc = await Vendor.findById(booking.vendor);
    const isVendor = vendorDoc?.user.toString() === req.user._id.toString();
    const isUser = booking.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    const allowedTransitions = {
      pending: isVendor ? ["accepted", "rejected"] : isUser ? ["cancelled"] : [],
      accepted: isVendor ? ["in_progress", "cancelled"] : isUser ? ["cancelled"] : [],
      in_progress: isVendor ? ["completed"] : [],
      completed: [],
      cancelled: [],
      rejected: [],
    };

    if (!allowedTransitions[booking.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from '${booking.status}' to '${status}'.`,
      });
    }

    booking.status = status;
    if (cancellationReason) booking.cancellationReason = cancellationReason;
    booking.timeline.push({ status, note: note || `Status updated to ${status}.` });
    await booking.save();

    // Real-time update to user
    const io = getIO();
    io.to(`user_${booking.user}`).emit("booking_status_update", {
      bookingId: booking._id,
      status,
    });

    // Send notification
    await notificationService.send({
      recipientId: booking.user,
      type: `booking_${status}`,
      title: `Booking ${status.replace("_", " ")}`,
      message: `Your booking has been ${status}.`,
      data: { bookingId: booking._id },
    });

    res.json({ success: true, message: "Booking status updated.", data: booking });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/bookings/:id/receipt ─────────────────────────────────────────────
exports.downloadReceipt = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("user", "name email")
      .populate("vendor", "businessName vendorId")
      .populate("service", "title");

    if (!booking) return res.status(404).json({ success: false, message: "Booking not found." });
    if (booking.status !== "completed") {
      return res.status(400).json({ success: false, message: "Receipt available only for completed bookings." });
    }

    const payment = await Payment.findOne({ booking: booking._id });
    const pdfBuffer = await pdfService.generateReceipt(booking, payment);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=receipt-${booking.bookingId}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
};
