import express from 'express';
import { claimCoupon, getMyCoupons } from '../controllers/userCoupon.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/claim', authMiddleware, claimCoupon);
router.get('/my', authMiddleware, getMyCoupons);

export default router;
