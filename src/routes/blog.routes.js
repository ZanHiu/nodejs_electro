import express from 'express';
import multer from 'multer';
import { addBlog, getHomeBlogs, getBlogs, editBlog, deleteBlog, getBlogDetail } from '../controllers/blog.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/add', authMiddleware, upload.array('images'), addBlog);
router.put('/edit/:id', authMiddleware, upload.array('images'), editBlog);
router.delete('/delete/:id', authMiddleware, deleteBlog);
router.get('/list', getBlogs);
router.get('/home', getHomeBlogs);
router.get('/:id', getBlogDetail);

export default router;
