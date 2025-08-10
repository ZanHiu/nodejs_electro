import UserRank from '../models/UserRank.js';
import Order from '../models/Order.js';
import Coupon from '../models/Coupon.js';
import { RANK_THRESHOLDS, RANK_NAMES, RANK_COLORS, SPIN_REWARDS, getNextRank, getRankProgress } from '../utils/rankConstants.js';
import { OrderStatus, PaymentStatus } from '../utils/constants.js';

// Hàm tính tổng chi tiêu của user
const calculateTotalSpent = async (userId) => {
  const orders = await Order.find({
    userId: userId,
    status: OrderStatus.DELIVERED,
    paymentStatus: PaymentStatus.PAID
  });
  
  return orders.reduce((total, order) => total + order.amount, 0);
};

// Hàm xác định rank dựa trên tổng chi tiêu
const determineRank = (totalSpent) => {
  const ranks = Object.keys(RANK_THRESHOLDS).reverse();
  for (const rank of ranks) {
    if (totalSpent >= RANK_THRESHOLDS[rank]) {
      return rank;
    }
  }
  return 'IRON';
};

// Hàm kiểm tra và cập nhật rank
const checkAndUpdateRank = async (userId) => {
  // Luôn tính lại tổng chi tiêu từ DB
  const totalSpent = await calculateTotalSpent(userId);
  const newRank = determineRank(totalSpent);

  let userRank = await UserRank.findOne({ userId });

  if (!userRank) {
    // Nếu là user cũ đã từng mua hàng, vẫn tính đúng tổng chi tiêu
    userRank = new UserRank({
      userId,
      currentRank: newRank,
      totalSpent,
      // spinCount mặc định 0, lastRankUpgrade null
    });
  } else {
    const oldRank = userRank.currentRank;
    userRank.currentRank = newRank;
    userRank.totalSpent = totalSpent;

    // Nếu rank được nâng lên, cập nhật thời gian và tăng spin count
    if (newRank !== oldRank && RANK_THRESHOLDS[newRank] > RANK_THRESHOLDS[oldRank]) {
      userRank.lastRankUpgrade = new Date();
      // Tăng spin count cho PLATINUM và DIAMOND
      if (newRank === 'PLATINUM' || newRank === 'DIAMOND') {
        userRank.spinCount += 1;
      }
    }
  }

  await userRank.save();
  return userRank;
};

// Lấy thông tin rank của user
export const getUserRank = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Kiểm tra và cập nhật rank
    const userRank = await checkAndUpdateRank(userId);
    
    const nextRank = getNextRank(userRank.currentRank);
    const progress = getRankProgress(userRank.totalSpent, userRank.currentRank);
    
    res.json({
      success: true,
      rank: {
        current: userRank.currentRank,
        currentName: RANK_NAMES[userRank.currentRank],
        currentColor: RANK_COLORS[userRank.currentRank],
        next: nextRank,
        nextName: nextRank ? RANK_NAMES[nextRank] : null,
        nextThreshold: nextRank ? RANK_THRESHOLDS[nextRank] : null,
        totalSpent: userRank.totalSpent,
        progress: Math.round(progress),
        spinCount: userRank.spinCount,
        lastUpgrade: userRank.lastRankUpgrade
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Vòng quay may mắn
export const spinWheel = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Kiểm tra user rank
    const userRank = await UserRank.findOne({ userId });
    if (!userRank) {
      return res.status(404).json({ success: false, message: "Không tìm thấy thông tin hạng" });
    }
    
    // Kiểm tra có lượt quay không
    if (userRank.spinCount <= 0) {
      return res.status(400).json({ success: false, message: "Bạn không có lượt quay nào" });
    }
    
    // Chọn phần thưởng dựa trên xác suất
    const random = Math.random() * 100;
    let cumulativeProbability = 0;
    let selectedReward = null;
    let selectedIndex = 0;
    
    for (let i = 0; i < SPIN_REWARDS.length; i++) {
      cumulativeProbability += SPIN_REWARDS[i].probability;
      if (random <= cumulativeProbability) {
        selectedReward = SPIN_REWARDS[i];
        selectedIndex = i;
        break;
      }
    }
    
    // Nếu không chọn được (trường hợp hiếm), lấy phần thưởng đầu tiên
    if (!selectedReward) {
      selectedReward = SPIN_REWARDS[0];
      selectedIndex = 0;
    }
    
    // Giảm số lượt quay
    userRank.spinCount -= 1;
    await userRank.save();
    
    // Nếu phần thưởng là coupon, tạo coupon cho user
    let coupon = null;
    if (selectedReward.type === 'PERCENTAGE' || selectedReward.type === 'FIXED_AMOUNT') {
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const couponCode = `LUCKY${random}`;
      
      coupon = await Coupon.create({
        code: couponCode,
        type: selectedReward.type,
        value: selectedReward.value,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 ngày
        maxUses: 1,
        minOrderAmount: 0,
        createdBy: userId
      });
    }
    
    res.json({
      success: true,
      reward: selectedReward,
      rewardIndex: selectedIndex, // Thêm index để frontend biết vị trí
      coupon: coupon,
      remainingSpins: userRank.spinCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy lịch sử vòng quay (nếu cần)
export const getSpinHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Có thể thêm model SpinHistory nếu cần lưu lịch sử
    // Hiện tại chỉ trả về thông tin cơ bản
    const userRank = await UserRank.findOne({ userId });
    
    res.json({
      success: true,
      spinCount: userRank ? userRank.spinCount : 0
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

