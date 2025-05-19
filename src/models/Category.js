import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  userId: { type: String, required: true, ref: "user" },
  name: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: Array, required: true },
  views: { type: Number, default: 0 },
  cateId: { type: Number, required: true },
  date: { type: Number, required: true },
});

export default mongoose.model("category", categorySchema);
