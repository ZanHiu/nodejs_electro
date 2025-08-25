import mongoose from "mongoose";

const productAttributeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  value: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Index để tối ưu query
productAttributeSchema.index({ name: 1 });
productAttributeSchema.index({ name: 1, value: 1 });

export default mongoose.model("productAttribute", productAttributeSchema);