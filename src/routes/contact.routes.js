import express from 'express';
import { submitContact, getContacts, markAsRead } from '../controllers/contact.controller.js';

const router = express.Router();

// Route gửi liên hệ
router.post('/submit', submitContact);

// Route lấy danh sách liên hệ (cho admin)
router.get('/list', getContacts);

// Route đánh dấu đã đọc
router.put('/mark-read/:id', markAsRead);

export default router;