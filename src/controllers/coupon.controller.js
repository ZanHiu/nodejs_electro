import Coupon from '../models/Coupon.js';
import UserCoupon from '../models/UserCoupon.js';

export const createCoupon = async (req, res) => {
  try {
    const {
      code,
      type,
      value,
      startDate,
      endDate,
      maxUses,
      minOrderAmount,
      isInfinite,
      isUnlimitedUses,
      isNoMinOrder
    } = req.body;

    // Xử lý ngày: ép startDate về 00:00:00 và endDate về 23:59:59
    let start, end;
    if (!isInfinite && startDate && endDate) {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      // Validate dates
      if (start >= end) {
        return res.status(400).json({
          success: false,
          message: 'Ngày kết thúc phải sau ngày bắt đầu'
        });
      }
    } else if (isInfinite) {
      // Nếu vô hạn thì set ngày hiện tại làm startDate và ngày xa trong tương lai làm endDate
      start = new Date();
      start.setHours(0, 0, 0, 0);
      end = new Date();
      end.setFullYear(end.getFullYear() + 100); // 100 năm sau
      end.setHours(23, 59, 59, 999);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn ngày bắt đầu và kết thúc hoặc chọn hiệu lực vô hạn'
      });
    }

    // Validate value based on type
    if (type === 'PERCENTAGE' && (value < 0 || value > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Giá trị giảm giá phần trăm phải từ 0 đến 100'
      });
    }

    // Xử lý maxUses
    let finalMaxUses;
    if (isUnlimitedUses) {
      finalMaxUses = 999999; // Số lớn để coi như vô hạn
    } else if (maxUses && maxUses > 0) {
      finalMaxUses = maxUses;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập số lượng sử dụng tối đa hoặc chọn sử dụng vô hạn'
      });
    }

    // Xử lý minOrderAmount
    let finalMinOrderAmount;
    if (isNoMinOrder) {
      finalMinOrderAmount = 0;
    } else if (minOrderAmount !== undefined && minOrderAmount !== null) {
      finalMinOrderAmount = minOrderAmount;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập giá trị đơn hàng tối thiểu hoặc chọn không giới hạn đơn hàng'
      });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      type,
      value,
      startDate: start,
      endDate: end,
      maxUses: finalMaxUses,
      minOrderAmount: finalMinOrderAmount,
      isPublic: true,
      createdBy: req.user.id
    });

    res.json({
      success: true,
      message: 'Tạo mã giảm giá thành công',
      coupon
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Helper function để cập nhật coupon hết hạn
const updateExpiredCoupons = async () => {
  const now = new Date();
  await Coupon.updateMany(
    {
      $or: [
        { endDate: { $lt: now } },
        { $expr: { $gte: ["$usedCount", "$maxUses"] } }
      ],
      isActive: true
    },
    { isActive: false }
  );
};

// Helper function để cập nhật UserCoupon hết hạn
const updateExpiredUserCoupons = async () => {
  const expiredCoupons = await Coupon.find({
    endDate: { $lt: new Date() },
    isActive: false
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

export const getCoupons = async (req, res) => {
  try {
    await updateExpiredCoupons();
    await updateExpiredUserCoupons();
    const coupons = await Coupon.find({})
      .populate('createdBy', 'name email');
    res.json({ success: true, coupons });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mã giảm giá'
      });
    }

    res.json({ success: true, coupon });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const {
      type,
      value,
      startDate,
      endDate,
      maxUses,
      minOrderAmount,
      isActive
    } = req.body;

    // Xử lý ngày nếu có cập nhật
    let updateData = { type, value, maxUses, minOrderAmount, isActive };
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      updateData.startDate = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      updateData.endDate = end;
    }

    // Validate dates nếu có đủ cả hai
    if (updateData.startDate && updateData.endDate && updateData.startDate >= updateData.endDate) {
      return res.status(400).json({
        success: false,
        message: 'Ngày kết thúc phải sau ngày bắt đầu'
      });
    }

    // Validate value if provided
    if (type === 'PERCENTAGE' && value && (value < 0 || value > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Giá trị giảm giá phần trăm phải từ 0 đến 100'
      });
    }

    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mã giảm giá'
      });
    }

    res.json({
      success: true,
      message: 'Cập nhật mã giảm giá thành công',
      coupon
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mã giảm giá'
      });
    }

    res.json({
      success: true,
      message: 'Xóa mã giảm giá thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const validateCoupon = async (req, res) => {
  try {
    await updateExpiredCoupons();
    const { code, orderAmount } = req.body;

    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase(),
      isActive: true
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Mã giảm giá không tồn tại hoặc đã bị vô hiệu hóa'
      });
    }

    // So sánh now >= startDate && now <= endDate
    const now = new Date();
    if (now < new Date(coupon.startDate) || now > new Date(coupon.endDate)) {
      return res.status(400).json({
        success: false,
        message: 'Mã giảm giá đã hết hạn'
      });
    }

    // Check if coupon has reached max uses
    if (coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({
        success: false,
        message: 'Mã giảm giá đã hết lượt sử dụng'
      });
    }

    // Check minimum order amount
    if (orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Đơn hàng phải có giá trị tối thiểu ${coupon.minOrderAmount}`
      });
    }

    // Kiểm tra user đã sử dụng coupon này chưa
    const userCoupon = await UserCoupon.findOne({
      userId: req.user.id,
      couponId: coupon._id,
      status: 'USED'
    });

    if (userCoupon) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã sử dụng mã giảm giá này trước đó'
      });
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.type === 'PERCENTAGE') {
      discountAmount = (orderAmount * coupon.value) / 100;
    } else {
      discountAmount = coupon.value;
    }

    res.json({
      success: true,
      message: 'Mã giảm giá hợp lệ',
      coupon,
      discountAmount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getPublicCoupons = async (req, res) => {
  try {
    await updateExpiredCoupons();
    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      isPublic: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    });
    res.json({ success: true, coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
