import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  userId: { type: String, required: true, ref: "user" },
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  offerPrice: { type: Number, required: true },
  image: { type: Array, required: true },
  views: { type: Number, default: 0 },
  cateId: { type: Number, required: true },
  brandId: { type: Number, required: true },
  date: { type: Number, required: true },
});

export default mongoose.model("product", productSchema);
