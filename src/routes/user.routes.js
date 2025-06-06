import express from 'express';
import { 
  getUserData, 
  addAddress, 
  getAddresses, 
  getCart, 
  updateCart, 
  getUsers,
  updateUserRole,
  toggleUserBlock
} from '../controllers/user.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { sellerMiddleware } from '../middlewares/seller.middleware.js';

const router = express.Router();

router.get('/data', authMiddleware, getUserData);
router.get('/get-addresses', authMiddleware, getAddresses);
router.post('/add-address', authMiddleware, addAddress);
router.get('/cart', authMiddleware, getCart);
router.post('/cart/update', authMiddleware, updateCart);
router.get('/seller-list', authMiddleware, sellerMiddleware, getUsers);
router.put('/update-role/:userId', authMiddleware, sellerMiddleware, updateUserRole);
router.put('/toggle-block/:userId', authMiddleware, sellerMiddleware, toggleUserBlock);

export default router;
