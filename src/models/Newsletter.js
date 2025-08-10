import mongoose from "mongoose";

const newsletterSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true 
  },
  subscribedAt: { 
    type: Date, 
    default: Date.now 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
});

export default mongoose.model("newsletter", newsletterSchema);
