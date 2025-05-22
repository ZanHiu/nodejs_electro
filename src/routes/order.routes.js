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

router.post('/create', createOrder);
router.get('/list', getOrders);
router.put('/cancel/:id', cancelOrder);
router.get('/detail/:id', getOrderDetail);
router.post('/verify-payment', verifyPayment);

router.get('/seller-orders', getSellerOrders);
router.put('/update-status/:id', updateOrderStatus);

export default router;
