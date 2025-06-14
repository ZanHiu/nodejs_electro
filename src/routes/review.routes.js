import express from 'express';
import { createReview, getReviewsByProduct } from '../controllers/review.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Routes cho Review sản phẩm
router.post('/product', authMiddleware, createReview);
router.get('/product/:productId', getReviewsByProduct);

export default router;
