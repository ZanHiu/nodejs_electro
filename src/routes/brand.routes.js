import express from 'express';
import multer from 'multer';
import { addBrand, getBrands, getSellerBrands } from '../controllers/brand.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { sellerMiddleware } from '../middlewares/seller.middleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/add', authMiddleware, sellerMiddleware, upload.array('images'), addBrand);
router.get('/list', getBrands);
router.get('/seller-list', authMiddleware, sellerMiddleware, getSellerBrands);

export default router;
