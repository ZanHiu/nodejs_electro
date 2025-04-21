import express from 'express';
import { getCartItems, updateCartItems } from '../controllers/cart.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/get', authMiddleware, getCartItems);
router.post('/update', authMiddleware, updateCartItems);

export default router;
