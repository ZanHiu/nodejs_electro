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

dotenv.config();

const app = express();

app.use(cors());
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

app.get("/", (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  res.json({
    message: "Welcome to the API!",
    available_routes: [
      //blog
      { method: "GET", path: `${baseUrl}/api/blogs/list` },
      { method: "GET", path: `${baseUrl}/api/blogs/home` },
      { method: "POST", path: `${baseUrl}/api/blogs/add` },
      
      //brand
      { method: "GET", path: `${baseUrl}/api/brands/list` },
      { method: "GET", path: `${baseUrl}/api/brands/top` },
      { method: "GET", path: `${baseUrl}/api/brands/seller-list` },
      { method: "POST", path: `${baseUrl}/api/brands/add` },
      { method: "PUT", path: `${baseUrl}/api/brands/edit/:id` },
      { method: "DELETE", path: `${baseUrl}/api/brands/delete/:id` },

      //cart
      { method: "GET", path: `${baseUrl}/api/cart/get` },
      { method: "POST", path: `${baseUrl}/api/cart/updatet` },

      //category
      { method: "GET", path: `${baseUrl}/api/categories/list` },
      { method: "GET", path: `${baseUrl}/api/categories/top` },
      { method: "GET", path: `${baseUrl}/api/categories/seller-list` },
      { method: "POST", path: `${baseUrl}/api/categories/add` },
      { method: "PUT", path: `${baseUrl}/api/categories/edit/:id` },
      { method: "DELETE", path: `${baseUrl}/api/categories/delete/:id` },
      
      //home
      { method: "GET", path: `${baseUrl}/api/home` },
      
      //order
      { method: "GET", path: `${baseUrl}/api/orders/list` },
      { method: "GET", path: `${baseUrl}/api/orders/detail/:id` },
      { method: "GET", path: `${baseUrl}/api/orders/seller-orders` },
      { method: "POST", path: `${baseUrl}/api/orders/verify-payment` },
      { method: "PUT", path: `${baseUrl}/api/orders/cancel/:id` },
      { method: "PUT", path: `${baseUrl}/api/orders/update-status/:id` },
      
      //payment
      { method: "GET", path: `${baseUrl}/api/payments/vnpay-return` },
      { method: "POST", path: `${baseUrl}/api/payments/create-vnpay-payment` },
      
      //product
      { method: "GET", path: `${baseUrl}/api/products/list` },
      { method: "GET", path: `${baseUrl}/api/products/seller-list` },
      { method: "GET", path: `${baseUrl}/api/products/category/:id` },
      { method: "GET", path: `${baseUrl}/api/products/brand/:id` },
      { method: "GET", path: `${baseUrl}/api/products/filter` },
      { method: "GET", path: `${baseUrl}/api/products/search` },
      { method: "POST", path: `${baseUrl}/api/products/add` },
      { method: "PUT", path: `${baseUrl}/api/products/edit/:id` },
      { method: "DELETE", path: `${baseUrl}/api/products/delete/:id` },
      
      //review
      { method: "GET", path: `${baseUrl}/api/reviews/blog/:blogId` },
      { method: "POST", path: `${baseUrl}/api/reviews/blog` },
      
      //user
      { method: "GET", path: `${baseUrl}/api/users/data` },
      { method: "GET", path: `${baseUrl}/api/users/get-addresses` },
      { method: "GET", path: `${baseUrl}/api/users/cart` },
      { method: "GET", path: `${baseUrl}/api/users/seller-list` },
      { method: "POST", path: `${baseUrl}/api/users/add-address` },
      { method: "POST", path: `${baseUrl}/api/users/cart/update` },
      { method: "PUT", path: `${baseUrl}/api/users/update-role/:userId` },
      { method: "PUT", path: `${baseUrl}/api/users/toggle-block/:userId` },

    ],
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running http://localhost:${PORT}`);
});
