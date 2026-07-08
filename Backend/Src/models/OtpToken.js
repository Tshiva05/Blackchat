const mongoose = require("mongoose");

const otpTokenSchema = new mongoose.Schema(
  {
    // The email or mobile number this OTP was issued for
    identifier: { type: String, required: true, index: true },
    channel: { type: String, enum: ["email", "mobile"], required: true },
    otpHash: { type: String, required: true },
    purpose: {
      type: String,
      enum: ["register", "login", "reset_password"],
      default: "register",
    },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
    consumed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Auto-delete expired OTP docs
otpTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("OtpToken", otpTokenSchema);
