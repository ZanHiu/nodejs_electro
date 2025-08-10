import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import dashboardRoutes from './routes/dashboard.routes.js';
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
import couponRoutes from './routes/coupon.routes.js';
import emailRoutes from './routes/email.routes.js';
import contactRoutes from './routes/contact.routes.js';
//import luckyDrawRoutes from './routes/luckyDraw.routes.js';
import userCouponRoutes from './routes/userCoupon.routes.js';
import userRankRoutes from './routes/userRank.routes.js';
import openrouterRoutes from './routes/openrouter.routes.js';

dotenv.config();

const app = express();

app.use(express.json());
// Cấu hình CORS chi tiết hơn
app.use(cors({
  origin: [
    'https://nextjs-electro-datn.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

// Connect to database
connectDB();

app.use('/api/dashboard', dashboardRoutes);
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
app.use('/api/coupons', couponRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/favorites', favoriteRoutes);
//app.use('/api/lukeyDraws', luckyDrawRoutes);
app.use('/api/user-coupons', userCouponRoutes);
app.use('/api/user-rank', userRankRoutes);
app.use('/api/openrouter', openrouterRoutes);

app.get("/", (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  res.json({
    message: "Welcome to the API!",
    available_routes: [
      {
        name: "blog",
        routes: [
          { method: "GET", path: `${baseUrl}/api/blogs/list` },
          { method: "GET", path: `${baseUrl}/api/blogs/home` },
          { method: "GET", path: `${baseUrl}/api/blogs/:id` },
          { method: "POST", path: `${baseUrl}/api/blogs/add` },
          { method: "PUT", path: `${baseUrl}/api/blogs/edit/:id` },
          { method: "DELETE", path: `${baseUrl}/api/blogs/delete/:id` },
        ]
      },
      
      {
        name: "brand",
        routes: [
          { method: "GET", path: `${baseUrl}/api/brands/list` },
          { method: "GET", path: `${baseUrl}/api/brands/top` },
          { method: "GET", path: `${baseUrl}/api/brands/seller-list` },
          { method: "POST", path: `${baseUrl}/api/brands/add` },
          { method: "PUT", path: `${baseUrl}/api/brands/edit/:id` },
          { method: "PUT", path: `${baseUrl}/api/brands/update/:id` },
          { method: "DELETE", path: `${baseUrl}/api/brands/delete/:id` },
        ]
      },
      
      {
        name: "cart",
        route: [
          { method: "GET", path: `${baseUrl}/api/cart/get` },
          { method: "POST", path: `${baseUrl}/api/cart/update` },
        ]
      },

      {
        name: "category",
        route: [
          { method: "GET", path: `${baseUrl}/api/categories/list` },
          { method: "GET", path: `${baseUrl}/api/categories/top` },
          { method: "GET", path: `${baseUrl}/api/categories/seller-list` },
          { method: "POST", path: `${baseUrl}/api/categories/add` },
          { method: "PUT", path: `${baseUrl}/api/categories/edit/:id` },
          { method: "PUT", path: `${baseUrl}/api/categories/update/:id` },
          { method: "DELETE", path: `${baseUrl}/api/categories/delete/:id` },
        ]
      },

      {
        name: "comment",
        route: [
          { method: "GET", path: `${baseUrl}/api/comments/:type/:targetId` },
          { method: "POST", path: `${baseUrl}/api/comments/` },
          { method: "PUT", path: `${baseUrl}/api/comments/:commentId` },
          { method: "DELETE", path: `${baseUrl}/api/comments/:commentId` },
        ]
      },

      {
        name: "coupon",
        route: [
          { method: "GET", path: `${baseUrl}/api/coupons/public` },
          { method: "GET", path: `${baseUrl}/api/coupons/list` },
          { method: "GET", path: `${baseUrl}/api/coupons/:id` },
          { method: "POST", path: `${baseUrl}/api/coupons/validate` },
          { method: "POST", path: `${baseUrl}/api/coupons/create` },
          { method: "PUT", path: `${baseUrl}/api/coupons/update/:id` },
          { method: "DELETE", path: `${baseUrl}/api/coupons/delete/:id` },
        ]
      },

      {
        name: "favorite",
        route: [
          { method: "GET", path: `${baseUrl}/api/favorites/list` },
          { method: "GET", path: `${baseUrl}/api/favorites/check/:productId` },
          { method: "POST", path: `${baseUrl}/api/favorites/add` },
          { method: "DELETE", path: `${baseUrl}/api/favorites/remove/:productId` }, 
        ]
      },

      {
        name: "home",
        route: [
          { method: "GET", path: `${baseUrl}/api/home/` },
        ]
      },
      
      {
        name: "luckyDraw",
        route: [
          // { method: "POST", path: `${baseUrl}/api/luckyDraws/spin` },
        ]
      },

      {
        name: "openrouter",
        route: [
          { method: "POST", path: `${baseUrl}/api/openrouter/chat` },
        ]
      },
      
      {
        name: "order",
        route: [
          { method: "GET", path: `${baseUrl}/api/orders/list` },
          { method: "GET", path: `${baseUrl}/api/orders/pending` },
          { method: "GET", path: `${baseUrl}/api/orders/processing` },
          { method: "GET", path: `${baseUrl}/api/orders/delivered` },
          { method: "GET", path: `${baseUrl}/api/orders/cancelled` },
          { method: "GET", path: `${baseUrl}/api/orders/detail/:id` },
          { method: "GET", path: `${baseUrl}/api/orders/seller-orders` },
          { method: "GET", path: `${baseUrl}/api/orders/check-purchase/:productId` },
          { method: "POST", path: `${baseUrl}/api/orders/create` },
          { method: "POST", path: `${baseUrl}/api/orders/verify-payment` },
          { method: "PUT", path: `${baseUrl}/api/orders/cancel/:id` },
          { method: "PUT", path: `${baseUrl}/api/orders/update-status/:id` },
        ]
      },
      
      {
        name: "payment",
        route: [
          { method: "GET", path: `${baseUrl}/api/payments/vnpay-return` },
          { method: "POST", path: `${baseUrl}/api/payments/create-vnpay-payment` },
        ]
      },

      {
        name: "product",
        route: [
          { method: "GET", path: `${baseUrl}/api/products/list` },
          { method: "GET", path: `${baseUrl}/api/products/seller-list` },
          { method: "GET", path: `${baseUrl}/api/products/category/:id` },
          { method: "GET", path: `${baseUrl}/api/products/brand/:id` },
          { method: "GET", path: `${baseUrl}/api/products/filter` },
          { method: "GET", path: `${baseUrl}/api/products/search` },
          { method: "GET", path: `${baseUrl}/api/products/:id` },
          { method: "POST", path: `${baseUrl}/api/products/add` },
          { method: "PUT", path: `${baseUrl}/api/products/edit/:id` },
          { method: "PUT", path: `${baseUrl}/api/products/update/:id` },
          { method: "DELETE", path: `${baseUrl}/api/products/delete/:id` },
        ]
      },

      {
        name: "review",
        route: [
          { method: "GET", path: `${baseUrl}/api/reviews/all` },
          { method: "GET", path: `${baseUrl}/api/reviews/product/:productId` },
          { method: "POST", path: `${baseUrl}/api/reviews/product` },
        ]
      },

      {
        name: "user",
        route: [
          { method: "GET", path: `${baseUrl}/api/users/data` },
          { method: "GET", path: `${baseUrl}/api/users/get-addresses` },
          { method: "GET", path: `${baseUrl}/api/users/cart` },
          { method: "GET", path: `${baseUrl}/api/users/seller-list` },
          { method: "POST", path: `${baseUrl}/api/users/add-address` },
          { method: "POST", path: `${baseUrl}/api/users/cart/update` },
          { method: "PUT", path: `${baseUrl}/api/users/update-role/:userId` },
          { method: "PUT", path: `${baseUrl}/api/users/toggle-block/:userId` },
        ]
      },

      {
        name: "userCoupon",
        route: [
          { method: "GET", path: `${baseUrl}/api/user-coupons/my` },
          { method: "POST", path: `${baseUrl}/api/user-coupons/claim` },
        ]
      },
      
    ],
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
