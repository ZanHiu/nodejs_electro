import mongoose from "mongoose";

const userCouponSchema = new mongoose.Schema({
  userId: { type: String, required: true, ref: "user" },
  couponId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "coupon" },
  status: { type: String, enum: ["RECEIVED", "USED", "EXPIRED"], default: "RECEIVED" },
  receivedAt: { type: Date, default: Date.now },
  usedAt: { type: Date },
  prizeInfo: { type: Object, default: {} }, // Dùng cho trường hợp quay thưởng
});

export default mongoose.model("usercoupon", userCouponSchema);
