import mongoose from "mongoose";

const brandSchema = new mongoose.Schema({
  userId: { type: String, required: true, ref: "user" },
  name: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: Array, required: true },
  views: { type: Number, default: 0  },
  brandId: { type: Number, required: true },
  date: { type: Number, required: true },
});

export default mongoose.model("brand", brandSchema);
