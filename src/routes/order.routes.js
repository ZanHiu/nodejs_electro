import express from 'express';
import { 
  createOrder, 
  getOrders, 
  cancelOrder,  
  getOrderDetail, 
  verifyPayment, 
  getSellerOrders, 
  updateOrderStatus, 
  checkPurchaseStatus,
  getPendingOrders,
  getProcessingOrders,
  getDeliveredOrders,
  getCancelledOrders,
} from '../controllers/order.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { sellerMiddleware } from '../middlewares/seller.middleware.js';

const router = express.Router();

router.post('/create', authMiddleware, createOrder);
router.get('/list', authMiddleware, getOrders);
router.get('/pending', authMiddleware, getPendingOrders);
router.get('/processing', authMiddleware, getProcessingOrders);
router.get('/delivered', authMiddleware, getDeliveredOrders);
router.get('/cancelled', authMiddleware, getCancelledOrders);
router.put('/cancel/:id', authMiddleware, cancelOrder);
router.get('/detail/:id', getOrderDetail);
router.post('/verify-payment', verifyPayment);

router.get('/seller-orders', authMiddleware, sellerMiddleware, getSellerOrders);
router.put('/update-status/:id', authMiddleware, sellerMiddleware, updateOrderStatus);

router.get('/check-purchase/:productId', authMiddleware, checkPurchaseStatus);

export default router;
