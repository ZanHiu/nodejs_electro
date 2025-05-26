import Review from '../models/Review.js';

export const createReview = async (req, res) => {
  try {
    const { targetId, content, ratingValue } = req.body;
    const userId = req.user.id;
    
    const review = await Review.create({ 
      userId, 
      targetId, 
      content, 
      ratingValue: ratingValue > 0 ? ratingValue : undefined, // Lưu ratingValue nếu > 0
      type: 'product' 
    });
    res.json({ success: true, review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createBlogReview = async (req, res) => {
  try {
    const { targetId, content, ratingValue } = req.body;
    const userId = req.user.id;

    const review = await Review.create({ 
      userId, 
      targetId, 
      content, 
      ratingValue: ratingValue > 0 ? ratingValue : undefined, // Lưu ratingValue nếu > 0
      type: 'blog' 
    });
    res.json({ success: true, review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

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

export const getReviewsByBlog = async (req, res) => {
  try {
    const { blogId } = req.params;
     // Chỉ cần find và populate user
    const reviews = await Review.find({ targetId: blogId, type: 'blog' })
      .populate('userId', 'name imageUrl')
      .sort({ createdAt: -1 }); // Sắp xếp mới nhất lên trước

    // Không tính toán average và count ở đây nữa
    res.json({ success: true, reviews: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
