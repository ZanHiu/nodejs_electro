import mongoose from "mongoose";

const productAttributeSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'product', required: true },
  name: { type: String, required: true },
  value: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Index để tối ưu query
productAttributeSchema.index({ productId: 1 });
productAttributeSchema.index({ name: 1 });
productAttributeSchema.index({ productId: 1, name: 1 });

export default mongoose.model("productAttribute", productAttributeSchema);