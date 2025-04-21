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

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Connect to database
connectDB();

app.use('/api/home', homeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/payments', paymentRoutes);

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

      { method: "GET", path: `${baseUrl}/api/products` },
      { method: "GET", path: `${baseUrl}/api/products/:id` },
      { method: "POST", path: `${baseUrl}/api/products` },
      { method: "PUT", path: `${baseUrl}/api/products/:id` },
      { method: "DELETE", path: `${baseUrl}/api/products/:id` },

      { method: "GET", path: `${baseUrl}/api/home/top-products` },
      { method: "GET", path: `${baseUrl}/api/home/hot-products` },
      { method: "GET", path: `${baseUrl}/api/home/newest-products` },
    ],
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
