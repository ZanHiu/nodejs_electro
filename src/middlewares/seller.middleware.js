import * as clerk from '@clerk/clerk-sdk-node';
import dotenv from 'dotenv';

dotenv.config();

const client = clerk.createClerkClient({ 
  secretKey: process.env.CLERK_SECRET_KEY 
});

export const sellerMiddleware = async (req, res, next) => {
  try {
    const user = await client.users.getUser(req.user.id);
    if (user.publicMetadata.role === 'seller') {
      next();
    } else {
      res.status(403).json({ success: false, message: "Unauthorized" });
    }
  } catch (error) {
    console.error('Seller middleware error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
