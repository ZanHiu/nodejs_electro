import mongoose from "mongoose";

const productVariantSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'product', required: true },
  attributes: {
    type: Object,
    required: true,
    // Các trường optional sẽ được lưu động trong object này
    // color: String,
    // ram: String,
    // rom: String,
    // cpu: String,
    // vga: String,
    // os: String,
    // pin: String,
    // manhinh: String,
    // camera: String,
  },
  images: { type: Array, required: true },
  price: { type: Number, required: true },
  offerPrice: { type: Number, required: true },
  // stock: { type: Number, default: 0 },
});

export default mongoose.model("productVariant", productVariantSchema);
