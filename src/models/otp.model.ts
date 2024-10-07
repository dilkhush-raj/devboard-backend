import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    otp: {type: String, required: true},
    email: {type: String, required: true},
    sent: {type: Boolean, default: false},
    date: {type: Date, default: Date.now},
  },
  {timestamps: true}
);

otpSchema.index({createdAt: 1}, {expireAfterSeconds: 1800});

export const Otp = mongoose.model("Otp", otpSchema);
