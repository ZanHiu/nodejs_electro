import express from 'express';
import {
  createCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  getPublicCoupons
} from '../controllers/coupon.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { sellerMiddleware } from '../middlewares/seller.middleware.js';

const router = express.Router();

// User routes
router.post('/validate', authMiddleware, validateCoupon);
router.get('/public', getPublicCoupons);

// Admin/Seller routes
router.post('/create', authMiddleware, sellerMiddleware, createCoupon);
router.get('/list', authMiddleware, sellerMiddleware, getCoupons);
router.get('/:id', authMiddleware, sellerMiddleware, getCouponById);
router.put('/update/:id', authMiddleware, sellerMiddleware, updateCoupon);
router.delete('/delete/:id', authMiddleware, sellerMiddleware, deleteCoupon);

export default router;
