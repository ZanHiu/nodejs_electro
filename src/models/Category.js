import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: Array, required: true },
  views: { type: Number, default: 0 },
  date: { type: Number, required: true },
});

export default mongoose.model("category", categorySchema);
