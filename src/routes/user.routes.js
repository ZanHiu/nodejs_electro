import express from 'express';
import { getUserData, addAddress, getAddresses, getCart, updateCart } from '../controllers/user.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/data', authMiddleware, getUserData);
router.get('/get-addresses', authMiddleware, getAddresses);
router.post('/add-address', authMiddleware, addAddress);
router.get('/cart', authMiddleware, getCart);
router.post('/cart/update', authMiddleware, updateCart);

export default router;
