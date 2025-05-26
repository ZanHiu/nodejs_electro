import express from 'express';
import { createReview, getReviewsByProduct, createBlogReview, getReviewsByBlog } from '../controllers/review.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Routes cho Review sản phẩm
router.post('/product', authMiddleware, createReview);
router.get('/product/:productId', getReviewsByProduct);

// Routes cho Review blog
router.post('/blog', authMiddleware, createBlogReview);
router.get('/blog/:blogId', getReviewsByBlog);

export default router;
