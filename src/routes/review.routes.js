import express from 'express';
import { createReview, updateReview, getReviewsByProduct, getAllReviews, fetchSellerReviews, deleteReview } from '../controllers/review.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { sellerMiddleware } from '../middlewares/seller.middleware.js';

const router = express.Router();

// Routes cho Review sản phẩm
router.post('/', authMiddleware, createReview);
router.put('/:reviewId', authMiddleware, updateReview);
router.delete('/:reviewId', authMiddleware, deleteReview);
router.get('/all', getAllReviews);
router.get('/seller', authMiddleware, sellerMiddleware, fetchSellerReviews);
router.get('/product/:productId', getReviewsByProduct);

export default router;
