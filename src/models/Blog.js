import mongoose from "mongoose";

const blogSchema = new mongoose.Schema({
    userId: { type: String, required: true, ref: "user" },
    name: { type: String, required: true },
    content: { type: String, required: true },
    image: { type: Array, required: true },
    slug: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

export default mongoose.model("blog", blogSchema);