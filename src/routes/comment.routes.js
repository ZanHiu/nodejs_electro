import express from 'express';
import { createComment, getComments, updateComment, deleteComment } from '../controllers/comment.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Routes cho Comment
router.post('/', authMiddleware, createComment);
router.get('/:type/:targetId', getComments);
router.put('/:commentId', authMiddleware, updateComment);
router.delete('/:commentId', authMiddleware, deleteComment);

export default router;
