import Address from '../models/Address.js';
import User from '../models/User.js';
import { clerkClient } from '@clerk/clerk-sdk-node';

export const getUserData = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.user.id });
    res.json({ success: true, addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addAddress = async (req, res) => {
  try {
    const { address } = req.body;
    const newAddress = await Address.create({
      ...address,
      userId: req.user.id
    });
    res.json({ success: true, message: "Thêm địa chỉ thành công", address: newAddress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCart = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, cartItems: user.cartItems });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCart = async (req, res) => {
  try {
    const { cartData } = req.body;
    const user = await User.findById(req.user.id);
    user.cartItems = cartData;
    await user.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    // Lấy danh sách user từ Clerk
    const clerkUsers = await clerkClient.users.getUserList();
    
    // Lấy thông tin chi tiết từ database
    const dbUsers = await User.find({}).select('-cartItems');
    
    // Kết hợp thông tin từ cả hai nguồn và loại bỏ user hiện tại
    const users = clerkUsers.data
      .filter(clerkUser => clerkUser.id !== req.user.id) // Loại bỏ user hiện tại
      .map(clerkUser => {
        const dbUser = dbUsers.find(u => u._id === clerkUser.id);
        return {
          _id: clerkUser.id,
          name: clerkUser.firstName + ' ' + clerkUser.lastName,
          email: clerkUser.emailAddresses[0]?.emailAddress,
          imageUrl: clerkUser.imageUrl,
          role: clerkUser.publicMetadata.role || 'user',
          isBlocked: !!clerkUser.locked,
          createdAt: clerkUser.createdAt,
          ...dbUser?.toObject()
        };
      });

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'seller'].includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid role. Role must be either 'user' or 'seller'" 
      });
    }

    // Không cho phép thay đổi role của chính mình
    if (userId === req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: "You cannot change your own role" 
      });
    }

    // Cập nhật role trong Clerk
    await clerkClient.users.updateUser(userId, {
      publicMetadata: { role }
    });

    res.json({ 
      success: true, 
      message: "Cập nhật quyền người dùng thành công"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleUserBlock = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isBlocked } = req.body;

    // Không cho phép block chính mình
    if (userId === req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You cannot block yourself",
      });
    }

    // Cập nhật trạng thái block trong Clerk
    if (isBlocked) {
      await clerkClient.users.lockUser(userId);
    } else {
      await clerkClient.users.unlockUser(userId);
    }

    res.json({
      success: true,
      message: isBlocked ? "Khóa người dùng thành công" : "Mở khóa người dùng thành công",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
