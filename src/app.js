import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import homeRoutes from './routes/home.routes.js';
import productRoutes from './routes/product.routes.js';
import categoryRoutes from './routes/category.routes.js';
import brandRoutes from './routes/brand.routes.js';
import userRoutes from './routes/user.routes.js';
import orderRoutes from './routes/order.routes.js';
import cartRoutes from './routes/cart.routes.js';
import blogRoutes from './routes/blog.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import reviewRoutes from './routes/review.routes.js';
import commentRoutes from './routes/comment.routes.js';
import favoriteRoutes from './routes/favorite.routes.js';

dotenv.config();

const app = express();

app.use(express.json());
// Cấu hình CORS chi tiết hơn
app.use(cors({
  origin: [
    'https://electro-nextjs.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true
}));

// Connect to database
connectDB();

app.use('/api/home', homeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/favorites', favoriteRoutes);

app.get("/", (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  res.json({
    message: "Welcome to the API!",
    available_routes: [
      { method: "GET", path: `${baseUrl}/api/categories` },
      { method: "GET", path: `${baseUrl}/api/categories/:id` },
      { method: "POST", path: `${baseUrl}/api/categories` },
      { method: "PUT", path: `${baseUrl}/api/categories/:id` },
      { method: "DELETE", path: `${baseUrl}/api/categories/:id` },
    ],
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
