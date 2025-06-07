import express from 'express';
import multer from 'multer';
import { addCategory, editCategory, deleteCategory, getCategories, getTopCategories, getSellerCategories } from '../controllers/category.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { sellerMiddleware } from '../middlewares/seller.middleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/add', authMiddleware, sellerMiddleware, upload.array('images'), addCategory);
router.put('/edit/:id', authMiddleware, sellerMiddleware, upload.array('images'), editCategory);
router.delete('/delete/:id', authMiddleware, sellerMiddleware, deleteCategory);
router.get('/list', getCategories);
router.get('/top', getTopCategories);
router.get('/seller-list', authMiddleware, sellerMiddleware, getCategories); // getSellerCategories

export default router;