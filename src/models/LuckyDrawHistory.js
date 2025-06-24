import mongoose from "mongoose";

const luckyDrawHistorySchema = new mongoose.Schema({
  userId: { type: String, required: true, ref: "user" },
  orderId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "order" },
  prizeType: { type: String, required: true }, // VOUCHER, GIFT, NONE
  prizeValue: { type: Object, default: {} }, // Thông tin voucher hoặc quà tặng
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("luckydrawhistory", luckyDrawHistorySchema);
