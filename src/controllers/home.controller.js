import Product from '../models/Product.js';

export const getHomeProducts = async (req, res) => {
  try {
    // Get new products
    const newProducts = await Product.find({})
      .sort({ createdAt: -1 })
      .limit(5);

    // Get sale products
    const saleProducts = await Product.find({ offerPrice: { $ne: null } })
      .sort({ offerPrice: 1 })
      .limit(5);

    res.json({ 
      success: true, 
      newProducts, 
      saleProducts 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
