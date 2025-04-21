import express from 'express';
import multer from 'multer';
import { addBlog, getHomeBlogs, getBlogs } from '../controllers/blog.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/add', authMiddleware, upload.array('images'), addBlog);
router.get('/list', getBlogs);
router.get('/home', getHomeBlogs);

export default router;
