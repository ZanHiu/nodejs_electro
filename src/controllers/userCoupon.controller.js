import UserCoupon from '../models/UserCoupon.js';
import Coupon from '../models/Coupon.js';

// User claim voucher công khai
export const claimCoupon = async (req, res) => {
  try {
    const { couponId } = req.body;
    const userId = req.user.id;

    // Kiểm tra đã nhận chưa
    const existed = await UserCoupon.findOne({ userId, couponId });
    if (existed) {
      return res.status(400).json({ success: false, message: 'Bạn đã nhận mã này rồi!' });
    }
    // Kiểm tra mã còn hạn không
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return res.status(400).json({ success: false, message: 'Mã không tồn tại hoặc đã hết hạn!' });
    }
    const now = new Date();
    if (coupon.endDate < now || coupon.usedCount >= coupon.maxUses) {
      await Coupon.findByIdAndUpdate(couponId, { isActive: false });
      return res.status(400).json({ success: false, message: 'Mã đã hết hạn!' });
    }
    // Lưu vào UserCoupon
    await UserCoupon.create({ userId, couponId });
    res.json({ success: true, message: 'Nhận mã thành công!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Helper function để cập nhật UserCoupon hết hạn
const updateExpiredUserCoupons = async () => {
  const expiredCoupons = await Coupon.find({
    endDate: { $lt: new Date() }
  }).select('_id');
  
  const expiredCouponIds = expiredCoupons.map(c => c._id);
  
  await UserCoupon.updateMany(
    {
      couponId: { $in: expiredCouponIds },
      status: 'RECEIVED'
    },
    { status: 'EXPIRED' }
  );
};

// Lấy danh sách voucher đã nhận
export const getMyCoupons = async (req, res) => {
  try {
    await updateExpiredUserCoupons();

    const userId = req.user.id;
    const userCoupons = await UserCoupon.find({ userId })
      .populate('couponId');
    res.json({ success: true, userCoupons });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Hàm tặng voucher đặc quyền (gọi ở các nơi khác)
export const grantSpecialCoupon = async (userId, couponId, prizeInfo = {}) => {
  // Không trả response, chỉ dùng nội bộ
  const existed = await UserCoupon.findOne({ userId, couponId });
  if (!existed) {
    await UserCoupon.create({ userId, couponId, prizeInfo });
  }
};
