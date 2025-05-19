import express from 'express';
import { 
  createOrder, 
  getOrders, 
  cancelOrder,  
  getOrderDetail, 
  verifyPayment, 
  getSellerOrders, 
  updateOrderStatus, 
} from '../controllers/order.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { sellerMiddleware } from '../middlewares/seller.middleware.js';

const router = express.Router();

router.post('/create', authMiddleware, createOrder);
router.get('/list', authMiddleware, getOrders);
router.put('/cancel/:id', authMiddleware, cancelOrder);
router.get('/detail/:id', getOrderDetail);
router.post('/verify-payment', verifyPayment);

router.get('/seller-orders', authMiddleware, sellerMiddleware, getSellerOrders);
router.put('/update-status/:id', authMiddleware, sellerMiddleware, updateOrderStatus);

export default router;
