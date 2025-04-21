import express from 'express';
import { createVNPayPayment, vnpayReturn } from '../controllers/payment.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/create-vnpay-payment', authMiddleware, createVNPayPayment);
router.get('/vnpay-return', vnpayReturn);

export default router;
