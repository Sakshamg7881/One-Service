/**
 * OneService – User Model
 */
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String, required: true, unique: true,
      lowercase: true, trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    phone: { type: String, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ["user", "vendor", "admin"], default: "user" },
    avatar: { type: String, default: "" },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    // OTP
    otp: { code: String, expiresAt: Date },

    // Location for nearby filtering
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
      address: { type: String, default: "" },
    },

    // Tokens
    refreshTokens: [{ token: String, createdAt: { type: Date, default: Date.now } }],

    // Firebase FCM token for push notifications
    fcmToken: { type: String, default: "" },

    // Preferences
    preferences: {
      notifications: { type: Boolean, default: true },
      emailAlerts: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
userSchema.index({ location: "2dsphere" });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

// ── Hash password before save ─────────────────────────────────────────────────
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ── Compare password ──────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── Remove sensitive fields from JSON output ──────────────────────────────────
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otp;
  delete obj.refreshTokens;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
