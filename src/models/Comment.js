import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  userId: { type: String, required: true, ref: "user" },
  targetId: { type: String, required: true }, // ID của sản phẩm hoặc blog
  type: { type: String, enum: ['product', 'blog'], required: true },
  content: { type: String, required: true },
  parentId: { type: String, ref: "comment" }, // ID của comment cha (nếu là reply)
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Middleware để tự động cập nhật updatedAt
commentSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model("comment", commentSchema); 
