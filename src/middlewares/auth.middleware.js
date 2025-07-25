import * as clerk from '@clerk/clerk-sdk-node';
import dotenv from 'dotenv';

dotenv.config();

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    // Verify token with Clerk
    const client = clerk.createClerkClient({ 
      secretKey: process.env.CLERK_SECRET_KEY 
    });
    
    // Get session claims instead of verifying session
    const sessionClaims = await client.verifyToken(token);
    
    // Set user id from session claims
    req.user = { 
      id: sessionClaims.sub // Clerk stores user ID in the 'sub' claim
    };

    next();
  } catch (error) {
    console.error('Auth error:', error);
    
    // Xử lý lỗi token hết hạn cụ thể
    if (error.reason === 'token-expired') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token đã hết hạn, vui lòng đăng nhập lại',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    // Xử lý các lỗi khác
    res.status(401).json({ 
      success: false, 
      message: 'Token không hợp lệ hoặc đã hết hạn',
      code: 'INVALID_TOKEN'
    });
  }
};