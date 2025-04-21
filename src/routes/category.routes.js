import express from 'express';
import multer from 'multer';
import { addCategory, getCategories, getSellerCategories } from '../controllers/category.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { sellerMiddleware } from '../middlewares/seller.middleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/add', authMiddleware, sellerMiddleware, upload.array('images'), addCategory);
router.get('/list', getCategories);
router.get('/seller-list', authMiddleware, sellerMiddleware, getSellerCategories);

export default router;
