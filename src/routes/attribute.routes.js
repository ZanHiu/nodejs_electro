import express from 'express';
import { 
  getAllAttributes,
  getAttributeNames,
  getAttributeValues,
  addAttribute,
  updateAttribute,
  deleteAttribute,
  searchAttributes
} from '../controllers/attribute.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { sellerMiddleware } from '../middlewares/seller.middleware.js';

const router = express.Router();

// Routes công khai (cho việc lấy thuộc tính khi tạo/sửa sản phẩm)
router.get('/list', getAllAttributes);
router.get('/names', getAttributeNames);
router.get('/values/:name', getAttributeValues);
router.get('/search', searchAttributes);

// Routes yêu cầu xác thực seller (cho việc quản lý thuộc tính)
router.post('/add', authMiddleware, sellerMiddleware, addAttribute);
router.put('/edit/:id', authMiddleware, sellerMiddleware, updateAttribute);
router.delete('/delete/:id', authMiddleware, sellerMiddleware, deleteAttribute);

export default router;