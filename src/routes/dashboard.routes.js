import express from 'express';
import {
  getDashboardStats,
  getMonthlySalesData,
  getOrderStatusStats,
  getProductCategoryStats,
  getRecentOrders,
  exportDashboardExcel
} from '../controllers/dashboard.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { sellerMiddleware } from '../middlewares/seller.middleware.js';

const router = express.Router();

router.get('/stats', authMiddleware, sellerMiddleware, getDashboardStats);
router.get('/sales-data', authMiddleware, sellerMiddleware, getMonthlySalesData);
router.get('/order-status', authMiddleware, sellerMiddleware, getOrderStatusStats);
router.get('/category-stats', authMiddleware, sellerMiddleware, getProductCategoryStats);
router.get('/recent-orders', authMiddleware, sellerMiddleware, getRecentOrders);
router.get('/export-excel', authMiddleware, sellerMiddleware, exportDashboardExcel);

export default router;