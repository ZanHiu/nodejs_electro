import express from 'express';
import { createComment, getComments, getAllComments, fetchSellerComments, updateComment, deleteComment } from '../controllers/comment.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { sellerMiddleware } from '../middlewares/seller.middleware.js';

const router = express.Router();

// Routes cho Comment
router.post('/', authMiddleware, createComment);
router.put('/:commentId', authMiddleware, updateComment);
router.delete('/:commentId', authMiddleware, deleteComment);
router.get('/all', getAllComments);
router.get('/seller', authMiddleware, sellerMiddleware, fetchSellerComments);
router.get('/:type/:targetId', getComments);

export default router;
