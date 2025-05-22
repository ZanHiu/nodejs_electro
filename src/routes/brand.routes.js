import express from 'express';
import multer from 'multer';
import { addBrand, editBrand, deleteBrand, getBrands, getTopBrands, getSellerBrands } from '../controllers/brand.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { sellerMiddleware } from '../middlewares/seller.middleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/add', upload.array('images'), addBrand);
router.put('/edit/:id', upload.array('images'), editBrand);
router.delete('/delete/:id', deleteBrand);
router.get('/list', getBrands);
router.get('/top', getTopBrands);
router.get('/seller-list', getSellerBrands);

export default router;
