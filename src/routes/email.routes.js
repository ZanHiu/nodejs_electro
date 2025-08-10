import express from 'express';
import { subscribeNewsletter, checkNewsletterSubscription } from '../controllers/email.controller.js';

const router = express.Router();

// Route đăng ký newsletter
router.post('/subscribe', subscribeNewsletter);

// Route kiểm tra email đã đăng ký chưa
router.get('/check', checkNewsletterSubscription);

export default router;
