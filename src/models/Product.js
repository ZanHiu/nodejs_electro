import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  views: { type: Number, default: 0 },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'category', required: true },
  brand: { type: mongoose.Schema.Types.ObjectId, ref: 'brand', required: true },
  date: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  specs: {
    cpu: { type: String },
    vga: { type: String },
    os: { type: String },
    pin: { type: String },
    manhinh: { type: String },
    camera: { type: String },
  },
});

export default mongoose.model("product", productSchema);
