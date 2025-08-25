import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  userId: { type: String, required: true, ref: "user" },
  productId: { type: String, required: true, ref: "product" },
  orderId: { type: String, required: true, ref: "order" },
  content: { type: String },
  ratingValue: { type: Number, min: 1, max: 5 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Middleware để tự động cập nhật updatedAt
reviewSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model("review", reviewSchema); 