/**
 * OneService – Vendor Model
 */
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const vendorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    vendorId: { type: String, unique: true, default: () => "VS-" + uuidv4().slice(0, 8).toUpperCase() },

    businessName: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    categories: [{ type: String }],

    // Documents for verification
    govIdUrl: { type: String, required: true },
    certificatesUrls: [{ type: String }],

    // Approval status
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "pending",
    },
    isVerified: { type: Boolean, default: false },
    adminNote: { type: String, default: "" },

    // Location
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
      address: { type: String, default: "" },
      city: { type: String, default: "" },
    },

    // Live location (updated in real-time)
    liveLocation: {
      coordinates: { type: [Number], default: [0, 0] },
      updatedAt: { type: Date },
    },

    // Availability
    availability: {
      isOnline: { type: Boolean, default: false },
      slots: [
        {
          day: { type: String, enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
          from: String,
          to: String,
        },
      ],
    },

    // Earnings
    earnings: {
      total: { type: Number, default: 0 },
      pending: { type: Number, default: 0 },
      withdrawn: { type: Number, default: 0 },
    },

    // Stats
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    totalBookings: { type: Number, default: 0 },
    completedBookings: { type: Number, default: 0 },

    // Stripe account for payouts
    stripeAccountId: { type: String, default: "" },
  },
  { timestamps: true }
);

vendorSchema.index({ location: "2dsphere" });
vendorSchema.index({ status: 1, isVerified: 1 });
vendorSchema.index({ categories: 1 });

module.exports = mongoose.model("Vendor", vendorSchema);
