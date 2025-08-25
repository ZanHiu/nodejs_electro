import mongoose from "mongoose";

const productVariantSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'product', required: true },
  attributeId: { type: mongoose.Schema.Types.ObjectId, ref: 'productAttribute', required: true },
  imageId: { type: mongoose.Schema.Types.ObjectId, ref: 'productImage' },
  price: { type: Number, required: true },
  offerPrice: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Index để tối ưu query
productVariantSchema.index({ productId: 1 });
productVariantSchema.index({ attributeId: 1 });
productVariantSchema.index({ imageId: 1 });

export default mongoose.model("productVariant", productVariantSchema);