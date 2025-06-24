import LuckyDrawHistory from '../models/LuckyDrawHistory.js';
import UserCoupon from '../models/UserCoupon.js';
import Coupon from '../models/Coupon.js';

// Danh sách phần thưởng mẫu
const PRIZES = [
  { type: 'VOUCHER', value: { couponId: null, value: 1000000, desc: 'Voucher 1 triệu' }, weight: 10 },
  { type: 'VOUCHER', value: { couponId: null, value: 500000, desc: 'Voucher 500k' }, weight: 20 },
  { type: 'GIFT', value: { name: 'Tai nghe Sony', desc: 'Tai nghe chính hãng' }, weight: 5 },
  { type: 'GIFT', value: { name: 'Chuột Logitech', desc: 'Chuột không dây' }, weight: 5 },
  { type: 'NONE', value: {}, weight: 60 },
];

function getRandomPrize() {
  // Quay theo tỉ lệ weight
  const total = PRIZES.reduce((sum, p) => sum + p.weight, 0);
  let rand = Math.random() * total;
  for (const prize of PRIZES) {
    if (rand < prize.weight) return prize;
    rand -= prize.weight;
  }
  return PRIZES[PRIZES.length - 1];
}

export const spinLuckyDraw = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.body;
    // Kiểm tra đã quay chưa
    const existed = await LuckyDrawHistory.findOne({ userId, orderId });
    if (existed) {
      return res.status(400).json({ success: false, message: 'Bạn đã quay thưởng cho đơn này rồi!', prize: existed });
    }
    // TODO: Kiểm tra đơn hàng đủ điều kiện (order > 50tr, status hợp lệ)
    // ...
    // Quay thưởng
    let prize = getRandomPrize();
    // Nếu là voucher, tạo coupon mới và gán cho user
    if (prize.type === 'VOUCHER') {
      // Tạo coupon giảm giá sâu (tùy theo value)
      const coupon = await Coupon.create({
        code: `LUCKY${Date.now()}`,
        type: 'FIXED_AMOUNT',
        value: prize.value.value,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30*24*60*60*1000),
        maxUses: 1,
        minOrderAmount: 0,
        isActive: true,
        createdBy: userId
      });
      // Lưu vào UserCoupon
      await UserCoupon.create({ userId, couponId: coupon._id, prizeInfo: prize.value });
      prize = { ...prize, value: { ...prize.value, couponId: coupon._id } };
    }
    // Lưu lịch sử
    const history = await LuckyDrawHistory.create({
      userId,
      orderId,
      prizeType: prize.type,
      prizeValue: prize.value
    });
    res.json({ success: true, message: 'Chúc mừng! Bạn đã nhận được phần thưởng', prize });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
