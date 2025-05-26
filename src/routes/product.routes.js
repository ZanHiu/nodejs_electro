import express from 'express';
import multer from 'multer';
import { 
  addProduct, 
  editProduct, 
  deleteProduct, 
  getProducts, 
  getProductsByCategory, 
  getProductsByBrand, 
  getSellerProducts, 
  getFilteredProducts, 
  searchProducts, 
} from '../controllers/product.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { sellerMiddleware } from '../middlewares/seller.middleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/add', authMiddleware, sellerMiddleware, upload.array('images'), addProduct);
router.put('/edit/:id', authMiddleware, sellerMiddleware, upload.array('images'), editProduct);
router.delete('/delete/:id', authMiddleware, sellerMiddleware, deleteProduct);
router.get('/list', getProducts);
router.get('/seller-list', authMiddleware, sellerMiddleware, getProducts); // getSellerProducts
router.get('/category/:id', getProductsByCategory);
router.get('/brand/:id', getProductsByBrand);
router.get('/filter', getFilteredProducts);
router.get('/search', searchProducts);

export default router;
