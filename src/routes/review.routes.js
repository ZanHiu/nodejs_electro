import express from 'express';
import { createReview, getReviewsByProduct, getAllReviews } from '../controllers/review.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Routes cho Review sản phẩm
router.post('/product', authMiddleware, createReview);
router.get('/all', getAllReviews);
router.get('/product/:productId', getReviewsByProduct);

export default router;
