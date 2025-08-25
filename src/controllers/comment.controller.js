import Comment from '../models/Comment.js';

// Tạo comment mới
export const createComment = async (req, res) => {
  try {
    const { productId, blogId, type, content, parentId } = req.body;
    const userId = req.user.id;

    // Validation trong controller
    if (!type || !['product', 'blog'].includes(type)) {
      return res.status(400).json({ success: false, message: "Type must be 'product' or 'blog'" });
    }

    if (type === 'product' && !productId) {
      return res.status(400).json({ success: false, message: "productId is required for product comments" });
    }

    if (type === 'blog' && !blogId) {
      return res.status(400).json({ success: false, message: "blogId is required for blog comments" });
    }

    if (productId && blogId) {
      return res.status(400).json({ success: false, message: "Cannot have both productId and blogId" });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Content is required" });
    }

    const commentData = {
      userId,
      type,
      content: content.trim(),
      parentId: parentId || null
    };

    // Thêm productId hoặc blogId tùy theo type
    if (type === 'product') {
      commentData.productId = productId;
    } else {
      commentData.blogId = blogId;
    }

    const comment = await Comment.create(commentData);

    // Populate thông tin user
    await comment.populate('userId', 'name imageUrl');

    res.json({ 
      success: true, 
      comment,
      message: parentId ? "Trả lời thành công!" : "Bình luận thành công!"
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Lấy danh sách comment theo target (sản phẩm/blog)
export const getComments = async (req, res) => {
  try {
    const { targetId, type } = req.params;

    // Validation trong controller
    if (!type || !['product', 'blog'].includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid type. Must be 'product' or 'blog'" });
    }

    if (!targetId) {
      return res.status(400).json({ success: false, message: "targetId is required" });
    }

    // Tạo query dựa trên type
    let query = {
      type,
      parentId: null
    };

    if (type === 'product') {
      query.productId = targetId;
    } else {
      query.blogId = targetId;
    }

    // Lấy tất cả comment gốc (không phải reply)
    const comments = await Comment.find(query)
      .populate('userId', 'name imageUrl')
      .sort({ createdAt: -1 });

    // Lấy tất cả reply cho mỗi comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({ parentId: comment._id })
          .populate('userId', 'name imageUrl')
          .sort({ createdAt: 1 });
        return {
          ...comment.toObject(),
          replies
        };
      })
    );

    res.json({ success: true, comments: commentsWithReplies });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Lấy tất cả comments (cho admin/seller)
export const getAllComments = async (req, res) => {
  try {
    const comments = await Comment.find()
      .populate('userId', 'name imageUrl')
      .sort({ createdAt: -1 });

    res.json({ success: true, comments: comments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Lấy comments cho seller (có phân trang và filter)
export const fetchSellerComments = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, search, productId, blogId } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    
    // Filter theo type nếu có
    if (type && type !== 'all') {
      if (!['product', 'blog'].includes(type)) {
        return res.status(400).json({ success: false, message: "Invalid type. Must be 'product' or 'blog'" });
      }
      query.type = type;
    }

    // Filter theo productId hoặc blogId nếu có
    if (productId) {
      query.productId = productId;
    }
    if (blogId) {
      query.blogId = blogId;
    }

    // Filter theo search nếu có
    if (search) {
      query.$or = [
        { content: { $regex: search, $options: 'i' } },
        { 'userId.name': { $regex: search, $options: 'i' } }
      ];
    }

    const comments = await Comment.find(query)
      .populate('userId', 'name imageUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Comment.countDocuments(query);

    res.json({ 
      success: true, 
      comments,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Cập nhật comment
export const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // Validation trong controller
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Content is required" });
    }

    const comment = await Comment.findOne({ _id: commentId, userId });
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy comment hoặc bạn không có quyền chỉnh sửa"
      });
    }

    comment.content = content.trim();
    await comment.save();

    res.json({ 
      success: true, 
      comment,
      message: "Cập nhật bình luận thành công!"
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Xóa comment
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    const comment = await Comment.findOne({ _id: commentId, userId });
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy comment hoặc bạn không có quyền xóa"
      });
    }

    // Xóa tất cả reply của comment này
    await Comment.deleteMany({ parentId: commentId });
    // Xóa comment
    await comment.deleteOne();

    res.json({ 
      success: true, 
      message: "Xóa bình luận thành công!"
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
