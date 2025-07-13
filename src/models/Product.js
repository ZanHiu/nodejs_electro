import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  offerPrice: { type: Number, required: true },
  image: { type: Array, required: true },
  views: { type: Number, default: 0 },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'category', required: true },
  brand: { type: mongoose.Schema.Types.ObjectId, ref: 'brand', required: true },
  date: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
});

export default mongoose.model("product", productSchema);
