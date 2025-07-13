import express from 'express';
import multer from 'multer';
import { addBrand, editBrand, deleteBrand, getBrands, getTopBrands, getSellerBrands } from '../controllers/brand.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { sellerMiddleware } from '../middlewares/seller.middleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/add', authMiddleware, sellerMiddleware, upload.array('images'), addBrand);
router.put('/edit/:id', authMiddleware, sellerMiddleware, upload.array('images'), editBrand);
router.put('/update/:id', authMiddleware, editBrand);
router.delete('/delete/:id', authMiddleware, sellerMiddleware, deleteBrand);
router.get('/list', getBrands);
router.get('/top', getTopBrands);
router.get('/seller-list', authMiddleware, sellerMiddleware, getSellerBrands);

export default router;