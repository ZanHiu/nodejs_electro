import express from 'express';
import { 
  addToFavorite, 
  removeFromFavorite, 
  getFavorites,
  checkFavorite
} from '../controllers/favorite.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/add', authMiddleware, addToFavorite);
router.delete('/remove/:productId', authMiddleware, removeFromFavorite);
router.get('/list', authMiddleware, getFavorites);
router.get('/check/:productId', authMiddleware, checkFavorite);

export default router;
