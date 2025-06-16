import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema({
  userId: { type: String, required: true, ref: "user" },
  product: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'product' },
  date: { type: Number, default: Date.now },
});

// Tạo unique index để tránh trùng lặp
favoriteSchema.index({ userId: 1, product: 1 }, { unique: true });

export default mongoose.model("favorite", favoriteSchema);
