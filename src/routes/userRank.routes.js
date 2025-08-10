import express from 'express';
import { getUserRank, spinWheel, getSpinHistory } from '../controllers/userRank.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Lấy thông tin rank của user
router.get('/my-rank', authMiddleware, getUserRank);

// Vòng quay may mắn
router.post('/spin', authMiddleware, spinWheel);

// Lấy lịch sử vòng quay
router.get('/spin-history', authMiddleware, getSpinHistory);

export default router;
