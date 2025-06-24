import express from 'express';
import { spinLuckyDraw } from '../controllers/luckyDraw.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/spin', authMiddleware, spinLuckyDraw);

export default router;
