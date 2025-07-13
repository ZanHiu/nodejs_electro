import Review from '../models/Review.js';
import Order from '../models/Order.js';
import { OrderStatus, PaymentStatus } from '../utils/constants.js';

export const createReview = async (req, res) => {
  try {
    const { targetId, content, ratingValue, orderId } = req.body;
    const userId = req.user.id;

    // Kiểm tra xem đơn hàng có tồn tại và thuộc về người dùng này không
    const order = await Order.findOne({
      _id: orderId,
      userId: userId,
      status: OrderStatus.DELIVERED,
      paymentStatus: PaymentStatus.PAID,
      'items.product': targetId
    });

    if (!order) {
      return res.status(403).json({ 
        success: false, 
        message: "Không tìm thấy đơn hàng hợp lệ để đánh giá." 
      });
    }

    // Kiểm tra xem người dùng đã đánh giá sản phẩm này cho đơn hàng này chưa
    const existingReview = await Review.findOne({
      userId,
      targetId,
      orderId,
      type: 'product'
    });

    if (existingReview) {
      // Nếu đã có đánh giá cho đơn hàng này, cập nhật nó
      existingReview.content = content;
      existingReview.ratingValue = ratingValue > 0 ? ratingValue : undefined;
      await existingReview.save();
      return res.json({ 
        success: true, 
        review: existingReview, 
        message: "Cập nhật đánh giá thành công." 
      });
    } else {
      // Nếu chưa có đánh giá cho đơn hàng này, tạo mới
      const review = await Review.create({
        userId,
        targetId,
        orderId,
        content,
        ratingValue: ratingValue > 0 ? ratingValue : undefined,
        type: 'product'
      });
      return res.json({ 
        success: true, 
        review, 
        message: "Đánh giá sản phẩm thành công." 
      });
    }

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getReviewsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    // Chỉ cần find và populate user
    const reviews = await Review.find({ targetId: productId, type: 'product' })
      .populate('userId', 'name imageUrl')
      .sort({ createdAt: -1 }); // Sắp xếp mới nhất lên trước

    // Không tính toán average và count ở đây nữa
    res.json({ success: true, reviews: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ type: 'product' })
      .populate('userId', 'name imageUrl')
      .sort({ createdAt: -1 });

    res.json({ success: true, reviews: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
