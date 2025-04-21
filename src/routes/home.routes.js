import express from 'express';
import { getHomeProducts } from '../controllers/home.controller.js';

const router = express.Router();

router.get('/', getHomeProducts);

export default router;
