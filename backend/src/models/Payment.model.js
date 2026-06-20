/**
 * OneService – Payment Model
 */
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },

    stripePaymentIntentId: { type: String, unique: true, sparse: true },
    stripeChargeId: { type: String, default: "" },

    amount: { type: Number, required: true },
    currency: { type: String, default: "inr" },
    platformFee: { type: Number, default: 0 },
    vendorAmount: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["created", "succeeded", "failed", "refunded", "partially_refunded"],
      default: "created",
    },

    refund: {
      refundId: { type: String, default: "" },
      amount: { type: Number, default: 0 },
      reason: { type: String, default: "" },
      refundedAt: { type: Date },
    },

    receiptUrl: { type: String, default: "" },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true }
);

paymentSchema.index({ booking: 1 });
paymentSchema.index({ user: 1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model("Payment", paymentSchema);
