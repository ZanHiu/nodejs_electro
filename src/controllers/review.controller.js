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
      orderId
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
        ratingValue: ratingValue > 0 ? ratingValue : undefined
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

export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { content, ratingValue } = req.body;
    const userId = req.user.id;

    const review = await Review.findOne({ _id: reviewId, userId });
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đánh giá hoặc bạn không có quyền chỉnh sửa"
      });
    }

    review.content = content;
    review.ratingValue = ratingValue > 0 ? ratingValue : undefined;
    await review.save();

    res.json({ 
      success: true, 
      review,
      message: "Cập nhật đánh giá thành công." 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getReviewsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    // Chỉ cần find và populate user
    const reviews = await Review.find({ targetId: productId })
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
    const reviews = await Review.find()
      .populate('userId', 'name imageUrl')
      .sort({ createdAt: -1 });

    res.json({ success: true, reviews: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Lấy reviews cho seller (có phân trang và filter)
export const fetchSellerReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, rating } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    
    // Filter theo rating nếu có
    if (rating && rating !== 'all') {
      query.ratingValue = parseInt(rating);
    }

    // Filter theo search nếu có
    if (search) {
      query.$or = [
        { content: { $regex: search, $options: 'i' } },
        { 'userId.name': { $regex: search, $options: 'i' } }
      ];
    }

    const reviews = await Review.find(query)
      .populate('userId', 'name imageUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments(query);

    res.json({ 
      success: true, 
      reviews,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Xóa review
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await Review.findOne({ _id: reviewId, userId });
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đánh giá hoặc bạn không có quyền xóa"
      });
    }

    await review.deleteOne();

    res.json({ 
      success: true, 
      message: "Xóa đánh giá thành công!"
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
