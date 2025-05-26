import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  userId: { type: String, required: true, ref: "user" },
  targetId: { type: String, required: true },
  type: { type: String, enum: ['product', 'blog'], default: 'product' },
  content: { type: String },
  ratingValue: { type: Number, min: 1, max: 5 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("review", reviewSchema); 