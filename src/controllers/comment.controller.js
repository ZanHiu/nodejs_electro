import Comment from '../models/Comment.js';

// Tạo comment mới
export const createComment = async (req, res) => {
  try {
    const { targetId, type, content, parentId } = req.body;
    const userId = req.user.id;

    const comment = await Comment.create({
      userId,
      targetId,
      type,
      content,
      parentId: parentId || null
    });

    // Populate thông tin user
    await comment.populate('userId', 'name imageUrl');

    res.json({ success: true, comment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Lấy danh sách comment theo target (sản phẩm/blog)
export const getComments = async (req, res) => {
  try {
    const { targetId, type } = req.params;

    // Lấy tất cả comment gốc (không phải reply)
    const comments = await Comment.find({
      targetId,
      type,
      parentId: null
    })
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

// Cập nhật comment
export const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const comment = await Comment.findOne({ _id: commentId, userId });
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy comment hoặc bạn không có quyền chỉnh sửa"
      });
    }

    comment.content = content;
    await comment.save();

    res.json({ success: true, comment });
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

    res.json({ success: true, message: "Xóa comment thành công" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
