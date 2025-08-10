import mongoose from "mongoose";

const userRankSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true, 
    unique: true,
    ref: "user" 
  },
  currentRank: { 
    type: String, 
    required: true,
    enum: ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'],
    default: 'IRON'
  },
  totalSpent: { 
    type: Number, 
    default: 0 
  },
  spinCount: { 
    type: Number, 
    default: 0 
  },
  lastRankUpgrade: { 
    type: Date, 
    default: null 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Middleware để tự động cập nhật updatedAt
userRankSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model("userRank", userRankSchema); 