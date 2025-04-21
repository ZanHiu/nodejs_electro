import User from '../models/User.js';

export const getCartItems = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, cartItems: user.cartItems });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCartItems = async (req, res) => {
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
