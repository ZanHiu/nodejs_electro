import mongoose from "mongoose";

const productImageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  value: { type: Array, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Index để tối ưu query
productImageSchema.index({ name: 1 });
productImageSchema.index({ name: 1, value: 1 });

export default mongoose.model("productImage", productImageSchema);